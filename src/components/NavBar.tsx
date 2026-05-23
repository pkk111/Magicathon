import { NavLink } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-40 bg-ink/90 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between px-4 sm:px-6 h-12 sm:h-14 md:h-16 max-w-6xl mx-auto">
        <a href="/" className="font-black text-lg sm:text-xl md:text-3xl tracking-tight shrink-0">
          Magic<span className="text-acid">thon</span>
        </a>
        <div className="flex gap-1 sm:gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-base md:text-xl font-bold transition-colors whitespace-nowrap ${
                isActive ? 'text-acid border-b-2 border-acid' : 'text-paper/70 hover:text-paper'
              }`
            }
          >
            Create
          </NavLink>
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-base md:text-xl font-bold transition-colors whitespace-nowrap ${
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
