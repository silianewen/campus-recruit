import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import CompanyDetail from './pages/CompanyDetail'
import Upload from './pages/Upload'
import Success from './pages/Success'
import HR from './pages/HR'
import HRList from './pages/HRList'
import HRDashboard from './pages/HRDashboard'
import Status from './pages/Status'
import Personality from './pages/Personality'
import SkillTest from './pages/SkillTest'
import { ConfigBanner } from './components/ConfigBanner'

// HRAdminUsers stays lazy — only used by admins, not on the hot path.
const HRAdminUsers = lazy(() => import('./pages/HRAdminUsers'))

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 dark:text-slate-500">
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
          {/* Student */}
          <Route path="/" element={<Home />} />
          <Route path="/companies/:companyId" element={<CompanyDetail />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/upload/:positionId" element={<Upload />} />
          <Route path="/success/:submissionId" element={<Success />} />
          <Route path="/status" element={<Status />} />
          <Route path="/personality" element={<Personality />} />
          <Route path="/skill-test" element={<SkillTest />} />
          <Route path="/skill-test/:positionId" element={<SkillTest />} />

          {/* HR */}
          <Route path="/hr" element={<HR />} />
          <Route path="/hr/list" element={<HRList />} />
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/admin/users" element={<HRAdminUsers />} />

          {/* Defensive legacy redirects — old HR routes now live under /hr/* */}
          <Route path="/dashboard" element={<Navigate to="/hr/list" replace />} />
          <Route path="/stats" element={<Navigate to="/hr/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}