package com.example.bankchain.service.ledger.gcul;

/**
 * Infrastructure-level failure running ul-cli/gcloud (process couldn't
 * start, timed out, output didn't match an expected shape) - distinct from
 * BusinessRuleException, which is for a contract rule rejecting the
 * transaction (a real, expected outcome the user should see a clean
 * message for).
 */
public class LedgerCommandException extends RuntimeException {
    public LedgerCommandException(String message) {
        super(message);
    }

    public LedgerCommandException(String message, Throwable cause) {
        super(message, cause);
    }
}
