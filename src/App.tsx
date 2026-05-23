import { Routes, Route, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar'
import CreatePage from './pages/CreatePage'
import FeedPage from './pages/FeedPage'
import ViewPage from './pages/ViewPage'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-ink text-paper selection:bg-acid/30">
      <NavBar />
      <Routes>
        <Route path="/" element={<CreatePage key={location.key} />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/m/:id" element={<ViewPage />} />
      </Routes>
    </div>
  )
}
