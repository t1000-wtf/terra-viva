import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Sprout } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BackendStatusBanner } from '../common/BackendStatusBanner'

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-2xl">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top navbar */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">
              Terra<span className="text-primary">Viva</span>
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable content container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <BackendStatusBanner />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
