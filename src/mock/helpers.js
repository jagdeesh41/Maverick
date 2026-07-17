import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import DiamondRoundedIcon from '@mui/icons-material/DiamondRounded';

export const ASSET_ICONS = {
  property: HomeWorkRoundedIcon,
  bond: AccountBalanceRoundedIcon,
  equity: ShowChartRoundedIcon,
  commodity: DiamondRoundedIcon,
};

export function formatGBP(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ltvColor(ltv, threshold) {
  const ratio = ltv / threshold;
  if (ratio >= 0.9) return '#C62828';
  if (ratio >= 0.7) return '#B98900';
  return '#2E7D32';
}
