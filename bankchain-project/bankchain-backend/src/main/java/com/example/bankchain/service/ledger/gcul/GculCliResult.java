package com.example.bankchain.service.ledger.gcul;

/**
 * Parsed result of one ul-cli/gcloud invocation. Success detection is
 * string-based (output starting with "Error:") rather than purely exit-code
 * based, since the real exit-code convention wasn't independently confirmed
 * against a live ul-cli - every failure observed in practice started the
 * combined stdout/stderr with "Error:", so that's the primary signal here.
 */
public record GculCliResult(boolean success, String output, int exitCode) {

    /**
     * True if a `contracts grant` failed only because permission was
     * already granted in an earlier call - treat as success, not failure,
     * since the end state (participant can read/write their fields) is
     * exactly what we wanted anyway.
     */
    public boolean alreadyGranted() {
        return output.contains("ALREADY_EXISTS") && output.contains("already has storage permission");
    }

    /**
     * The contract's own assert message, or the CLI's error text, for a
     * failed transaction - e.g. "Asset is not ACTIVE - transfer blocked"
     * from a FAILED_PRECONDITION, confirmed verbatim against a real ledger
     * rejection. Falls back to a generic message if neither pattern matches.
     */
    public String extractReason() {
        String reason = extractAfter("FAILED_PRECONDITION:");
        if (reason != null) {
            return reason;
        }
        reason = extractAfter("Error:");
        if (reason != null) {
            return reason;
        }
        return "Ledger transaction failed.";
    }

    /** The value following a known "<Label>: " prefix ul-cli prints on success, e.g. "Contract created: ". */
    public String extractId(String label) {
        int idx = output.indexOf(label);
        if (idx < 0) {
            throw new LedgerCommandException("Expected \"" + label + "\" in ul-cli output but got:\n" + output);
        }
        String rest = output.substring(idx + label.length());
        int newline = rest.indexOf('\n');
        return (newline >= 0 ? rest.substring(0, newline) : rest).trim();
    }

    private String extractAfter(String marker) {
        int idx = output.indexOf(marker);
        if (idx < 0) {
            return null;
        }
        String rest = output.substring(idx + marker.length());
        int newline = rest.indexOf('\n');
        return (newline >= 0 ? rest.substring(0, newline) : rest).trim();
    }
}
