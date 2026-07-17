// ---------------------------------------------------------------------------
// Mocked backend data for the Digital Asset Tokenization prototype
// Mirrors the architecture: Smart Contract Adapter, Token Ledger, Multi-AVM
// valuation, LTV & Risk Engine, Compliance Engine, Audit Trail.
// ---------------------------------------------------------------------------

export const USERS = {
  customer: {
    id: 'CUST-10245',
    name: 'Emma Whitfield',
    email: 'emma.whitfield@example.com',
    role: 'customer',
    kycStatus: 'Verified',
    tier: 'Premier Banking',
    avatarInitials: 'EW',
    memberSince: '2019',
  },
  rm: {
    id: 'RM-3381',
    name: 'Daniel Osei',
    email: 'daniel.osei@lloydsbankinggroup.com',
    role: 'rm',
    branch: 'Leeds Corporate Centre',
    avatarInitials: 'DO',
    portfolioClients: 42,
  },
};

// Asset lifecycle states, matching the Token Lifecycle strip in the architecture deck
export const LIFECYCLE_STAGES = ['Mint', 'Active', 'Revalue', 'Transfer', 'Freeze', 'Burn'];

export const ASSET_TYPES = [
  { key: 'property', label: 'Property', icon: 'HomeWork' },
  { key: 'bond', label: 'Bond', icon: 'AccountBalance' },
  { key: 'equity', label: 'Shares', icon: 'ShowChart' },
  { key: 'commodity', label: 'Commodity', icon: 'Diamond' },
];

export const ASSETS = [
  {
    id: 'TKN-0001-PR',
    ownerId: 'CUST-10245',
    type: 'property',
    name: '14 Alder Grove, Manchester',
    tokenSymbol: 'PROP-ALD14',
    status: 'Active',
    valuation: 428000,
    valuationSource: 'Multi-AVM (Rightmove + Zoopla + Bank Model)',
    confidenceScore: 92,
    ltv: 58,
    ltvThreshold: 75,
    lastRevalued: '2026-06-02',
    mintedOn: '2023-11-14',
    provenance: [
      { stage: 'Mint', date: '2023-11-14', actor: 'RM-3381', note: 'Asset tokenized after title verification' },
      { stage: 'Revalue', date: '2025-01-10', actor: 'Oracle', note: 'AVM revaluation +£12,000' },
      { stage: 'Revalue', date: '2026-06-02', actor: 'Oracle', note: 'AVM revaluation +£8,500' },
    ],
    digitalWill: {
      enabled: true,
      beneficiaries: [{ name: 'James Whitfield', relation: 'Spouse', allocation: 100 }],
      trigger: 'Probate confirmation',
    },
  },
  {
    id: 'TKN-0002-BD',
    ownerId: 'CUST-10245',
    type: 'bond',
    name: 'UK Gilt 4.25% 2034',
    tokenSymbol: 'GILT-2034',
    status: 'Active',
    valuation: 96500,
    valuationSource: 'Market Price Oracle',
    confidenceScore: 99,
    ltv: 21,
    ltvThreshold: 60,
    lastRevalued: '2026-07-15',
    mintedOn: '2024-03-02',
    provenance: [
      { stage: 'Mint', date: '2024-03-02', actor: 'RM-3381', note: 'Digitized from custody holding' },
      { stage: 'Revalue', date: '2026-07-15', actor: 'Oracle', note: 'Daily price sync' },
    ],
    digitalWill: { enabled: false, beneficiaries: [], trigger: null },
  },
  {
    id: 'TKN-0003-EQ',
    ownerId: 'CUST-10245',
    type: 'equity',
    name: 'Lloyds Growth Portfolio Shares',
    tokenSymbol: 'LGP-SHR',
    status: 'Transfer Pending',
    valuation: 54200,
    valuationSource: 'Market Price Oracle',
    confidenceScore: 97,
    ltv: 34,
    ltvThreshold: 55,
    lastRevalued: '2026-07-16',
    mintedOn: '2025-05-20',
    provenance: [
      { stage: 'Mint', date: '2025-05-20', actor: 'RM-3381', note: 'Portfolio onboarded' },
      { stage: 'Transfer', date: '2026-07-16', actor: 'CUST-10245', note: 'Transfer to ISA wrapper initiated — pending RM approval' },
    ],
    digitalWill: { enabled: false, beneficiaries: [], trigger: null },
  },
  {
    id: 'TKN-0004-CM',
    ownerId: 'CUST-10245',
    type: 'commodity',
    name: 'Allocated Gold Bullion (250g)',
    tokenSymbol: 'AU-250G',
    status: 'Frozen',
    valuation: 15650,
    valuationSource: 'LBMA Price Oracle',
    confidenceScore: 100,
    ltv: 0,
    ltvThreshold: 50,
    lastRevalued: '2026-07-10',
    mintedOn: '2022-08-09',
    provenance: [
      { stage: 'Mint', date: '2022-08-09', actor: 'RM-3381', note: 'Vault-allocated bullion tokenized' },
      { stage: 'Freeze', date: '2026-06-28', actor: 'Compliance Engine', note: 'Freeze triggered — pending source-of-funds review' },
    ],
    digitalWill: { enabled: true, beneficiaries: [{ name: 'James Whitfield', relation: 'Spouse', allocation: 100 }], trigger: 'Probate confirmation' },
  },
  // Assets belonging to other clients, used on the RM portfolio view
  {
    id: 'TKN-0011-PR',
    ownerId: 'CUST-20991',
    ownerName: 'Priya Anand',
    type: 'property',
    name: '3 Kelvin House, Glasgow',
    tokenSymbol: 'PROP-KEL3',
    status: 'Active',
    valuation: 312000,
    valuationSource: 'Multi-AVM',
    confidenceScore: 88,
    ltv: 71,
    ltvThreshold: 75,
    lastRevalued: '2026-07-01',
    mintedOn: '2021-02-18',
    provenance: [],
    digitalWill: { enabled: false, beneficiaries: [], trigger: null },
  },
  {
    id: 'TKN-0012-BD',
    ownerId: 'CUST-30442',
    ownerName: 'Marcus Fielding',
    type: 'bond',
    name: 'Corporate Bond — Tesco 3.5% 2029',
    tokenSymbol: 'TESC-2029',
    status: 'Active',
    valuation: 41000,
    valuationSource: 'Market Price Oracle',
    confidenceScore: 96,
    ltv: 46,
    ltvThreshold: 60,
    lastRevalued: '2026-07-14',
    mintedOn: '2023-09-30',
    provenance: [],
    digitalWill: { enabled: false, beneficiaries: [], trigger: null },
  },
  {
    id: 'TKN-0013-EQ',
    ownerId: 'CUST-40118',
    ownerName: 'Sofia Marchetti',
    type: 'equity',
    name: 'Global Tech ETF Holding',
    tokenSymbol: 'GTECH-ETF',
    status: 'Active',
    valuation: 88750,
    valuationSource: 'Market Price Oracle',
    confidenceScore: 95,
    ltv: 39,
    ltvThreshold: 55,
    lastRevalued: '2026-07-16',
    mintedOn: '2024-12-01',
    provenance: [],
    digitalWill: { enabled: false, beneficiaries: [], trigger: null },
  },
];

// Static traditional banking accounts shown on the Account Overview page —
// separate from tokenized assets, which live in the Digital Assets journey.
export const BANK_ACCOUNTS = [
  { id: 'ACC-1', label: 'RESTRICTED CURRENT ACC', sortCode: '77-20-27', number: '46013668', balance: 0, tag: 'Primary' },
  { id: 'ACC-2', label: 'CLASSIC', sortCode: '77-01-01', number: '75658360', balance: 20271.78 },
  { id: 'ACC-3', label: 'EASY SAVER', sortCode: '77-01-01', number: '75636168', balance: 20728.22, note: 'Current balance' },
  { id: 'ACC-4', label: 'LLOYDS BANK WORLD ELITE MASTERCARD', number: '5404 40•• •••• 7464', balance: -1284.16, isCard: true },
];

export const PRODUCT_NAV = [
  'Savings & Investments',
  'Loans & Car Finance',
  'Wealth and Retirement',
  'Credit Cards',
  'Overdrafts',
  'Mortgages',
  'Home Insurance',
  'Insurance',
  'Bank Accounts',
  'Upgrade Bank Account',
  'Other Services',
];

export const CLIENTS = [
  { id: 'CUST-10245', name: 'Emma Whitfield', tier: 'Premier Banking', kycStatus: 'Verified', assets: 4, totalValue: 594350, riskFlag: 'Watch' },
  { id: 'CUST-20991', name: 'Priya Anand', tier: 'Wealth Management', kycStatus: 'Verified', assets: 1, totalValue: 312000, riskFlag: 'High LTV' },
  { id: 'CUST-30442', name: 'Marcus Fielding', tier: 'Premier Banking', kycStatus: 'Verified', assets: 1, totalValue: 41000, riskFlag: 'None' },
  { id: 'CUST-40118', name: 'Sofia Marchetti', tier: 'Private Banking', kycStatus: 'Pending Review', assets: 1, totalValue: 88750, riskFlag: 'KYC Pending' },
];

export const TRANSACTIONS = [
  { id: 'TX-88213', assetId: 'TKN-0003-EQ', type: 'Transfer', status: 'Pending Approval', date: '2026-07-16 09:14', actor: 'Emma Whitfield', detail: 'Transfer to ISA wrapper' },
  { id: 'TX-88190', assetId: 'TKN-0004-CM', type: 'Freeze', status: 'Completed', date: '2026-06-28 14:02', actor: 'Compliance Engine', detail: 'Source-of-funds review triggered' },
  { id: 'TX-88104', assetId: 'TKN-0001-PR', type: 'Revalue', status: 'Completed', date: '2026-06-02 06:00', actor: 'Oracle', detail: 'Quarterly AVM revaluation' },
  { id: 'TX-87950', assetId: 'TKN-0002-BD', type: 'Revalue', status: 'Completed', date: '2026-07-15 06:00', actor: 'Oracle', detail: 'Daily price sync' },
  { id: 'TX-87811', assetId: 'TKN-0001-PR', type: 'Mint', status: 'Completed', date: '2023-11-14 11:20', actor: 'Daniel Osei (RM)', detail: 'Initial tokenization after title verification' },
];

export const RISK_ALERTS = [
  { id: 'AL-501', severity: 'High', clientId: 'CUST-20991', clientName: 'Priya Anand', message: 'LTV at 71% — approaching 75% threshold on PROP-KEL3', date: '2026-07-16' },
  { id: 'AL-502', severity: 'Medium', clientId: 'CUST-40118', clientName: 'Sofia Marchetti', message: 'KYC re-verification pending for 12 days', date: '2026-07-04' },
  { id: 'AL-503', severity: 'Low', clientId: 'CUST-10245', clientName: 'Emma Whitfield', message: 'Anomaly scan: transfer request outside usual pattern', date: '2026-07-16' },
];

export const PORTFOLIO_HISTORY = [
  { month: 'Feb', value: 542000 },
  { month: 'Mar', value: 551200 },
  { month: 'Apr', value: 558900 },
  { month: 'May', value: 567300 },
  { month: 'Jun', value: 581000 },
  { month: 'Jul', value: 594350 },
];

export const AUDIT_LOG = [
  { id: 'AUD-9001', event: 'Ownership transfer initiated', asset: 'LGP-SHR', actor: 'Emma Whitfield', timestamp: '2026-07-16 09:14:02', hash: '0x7f3a...c19e' },
  { id: 'AUD-9000', event: 'Compliance freeze applied', asset: 'AU-250G', actor: 'Compliance Engine', timestamp: '2026-06-28 14:02:47', hash: '0x2b88...a01f' },
  { id: 'AUD-8998', event: 'AVM revaluation recorded', asset: 'PROP-ALD14', actor: 'Oracle Adapter', timestamp: '2026-06-02 06:00:11', hash: '0x91cd...44b2' },
  { id: 'AUD-8990', event: 'Digital Will conditions updated', asset: 'PROP-ALD14', actor: 'Daniel Osei (RM)', timestamp: '2026-04-19 10:31:55', hash: '0x0f61...e77a' },
];
