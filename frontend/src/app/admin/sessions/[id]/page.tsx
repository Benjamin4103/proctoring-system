'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'

interface Violation {
  id: string
  type: string
  severity: string
  confidence: number
  description: string
  occurred_at: string
}

const severityColor = (s: string) => {
  if (s === 'severe') return 'bg-red-100 text-red-700 border-red-200'
  if (s === 'high') return 'bg-orange-100 text-orange-700 border-orange-200'
  if (s === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

const typeLabel = (t: string) => t.replace(/_/g, ' ')

export default function SessionTimeline() {
  const params = useParams()
  const sessionId = params.id as string
  const [violations, setViolations] = useState<Violation[]>([])
  const [loading, setLoading] = useState(true)
  const [grouped, setGrouped] = useState<Record<string, number>>({})

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/admin/dashboard'
      return
    }
    fetchViolations()
    const interval = setInterval(fetchViolations, 5000)
    return () => clearInterval(interval)
  }, [sessionId])

  const fetchViolations = async () => {
    try {
      const res = await api.get(`/api/v1/admin/sessions/${sessionId}/violations`)
      setViolations(res.data)
      const counts: Record<string, number> = {}
      res.data.forEach((v: Violation) => {
        counts[v.type] = (counts[v.type] || 0) + 1
      })
      setGrouped(counts)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a href="/admin/dashboard" className="text-blue-600 text-sm hover:underline">Back to dashboard</a>
          <h1 className="text-2xl font-semibold text-gray-800">Violation Timeline</h1>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {Object.entries(grouped).map(([type, count]) => (
            <div key={type} className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-500 capitalize">{typeLabel(type)}</p>
              <p className="text-2xl font-semibold text-gray-800 mt-1">{count}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-medium text-gray-700 mb-6">All violations — most recent first</h2>
          {loading && <p className="text-gray-400 text-sm">Loading...</p>}
          {!loading && violations.length === 0 && (
            <p className="text-gray-400 text-sm">No violations recorded for this session.</p>
          )}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-4">
              {violations.map((v) => (
                <div key={v.id} className="flex gap-4 relative">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-xs z-10 shrink-0 font-bold text-gray-500">
                    !
                  </div>
                  <div className={'flex-1 border rounded-lg p-3 ' + severityColor(v.severity)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm capitalize">{typeLabel(v.type)}</p>
                        <p className="text-xs mt-0.5 opacity-80">{v.description}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xs font-medium capitalize">{v.severity}</p>
                        <p className="text-xs opacity-70">{Math.round(v.confidence * 100)}% conf</p>
                      </div>
                    </div>
                    <p className="text-xs opacity-60 mt-2">
                      {new Date(v.occurred_at).toLocaleTimeString()} — {new Date(v.occurred_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}