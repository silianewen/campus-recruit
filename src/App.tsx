import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Success from './pages/Success'
import Dashboard from './pages/Dashboard'
import Status from './pages/Status'
import Personality from './pages/Personality'
import SkillTest from './pages/SkillTest'
import { ConfigBanner } from './components/ConfigBanner'

// ECharts is heavy — lazy-load only the Stats page that needs it.
const Stats = lazy(() => import('./pages/Stats'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      加载中…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfigBanner />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* /upload now uses ?company=&position= query params (set via Home page). */}
          <Route path="/upload" element={<Upload />} />
          {/* Old URL shape kept as defensive fallback — shows "go to home" message. */}
          <Route path="/upload/:positionId" element={<Upload />} />
          <Route path="/success/:submissionId" element={<Success />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/status" element={<Status />} />
          <Route path="/personality" element={<Personality />} />
          <Route path="/skill-test/:positionId?" element={<SkillTest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}