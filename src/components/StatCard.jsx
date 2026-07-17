import { Card, Stack, Typography, Box } from '@mui/material';
import { brand } from '../theme';

export default function StatCard({ label, value, sub, icon: Icon, accent = brand[600], trend }) {
  return (
    <Card
      sx={{
        p: 2.5, borderRadius: 3, height: '100%',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
        '&:hover': { boxShadow: '0 6px 18px rgba(15,43,33,0.08)', transform: 'translateY(-2px)' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, color: 'text.primary' }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" sx={{ color: trend === 'up' ? '#2E7D32' : 'text.secondary', fontWeight: 600 }}>
              {sub}
            </Typography>
          )}
        </Box>
        {Icon && (
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2.5,
              bgcolor: `${accent}1A`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon sx={{ color: accent, fontSize: 22 }} />
          </Box>
        )}
      </Stack>
    </Card>
  );
}
