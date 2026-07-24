/**
 * format.js
 * Fixes the bug where £/₹ symbols and lakh-vs-thousands grouping were
 * inconsistent across screens (toLocaleString() with no locale argument
 * follows whatever locale the machine it's running on happens to have).
 * Every screen should import formatGBP() instead of doing this inline.
 */
const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

export function formatGBP(value) {
  return gbp.format(Number(value) || 0);
}
