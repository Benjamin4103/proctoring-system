'use client'
import { useEffect, useState } from 'react'
import { WebcamCapture } from '@/components/exam/WebcamCapture'
import { useBrowserMonitor } from '@/hooks/useBrowserMonitor'
import api from '@/lib/api'

const SESSION_ID = 'ba06df76-3e56-43bf-8eac-0de8c8b07222'
const MAX_VIOLATIONS = 3

export default function ExamPage() {
  const [tabViolations, setTabViolations] = useState(0)
  const [terminated, setTerminated] = useState(false)
  const [warning, setWarning] = useState(false)

  useBrowserMonitor(SESSION_ID)

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.hidden) {
        const newCount = tabViolations + 1
        setTabViolations(newCount)
        setWarning(true)

        await api.post('/api/v1/browser-events', {
          session_id: SESSION_ID,
          type: 'tab_switch',
          timestamp: Date.now(),
        }).catch(() => {})

        setTimeout(() => setWarning(false), 3000)

        if (newCount >= MAX_VIOLATIONS) {
          setTerminated(true)
          await api.post('/api/v1/browser-events', {
            session_id: SESSION_ID,
            type: 'exam_terminated',
            timestamp: Date.now(),
          }).catch(() => {})
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [tabViolations])

  if (terminated) return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Exam Terminated</h1>
        <p className="text-gray-500 text-sm">You switched tabs {MAX_VIOLATIONS} times. Your exam has been automatically terminated and flagged for review.</p>
        <p className="text-gray-400 text-xs mt-4">Please contact your instructor.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {warning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-bounce">
          ?? Warning {tabViolations}/{MAX_VIOLATIONS} - Do not switch tabs. Your exam will be terminated.
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Exam in progress</h1>
            <p className="text-sm text-gray-500 mt-1">You are being monitored. Do not switch tabs.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Tab warnings:</span>
            <span className={`text-sm font-bold ${tabViolations >= 2 ? 'text-red-600' : tabViolations === 1 ? 'text-yellow-500' : 'text-green-500'}`}>
              {tabViolations}/{MAX_VIOLATIONS}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl shadow-md p-6 min-h-96">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Exam questions</h2>
            <p className="text-gray-500 text-sm">Exam content will appear here.</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Proctoring monitor</h2>
            <WebcamCapture sessionId={SESSION_ID} />
          </div>
        </div>
      </div>
    </div>
  )
}
