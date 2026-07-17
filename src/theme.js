import { createTheme } from '@mui/material/styles';

// Lloyds brand green — single source of truth for the whole app.
// Every other green in the UI is a tint/shade derived from this hue so the
// palette reads as one cohesive system instead of a grab-bag of near-blacks.
export const brand = {
  50: '#EBFAF3',
  100: '#CFF3E2',
  200: '#9FE7C6',
  300: '#6BD8A8',
  400: '#3EC28E',
  500: '#24A973', // Lloyds brand green
  600: '#1C8B5E',
  700: '#166F4B',
  800: '#12573C',
  900: '#0D3F2C',
};

// Accent used for the "Digital Assets" journey — kept distinct from the
// green family so that entry point visually pops against the rest of the UI.
export const accentOrange = '#C25A1E';

const palette = {
  primary: {
    main: brand[500],
    dark: brand[700],
    light: brand[300],
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: brand[300],
    dark: brand[500],
    light: brand[100],
    contrastText: brand[900],
  },
  success: { main: '#2E7D32' },
  warning: { main: '#B98900' },
  error: { main: '#C62828' },
  info: { main: '#0277BD' },
  background: {
    default: '#F4F9F6',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#0F2B21',
    secondary: '#4B6358',
  },
  divider: '#E1EDE6',
};

const theme = createTheme({
  palette,
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingLeft: 18,
          paddingRight: 18,
          transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease',
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(13,63,44,0.22)', backgroundColor: brand[700] },
          '&:active': { transform: 'translateY(1px)' },
        },
        outlinedPrimary: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5, backgroundColor: brand[50] },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 14 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E1EDE6',
          boxShadow: '0 1px 2px rgba(15,43,33,0.04)',
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: '#0F2B21', backgroundColor: '#F4F9F6' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-of-type td': { borderBottom: 'none' },
        },
      },
    },
    MuiLink: {
      defaultProps: { color: brand[700] },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': { color: brand[500] },
          '&.Mui-checked + .MuiSwitch-track': { backgroundColor: brand[500] },
        },
      },
    },
  },
});

export default theme;
