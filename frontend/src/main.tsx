import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router.tsx'
import { Toaster } from 'sonner'
import './index.css'

const router = getRouter()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <Toaster position="top-center" richColors />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)
