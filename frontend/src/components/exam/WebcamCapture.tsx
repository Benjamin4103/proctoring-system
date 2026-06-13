'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  sessionId: string
}

export function WebcamCapture({ sessionId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>()
  const [connected, setConnected] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/proctor/' + sessionId)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => setAnalysis(JSON.parse(e.data))
    return () => ws.close()
  }, [sessionId])

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  useEffect(() => {
    const capture = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return
      const ctx = canvas.getContext('2d')!
      canvas.width = 320
      canvas.height = 240
      ctx.drawImage(video, 0, 0, 320, 240)
      canvas.toBlob((blob) => {
        if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
          blob.arrayBuffer().then((buf) => wsRef.current?.send(buf))
        }
      }, 'image/jpeg', 0.6)
    }
    intervalRef.current = setInterval(capture, 500)
    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="rounded-lg w-72 object-cover border-2 border-gray-200"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className={'absolute top-2 right-2 w-3 h-3 rounded-full ' + (connected ? 'bg-green-500' : 'bg-red-500')} />
      </div>
      {analysis && (
        <div className="w-72 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Risk level</span>
            <span className={'font-medium ' + (
              analysis.risk_level === 'severe' ? 'text-red-600' :
              analysis.risk_level === 'high' ? 'text-orange-500' :
              analysis.risk_level === 'medium' ? 'text-yellow-500' : 'text-green-500'
            )}>{analysis.risk_level}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Suspicion score</span>
            <span className="font-medium">{analysis.suspicion_score}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Face present</span>
            <span className="font-medium">{analysis.face_present ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Gaze</span>
            <span className="font-medium">{analysis.gaze_direction}</span>
          </div>
          {analysis.violations?.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 rounded text-red-600 text-xs">
              {analysis.violations.map((v: any) => v.description).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}