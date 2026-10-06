import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import type { AlertRecord } from '@/types/celebra'
import {
  LayoutDashboard,
  Award,
  Users,
  Grid,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Radio,
  LogOut,
  Sparkles,
  Calendar,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function CelebraLayout() {
  const { user, logout } = useAuth()
  const { eventId } = useParams<{ eventId?: string }>()
  const navigate = useNavigate()
  const [hasNewAlert, setHasNewAlert] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [eventName, setEventName] = useState<string>('Festa dos Destaques')

  // Listen to alerts in realtime to pulse the LIVE button
  useRealtime<AlertRecord>('alerts', (data) => {
    if (data.action === 'create') {
      setHasNewAlert(true)
    }
  })

  // Load event details if eventId is present
  useEffect(() => {
    if (!eventId) return
    pb.collection('events')
      .getOne(eventId)
      .then((rec) => {
        setEventName(rec.name)
      })
      .catch(() => {})
  }, [eventId])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Active event links
  const navItems = eventId
    ? [
        { label: 'Central da Festa', to: `/app/${eventId}/dashboard`, icon: LayoutDashboard },
        { label: 'Checklist Pré-Abertura', to: `/app/${eventId}/checklist`, icon: ShieldCheck },
        { label: 'Mesas & Cadeiras', to: `/app/${eventId}/tables`, icon: Grid },
        { label: 'Check-in Recepção', to: `/app/${eventId}/checkin`, icon: CheckCircle2 },
        { label: 'Homenageados (30)', to: `/app/${eventId}/honorees`, icon: Award },
        { label: 'Buffet & Telão', to: `/app/${eventId}/buffet`, icon: Sparkles },
        { label: 'Convidados (~400)', to: `/app/${eventId}/guests`, icon: Users },
        { label: 'Protocolo Palco', to: `/app/${eventId}/timeline`, icon: Clock },
        { label: 'Equipes & Staff (68)', to: `/app/${eventId}/teams`, icon: ShieldCheck },
        {
          label: 'Ocorrências & Auditoria',
          to: `/app/${eventId}/occurrences`,
          icon: AlertTriangle,
        },
      ]
    : []

  const mobileBottomItems = eventId
    ? [
        { label: 'Central', to: `/app/${eventId}/dashboard`, icon: LayoutDashboard },
        { label: 'Check-in', to: `/app/${eventId}/checkin`, icon: CheckCircle2 },
        { label: 'Protocolo', to: `/app/${eventId}/timeline`, icon: Clock },
        { label: 'Ao Vivo', to: `/app/${eventId}/live`, icon: Radio, highlight: true },
      ]
    : []

  return (
    <div className="min-h-screen bg-[#0F0E0D] flex flex-col font-sans text-[#F6F4F0] antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#141210]/95 backdrop-blur-md text-white border-b border-[#29241E] px-4 lg:px-8 py-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          {/* Mobile hamburger menu toggle */}
          {eventId && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-neutral-300 hover:text-[#C5A45F] p-2 rounded-lg bg-[#1F1B16] border border-[#332D24] transition-colors"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <Link to="/app" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C5A45F] to-[#E5C989] flex items-center justify-center text-[#141210] shadow-md group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(197,164,95,0.4)] transition-all">
              <Sparkles className="w-4.5 h-4.5 fill-current" />
            </div>
            <div>
              <span className="font-serif tracking-widest text-lg font-bold text-white group-hover:text-[#C5A45F] transition-colors">
                CELEBRA
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider text-[#C5A45F] font-semibold border-l border-[#332D24] pl-2">
                Central Operacional
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Event Selector Badge */}
        {eventId && (
          <div className="hidden md:flex items-center gap-2 bg-[#1A1815] border border-[#332D24] rounded-full px-3.5 py-1.5 text-xs shadow-inner">
            <Calendar className="w-3.5 h-3.5 text-[#C5A45F]" />
            <span className="text-neutral-200 font-medium truncate max-w-[220px]">{eventName}</span>
            <Link
              to="/app"
              className="text-[#C5A45F] hover:text-[#E5C989] underline ml-1 font-semibold text-[11px] transition-colors"
            >
              Trocar
            </Link>
          </div>
        )}

        {/* Right Actions: LIVE button & User Profile */}
        <div className="flex items-center gap-3">
          {eventId && (
            <Link
              to={`/app/${eventId}/live`}
              onClick={() => setHasNewAlert(false)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md ${
                hasNewAlert
                  ? 'bg-amber-500 text-black animate-soft-pulse'
                  : 'bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] hover:shadow-[0_0_15px_rgba(197,164,95,0.3)]'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${hasNewAlert ? 'animate-spin' : ''}`} />
              <span className="tracking-wide">EVENTO AO VIVO</span>
              {hasNewAlert && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />}
            </Link>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-neutral-200 hover:text-white hover:bg-[#231F1A] border border-[#2B2620] gap-2 px-2.5 h-9 text-xs rounded-xl"
              >
                <div className="w-6 h-6 rounded-full bg-[#2A241D] text-[#C5A45F] font-semibold flex items-center justify-center border border-[#443A2C]">
                  {(user?.name || user?.email || 'H')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline font-medium max-w-[120px] truncate">
                  {user?.name || 'Hugo Cerimonial'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#1A1815] border-[#332D24] text-neutral-200 shadow-2xl"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="font-semibold text-white truncate">
                  {user?.name || 'Cerimonialista'}
                </div>
                <div className="text-xs text-neutral-400 truncate">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2D2821]" />
              <DropdownMenuItem
                onClick={() => navigate('/app')}
                className="cursor-pointer hover:bg-[#25211B] text-neutral-200 focus:bg-[#25211B] focus:text-[#C5A45F]"
              >
                <Calendar className="w-4 h-4 mr-2 text-[#C5A45F]" />
                Trocar Evento
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2D2821]" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-400 hover:bg-red-950/40 focus:bg-red-950/40 focus:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Structure with Sidebar & Content */}
      <div className="flex-1 flex w-full relative">
        {/* Desktop Sidebar */}
        {eventId && (
          <aside className="hidden lg:flex flex-col w-64 bg-[#141210] border-r border-[#26221C] text-neutral-300 p-4 shrink-0 shadow-lg">
            <div className="text-[10px] font-bold tracking-wider text-[#A8A29A] uppercase px-3 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A45F]" />
              Menu Operacional
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#C5A45F] text-[#141210] font-bold shadow-[0_0_15px_rgba(197,164,95,0.25)]'
                          : 'text-neutral-300 hover:bg-[#201D18] hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-[#26221C]">
              <div className="bg-[#1C1915] rounded-xl p-3 border border-[#312B22] shadow-inner">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#C5A45F]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Celebra Modo Piloto
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Operando Festa dos Destaques em tempo real.
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile Slide-out Menu Overlay */}
        {mobileMenuOpen && eventId && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-72 bg-[#141210] h-full p-4 flex flex-col shadow-2xl animate-fade-in border-r border-[#2C2720]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#2C2720] mb-3">
                <span className="font-serif font-bold text-white tracking-wider">CELEBRA</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium ${
                          isActive
                            ? 'bg-[#C5A45F] text-[#141210] font-bold'
                            : 'text-neutral-300 hover:bg-[#201D18] hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </nav>

              <div className="pt-4 border-t border-[#26221C]">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-400 border-[#332D24] bg-[#1C1915] hover:bg-red-950/40"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair do Celebra
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-8 bg-[#0F0E0D]">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed 4 destinations) */}
      {eventId && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141210]/95 backdrop-blur-md border-t border-[#29241E] px-2 py-2 flex items-center justify-around shadow-2xl">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-h-[48px] ${
                    item.highlight
                      ? isActive
                        ? 'text-[#C5A45F] font-bold'
                        : 'text-[#E5C989] font-medium'
                      : isActive
                        ? 'text-[#C5A45F] font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                  }`
                }
              >
                <div className={`p-1.5 rounded-full ${item.highlight ? 'bg-[#C5A45F]/20' : ''}`}>
                  <Icon className={`w-5 h-5 ${item.highlight ? 'text-[#C5A45F]' : ''}`} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      )}
    </div>
  )
}
