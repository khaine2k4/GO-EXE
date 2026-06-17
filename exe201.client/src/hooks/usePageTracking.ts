import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'

const SESSION_KEY = 'go_analytics_session'
const EXCLUDED_PATHS = new Set(['/login', '/register', '/reset-password', '/verify-email'])

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export default function usePageTracking() {
  const location = useLocation()
  const lastTracked = useRef('')

  useEffect(() => {
    const path = `${location.pathname}${location.search}`

    // Skip admin pages from tracking (admin browsing is not visitor traffic).
    if (path.startsWith('/admin')) return
    if (EXCLUDED_PATHS.has(location.pathname)) return

    // Avoid duplicate records in React StrictMode and harmless rerenders.
    if (path === lastTracked.current) return
    lastTracked.current = path

    const sessionId = getSessionId()

    // Fire-and-forget: do not block rendering if analytics is unavailable.
    api.post('/analytics/track', {
      pagePath: path,
      sessionId,
      referrer: document.referrer || null,
    }).catch(() => {
      // Silently ignore tracking failures.
    })
  }, [location.pathname, location.search])
}
