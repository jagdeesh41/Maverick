import { useNavigate } from 'react-router-dom';
import {
  Box, Stack, Typography, Link, Button, Divider,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DiamondRoundedIcon from '@mui/icons-material/DiamondRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BrandMark from '../components/BrandMark';
import { useAuth } from '../context/AuthContext';
import { BANK_ACCOUNTS, PRODUCT_NAV } from '../mock/mockData';
import { brand, accentOrange } from '../theme';

function formatMoney(v) {
  const sign = v < 0 ? '-' : '';
  return `${sign}£ ${Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
}

export default function AccountOverview() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F0F2F0' }}>
      {/* Green header */}
      <Box sx={{ background: `linear-gradient(115deg, ${brand[600]} 0%, ${brand[500]} 100%)`, color: '#FFFFFF' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.75 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="subtitle1" fontWeight={800} letterSpacing={0.5}>LLOYDS BANK</Typography>
            <BrandMark size={34} />
          </Stack>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>Cookie Policy</Typography>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 } }}>
        {/* Sub header — user + nav */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          spacing={1.5}
          sx={{ py: 2.5, borderBottom: '1px solid #D8DFDB' }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>{user.name}</Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
              <Typography variant="caption">🔒 Last logged on 17 July 26 at 05:23 AM</Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={3.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <HomeRoundedIcon sx={{ color: brand[700] }} />
            <Link underline="none" sx={{ color: brand[700], fontWeight: 700, cursor: 'pointer' }}>Your Accounts ▾</Link>
            <Link underline="none" sx={{ color: brand[700], fontWeight: 700, cursor: 'pointer' }}>Your Profile ▾</Link>
            <Link underline="none" sx={{ color: brand[700], fontWeight: 700, cursor: 'pointer' }}>Your Security</Link>
            <Link underline="none" sx={{ color: brand[700], fontWeight: 700, cursor: 'pointer' }}>Help & Support ▾</Link>
            <MailOutlineRoundedIcon sx={{ color: brand[700] }} />
            <Link underline="none" onClick={() => { logout(); navigate('/login'); }} sx={{ color: brand[700], fontWeight: 700, cursor: 'pointer' }}>
              Log off
            </Link>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ py: 3 }}>
          {/* Left product nav */}
          <Box sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
            <Box sx={{ bgcolor: brand[800], color: '#FFFFFF', p: 2, borderRadius: '2px 2px 0 0' }}>
              <Typography variant="subtitle2" fontWeight={800} letterSpacing={0.5}>OUR PRODUCTS AND SERVICES</Typography>
              <Box sx={{ width: 40, height: 2, bgcolor: brand[400], mt: 1 }} />
            </Box>
            <Stack>
              {PRODUCT_NAV.map((item) => (
                <Stack
                  key={item}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    bgcolor: brand[800], color: '#FFFFFF', px: 2, py: 1.4,
                    borderTop: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                    '&:hover': { bgcolor: brand[700] },
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>{item.toUpperCase()}</Typography>
                  <AddRoundedIcon sx={{ fontSize: 18, color: brand[400] }} />
                </Stack>
              ))}
              {/* Digital Assets entry point — visually distinct */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                onClick={() => navigate('/customer')}
                sx={{
                  bgcolor: accentOrange, color: '#FFFFFF', px: 2, py: 1.6,
                  borderTop: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer',
                  '&:hover': { bgcolor: '#A84C16' },
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <DiamondRoundedIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={800}>DIGITAL ASSETS</Typography>
                </Stack>
                <ChevronRightRoundedIcon sx={{ fontSize: 20 }} />
              </Stack>
            </Stack>

            <Box sx={{ mt: 2.5, bgcolor: '#FFFFFF', border: '1px solid #D8DFDB', p: 2 }}>
              <Typography variant="body2" fontWeight={700} color={brand[700]}>GET ADD-ONS</Typography>
            </Box>
            <Box sx={{ mt: 1.5, bgcolor: '#FFFFFF', border: '1px solid #D8DFDB', p: 2 }}>
              <Typography variant="body2" fontWeight={700} color={brand[700]}>WHAT'S NEW IN INTERNET BANKING</Typography>
            </Box>
          </Box>

          {/* Main content */}
          <Box sx={{ flex: 1 }}>
            {/* Digital Assets promo banner — the single customer entry point */}
            <Box
              onClick={() => navigate('/customer')}
              sx={{
                mb: 3, p: 3, borderRadius: 2, cursor: 'pointer',
                background: `linear-gradient(120deg, ${brand[500]} 0%, ${brand[800]} 60%, ${accentOrange} 130%)`,
                color: '#FFFFFF',
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
                <Box>
                  <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 1 }}>NEW</Typography>
                  <Typography variant="h6" fontWeight={800}>Explore Digital Asset Tokenization</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 480 }}>
                    View, transfer and manage your tokenized property, bonds, shares and
                    commodities — with programmable inheritance and real-time valuation.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{ bgcolor: '#FFFFFF', color: brand[700], fontWeight: 800, whiteSpace: 'nowrap', '&:hover': { bgcolor: brand[50] } }}
                >
                  Open Digital Assets
                </Button>
              </Stack>
            </Box>

            <Stack spacing={2.5}>
              {BANK_ACCOUNTS.map((acc) => (
                <Stack key={acc.id} direction={{ xs: 'column', md: 'row' }} sx={{ border: '1px solid #D8DFDB', bgcolor: '#FFFFFF' }}>
                  <Box sx={{ flex: 1, p: 2.5 }}>
                    <Typography variant="body2" fontWeight={800} color={brand[700]} letterSpacing={0.3}>
                      {acc.label}{'  '}
                      <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>
                        {acc.sortCode ? `${acc.sortCode}   ${acc.number}` : acc.number}
                      </Typography>
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 1, color: acc.balance < 0 ? '#B3261E' : '#111' }}>
                      {formatMoney(acc.balance)}
                      {acc.note && <Typography component="span" variant="body2" sx={{ ml: 1.5, color: 'text.secondary', fontWeight: 500 }}>{acc.note}</Typography>}
                    </Typography>
                    {acc.tag && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="text.secondary">{acc.tag}</Typography>
                      </>
                    )}
                  </Box>
                  <Stack sx={{ width: { xs: '100%', md: 220 }, flexShrink: 0 }}>
                    {['View statement', 'Payments and transfers'].map((action) => (
                      <Stack
                        key={action} direction="row" justifyContent="space-between" alignItems="center"
                        sx={{
                          px: 2, py: 1.4, borderTop: '1px solid #D8DFDB', cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          '&:hover': { bgcolor: brand[50] },
                        }}
                      >
                        <Typography variant="body2" fontWeight={700} color={brand[700]}>{action}</Typography>
                        <ChevronRightRoundedIcon sx={{ fontSize: 18, color: brand[700] }} />
                      </Stack>
                    ))}
                    <Stack
                      direction="row" justifyContent="space-between" alignItems="center"
                      sx={{
                        px: 2, py: 1.4, bgcolor: brand[600], cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        '&:hover': { bgcolor: brand[700] },
                      }}
                    >
                      <Typography variant="body2" fontWeight={700} color="#FFFFFF">More actions</Typography>
                      <ChevronRightRoundedIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />
                    </Stack>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
