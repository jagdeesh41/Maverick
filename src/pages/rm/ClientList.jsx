import { useState } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, InputAdornment, Avatar, Stack,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { CLIENTS, ASSETS } from '../../mock/mockData';
import { formatGBP } from '../../mock/helpers';
import StatusChip from '../../components/StatusChip';
import { brand } from '../../theme';

export default function ClientList() {
  const [query, setQuery] = useState('');
  const filtered = CLIENTS.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Clients</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage tokenized asset relationships across your client book.
      </Typography>

      <TextField
        placeholder="Search clients…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        size="small"
        sx={{ mb: 2.5, width: 320, bgcolor: '#FFFFFF' }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
      />

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>KYC Status</TableCell>
              <TableCell>Tokenized Assets</TableCell>
              <TableCell>Total Value</TableCell>
              <TableCell>Risk Flag</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id} hover sx={{ cursor: 'pointer' }}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: brand[600], fontSize: '0.75rem', fontWeight: 700 }}>
                      {client.name.split(' ').map((n) => n[0]).join('')}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{client.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{client.id}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>{client.tier}</TableCell>
                <TableCell><StatusChip label={client.kycStatus} /></TableCell>
                <TableCell>{client.assets}</TableCell>
                <TableCell><Typography variant="body2" fontWeight={700}>{formatGBP(client.totalValue)}</Typography></TableCell>
                <TableCell><StatusChip label={client.riskFlag} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
