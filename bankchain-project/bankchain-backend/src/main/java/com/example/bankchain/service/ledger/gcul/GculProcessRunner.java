package com.example.bankchain.service.ledger.gcul;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Shells out to `ul-cli` / `gcloud` as subprocesses - the only confirmed way
 * to talk to Universal Ledger during this private preview (no Java/gRPC
 * client has surfaced yet). See smart-contracts/gcul/DEPLOY.md for the
 * command sequences this wraps.
 *
 * `ul-cli` is NOT a real binary on PATH in this environment - `type ul-cli`
 * shows it's a shell alias wrapping `docker run` (the same situation as
 * `gculpyc`). Shell aliases don't exist to a direct exec() call, which is
 * all ProcessBuilder can do, so runUlCli() reconstructs that docker
 * invocation itself rather than trying to invoke "ul-cli" as a command name.
 * `gcloud` is a real installed binary and needs no such wrapping.
 *
 * Precondition this class does NOT set up itself: the host running this
 * Spring Boot process needs Docker, authenticated `gcloud`, and a
 * `~/.config/ul-cli/config.yaml` with the bank's operator aliases
 * (contract-owner, mavericks-account-manager, etc.) already registered -
 * that's an ops/deployment concern, not something provisioned at runtime here.
 */
@Component
@Slf4j
public class GculProcessRunner {

    @Value("${gcul.ul-cli.image:us-docker.pkg.dev/gcul-artifacts/images/client/ul-cli:latest}")
    private String ulCliImage;

    @Value("${gcul.workdir}")
    private String workDir;

    @Value("${gcul.timeout-seconds:45}")
    private long timeoutSeconds;

    public GculCliResult runUlCli(String... args) {
        String home = System.getenv("HOME");
        if (home == null || home.isBlank()) {
            throw new LedgerCommandException("HOME is not set - needed to mount ~/.config/ul-cli into the ul-cli container");
        }
        String absoluteWorkDir = new File(workDir).getAbsolutePath();

        // Mirrors the `ul-cli` shell alias (see class docstring), with two
        // changes needed for a non-interactive subprocess launched from Java:
        //  - -it replaced by -i: no real TTY exists here, and -t would make
        //    `docker run` fail outright.
        //  - explicit `-e HOME=/home/user`: without a TTY, whatever makes
        //    the container's $HOME resolve to /home/user in the interactive
        //    case doesn't happen - ul-cli then looks for its config at
        //    "$HOME/.config/ul-cli" with HOME empty, i.e. "/.config/ul-cli",
        //    missing the mounted real config entirely (confirmed from a
        //    real run: "Creating config directory: \"/.config/ul-cli\"").
        List<String> command = new ArrayList<>();
        command.add("docker");
        command.add("run");
        command.add("--rm");
        command.add("-i");
        command.add("-e");
        command.add("HOME=/home/user");
        command.add("-v");
        command.add(home + "/.config/ul-cli:/home/user/.config/ul-cli");
        command.add("-v");
        command.add(absoluteWorkDir + ":" + absoluteWorkDir);
        command.add("-w");
        command.add(absoluteWorkDir);
        command.add(ulCliImage);
        for (String arg : args) {
            command.add(arg);
        }
        return execute(command);
    }

    public GculCliResult runGcloud(String... args) {
        List<String> command = new ArrayList<>();
        command.add("gcloud");
        for (String arg : args) {
            command.add(arg);
        }
        return execute(command);
    }

    private GculCliResult execute(List<String> command) {
        log.info("Running ledger command: {}", String.join(" ", command));
        Process process;
        try {
            process = new ProcessBuilder(command)
                    .directory(new File(workDir))
                    .redirectErrorStream(true)
                    .start();
        } catch (IOException e) {
            throw new LedgerCommandException("Failed to start: " + String.join(" ", command), e);
        }

        String output;
        try (InputStream in = process.getInputStream()) {
            output = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            process.destroyForcibly();
            throw new LedgerCommandException("Failed to read output of: " + String.join(" ", command), e);
        }

        boolean finished;
        try {
            finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            process.destroyForcibly();
            throw new LedgerCommandException("Interrupted waiting for: " + String.join(" ", command), e);
        }
        if (!finished) {
            process.destroyForcibly();
            throw new LedgerCommandException("Timed out after " + timeoutSeconds + "s: " + String.join(" ", command));
        }

        int exitCode = process.exitValue();
        boolean success = exitCode == 0 && !output.startsWith("Error:");
        log.info("Ledger command {} (exit {}): {}", success ? "succeeded" : "failed", exitCode, output.strip());
        return new GculCliResult(success, output, exitCode);
    }
}
