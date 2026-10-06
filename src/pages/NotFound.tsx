/* 404 Page - Displays when a user attempts to access a non-existent route - translate to the language of the user */
import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Sparkles, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0E0D] text-[#F6F4F0] p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#C5A45F]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#C5A45F]/5 blur-3xl pointer-events-none" />

      <div className="text-center max-w-md relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C5A45F] to-[#E5C989] text-[#141210] shadow-[0_0_25px_rgba(197,164,95,0.35)] mb-4 ring-1 ring-[#C5A45F]/40">
          <Sparkles className="w-7 h-7 fill-current" />
        </div>
        <h1 className="text-6xl font-bold font-serif text-[#C5A45F] mb-2 tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Página não encontrada</h2>
        <p className="text-sm text-neutral-400 mb-6">
          A rota operacional solicitada não existe ou foi movida.
        </p>
        <Link
          to="/app"
          className="inline-flex items-center justify-center gap-2 bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-semibold h-12 min-h-[48px] px-6 rounded-xl transition-all shadow-lg hover:shadow-[0_0_20px_rgba(197,164,95,0.3)] text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar à Central Celebra
        </Link>
      </div>
    </div>
  )
}

export default NotFound
