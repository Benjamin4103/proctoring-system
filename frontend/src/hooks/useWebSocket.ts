import { useEffect, useRef, useState } from 'react'

export function useWebSocket(url: string) {
  const ws = useRef<WebSocket | null>(null)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    ws.current = new WebSocket(url)
    ws.current.onopen = () => setConnected(true)
    ws.current.onclose = () => setConnected(false)
    ws.current.onmessage = (e) => setLastMessage(JSON.parse(e.data))
    return () => ws.current?.close()
  }, [url])

  const sendBinary = (data: ArrayBuffer) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(data)
    }
  }

  return { connected, lastMessage, sendBinary }
}
