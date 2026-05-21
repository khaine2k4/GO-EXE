import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HashRouter } from 'react-router-dom'
import { AppStoreProvider } from './store/AppStore'
import { ToastProvider } from './components/Toast'
import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = '92630362065-gbo4647osm4q9d5ntfliebh0h5ij1e76.apps.googleusercontent.com'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ToastProvider>
        <AppStoreProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AppStoreProvider>
      </ToastProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
