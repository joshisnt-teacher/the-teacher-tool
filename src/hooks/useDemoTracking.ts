import { useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAIUsage } from '@/hooks/useAIUsage'
import { supabase } from '@/integrations/supabase/client'

const LOG_URL = `${import.meta.env.VITE_CENTRAL_SUPABASE_URL}/functions/v1/log-demo-activity`
const APP = 'pulse'

async function postEvent(payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return
  fetch(LOG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  }).catch(() => { /* fire-and-forget */ })
}

export function useDemoTracking() {
  const { data: usageData } = useAIUsage()
  const isDemo = usageData?.plan === 'demo'
  const location = useLocation()

  const lastPathnameRef = useRef<string | null>(null)
  const pageStartRef = useRef<number>(Date.now())
  const actionFiredRef = useRef<boolean>(false)

  useEffect(() => {
    if (!isDemo) return
    const currentPathname = location.pathname
    const prevPathname = lastPathnameRef.current

    if (prevPathname !== null && prevPathname !== currentPathname) {
      const dwell = Math.round((Date.now() - pageStartRef.current) / 1000)

      postEvent({ app: APP, event_type: 'page_visit', page: prevPathname, dwell_seconds: dwell })

      if (!actionFiredRef.current && dwell >= 15) {
        postEvent({ app: APP, event_type: 'confusion', page: prevPathname, dwell_seconds: dwell })
      }
    }

    lastPathnameRef.current = currentPathname
    pageStartRef.current = Date.now()
    actionFiredRef.current = false
  }, [location.pathname, isDemo])

  const trackDemoAction = useCallback((action: string, meta?: Record<string, unknown>) => {
    if (!isDemo) return
    actionFiredRef.current = true
    postEvent({ app: APP, event_type: 'action', page: location.pathname, action, meta: meta ?? null })
  }, [isDemo, location.pathname])

  return { trackDemoAction }
}
