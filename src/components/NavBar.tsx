import { NavLink } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-ink/95 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between px-6 h-16 max-w-6xl mx-auto">
        <a href="/" className="font-black text-3xl tracking-tight">
          Magic<span className="text-acid">thon</span>
        </a>
        <div className="flex gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-6 py-2.5 rounded-full text-xl font-bold transition-colors ${
                isActive ? 'text-acid border-b-2 border-acid' : 'text-paper/70 hover:text-paper'
              }`
            }
          >
            Create
          </NavLink>
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `px-6 py-2.5 rounded-full text-xl font-bold transition-colors ${
                isActive ? 'text-acid border-b-2 border-acid' : 'text-paper/70 hover:text-paper'
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
