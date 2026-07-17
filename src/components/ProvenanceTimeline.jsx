import { Stack, Box, Typography } from '@mui/material';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import { brand } from '../theme';

export default function ProvenanceTimeline({ events }) {
  if (!events || events.length === 0) {
    return <Typography variant="body2" color="text.secondary">No ledger events recorded yet.</Typography>;
  }
  return (
    <Stack spacing={0}>
      {events.map((ev, i) => (
        <Stack key={i} direction="row" spacing={2} sx={{ position: 'relative' }}>
          <Stack alignItems="center" sx={{ width: 20 }}>
            <FiberManualRecordRoundedIcon sx={{ fontSize: 12, color: brand[700], mt: 0.6 }} />
            {i < events.length - 1 && (
              <Box sx={{ width: '2px', flex: 1, bgcolor: '#E1EDE6', minHeight: 32 }} />
            )}
          </Stack>
          <Box sx={{ pb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={700}>
                {ev.stage}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ev.date}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {ev.note} · <span style={{ fontFamily: 'monospace' }}>{ev.actor}</span>
            </Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
