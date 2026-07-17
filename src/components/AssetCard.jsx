import { Card, Stack, Typography, Box, LinearProgress, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ASSET_ICONS, formatGBP, ltvColor } from '../mock/helpers';
import StatusChip from './StatusChip';
import { brand } from '../theme';

export default function AssetCard({ asset, onClick }) {
  const Icon = ASSET_ICONS[asset.type];
  const color = ltvColor(asset.ltv, asset.ltvThreshold);

  return (
    <Card
      onClick={onClick}
      sx={{
        p: 2.5, borderRadius: 3, cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        '&:hover': onClick ? { boxShadow: '0 6px 18px rgba(15,43,33,0.10)', transform: 'translateY(-2px)' } : {},
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: brand[50], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon sx={{ color: brand[700], fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {asset.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {asset.tokenSymbol}
            </Typography>
          </Box>
        </Stack>
        <StatusChip label={asset.status} />
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
        <Typography variant="h6" fontWeight={800}>
          {formatGBP(asset.valuation)}
        </Typography>
        <Chip
          size="small"
          label={`${asset.confidenceScore}% confidence`}
          sx={{ bgcolor: '#F4F9F6', color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem', height: 22 }}
        />
      </Stack>

      <Box>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Loan-to-Value
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color }}>
            {asset.ltv}% / {asset.ltvThreshold}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={(asset.ltv / asset.ltvThreshold) * 100}
          sx={{
            height: 6, borderRadius: 3, bgcolor: '#EAF1EC',
            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
          }}
        />
      </Box>
    </Card>
  );
}
