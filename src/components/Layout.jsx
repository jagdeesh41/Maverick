import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Box, Stack, Typography, Avatar, IconButton, Divider, Badge, Tooltip,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useAuth } from '../context/AuthContext';
import { RISK_ALERTS } from '../mock/mockData';
import { brand } from '../theme';

const CUSTOMER_NAV = [
  { to: '/customer', label: 'Dashboard', icon: DashboardRoundedIcon, end: true },
  { to: '/customer/assets', label: 'My Assets', icon: AccountBalanceWalletRoundedIcon },
  { to: '/customer/transfer', label: 'Transfer', icon: SwapHorizRoundedIcon },
  { to: '/customer/history', label: 'Transaction History', icon: HistoryRoundedIcon },
  { to: '/customer/will', label: 'Digital Will', icon: DescriptionRoundedIcon },
];

const RM_NAV = [
  { to: '/rm', label: 'Dashboard', icon: DashboardRoundedIcon, end: true },
  { to: '/rm/clients', label: 'Clients', icon: GroupsRoundedIcon },
  { to: '/rm/approvals', label: 'Approval Queue', icon: FactCheckRoundedIcon },
  { to: '/rm/risk', label: 'Risk & Compliance', icon: ShieldRoundedIcon },
  { to: '/rm/audit', label: 'Audit Trail', icon: ReceiptLongRoundedIcon },
];

export default function Layout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = role === 'customer' ? CUSTOMER_NAV : RM_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 248,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${brand[900]} 0%, #0A3324 100%)`,
          color: '#EAF6EF',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <Stack direction="row" spacing={1.3} alignItems="center" sx={{ px: 2.5, py: 2.75 }}>
          <Box
            sx={{
              width: 34, height: 34, borderRadius: '9px',
              bgcolor: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <AccountBalanceRoundedIcon fontSize="small" sx={{ color: brand[300] }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.1 }}>
              Lloyds Digital
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(234,246,239,0.6)' }}>
              Asset Tokenization
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderColor: 'rgba(234,246,239,0.1)' }} />

        <Stack sx={{ px: 1.5, py: 2, flex: 1 }} spacing={0.5}>
          {role === 'customer' && (
            <NavLink to="/accounts" style={{ textDecoration: 'none' }}>
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
                sx={{
                  px: 1.5, py: 1, mb: 1, borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <ArrowBackRoundedIcon fontSize="small" sx={{ color: 'rgba(234,246,239,0.7)' }} />
                <Typography variant="caption" fontWeight={700} sx={{ color: 'rgba(234,246,239,0.85)' }}>
                  Back to Accounts
                </Typography>
              </Stack>
            </NavLink>
          )}
          <Typography variant="overline" sx={{ color: 'rgba(234,246,239,0.4)', px: 1.5, fontSize: '0.68rem', letterSpacing: 1 }}>
            {role === 'customer' ? 'Digital Assets' : 'RM Console'}
          </Typography>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? '#EAF6EF' : 'rgba(234,246,239,0.7)',
              })}
            >
              {({ isActive }) => (
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    px: 1.5,
                    py: 1.1,
                    borderRadius: 2,
                    bgcolor: isActive ? 'rgba(36,169,115,0.18)' : 'transparent',
                    borderLeft: isActive ? `3px solid ${brand[300]}` : '3px solid transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <item.icon fontSize="small" sx={{ color: isActive ? brand[300] : 'inherit' }} />
                  <Typography variant="body2" fontWeight={isActive ? 700 : 500}>
                    {item.label}
                  </Typography>
                </Stack>
              )}
            </NavLink>
          ))}
        </Stack>

        <Divider sx={{ borderColor: 'rgba(234,246,239,0.1)' }} />
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            onClick={handleLogout}
            sx={{ cursor: 'pointer', px: 1, py: 1, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
          >
            <LogoutRoundedIcon fontSize="small" sx={{ color: 'rgba(234,246,239,0.7)' }} />
            <Typography variant="body2" sx={{ color: 'rgba(234,246,239,0.7)' }}>
              Sign out
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Main column */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 4, py: 2, bgcolor: '#FFFFFF', borderBottom: '1px solid',
            borderColor: 'divider', position: 'sticky', top: 0, zIndex: 5,
            boxShadow: '0 1px 3px rgba(15,43,33,0.05)',
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
              {role === 'customer' ? user.tier : user.branch}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title={`${RISK_ALERTS.length} active alerts`}>
              <IconButton sx={{ bgcolor: '#F4F9F6' }}>
                <Badge badgeContent={role === 'rm' ? RISK_ALERTS.length : 0} color="error">
                  <NotificationsNoneRoundedIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
            <Stack direction="row" spacing={1.3} alignItems="center">
              <Avatar sx={{ width: 36, height: 36, bgcolor: brand[600], fontSize: '0.85rem', fontWeight: 700 }}>
                {user.avatarInitials}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
                  {user.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {role === 'customer' ? 'Customer' : 'Relationship Manager'}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>

        <Box sx={{ p: 4, flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
