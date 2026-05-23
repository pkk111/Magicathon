import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import CreatePage from './pages/CreatePage'
import FeedPage from './pages/FeedPage'
import ViewPage from './pages/ViewPage'

export default function App() {
  return (
    <div className="min-h-dvh bg-ink text-paper">
      <NavBar />
      <Routes>
        <Route path="/" element={<CreatePage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/m/:id" element={<ViewPage />} />
      </Routes>
    </div>
  )
}
