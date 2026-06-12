'use client'
import { WebcamCapture } from '@/components/exam/WebcamCapture'

export default function ExamPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-xl font-semibold text-gray-800">Exam in progress</h1>
          <p className="text-sm text-gray-500 mt-1">You are being monitored. Please keep your face visible at all times.</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl shadow-md p-6 min-h-96">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Exam questions</h2>
            <p className="text-gray-500 text-sm">Exam content will appear here.</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Proctoring monitor</h2>
            <WebcamCapture sessionId="ba06df76-3e56-43bf-8eac-0de8c8b07222" />
          </div>
        </div>
      </div>
    </div>
  )
}
