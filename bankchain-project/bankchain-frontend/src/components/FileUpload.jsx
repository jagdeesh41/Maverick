import { useState } from 'react';
import { uploadProofFile } from '../api.js';

/**
 * A file picker that uploads straight to GCS the moment a file is chosen
 * and reports the resulting object key via onChange - every "proof"
 * upload in this app (asset proof, KYC photo, transferee ID, death
 * certificate) uses this same component. The preview is a local blob URL
 * (no server round-trip needed just to show what you picked); the actual
 * value passed to the form is the GCS key, never the file itself again.
 */
export default function FileUpload({ label, value, onChange, required, category = 'proof' }) {
  const [fileName, setFileName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (file.size > 4 * 1024 * 1024) {
      setError('File is too large (max ~4MB for this demo).');
      return;
    }

    setUploading(true);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
    try {
      const key = await uploadProofFile(file, category);
      setFileName(file.name);
      onChange(key);
    } catch (err) {
      setError(err.message || 'Upload failed - please try again.');
      setPreviewUrl('');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="lb-label">{label}</label>
      <input
        className="lb-input"
        type="file"
        accept="image/*,application/pdf"
        required={required && !value}
        disabled={uploading}
        onChange={handleFile}
      />
      {uploading && <div style={{ fontSize: '0.8rem', color: 'var(--lb-ink-soft)', marginTop: 4 }}>Uploading…</div>}
      {fileName && !uploading && <div style={{ fontSize: '0.8rem', color: 'var(--lb-green-700)', marginTop: 4 }}>✓ {fileName} attached</div>}
      {error && <div style={{ fontSize: '0.8rem', color: 'var(--lb-danger)', marginTop: 4 }}>{error}</div>}
      {previewUrl && !uploading && (
        <img src={previewUrl} alt="attached proof" style={{ maxHeight: 80, marginTop: 6, borderRadius: 6, border: '1px solid var(--lb-border)' }} />
      )}
    </div>
  );
}
