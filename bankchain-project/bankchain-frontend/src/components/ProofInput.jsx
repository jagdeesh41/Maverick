import { useState } from 'react';
import { validateProof } from '../api.js';

/**
 * Account/ID number entry with a type dropdown and live validation on
 * blur (Rule 6: anything that's all zeros is treated as invalid - a
 * mock stand-in for a real account-lookup service). Shared by Transfer,
 * Inheritance nominees, and property Claims so the check-as-you-type
 * behaviour is identical everywhere it's used.
 */
export default function ProofInput({ typeValue, onTypeChange, valueValue, onValueChange, label }) {
  const [status, setStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid'
  const [reason, setReason] = useState('');

  async function handleBlur() {
    if (!valueValue) { setStatus(null); return; }
    setStatus('checking');
    try {
      const result = await validateProof(valueValue);
      setStatus(result.allowed ? 'valid' : 'invalid');
      setReason(result.reason);
    } catch {
      setStatus(null);
    }
  }

  return (
    <div>
      <label className="lb-label">{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <select className="lb-input" style={{ maxWidth: 170 }} value={typeValue} onChange={(e) => onTypeChange(e.target.value)}>
          <option value="ACCOUNT_NUMBER">Account number</option>
          <option value="ID_NUMBER">ID number</option>
        </select>
        <input
          className="lb-input"
          placeholder="e.g. 400123456789 — a number of all zeros will fail validation"
          value={valueValue}
          onChange={(e) => { onValueChange(e.target.value); setStatus(null); }}
          onBlur={handleBlur}
        />
      </div>
      {status === 'checking' && <div style={{ fontSize: '0.8rem', color: 'var(--lb-ink-soft)', marginTop: 4 }}>Checking…</div>}
      {status === 'valid' && <div style={{ fontSize: '0.8rem', color: 'var(--lb-green-700)', marginTop: 4 }}>✓ {reason}</div>}
      {status === 'invalid' && <div style={{ fontSize: '0.8rem', color: 'var(--lb-danger)', marginTop: 4 }}>✗ {reason}</div>}
    </div>
  );
}
