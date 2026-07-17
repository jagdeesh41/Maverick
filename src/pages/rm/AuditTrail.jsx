import { Box, Typography, Card, Stack, Chip } from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import { AUDIT_LOG } from '../../mock/mockData';
import { brand } from '../../theme';

export default function AuditTrail() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Audit Trail</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Every state change is immutably recorded on the permissioned ledger — tamper-proof, timestamped and cryptographically verifiable.
      </Typography>

      <Card sx={{ borderRadius: 3, p: 1 }}>
        <Stack divider={<Box sx={{ borderBottom: '1px solid #E1EDE6' }} />}>
          {AUDIT_LOG.map((entry) => (
            <Stack key={entry.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.25 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: brand[50], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LockRoundedIcon sx={{ fontSize: 16, color: brand[700] }} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700}>{entry.event}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {entry.asset} · {entry.actor} · {entry.timestamp}
                  </Typography>
                </Box>
              </Stack>
              <Chip
                label={entry.hash}
                size="small"
                sx={{ fontFamily: 'monospace', bgcolor: '#F4F9F6', color: 'text.secondary', fontSize: '0.7rem' }}
              />
            </Stack>
          ))}
        </Stack>
      </Card>
    </Box>
  );
}
