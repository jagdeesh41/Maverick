package com.example.bankchain.exception;

/**
 * Thrown when an action is technically valid (asset/transfer exists) but
 * violates a business/smart-contract rule - e.g. transferring a frozen
 * asset, or approving a transfer for an unverified buyer.
 * Mirrors what a real GCUL smart contract would reject on-chain.
 */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
