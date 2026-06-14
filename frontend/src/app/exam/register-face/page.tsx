'use client'
import { useEffect, useRef, useState } from 'react'
import api from '@/lib/api'

export default function RegisterFacePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle')
  const [message, setMessage] = useState('Position your face clearly in the camera and click Register Face')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  const login = async () => {
    try {
      const res = await api.post('/api/v1/auth/login', { email, password })
      localStorage.setItem('token', res.data.access_token)
      setLoggedIn(true)
      setMessage('Logged in. Now position your face and click Register Face.')
    } catch {
      setMessage('Login failed. Check your credentials.')
    }
  }

  useEffect(() => {
    if (!loggedIn) return
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream
    })
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      }
    }
  }, [loggedIn])

  const registerFace = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setStatus('capturing')
    const ctx = canvas.getContext('2d')!
    canvas.width = 640
    canvas.height = 480
    ctx.drawImage(video, 0, 0, 640, 480)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      const formData = new FormData()
      formData.append('file', blob, 'face.jpg')
      try {
        await api.post('/api/v1/identity/register-face', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setStatus('success')
        setMessage('Face registered successfully! You can now proceed to verify.')
      } catch (e: any) {
        setStatus('failed')
        setMessage(e.response?.data?.detail || 'Registration failed. Make sure your face is visible.')
      }
    }, 'image/jpeg', 0.9)
  }

  if (!loggedIn) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">Login to register face</h1>
        <div className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <button onClick={login} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Login
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Register Your Face</h1>
        <p className="text-sm text-gray-500 mb-6">This photo will be used to verify your identity at the start of each exam.</p>

        <div className="relative mb-4">
          <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-lg border-2 border-gray-200"/>
          <canvas ref={canvasRef} className="hidden"/>
          <div className="absolute inset-0 border-4 border-dashed border-blue-300 rounded-lg pointer-events-none opacity-50"/>
        </div>

        <div className={'p-3 rounded-lg text-sm mb-4 ' + (
          status === 'success' ? 'bg-green-50 text-green-700' :
          status === 'failed' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        )}>
          {message}
        </div>

        <div className="flex gap-3">
          <button
            onClick={registerFace}
            disabled={status === 'capturing' || status === 'success'}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'capturing' ? 'Registering...' : status === 'success' ? 'Registered!' : 'Register Face'}
          </button>
          {status === 'success' && (
            <a href="/exam/verify" className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 text-center">
              Go to Verify
            </a>
          )}
        </div>
      </div>
    </div>
  )
}