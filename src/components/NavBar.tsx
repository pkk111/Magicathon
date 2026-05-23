import { NavLink } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-ink/90 backdrop-blur border-b border-paper/10">
      <div className="flex items-center justify-between px-4 h-12 max-w-6xl mx-auto">
        <span className="font-black text-lg tracking-tight">
          Magic<span className="text-acid">thon</span>
        </span>
        <div className="flex gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive ? 'bg-acid text-ink' : 'text-paper/70 hover:text-paper'
              }`
            }
          >
            Create
          </NavLink>
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive ? 'bg-acid text-ink' : 'text-paper/70 hover:text-paper'
              }`
            }
          >
            Feed
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
