import { Box, Typography, Card, Grid, Stack, LinearProgress, Chip } from '@mui/material';
import { RISK_ALERTS, CLIENTS, ASSETS } from '../../mock/mockData';
import { ltvColor, formatGBP } from '../../mock/helpers';
import StatusChip from '../../components/StatusChip';

export default function RiskMonitoring() {
  const highLtvAssets = ASSETS.filter((a) => a.ltv / a.ltvThreshold >= 0.7);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Risk & Compliance</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Oracle-driven anomaly detection and LTV exposure across your book, powered by the Risk Intelligence Agent.
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Active Alerts</Typography>
            <Stack spacing={1.5}>
              {RISK_ALERTS.map((alert) => (
                <Stack key={alert.id} spacing={0.5} sx={{ p: 1.75, borderRadius: 2, bgcolor: '#F4F9F6' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={700}>{alert.clientName}</Typography>
                    <StatusChip label={alert.severity} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{alert.message}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{alert.date}</Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>LTV Exposure Monitor</Typography>
            <Stack spacing={2.5}>
              {highLtvAssets.map((asset) => {
                const color = ltvColor(asset.ltv, asset.ltvThreshold);
                return (
                  <Box key={asset.id}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>{asset.ownerName || 'Emma Whitfield'} — {asset.name}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color }}>{asset.ltv}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(asset.ltv / asset.ltvThreshold) * 100}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#EAF1EC', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }}
                    />
                    <Typography variant="caption" color="text.secondary">Threshold {asset.ltvThreshold}% · {formatGBP(asset.valuation)}</Typography>
                  </Box>
                );
              })}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Compliance Overview by Client</Typography>
        <Grid container spacing={2}>
          {CLIENTS.map((c) => (
            <Grid item xs={12} sm={6} md={3} key={c.id}>
              <Stack spacing={1} sx={{ p: 2, borderRadius: 2, border: '1px solid #E1EDE6' }}>
                <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                <Stack direction="row" spacing={1}>
                  <StatusChip label={c.kycStatus} />
                  <StatusChip label={c.riskFlag} />
                </Stack>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
}
