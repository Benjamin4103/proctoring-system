import { useEffect, useRef, useCallback } from 'react'

export function useWebcam(onFrame: (blob: ArrayBuffer) => void, intervalMs = 500) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = 320
    canvas.height = 240
    ctx.drawImage(video, 0, 0, 320, 240)
    canvas.toBlob((blob) => {
      if (blob) blob.arrayBuffer().then(onFrame)
    }, 'image/jpeg', 0.6)
  }, [onFrame])

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream
      intervalRef.current = setInterval(capture, intervalMs)
    })
    return () => {
      clearInterval(intervalRef.current)
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      }
    }
  }, [capture, intervalMs])

  return { videoRef, canvasRef }
}
