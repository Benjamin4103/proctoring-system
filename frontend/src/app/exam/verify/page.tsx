'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function VerifyPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'idle' | 'capturing' | 'verifying' | 'success' | 'failed'>('idle')
  const [message, setMessage] = useState('Position your face in the camera and click Verify Identity')
  const [confidence, setConfidence] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream
    })
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const captureAndVerify = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setStatus('capturing')
    const ctx = canvas.getContext('2d')!
    canvas.width = 640
    canvas.height = 480
    ctx.drawImage(video, 0, 0, 640, 480)

    const imageB64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]

    setStatus('verifying')
    setMessage('Verifying your identity...')

    try {
      const res = await api.post('/api/v1/identity/verify-face', { image_b64: imageB64 })
      if (res.data.verified) {
        setStatus('success')
        setConfidence(res.data.confidence)
        setMessage('Identity verified! Redirecting to exam...')
        setTimeout(() => router.push('/exam/demo'), 2000)
      } else {
        setStatus('failed')
        setMessage(res.data.reason || 'Identity verification failed. Please try again.')
      }
    } catch (e: any) {
      setStatus('failed')
      setMessage(e.response?.data?.detail || 'Verification error. Make sure your face is registered.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Identity Verification</h1>
        <p className="text-sm text-gray-500 mb-6">We need to verify your identity before the exam begins.</p>

        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg border-2 border-gray-200"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 border-4 border-dashed border-blue-300 rounded-lg pointer-events-none opacity-50" />
        </div>

        <div className={'p-3 rounded-lg text-sm mb-4 ' + (
          status === 'success' ? 'bg-green-50 text-green-700' :
          status === 'failed' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        )}>
          {message}
          {confidence !== null && (
            <span className="ml-2 font-medium">Confidence: {Math.round(confidence * 100)}%</span>
          )}
        </div>

        <button
          onClick={captureAndVerify}
          disabled={status === 'verifying' || status === 'success'}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {status === 'verifying' ? 'Verifying...' : status === 'success' ? 'Verified!' : 'Verify Identity'}
        </button>
      </div>
    </div>
  )
}