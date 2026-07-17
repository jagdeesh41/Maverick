import { useState } from 'react';
import {
  Box, Typography, TextField, Button, Stack, Link, Checkbox,
  FormControlLabel, Tooltip, InputAdornment, Alert,
} from '@mui/material';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BrandMark from '../components/BrandMark';
import { useAuth } from '../context/AuthContext';
import { brand } from '../theme';

const DEMO_ID = { customer: '0064429278', rm: 'RM-3381' };

export default function Login() {
  const { login } = useAuth();
  const [role, setRole] = useState('customer');
  const [userId, setUserId] = useState(DEMO_ID.customer);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const selectRole = (r) => {
    setRole(r);
    setUserId(DEMO_ID[r]);
    setPassword('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Enter your password to continue.');
      return;
    }
    login(role);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F0F2F0' }}>
      {/* Green top bar */}
      <Box sx={{ background: `linear-gradient(115deg, ${brand[600]} 0%, ${brand[500]} 100%)`, color: '#FFFFFF' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 4 }, py: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6" fontWeight={800} letterSpacing={0.5}>
              LLOYDS BANK
            </Typography>
            <BrandMark size={40} />
          </Stack>
          <Stack direction="row" spacing={4} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Link underline="always" sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
              Mobile
            </Link>
            <Link underline="always" sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
              Cookie policy
            </Link>
          </Stack>
          <Box sx={{ border: '1px solid rgba(255,255,255,0.5)', borderRadius: 1.5, px: 2, py: 1, display: { xs: 'none', md: 'block' } }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LockRoundedIcon fontSize="small" />
              <Typography variant="body2" fontWeight={700}>You're logging into a secure site</Typography>
            </Stack>
            <Link underline="always" sx={{ color: '#FFFFFF', fontSize: '0.78rem' }}>
              How can I tell that this site is secure?
            </Link>
          </Box>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 4 }, py: 5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={5}>
          {/* Main login column */}
          <Box sx={{ flex: 1, maxWidth: 640 }}>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 3, fontSize: { xs: '2rem', md: '2.6rem' }, color: '#111' }}>
              Welcome to Internet Banking
            </Typography>

            {/* Role selector */}
            <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
              <Button
                onClick={() => selectRole('customer')}
                startIcon={<PersonRoundedIcon />}
                variant={role === 'customer' ? 'contained' : 'outlined'}
                sx={{
                  borderRadius: 6, px: 2.5,
                  bgcolor: role === 'customer' ? brand[500] : 'transparent',
                  borderColor: brand[500],
                  color: role === 'customer' ? '#fff' : brand[700],
                  '&:hover': { bgcolor: role === 'customer' ? brand[700] : brand[50] },
                }}
              >
                Customer
              </Button>
              <Button
                onClick={() => selectRole('rm')}
                startIcon={<BadgeRoundedIcon />}
                variant={role === 'rm' ? 'contained' : 'outlined'}
                sx={{
                  borderRadius: 6, px: 2.5,
                  bgcolor: role === 'rm' ? brand[500] : 'transparent',
                  borderColor: brand[500],
                  color: role === 'rm' ? '#fff' : brand[700],
                  '&:hover': { bgcolor: role === 'rm' ? brand[700] : brand[50] },
                }}
              >
                Relationship Manager
              </Button>
            </Stack>

            <Typography sx={{ mb: 3, color: '#333' }}>
              {role === 'customer'
                ? <>If you don't already use Internet Banking, it's simple to <Link underline="always" sx={{ color: brand[700], fontWeight: 700, cursor: 'pointer' }}>register online</Link>.</>
                : 'Sign in with your relationship manager credentials to access the RM console.'}
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5} sx={{ maxWidth: 460 }}>
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 0.75 }}>User ID:</Typography>
                  <TextField
                    fullWidth
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, '& fieldset': { borderColor: '#111', borderWidth: 2 } } }}
                  />
                </Box>
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 0.75 }}>Password:</Typography>
                  <TextField
                    fullWidth
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter any password to continue"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Link
                            component="button"
                            type="button"
                            underline="always"
                            onClick={() => setShowPw((s) => !s)}
                            sx={{ color: brand[700], fontWeight: 700, fontSize: '0.85rem' }}
                          >
                            {showPw ? 'Hide' : 'Show'}
                          </Link>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {error && <Alert severity="warning" sx={{ borderRadius: 1 }}>{error}</Alert>}

                <FormControlLabel
                  control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} sx={{ color: brand[700], '&.Mui-checked': { color: brand[500] } }} />}
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="body2">Remember my User ID</Typography>
                      <Tooltip title="Only enable this on a private device"><InfoOutlinedIcon sx={{ fontSize: 16, color: brand[700] }} /></Tooltip>
                    </Stack>
                  }
                />
                <Typography variant="caption" sx={{ color: '#333' }}>
                  <strong>Warning:</strong> Don't tick this box if you're using a public or shared computer
                </Typography>

                <Box sx={{ borderTop: '1px solid #D8DFDB', pt: 2.5, mt: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1.5} columnGap={2}>
                    <Link underline="always" sx={{ color: brand[700], fontWeight: 700, cursor: 'pointer' }}>
                      Forgotten your logon details?
                    </Link>
                    <Button type="submit" variant="contained" sx={{ bgcolor: brand[500], px: 4, py: 1.1, borderRadius: 1, flexShrink: 0, '&:hover': { bgcolor: brand[700] } }}>
                      Continue
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </form>

            <Box sx={{ mt: 4, p: 2, borderRadius: 1, bgcolor: '#FFFFFF', border: '1px dashed #C9D6CE', maxWidth: 420 }}>
              <Typography variant="caption" color="text.secondary">
                Prototype demo — authentication is mocked. Any password signs you in
                as the seeded {role === 'customer' ? 'customer' : 'RM'} record.
              </Typography>
            </Box>

            <Stack direction="row" spacing={2.5} alignItems="flex-start" sx={{ mt: 5, pt: 4, borderTop: '1px solid #D8DFDB' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: 1.5, bgcolor: brand[50], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PhoneIphoneRoundedIcon sx={{ color: brand[700] }} />
              </Box>
              <Box>
                <Typography fontWeight={800} sx={{ color: brand[700], mb: 0.5 }}>
                  Why not try our secure Mobile Banking app?
                </Typography>
                <Typography variant="body2" sx={{ color: '#333' }}>
                  With our app you get access to lots of extra features to make banking
                  even easier. Things like freeze your card, check your PIN and set your
                  own contactless limit.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Right rail */}
          <Stack spacing={2.5} sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            {['Help & Support', 'Contact Us'].map((label) => (
              <Stack
                key={label}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  p: 2, border: '1px solid #D8DFDB', borderRadius: 1, bgcolor: '#FFFFFF', cursor: 'pointer',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': { borderColor: brand[500], boxShadow: '0 2px 8px rgba(13,63,44,0.08)' },
                }}
              >
                <Typography fontWeight={700} sx={{ color: brand[700] }}>{label}</Typography>
                <ExpandMoreRoundedIcon sx={{ color: brand[700] }} />
              </Stack>
            ))}
            <Box sx={{ p: 2.5, border: '1px solid #D8DFDB', borderRadius: 1, bgcolor: '#FFFFFF', textAlign: 'center' }}>
              <Box
                sx={{
                  width: 84, height: 84, mx: 'auto', mb: 1.5, borderRadius: '50%',
                  bgcolor: '#5C2D91', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <LockRoundedIcon sx={{ color: '#FFFFFF', fontSize: 32 }} />
              </Box>
              <Typography fontWeight={800} sx={{ color: '#5C2D91', fontSize: '0.95rem' }}>
                FSCS PROTECTED
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
