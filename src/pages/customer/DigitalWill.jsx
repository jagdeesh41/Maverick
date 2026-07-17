import { useState } from 'react';
import {
  Box, Typography, Card, Stack, Switch, TextField, Button, Grid, MenuItem, Chip, Divider, Alert,
} from '@mui/material';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import { ASSETS, USERS } from '../../mock/mockData';
import { ASSET_ICONS, formatGBP } from '../../mock/helpers';
import { brand } from '../../theme';

export default function DigitalWill() {
  const myAssets = ASSETS.filter((a) => a.ownerId === USERS.customer.id);
  const [assets, setAssets] = useState(myAssets);
  const [saved, setSaved] = useState(false);

  const toggle = (id) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, digitalWill: { ...a.digitalWill, enabled: !a.digitalWill.enabled } } : a)));
    setSaved(false);
  };

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Digital Will</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Programmable inheritance — succession rules are encoded directly into each
        asset's smart contract and execute automatically once probate is confirmed,
        with no manual sign-off delays.
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setSaved(false)}>
          Digital Will settings updated and recorded on the ledger.
        </Alert>
      )}

      <Stack spacing={2.5}>
        {assets.map((asset) => {
          const Icon = ASSET_ICONS[asset.type];
          return (
            <Card key={asset.id} sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: brand[50], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon sx={{ color: brand[700] }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{asset.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatGBP(asset.valuation)} · {asset.tokenSymbol}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {asset.digitalWill.enabled ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Switch checked={asset.digitalWill.enabled} onChange={() => toggle(asset.id)} color="success" />
                </Stack>
              </Stack>

              {asset.digitalWill.enabled && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Trigger condition</Typography>
                      <TextField select fullWidth size="small" value={asset.digitalWill.trigger || 'Probate confirmation'} sx={{ mt: 0.75 }}>
                        <MenuItem value="Probate confirmation">Probate confirmation</MenuItem>
                        <MenuItem value="Court order">Court order</MenuItem>
                        <MenuItem value="Inactivity + multi-party approval">Inactivity + multi-party approval</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>Beneficiaries</Typography>
                      <Stack spacing={1} sx={{ mt: 0.75 }}>
                        {asset.digitalWill.beneficiaries.map((b, i) => (
                          <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.5, py: 1, bgcolor: '#F4F9F6', borderRadius: 2 }}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{b.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{b.relation}</Typography>
                            </Box>
                            <Chip label={`${b.allocation}%`} size="small" sx={{ fontWeight: 700, bgcolor: brand[50], color: brand[700] }} />
                          </Stack>
                        ))}
                      </Stack>
                    </Grid>
                  </Grid>
                </>
              )}
            </Card>
          );
        })}
      </Stack>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button variant="contained" startIcon={<DescriptionRoundedIcon />} onClick={() => setSaved(true)}>
          Save Digital Will Settings
        </Button>
      </Stack>
    </Box>
  );
}
