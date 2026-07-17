import { Box } from '@mui/material';

// A simple abstracted ledger/ownership mark in a white tile — evokes the
// bank's black-on-white emblem convention without reproducing any
// trademarked artwork.
export default function BrandMark({ size = 40 }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        bgcolor: '#FFFFFF',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2 L21 6.5 V11 C21 16 17.2 20.3 12 22 C6.8 20.3 3 16 3 11 V6.5 L12 2Z"
          fill="#0F2B21"
        />
        <path d="M8 12.5 L11 15.5 L16 9" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Box>
  );
}
