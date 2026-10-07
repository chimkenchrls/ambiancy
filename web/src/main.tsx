import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from './App'
import { createBrowserEngine } from './audio/createBrowserEngine'
import { PlayerProvider } from './player/PlayerContext'
import '@fontsource/tuffy/400.css'
import '@fontsource/tuffy/700.css'
import './styles.css'
import './pages/landing.css'

// One engine for the whole visit, above the router, so a mix keeps playing
// while the visitor moves between pages.
const engine = createBrowserEngine()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlayerProvider engine={engine}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </PlayerProvider>
  </StrictMode>,
)
