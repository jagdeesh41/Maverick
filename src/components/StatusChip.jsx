import { Chip } from '@mui/material';
import { brand } from '../theme';

const MAP = {
  Active: { color: brand[700], bg: brand[50] },
  'Transfer Pending': { color: '#8A5A00', bg: '#FBF0DA' },
  'Pending Approval': { color: '#8A5A00', bg: '#FBF0DA' },
  Frozen: { color: '#0D4C82', bg: '#E1EFFB' },
  Completed: { color: brand[700], bg: brand[50] },
  Verified: { color: brand[700], bg: brand[50] },
  'Pending Review': { color: '#8A5A00', bg: '#FBF0DA' },
  High: { color: '#B3261E', bg: '#FBE3E1' },
  Medium: { color: '#8A5A00', bg: '#FBF0DA' },
  Low: { color: '#3A5A47', bg: '#EAF1EC' },
  'High LTV': { color: '#B3261E', bg: '#FBE3E1' },
  'KYC Pending': { color: '#8A5A00', bg: '#FBF0DA' },
  Watch: { color: '#0D4C82', bg: '#E1EFFB' },
  None: { color: '#3A5A47', bg: '#EAF1EC' },
};

export default function StatusChip({ label, size = 'small' }) {
  const style = MAP[label] || { color: '#3A5A47', bg: '#EAF1EC' };
  return (
    <Chip
      label={label}
      size={size}
      sx={{
        color: style.color,
        backgroundColor: style.bg,
        fontWeight: 700,
        fontSize: '0.72rem',
        height: 24,
      }}
    />
  );
}
