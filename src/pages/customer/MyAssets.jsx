import { useState } from 'react';
import {
  Box, Grid, Typography, Stack, Card, Chip, Divider, Button,
} from '@mui/material';
import { ASSETS, USERS } from '../../mock/mockData';
import { ASSET_ICONS, formatGBP, ltvColor } from '../../mock/helpers';
import StatusChip from '../../components/StatusChip';
import ProvenanceTimeline from '../../components/ProvenanceTimeline';
import { useNavigate } from 'react-router-dom';
import { brand } from '../../theme';

export default function MyAssets() {
  const myAssets = ASSETS.filter((a) => a.ownerId === USERS.customer.id);
  const [selectedId, setSelectedId] = useState(myAssets[0]?.id);
  const selected = myAssets.find((a) => a.id === selectedId);
  const navigate = useNavigate();
  const Icon = selected ? ASSET_ICONS[selected.type] : null;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>My Assets</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Every tokenized asset in your portfolio, with full ledger provenance.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            {myAssets.map((asset) => {
              const AIcon = ASSET_ICONS[asset.type];
              const active = asset.id === selectedId;
              return (
                <Card
                  key={asset.id}
                  onClick={() => setSelectedId(asset.id)}
                  sx={{
                    p: 2, borderRadius: 3, cursor: 'pointer',
                    border: active ? `2px solid ${brand[600]}` : '1px solid #E1EDE6',
                    bgcolor: active ? brand[50] : '#FFFFFF',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#FFFFFF', border: '1px solid #E1EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AIcon sx={{ fontSize: 18, color: brand[700] }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{asset.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {asset.tokenSymbol}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack alignItems="flex-end" spacing={0.5}>
                      <Typography variant="body2" fontWeight={700}>{formatGBP(asset.valuation)}</Typography>
                      <StatusChip label={asset.status} />
                    </Stack>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </Grid>

        <Grid item xs={12} md={7}>
          {selected && (
            <Card sx={{ p: 3.5, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: brand[50], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon sx={{ color: brand[700] }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>{selected.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {selected.tokenSymbol} · {selected.id}
                    </Typography>
                  </Box>
                </Stack>
                <StatusChip label={selected.status} />
              </Stack>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Valuation</Typography>
                  <Typography variant="body1" fontWeight={700}>{formatGBP(selected.valuation)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Confidence</Typography>
                  <Typography variant="body1" fontWeight={700}>{selected.confidenceScore}%</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">LTV</Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ color: ltvColor(selected.ltv, selected.ltvThreshold) }}>
                    {selected.ltv}%
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Last Revalued</Typography>
                  <Typography variant="body1" fontWeight={700}>{selected.lastRevalued}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: '#F4F9F6', mb: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Valuation source: <strong>{selected.valuationSource}</strong>
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                <Button variant="contained" size="small" onClick={() => navigate('/customer/transfer')}>
                  Transfer Asset
                </Button>
                <Button variant="outlined" size="small" onClick={() => navigate('/customer/will')}>
                  Digital Will
                </Button>
              </Stack>

              <Divider sx={{ mb: 2.5 }} />

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Ledger Provenance
              </Typography>
              <ProvenanceTimeline events={selected.provenance} />
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
