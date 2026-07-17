import { useState } from 'react';
import {
  Box, Typography, Card, Stack, MenuItem, TextField, Button, Stepper,
  Step, StepLabel, Alert, Divider, CircularProgress,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { ASSETS, USERS } from '../../mock/mockData';
import { formatGBP } from '../../mock/helpers';
import { brand } from '../../theme';

const STEPS = ['Select Asset', 'Transfer Details', 'Smart Contract Execution', 'Confirmation'];

export default function TransferAsset() {
  const myAssets = ASSETS.filter((a) => a.ownerId === USERS.customer.id && a.status === 'Active');
  const [activeStep, setActiveStep] = useState(0);
  const [assetId, setAssetId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [contractLog, setContractLog] = useState([]);

  const asset = myAssets.find((a) => a.id === assetId);

  const runContract = () => {
    setActiveStep(2);
    setProcessing(true);
    setContractLog([]);
    const steps = [
      'Validating ownership on Permissioned Token Ledger…',
      'Checking compliance & KYC status for recipient…',
      'Evaluating transfer conditions via Smart Contract Adapter…',
      'Recording transaction on Blockchain & Tokenization Layer…',
      'Awaiting Relationship Manager approval…',
    ];
    steps.forEach((line, i) => {
      setTimeout(() => {
        setContractLog((prev) => [...prev, line]);
        if (i === steps.length - 1) {
          setProcessing(false);
          setTimeout(() => setActiveStep(3), 500);
        }
      }, (i + 1) * 750);
    });
  };

  const reset = () => {
    setActiveStep(0);
    setAssetId('');
    setRecipient('');
    setReason('');
    setContractLog([]);
  };

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Transfer Asset</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ownership transfers execute through smart contracts and require RM sign-off before settlement.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      <Card sx={{ p: 3.5, borderRadius: 3 }}>
        {activeStep === 0 && (
          <Stack spacing={2.5}>
            <TextField
              select label="Select an asset to transfer" value={assetId}
              onChange={(e) => setAssetId(e.target.value)} fullWidth
            >
              {myAssets.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name} — {formatGBP(a.valuation)} ({a.tokenSymbol})
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" disabled={!assetId} onClick={() => setActiveStep(1)}>
                Continue
              </Button>
            </Stack>
          </Stack>
        )}

        {activeStep === 1 && asset && (
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Transferring <strong>{asset.name}</strong> ({asset.tokenSymbol}), currently valued at {formatGBP(asset.valuation)}.
            </Alert>
            <TextField
              label="Recipient account / IBAN reference" value={recipient}
              onChange={(e) => setRecipient(e.target.value)} fullWidth
              placeholder="e.g. ISA-WRAPPER-88213 or GB29 NWBK ..."
            />
            <TextField
              select label="Transfer reason" value={reason}
              onChange={(e) => setReason(e.target.value)} fullWidth
            >
              <MenuItem value="wrapper">Move into tax wrapper (ISA / SIPP)</MenuItem>
              <MenuItem value="family">Transfer to family member</MenuItem>
              <MenuItem value="sale">Sale / disposal</MenuItem>
              <MenuItem value="rebalance">Portfolio rebalancing</MenuItem>
            </TextField>
            <Stack direction="row" justifyContent="space-between">
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button variant="contained" disabled={!recipient || !reason} onClick={runContract}>
                Execute Transfer
              </Button>
            </Stack>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={2}>
            <Typography variant="subtitle2" fontWeight={700}>Smart contract execution in progress</Typography>
            <Stack spacing={1.2} sx={{ fontFamily: 'monospace' }}>
              {contractLog.map((line, i) => (
                <Stack key={i} direction="row" spacing={1.2} alignItems="center">
                  <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#2E7D32' }} />
                  <Typography variant="caption" color="text.secondary">{line}</Typography>
                </Stack>
              ))}
              {processing && (
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <CircularProgress size={14} sx={{ color: brand[600] }} />
                  <Typography variant="caption" color="text.secondary">Processing…</Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        )}

        {activeStep === 3 && asset && (
          <Stack spacing={2} alignItems="flex-start">
            <Stack direction="row" spacing={1.2} alignItems="center">
              <CheckCircleRoundedIcon sx={{ color: '#2E7D32' }} />
              <Typography variant="subtitle1" fontWeight={700}>Transfer submitted</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Your request to transfer <strong>{asset.name}</strong> has been recorded on the
              permissioned ledger and is now <strong>pending Relationship Manager approval</strong>.
              You'll be notified once it settles.
            </Typography>
            <Divider sx={{ width: '100%' }} />
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">Reference</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>TX-{Math.floor(80000 + Math.random() * 9999)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body2" fontWeight={700} color="warning.main">Pending Approval</Typography>
              </Box>
            </Stack>
            <Button variant="outlined" onClick={reset} sx={{ mt: 1 }}>Start a new transfer</Button>
          </Stack>
        )}
      </Card>
    </Box>
  );
}
