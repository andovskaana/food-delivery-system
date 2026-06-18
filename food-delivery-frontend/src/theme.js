import { createTheme } from '@mui/material/styles';

// Custom MUI theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#f97316', // blue  f97316
            contrastText: '#fff',
        },
        secondary: {
            main: '#2563eb', // orange
            contrastText: '#fff',
        },
        background: {
            default: '#f8fafc', // light background
            paper: '#ffffff',
        },
        text: {
            primary: '#111827',
            secondary: '#374151',
        },
    },
    typography: {
        fontFamily: '"Inter","Segoe UI",Roboto,sans-serif',
        h1: { fontSize: '2.25rem', fontWeight: 700 },
        h2: { fontSize: '1.875rem', fontWeight: 600 },
        h3: { fontSize: '1.5rem', fontWeight: 600 },
        h5: { fontSize: '1.25rem', fontWeight: 500 },
        body1: { fontSize: '1rem' },
        body2: { fontSize: '0.95rem' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
});

export default theme;
