import { useState } from 'react';
import {
  Box, Typography, Card, Stack, Button, Chip, Divider, Alert,
} from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { TRANSACTIONS, ASSETS } from '../../mock/mockData';
import { formatGBP } from '../../mock/helpers';
import StatusChip from '../../components/StatusChip';

export default function ApprovalQueue() {
  const [decisions, setDecisions] = useState({});
  const pending = TRANSACTIONS.filter((t) => t.status === 'Pending Approval');

  const decide = (id, decision) => setDecisions((prev) => ({ ...prev, [id]: decision }));

  return (
    <Box sx={{ maxWidth: 820 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Approval Queue</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Transactions awaiting relationship manager sign-off before ledger settlement.
      </Typography>

      {pending.length === 0 && (
        <Alert severity="success" sx={{ borderRadius: 2 }}>No pending approvals — you're all caught up.</Alert>
      )}

      <Stack spacing={2.5}>
        {pending.map((tx) => {
          const asset = ASSETS.find((a) => a.id === tx.assetId);
          const decision = decisions[tx.id];
          return (
            <Card key={tx.id} sx={{ p: 3, borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{tx.type} Request</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{tx.id}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{tx.detail}</Typography>
                </Box>
                {decision ? (
                  <StatusChip label={decision === 'approve' ? 'Completed' : 'High'} />
                ) : (
                  <StatusChip label={tx.status} />
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Asset</Typography>
                  <Typography variant="body2" fontWeight={700}>{asset?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Valuation</Typography>
                  <Typography variant="body2" fontWeight={700}>{formatGBP(asset?.valuation || 0)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Requested by</Typography>
                  <Typography variant="body2" fontWeight={700}>{tx.actor}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2" fontWeight={700}>{tx.date}</Typography>
                </Box>
              </Stack>

              {!decision ? (
                <Stack direction="row" spacing={1.5}>
                  <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} onClick={() => decide(tx.id, 'approve')}>
                    Approve & Settle
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<CloseRoundedIcon />} onClick={() => decide(tx.id, 'reject')}>
                    Reject
                  </Button>
                </Stack>
              ) : (
                <Alert severity={decision === 'approve' ? 'success' : 'error'} sx={{ borderRadius: 2 }}>
                  {decision === 'approve'
                    ? 'Approved — smart contract has settled the transfer and updated the permissioned ledger.'
                    : 'Rejected — the customer has been notified and the asset state remains unchanged.'}
                </Alert>
              )}
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
