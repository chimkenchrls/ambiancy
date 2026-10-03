import { Route, Routes } from 'react-router'
import { LandingPage } from './pages/LandingPage'
import { Layout } from './pages/Layout'
import { LicencesPage } from './pages/LicencesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SharedMixPage } from './pages/SharedMixPage'
import { PlayerPage } from './player/PlayerPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="play" element={<PlayerPage />} />
        <Route path="mix" element={<SharedMixPage />} />
        <Route path="licences" element={<LicencesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
