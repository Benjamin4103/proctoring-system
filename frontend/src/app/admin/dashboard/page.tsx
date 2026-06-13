'use client'
import React, { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Session {
  id: string
  student_name: string
  student_email: string
  status: string
  suspicion_score: number
  risk_level: string
  started_at: string
}

interface Stats {
  total_sessions: number
  active_sessions: number
  total_violations: number
  high_risk_students: number
}

export default function AdminDashboard() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [reports, setReports] = useState<Record<string, string>>({})
  const [loadingReport, setLoadingReport] = useState<string | null>(null)

  const login = async () => {
    try {
      const res = await api.post('/api/v1/auth/login', { email, password })
      localStorage.setItem('token', res.data.access_token)
      setLoggedIn(true)
      setError('')
    } catch {
      setError('Invalid credentials')
    }
  }

  const fetchData = async () => {
    try {
      const [sessRes, statsRes] = await Promise.all([
        api.get('/api/v1/admin/sessions'),
        api.get('/api/v1/admin/stats'),
      ])
      setSessions(sessRes.data)
      setStats(statsRes.data)
    } catch {}
  }

  const generateReport = async (sessionId: string) => {
    setLoadingReport(sessionId)
    try {
      const res = await api.get(`/api/v1/reports/${sessionId}`)
      setReports((prev) => ({ ...prev, [sessionId]: res.data.report }))
    } catch {
      setReports((prev) => ({ ...prev, [sessionId]: 'Failed to generate report.' }))
    } finally {
      setLoadingReport(null)
    }
  }

  useEffect(() => {
    if (!loggedIn) return
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [loggedIn])

  const riskColor = (r: string) => {
    if (r === 'severe') return 'bg-red-100 text-red-700'
    if (r === 'high') return 'bg-orange-100 text-orange-700'
    if (r === 'medium') return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  if (!loggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">Admin login</h1>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        <div className="space-y-4">
          <input type="email" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"/>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400 bg-white"/>
          <button onClick={login} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Sign in</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Admin dashboard</h1>
          <span className="text-sm text-gray-400">Auto-refreshes every 3s</span>
        </div>

        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total sessions', value: stats.total_sessions },
              { label: 'Active sessions', value: stats.active_sessions },
              { label: 'Total violations', value: stats.total_violations },
              { label: 'High risk students', value: stats.high_risk_students },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm p-5">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-3xl font-semibold text-gray-800 mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-medium text-gray-700">All exam sessions</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-5 py-3 text-left">Student</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Risk level</th>
                <th className="px-5 py-3 text-left">Suspicion score</th>
                <th className="px-5 py-3 text-left">Started</th>
                <th className="px-5 py-3 text-left">AI Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No sessions yet</td></tr>
              )}
              {sessions.map((s) => (
                <React.Fragment key={s.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{s.student_name}</p>
                      <p className="text-gray-400 text-xs">{s.student_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColor(s.risk_level)}`}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${s.suspicion_score > 70 ? 'bg-red-500' : s.suspicion_score > 45 ? 'bg-orange-400' : s.suspicion_score > 20 ? 'bg-yellow-400' : 'bg-green-400'}`}
                            style={{ width: `${Math.min(s.suspicion_score, 100)}%` }}/>
                        </div>
                        <span className="text-gray-600">{s.suspicion_score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {s.started_at ? new Date(s.started_at).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => generateReport(s.id)}
                        disabled={loadingReport === s.id}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loadingReport === s.id ? 'Generating...' : 'Generate'}
                      </button>
                    </td>
                  </tr>
                  {reports[s.id] && (
                    <tr>
                      <td colSpan={6} className="px-5 py-4 bg-blue-50">
                        <p className="text-xs font-medium text-blue-700 mb-1">AI Generated Report</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{reports[s.id]}</p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
