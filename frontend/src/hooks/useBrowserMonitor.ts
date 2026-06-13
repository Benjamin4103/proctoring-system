import { useEffect, useRef } from 'react'
import api from '@/lib/api'

interface BrowserEvent {
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit'
  timestamp: number
  session_id: string
}

export function useBrowserMonitor(sessionId: string) {
  const cooldown = useRef<Record<string, number>>({})

  useEffect(() => {
    const emit = async (type: BrowserEvent['type']) => {
      const now = Date.now()
      if (cooldown.current[type] && now - cooldown.current[type] < 3000) return
      cooldown.current[type] = now

      try {
        await api.post(`/api/v1/browser-events`, {
          session_id: sessionId,
          type,
          timestamp: now,
        })
      } catch {}
    }

    const handleVisibility = () => { if (document.hidden) emit('tab_switch') }
    const handleBlur = () => emit('window_blur')
    const handleFullscreen = () => { if (!document.fullscreenElement) emit('fullscreen_exit') }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreen)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreen)
    }
  }, [sessionId])
}
