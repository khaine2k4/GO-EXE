import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HashRouter } from 'react-router-dom'
import { AppStoreProvider } from './store/AppStore'
import { ToastProvider } from './components/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AppStoreProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AppStoreProvider>
    </ToastProvider>
  </StrictMode>,
)
