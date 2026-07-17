import { Box, Grid, Typography, Stack, Card, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import StatCard from '../../components/StatCard';
import AssetCard from '../../components/AssetCard';
import { ASSETS, PORTFOLIO_HISTORY, USERS } from '../../mock/mockData';
import { formatGBP } from '../../mock/helpers';
import { brand } from '../../theme';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const myAssets = ASSETS.filter((a) => a.ownerId === USERS.customer.id);
  const totalValue = myAssets.reduce((sum, a) => sum + a.valuation, 0);
  const avgLtv = Math.round(myAssets.reduce((s, a) => s + a.ltv, 0) / myAssets.length);
  const pending = myAssets.filter((a) => a.status.includes('Pending')).length;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Welcome back, {USERS.customer.name.split(' ')[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Here's what's happening across your tokenized assets today.
          </Typography>
        </Box>
        <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate('/customer/transfer')}>
          New Transfer
        </Button>
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Portfolio Value" value={formatGBP(totalValue)} sub="+2.3% this quarter" trend="up" icon={AccountBalanceWalletRoundedIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Tokenized Assets" value={myAssets.length} sub="Across 4 asset classes" icon={TrendingUpRoundedIcon} accent="#0277BD" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Average LTV" value={`${avgLtv}%`} sub="Within safe thresholds" icon={GppGoodRoundedIcon} accent="#2E7D32" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Pending Actions" value={pending} sub={pending ? 'Awaiting RM approval' : 'All clear'} icon={PendingActionsRoundedIcon} accent="#B98900" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Portfolio Value Over Time
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Aggregated Multi-AVM valuation, last 6 months
            </Typography>
            <Box sx={{ height: 220, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PORTFOLIO_HISTORY} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={brand[500]} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={brand[500]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1EDE6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#4B6358' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#4B6358' }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatGBP(v)} contentStyle={{ borderRadius: 10, border: '1px solid #E1EDE6' }} />
                  <Area type="monotone" dataKey="value" stroke={brand[600]} strokeWidth={2.5} fill="url(#portfolioFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, borderRadius: 3, height: '100%', background: `linear-gradient(160deg, ${brand[900]} 0%, #0A3324 100%)`, color: '#EAF6EF' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Digital Will Status
            </Typography>
            {myAssets.filter((a) => a.digitalWill.enabled).map((a) => (
              <Stack key={a.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(234,246,239,0.12)' }}>
                <Typography variant="body2" fontWeight={700}>{a.name}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(234,246,239,0.65)' }}>
                  {a.digitalWill.beneficiaries.map((b) => `${b.name} (${b.allocation}%)`).join(', ')}
                </Typography>
              </Stack>
            ))}
            <Typography variant="caption" sx={{ color: 'rgba(234,246,239,0.55)' }}>
              Succession rules are encoded directly in smart contracts and
              execute automatically once probate is confirmed — no manual
              sign-off delays.
            </Typography>
            <Button
              fullWidth variant="outlined" sx={{ mt: 2, borderColor: 'rgba(234,246,239,0.3)', color: '#EAF6EF', '&:hover': { borderColor: brand[300], bgcolor: 'rgba(107,216,168,0.12)' } }}
              onClick={() => navigate('/customer/will')}
            >
              Manage Digital Will
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Your Tokenized Assets
        </Typography>
        <Button size="small" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate('/customer/assets')}>
          View all
        </Button>
      </Stack>
      <Grid container spacing={2.5}>
        {myAssets.map((asset) => (
          <Grid item xs={12} sm={6} md={3} key={asset.id}>
            <AssetCard asset={asset} onClick={() => navigate('/customer/assets', { state: { assetId: asset.id } })} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
