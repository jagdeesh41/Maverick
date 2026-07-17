import { Box, Grid, Typography, Stack, Card, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import StatCard from '../../components/StatCard';
import StatusChip from '../../components/StatusChip';
import { CLIENTS, TRANSACTIONS, RISK_ALERTS, USERS } from '../../mock/mockData';
import { formatGBP } from '../../mock/helpers';
import { brand } from '../../theme';

const ltvByClient = CLIENTS.map((c) => ({ name: c.name.split(' ')[0], value: c.totalValue }));

export default function RMDashboard() {
  const navigate = useNavigate();
  const pendingApprovals = TRANSACTIONS.filter((t) => t.status === 'Pending Approval').length;
  const totalAUM = CLIENTS.reduce((s, c) => s + c.totalValue, 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Good morning, {USERS.rm.name.split(' ')[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {USERS.rm.branch} · {USERS.rm.portfolioClients} clients under management
          </Typography>
        </Box>
        <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate('/rm/approvals')}>
          Review Approvals
        </Button>
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Assets Under Management" value={formatGBP(totalAUM)} sub="Across 4 tracked clients" icon={AccountBalanceWalletRoundedIcon} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Active Clients" value={CLIENTS.length} sub={`${USERS.rm.portfolioClients} total book`} icon={GroupsRoundedIcon} accent="#0277BD" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Pending Approvals" value={pendingApprovals} sub="Requires your sign-off" icon={FactCheckRoundedIcon} accent="#B98900" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Active Risk Alerts" value={RISK_ALERTS.length} sub="1 high severity" icon={WarningAmberRoundedIcon} accent="#C62828" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Client Asset Exposure</Typography>
            <Typography variant="caption" color="text.secondary">Tokenized asset value by client</Typography>
            <Box sx={{ height: 220, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ltvByClient} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1EDE6" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B6358' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#4B6358' }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatGBP(v)} contentStyle={{ borderRadius: 10, border: '1px solid #E1EDE6' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {ltvByClient.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? brand[600] : brand[300]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>Risk Alerts</Typography>
              <Button size="small" onClick={() => navigate('/rm/risk')}>View all</Button>
            </Stack>
            <Stack spacing={1.5}>
              {RISK_ALERTS.map((alert) => (
                <Stack key={alert.id} spacing={0.5} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F4F9F6' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={700}>{alert.clientName}</Typography>
                    <StatusChip label={alert.severity} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{alert.message}</Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>Recent Activity</Typography>
          <Button size="small" onClick={() => navigate('/rm/audit')}>Full audit trail</Button>
        </Stack>
        <Stack divider={<Box sx={{ borderBottom: '1px solid #E1EDE6' }} />} spacing={1.5}>
          {TRANSACTIONS.slice(0, 4).map((tx) => (
            <Stack key={tx.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{tx.type} — {tx.detail}</Typography>
                <Typography variant="caption" color="text.secondary">{tx.actor} · {tx.date}</Typography>
              </Box>
              <StatusChip label={tx.status} />
            </Stack>
          ))}
        </Stack>
      </Card>
    </Box>
  );
}
