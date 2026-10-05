import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  eventService,
  honoreeService,
  guestService,
  tableService,
  teamService,
  supplierService,
  timelineService,
  alertService,
} from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type {
  EventRecord,
  HonoreeRecord,
  GuestRecord,
  TableRecord,
  TimelineItemRecord,
  AlertRecord,
} from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Award,
  Users,
  UserCheck,
  UserX,
  Grid,
  ShieldCheck,
  Truck,
  AlertTriangle,
  Clock,
  Radio,
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

export default function Dashboard() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [tables, setTables] = useState<TableRecord[]>([])
  const [timelineItems, setTimelineItems] = useState<TimelineItemRecord[]>([])
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [teamCount, setTeamCount] = useState<number>(0)
  const [supplierCount, setSupplierCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // Load all data
  const loadData = async () => {
    if (!eventId) return
    try {
      const [ev, hList, gList, tList, tmList, alList, teams, suppliers] = await Promise.all([
        eventService.getById(eventId),
        honoreeService.list(eventId),
        guestService.list(eventId),
        tableService.list(eventId),
        timelineService.list(eventId),
        alertService.list(eventId),
        teamService.list(eventId),
        supplierService.list(eventId),
      ])
      setEvent(ev)
      setHonorees(hList)
      setGuests(gList)
      setTables(tList)
      setTimelineItems(tmList)
      setAlerts(alList)
      setTeamCount(teams.length)
      setSupplierCount(suppliers.length)
    } catch (e) {
      console.error('Erro ao carregar dados do dashboard:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  // Realtime subscriptions
  useRealtime<GuestRecord>('guests', () => {
    if (eventId)
      guestService
        .list(eventId)
        .then(setGuests)
        .catch(() => {})
  })

  useRealtime<TimelineItemRecord>('timeline_items', () => {
    if (eventId)
      timelineService
        .list(eventId)
        .then(setTimelineItems)
        .catch(() => {})
  })

  useRealtime<AlertRecord>('alerts', () => {
    if (eventId)
      alertService
        .list(eventId)
        .then(setAlerts)
        .catch(() => {})
  })

  useRealtime<TableRecord>('tables', () => {
    if (eventId)
      tableService
        .list(eventId)
        .then(setTables)
        .catch(() => {})
  })

  // Computed metrics
  const totalGuests = guests.length
  const confirmedGuests = guests.filter(
    (g) => g.status === 'CONFIRMADO' || g.confirmation === 'CONFIRMADO',
  ).length
  const pendingGuests = guests.filter(
    (g) => g.status === 'PENDENTE' || g.confirmation === 'PENDENTE',
  ).length
  const presentGuests = guests.filter((g) => g.status === 'PRESENTE').length
  const absentGuests = guests.filter((g) => g.status === 'NAO_COMPARECEU').length

  const totalSeats = tables.reduce((acc, t) => acc + (t.capacity || 0), 0)
  const assignedSeats = guests.filter((g) => !!g.table_id).length
  const availableSeats = Math.max(0, totalSeats - assignedSeats)
  const contingencyCapacity = tables
    .filter((t) => t.is_reserve)
    .reduce((acc, t) => acc + (t.capacity || 0), 0)

  const activeAlerts = alerts.filter((a) => !a.is_resolved)

  // Timeline AGORA / PRÓXIMO / DEPOIS
  const timelineSummary = useMemo(() => {
    if (!timelineItems.length) return { agora: null, proximo: null, depois: [] }

    // Check if an item is "EM_ANDAMENTO"
    const inProgress = timelineItems.find((i) => i.status === 'EM_ANDAMENTO')
    const pendingItems = timelineItems.filter(
      (i) => i.status === 'A_PREPARAR' || i.status === 'PRONTO',
    )

    const agora = inProgress || pendingItems[0] || null
    const remaining = pendingItems.filter((i) => i.id !== agora?.id)
    const proximo = remaining[0] || null
    const depois = remaining.slice(1, 4)

    return { agora, proximo, depois }
  }, [timelineItems])

  const formattedDate = event?.date
    ? new Date(event.date)
        .toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        .toUpperCase()
    : '07 NOV 2026'

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A45F] border-t-transparent" />
          <p className="text-sm font-medium text-[#6B6356]">Atualizando Central da Festa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 lg:py-8 space-y-6">
      {/* Header Central */}
      <div className="bg-[#1C1A17] text-white rounded-2xl p-6 lg:p-8 shadow-xl border border-[#2D2A26] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-[#C5A45F]/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Central Operacional do Evento
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-white uppercase">
              {event?.name || 'FESTA DOS DESTAQUES'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1 flex items-center gap-2">
              <span className="font-semibold text-[#C5A45F]">{formattedDate}</span>
              <span>•</span>
              <span>
                Perfil: <strong className="text-white">{event?.profile || 'Elegante'}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                Status: {event?.status || 'ATIVO'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/app/${eventId}/live`}>
              <Button className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold gap-2 text-sm shadow-lg h-11 px-5">
                <Radio className="w-4 h-4 animate-pulse" />
                Abrir Modo Ao Vivo
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Homenageados */}
        <Link to={`/app/${eventId}/honorees`} className="group">
          <Card className="hover:border-[#C5A45F] transition-all bg-white shadow-sm hover:shadow group-hover:-translate-y-0.5">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#6B6356] font-semibold">
                  Homenageados
                </span>
                <Award className="w-4 h-4 text-[#C5A45F]" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl lg:text-3xl font-bold text-[#1C1A17]">{honorees.length}</div>
              <p className="text-[11px] text-[#6B6356] mt-0.5">Personalidades</p>
            </CardContent>
          </Card>
        </Link>

        {/* Convidados Total */}
        <Link to={`/app/${eventId}/guests`} className="group">
          <Card className="hover:border-[#C5A45F] transition-all bg-white shadow-sm hover:shadow group-hover:-translate-y-0.5">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#6B6356] font-semibold">
                  Convidados
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl lg:text-3xl font-bold text-[#1C1A17]">{totalGuests}</div>
              <div className="flex items-center gap-2 text-[11px] mt-0.5">
                <span className="text-emerald-700 font-medium">{confirmedGuests} conf.</span>
                <span className="text-[#6B6356]">•</span>
                <span className="text-amber-700">{pendingGuests} pend.</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Presentes no Evento (LIVE) */}
        <Link to={`/app/${eventId}/checkin`} className="group">
          <Card className="hover:border-emerald-500 transition-all bg-emerald-50/50 border-emerald-200 shadow-sm hover:shadow group-hover:-translate-y-0.5">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block" />
                  Presentes
                </span>
                <UserCheck className="w-4 h-4 text-emerald-700" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl lg:text-3xl font-bold text-emerald-900">{presentGuests}</div>
              <div className="flex items-center justify-between text-[11px] text-emerald-800 mt-0.5">
                <span>
                  {totalGuests > 0
                    ? `${Math.round((presentGuests / totalGuests) * 100)}% da lista`
                    : '0%'}
                </span>
                {absentGuests > 0 && (
                  <span className="text-neutral-500 flex items-center gap-0.5">
                    <UserX className="w-3 h-3" /> {absentGuests} aus.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Mesas & Lugares */}
        <Link to={`/app/${eventId}/tables`} className="group">
          <Card className="hover:border-[#C5A45F] transition-all bg-white shadow-sm hover:shadow group-hover:-translate-y-0.5">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#6B6356] font-semibold">
                  Mesas / Lugares
                </span>
                <Grid className="w-4 h-4 text-[#C5A45F]" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl lg:text-3xl font-bold text-[#1C1A17]">
                {tables.length} <span className="text-xs font-normal text-[#6B6356]">mesas</span>
              </div>
              <p className="text-[11px] text-[#6B6356] mt-0.5">
                <strong className="text-[#1C1A17]">{assignedSeats}</strong> ocup. /{' '}
                <strong className="text-emerald-700">{availableSeats}</strong> vagos
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Mesa Reserva / Contingência */}
        <Link to={`/app/${eventId}/tables`} className="group">
          <Card className="hover:border-amber-400 transition-all bg-amber-50/50 border-amber-200 shadow-sm hover:shadow group-hover:-translate-y-0.5">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-amber-800 font-semibold">
                  Contingência
                </span>
                <ShieldCheck className="w-4 h-4 text-amber-700" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl lg:text-3xl font-bold text-amber-900">
                {contingencyCapacity}
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">Lugares na Reserva</p>
            </CardContent>
          </Card>
        </Link>

        {/* Alertas / Equipes */}
        <Link to={`/app/${eventId}/timeline`} className="group">
          <Card
            className={`transition-all shadow-sm hover:shadow group-hover:-translate-y-0.5 ${
              activeAlerts.length > 0 ? 'bg-red-50/50 border-red-200' : 'bg-white'
            }`}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#6B6356] font-semibold">
                  Alertas Ativos
                </span>
                <AlertTriangle
                  className={`w-4 h-4 ${activeAlerts.length > 0 ? 'text-red-600' : 'text-neutral-400'}`}
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div
                className={`text-2xl lg:text-3xl font-bold ${activeAlerts.length > 0 ? 'text-red-700' : 'text-[#1C1A17]'}`}
              >
                {activeAlerts.length}
              </div>
              <p className="text-[11px] text-[#6B6356] mt-0.5">
                {teamCount} equipes • {supplierCount} forn.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Roteiro / Timeline Resumida: AGORA / PRÓXIMO / DEPOIS */}
      <Card className="bg-white border-neutral-200 shadow-sm">
        <CardHeader className="border-b border-neutral-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C5A45F]" />
              <CardTitle className="text-lg font-serif font-bold text-[#1C1A17]">
                Linha do Tempo Operacional
              </CardTitle>
            </div>
            <Link
              to={`/app/${eventId}/timeline`}
              className="text-xs font-semibold text-[#C5A45F] hover:underline inline-flex items-center gap-1"
            >
              Ver roteiro completo <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AGORA */}
            <div className="p-4 rounded-xl bg-[#1C1A17] text-white border border-[#332E27] relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  AGORA
                </span>
                <span className="text-xs text-[#C5A45F] font-semibold">
                  {timelineSummary.agora?.scheduled_time
                    ? new Date(timelineSummary.agora.scheduled_time).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '19:00'}
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-white line-clamp-2">
                {timelineSummary.agora?.title || 'Recepção dos Convidados'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                {timelineSummary.agora?.description || 'Acolhimento e direcionamento das famílias.'}
              </p>
              {timelineSummary.agora?.responsibles && (
                <div className="mt-3 text-[11px] text-neutral-300 border-t border-[#2A2723] pt-2">
                  <span className="text-neutral-500">Resp:</span>{' '}
                  {timelineSummary.agora.responsibles}
                </div>
              )}
            </div>

            {/* PRÓXIMO */}
            <div className="p-4 rounded-xl bg-[#F8F7F4] border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 border border-amber-300">
                  PRÓXIMO MOMENTO
                </span>
                <span className="text-xs text-[#6B6356] font-semibold">
                  {timelineSummary.proximo?.scheduled_time
                    ? new Date(timelineSummary.proximo.scheduled_time).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '20:00'}
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-[#1C1A17] line-clamp-2">
                {timelineSummary.proximo?.title || 'Abertura Oficial e Boas-Vindas'}
              </h3>
              <p className="text-xs text-[#6B6356] mt-1 line-clamp-2">
                {timelineSummary.proximo?.description ||
                  'Hugo sobe ao palco para abertura institucional.'}
              </p>
              {timelineSummary.proximo?.responsibles && (
                <div className="mt-3 text-[11px] text-[#6B6356] border-t border-neutral-200 pt-2">
                  <span className="text-neutral-400">Resp:</span>{' '}
                  {timelineSummary.proximo.responsibles}
                </div>
              )}
            </div>

            {/* DEPOIS */}
            <div className="p-4 rounded-xl bg-white border border-neutral-200">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B6356] mb-2">
                A SEGUIR (DEPOIS)
              </div>
              {timelineSummary.depois.length > 0 ? (
                <ul className="space-y-2.5">
                  {timelineSummary.depois.map((item) => (
                    <li
                      key={item.id}
                      className="text-xs flex items-start gap-2 border-b border-neutral-100 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="font-semibold text-[#C5A45F] shrink-0">
                        {item.scheduled_time
                          ? new Date(item.scheduled_time).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '--:--'}
                      </span>
                      <span className="text-[#221E1A] line-clamp-1">{item.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-neutral-400">Nenhum evento posterior cadastrado.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fast Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to={`/app/${eventId}/checkin`}>
          <Button
            variant="outline"
            className="w-full justify-start h-12 bg-white hover:bg-neutral-50 text-xs sm:text-sm border-neutral-200 gap-2 font-medium"
          >
            <UserCheck className="w-4 h-4 text-emerald-700" />
            Check-in Rápido
          </Button>
        </Link>
        <Link to={`/app/${eventId}/tables`}>
          <Button
            variant="outline"
            className="w-full justify-start h-12 bg-white hover:bg-neutral-50 text-xs sm:text-sm border-neutral-200 gap-2 font-medium"
          >
            <Grid className="w-4 h-4 text-[#C5A45F]" />
            Organização das Mesas
          </Button>
        </Link>
        <Link to={`/app/${eventId}/occurrences`}>
          <Button
            variant="outline"
            className="w-full justify-start h-12 bg-white hover:bg-neutral-50 text-xs sm:text-sm border-neutral-200 gap-2 font-medium"
          >
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            Registrar Ocorrência
          </Button>
        </Link>
        <Link to={`/app/${eventId}/live`}>
          <Button className="w-full justify-start h-12 bg-[#1C1A17] hover:bg-[#282521] text-[#C5A45F] text-xs sm:text-sm gap-2 font-bold shadow-sm">
            <Radio className="w-4 h-4 text-[#C5A45F]" />
            Comando Ao Vivo
          </Button>
        </Link>
      </div>
    </div>
  )
}
