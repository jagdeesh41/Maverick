import { useState } from 'react';

/**
 * A file picker that reads the chosen file as base64 and reports it via
 * onChange. Every "proof" upload in this app (asset proof, KYC photo,
 * transferee ID, death certificate) uses this same component - stored
 * as base64 text directly in Postgres, no separate file server needed.
 */
export default function FileUpload({ label, value, onChange, required }) {
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (file.size > 4 * 1024 * 1024) {
      setError('File is too large (max ~4MB for this demo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileName(file.name);
      onChange(reader.result); // data:<mime>;base64,....
    };
    reader.onerror = () => setError('Could not read that file.');
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="lb-label">{label}</label>
      <input
        className="lb-input"
        type="file"
        accept="image/*,application/pdf"
        required={required && !value}
        onChange={handleFile}
      />
      {fileName && <div style={{ fontSize: '0.8rem', color: 'var(--lb-green-700)', marginTop: 4 }}>✓ {fileName} attached</div>}
      {error && <div style={{ fontSize: '0.8rem', color: 'var(--lb-danger)', marginTop: 4 }}>{error}</div>}
      {value && !fileName && value.startsWith('data:image') && (
        <img src={value} alt="attached proof" style={{ maxHeight: 80, marginTop: 6, borderRadius: 6, border: '1px solid var(--lb-border)' }} />
      )}
    </div>
  );
}
