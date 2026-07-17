import {
  Box, Typography, Card, Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import { TRANSACTIONS, ASSETS, USERS } from '../../mock/mockData';
import StatusChip from '../../components/StatusChip';

export default function TransactionHistory() {
  const myAssetIds = ASSETS.filter((a) => a.ownerId === USERS.customer.id).map((a) => a.id);
  const rows = TRANSACTIONS.filter((t) => myAssetIds.includes(t.assetId));

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Transaction History</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Every ledger event tied to your assets — mint, revalue, transfer and lifecycle actions.
      </Typography>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reference</TableCell>
              <TableCell>Asset</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Detail</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((tx) => {
              const asset = ASSETS.find((a) => a.id === tx.assetId);
              return (
                <TableRow key={tx.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{tx.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{asset?.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{asset?.tokenSymbol}</Typography>
                  </TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{tx.detail}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{tx.date}</Typography></TableCell>
                  <TableCell><StatusChip label={tx.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
