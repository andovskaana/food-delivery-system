import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App.jsx'
import AuthProvider from './providers/authProvider.jsx'
import theme from './theme.js'

const router = createBrowserRouter(App.routes)

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>
)
