import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  eventService,
  guestService,
  tableService,
  checklistService,
  honoreeService,
  dietaryService,
  occurrenceService,
  buffetReleaseService,
  whatsappService,
  auditService,
} from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type {
  EventRecord,
  GuestRecord,
  TableRecord,
  ChecklistItemRecord,
  HonoreeRecord,
  DietaryTaskRecord,
  OccurrenceRecord,
  BuffetReleaseRecord,
  WhatsappMessageRecord,
} from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShieldAlert,
  CheckCircle2,
  Users,
  QrCode,
  Utensils,
  Award,
  AlertTriangle,
  Send,
  Sparkles,
  ArrowRight,
  Clock,
  Lock,
  PhoneCall,
  Tv,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Dashboard() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [tables, setTables] = useState<TableRecord[]>([])
  const [checklist, setChecklist] = useState<ChecklistItemRecord[]>([])
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [dietaryTasks, setDietaryTasks] = useState<DietaryTaskRecord[]>([])
  const [occurrences, setOccurrences] = useState<OccurrenceRecord[]>([])
  const [releases, setReleases] = useState<BuffetReleaseRecord[]>([])
  const [messages, setMessages] = useState<WhatsappMessageRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [ev, gList, tList, cList, hList, dList, oList, rList, wList] = await Promise.all([
        eventService.getById(eventId),
        guestService.list(eventId),
        tableService.list(eventId),
        checklistService.list(eventId),
        honoreeService.list(eventId),
        dietaryService.list(eventId),
        occurrenceService.list(eventId),
        buffetReleaseService.list(eventId),
        whatsappService.list(eventId),
      ])
      setEvent(ev)
      setGuests(gList)
      setTables(tList)
      setChecklist(cList)
      setHonorees(hList)
      setDietaryTasks(dList)
      setOccurrences(oList)
      setReleases(rList)
      setMessages(wList)
    } catch (_) {
      toast({ title: 'Erro ao carregar dados operacionais', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  // Realtime updates
  useRealtime<ChecklistItemRecord>('checklist_items', () => {
    if (eventId)
      checklistService
        .list(eventId)
        .then(setChecklist)
        .catch(() => {})
  })
  useRealtime<GuestRecord>('guests', () => {
    if (eventId)
      guestService
        .list(eventId)
        .then(setGuests)
        .catch(() => {})
  })
  useRealtime<TableRecord>('tables', () => {
    if (eventId)
      tableService
        .list(eventId)
        .then(setTables)
        .catch(() => {})
  })
  useRealtime<OccurrenceRecord>('occurrences', () => {
    if (eventId)
      occurrenceService
        .list(eventId)
        .then(setOccurrences)
        .catch(() => {})
  })

  // J. RESPOSTAS IMEDIATAS DO DASHBOARD CENTRAL:
  // 1. Evento pronto para abrir?
  const criticalChecklistPending = useMemo(() => {
    return checklist.filter(
      (c) => c.is_critical && c.status !== 'CONCLUIDO' && !c.bypass_authorized_by,
    )
  }, [checklist])

  const tablesWithDivergence = useMemo(() => {
    return tables.filter(
      (t) =>
        t.conference_status === 'DIVERGENTE' ||
        (t.planned_chairs !== undefined &&
          t.physical_chairs !== undefined &&
          t.planned_chairs !== t.physical_chairs),
    )
  }, [tables])

  const isEventReadyToOpen =
    checklist.length > 0 &&
    criticalChecklistPending.length === 0 &&
    tablesWithDivergence.length === 0

  // 2. Quantas pendências?
  const totalPendingChecklist = checklist.filter(
    (c) => c.status !== 'CONCLUIDO' && !c.bypass_authorized_by,
  ).length

  // 3. Confirmados e Entradas
  const totalGuests = guests.length
  const presentGuests = guests.filter((g) => g.status === 'PRESENTE').length

  // 4. Mesas já liberadas para buffet
  const tablesReleasedBuffet = tables.filter(
    (t) => t.buffet_status && t.buffet_status !== 'AGUARDANDO',
  ).length

  // 5. Próximo homenageado
  const onStageHonoree = honorees.find((h) => h.operational_state === 'NO_PALCO')
  const nextHonoree =
    honorees.find((h) => h.operational_state === 'PROXIMO') ||
    honorees.find((h) => h.operational_state === 'EM_PREPARACAO') ||
    honorees.find((h) => h.operational_state === 'AGUARDANDO')

  // 6. Restrições alimentares pendentes
  const pendingDietary = dietaryTasks.filter((d) => d.status !== 'ENTREGUE').length

  // 7. Ocorrências abertas
  const openOccurrences = occurrences.filter((o) => !o.solution || o.solution.trim() === '').length

  // 8. Qual responsável acionar agora?
  const urgentResponsible =
    criticalChecklistPending[0]?.responsible ||
    (tablesWithDivergence.length > 0 ? 'Renato Apoio (Mesas)' : 'Hugo Cerimonial')

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 sm:py-6 space-y-6 pb-24">
      {/* Top Main Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Sparkles className="w-4 h-4" /> Centro de Comando Operacional — Festa dos Destaques
            2026
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1C1A17]">
            Dashboard Geral de Prontidão do Evento
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6356] mt-0.5">
            Coordenação Geral: Hugo Cerimonial & Renato Apoio • 30 Homenageados • ~400 Convidados •
            20 Mesas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/events/${eventId}/live`}>
            <Button className="bg-[#1C1A17] hover:bg-[#282521] text-[#C5A45F] font-bold text-xs h-10 gap-2 border border-[#3D3833] shadow">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Entrar no Modo Evento ao Vivo
            </Button>
          </Link>
        </div>
      </div>

      {/* CORE READINESS HERO CARD (Responde imediatamente: Evento pronto para abrir?) */}
      <div
        className={`p-5 sm:p-6 rounded-2xl border-4 shadow-xl transition-all ${
          isEventReadyToOpen
            ? 'bg-emerald-950 border-emerald-500 text-white'
            : 'bg-red-950 border-red-600 text-white'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isEventReadyToOpen
                  ? 'bg-emerald-800 border-emerald-600 text-emerald-200'
                  : 'bg-red-800 border-red-500 text-red-100 animate-pulse'
              }`}
            >
              {isEventReadyToOpen ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <ShieldAlert className="w-8 h-8" />
              )}
            </div>

            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest opacity-80">
                PERGUNTA 1: EVENTO PRONTO PARA ABRIR ÀS 19:00?
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-0.5">
                {isEventReadyToOpen
                  ? 'SIM — 100% HOMOLOGADO PARA RECEBER CONVIDADOS'
                  : 'NÃO — SALÃO BLOQUEADO POR PENDÊNCIAS CRÍTICAS'}
              </h2>
              <p className="text-xs sm:text-sm opacity-90 mt-1">
                {isEventReadyToOpen
                  ? 'Todas as 20 mesas conferidas, palco pronto, buffet aquecido e rotas acessíveis livres.'
                  : `${criticalChecklistPending.length} item(ns) crítico(s) sem autorização e ${tablesWithDivergence.length} mesa(s) com divergência física de cadeiras.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <Link to={`/events/${eventId}/checklist`}>
              <Button
                className={`font-serif font-bold text-xs h-11 px-5 rounded-xl ${
                  isEventReadyToOpen
                    ? 'bg-white text-emerald-950 hover:bg-neutral-100'
                    : 'bg-white text-red-950 hover:bg-neutral-100'
                }`}
              >
                Ver Checklist Pré-Abertura
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 8 BIG OPERATIONAL METRIC CARDS (Requirements J: Cartões, cores, alertas e botões grandes) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pendências e Críticas */}
        <Link to={`/events/${eventId}/checklist`}>
          <Card className="hover:shadow-md transition-all border-2 border-neutral-200 bg-white p-4 h-full cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B6356]">Pendências</span>
              <Badge
                className={`text-[10px] font-bold ${
                  criticalChecklistPending.length > 0
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {criticalChecklistPending.length} Críticas
              </Badge>
            </div>
            <div className="text-3xl font-serif font-bold text-[#1C1A17] mt-1 group-hover:text-[#C5A45F]">
              {totalPendingChecklist}
            </div>
            <div className="text-[11px] text-[#6B6356] mt-1 flex items-center justify-between">
              <span>de {checklist.length} itens totais</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A45F]" />
            </div>
          </Card>
        </Link>

        {/* Card 2: Entradas / Check-in */}
        <Link to={`/events/${eventId}/checkin`}>
          <Card className="hover:shadow-md transition-all border-2 border-neutral-200 bg-white p-4 h-full cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B6356]">
                Entradas Recepção
              </span>
              <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold">
                Check-in QR
              </Badge>
            </div>
            <div className="text-3xl font-serif font-bold text-emerald-700 mt-1">
              {presentGuests}{' '}
              <span className="text-base font-normal text-neutral-400">/ {totalGuests}</span>
            </div>
            <div className="text-[11px] text-[#6B6356] mt-1 flex items-center justify-between">
              <span>
                {totalGuests > 0 ? Math.round((presentGuests / totalGuests) * 100) : 0}% presentes
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A45F]" />
            </div>
          </Card>
        </Link>

        {/* Card 3: Mesas com Divergência */}
        <Link to={`/events/${eventId}/tables`}>
          <Card className="hover:shadow-md transition-all border-2 border-neutral-200 bg-white p-4 h-full cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B6356]">
                Mesas & Cadeiras
              </span>
              <Badge
                className={`text-[10px] font-bold ${
                  tablesWithDivergence.length > 0
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {tablesWithDivergence.length > 0 ? 'Divergência!' : '100% OK'}
              </Badge>
            </div>
            <div className="text-3xl font-serif font-bold text-[#1C1A17] mt-1">
              {tablesWithDivergence.length}{' '}
              <span className="text-sm font-normal text-neutral-400">mesa(s)</span>
            </div>
            <div className="text-[11px] text-[#6B6356] mt-1 flex items-center justify-between">
              <span>{tables.length} mesas planejadas</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A45F]" />
            </div>
          </Card>
        </Link>

        {/* Card 4: Liberação Buffet */}
        <Link to={`/events/${eventId}/buffet`}>
          <Card className="hover:shadow-md transition-all border-2 border-neutral-200 bg-white p-4 h-full cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B6356]">
                Buffet em Ondas
              </span>
              <Badge className="bg-indigo-100 text-indigo-900 border-indigo-300 text-[10px] font-bold">
                Ondas de 2-3
              </Badge>
            </div>
            <div className="text-3xl font-serif font-bold text-indigo-700 mt-1">
              {tablesReleasedBuffet}{' '}
              <span className="text-sm font-normal text-neutral-400">liberadas</span>
            </div>
            <div className="text-[11px] text-[#6B6356] mt-1 flex items-center justify-between">
              <span>{releases.length} ondas realizadas</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A45F]" />
            </div>
          </Card>
        </Link>

        {/* Card 5: Próximo Homenageado */}
        <Link to={`/events/${eventId}/honorees`}>
          <Card className="hover:shadow-md transition-all border-2 border-neutral-200 bg-white p-4 h-full cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B6356]">
                Homenageados (30)
              </span>
              <Badge className="bg-[#1C1A17] text-[#C5A45F] text-[10px] font-bold">
                No Palco Agora
              </Badge>
            </div>
            <div className="font-serif font-bold text-base text-[#1C1A17] mt-1 truncate">
              {onStageHonoree ? onStageHonoree.name : 'Aguardando Início'}
            </div>
            <div className="text-[11px] text-[#6B6356] mt-1 flex items-center justify-between">
              <span>Próximo: {nextHonoree ? nextHonoree.name : '—'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A45F]" />
            </div>
          </Card>
        </Link>

        {/* Card 6: Restrições Alimentares */}
        <Link to={`/events/${eventId}/buffet`}>
          <Card className="hover:shadow-md transition-all border-2 border-neutral-200 bg-white p-4 h-full cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B6356]">
                Pratos Especiais
              </span>
              <Badge
                className={`text-[10px] font-bold ${
                  pendingDietary > 0 ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {pendingDietary > 0 ? 'Pendente' : '100% Entregue'}
              </Badge>
            </div>
            <div className="text-3xl font-serif font-bold text-amber-700 mt-1">
              {pendingDietary} <span className="text-sm font-normal text-neutral-400">pratos</span>
            </div>
            <div className="text-[11px] text-[#6B6356] mt-1 flex items-center justify-between">
              <span>{dietaryTasks.length} restrições severas</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A45F]" />
            </div>
          </Card>
        </Link>

        {/* Card 7: Ocorrências Abertas */}
        <Link to={`/events/${eventId}/occurrences`}>
          <Card className="hover:shadow-md transition-all border-2 border-neutral-200 bg-white p-4 h-full cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#6B6356]">Ocorrências</span>
              <Badge
                className={`text-[10px] font-bold ${
                  openOccurrences > 0 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {openOccurrences} Abertas
              </Badge>
            </div>
            <div className="text-3xl font-serif font-bold text-[#1C1A17] mt-1">
              {occurrences.length}
            </div>
            <div className="text-[11px] text-[#6B6356] mt-1 flex items-center justify-between">
              <span>todas auditadas</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A45F]" />
            </div>
          </Card>
        </Link>

        {/* Card 8: Responsável para Acionar */}
        <div className="bg-[#1C1A17] text-white p-4 rounded-2xl border border-[#332E27] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5A45F]">
              ACIONAL PRIORITÁRIO
            </div>
            <div className="font-serif font-bold text-base text-white mt-1 leading-snug">
              {urgentResponsible}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">Acionar via WhatsApp simulado</div>
          </div>
          <Link to={`/events/${eventId}/live`}>
            <Button
              size="sm"
              className="w-full mt-2 bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold text-xs h-8"
            >
              Acionar Agora
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK WORKFLOW ACCESS SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <Link to={`/events/${eventId}/checkin`}>
          <div className="p-3 bg-white rounded-xl border border-neutral-200 hover:border-[#C5A45F] text-center cursor-pointer transition-all shadow-sm">
            <QrCode className="w-5 h-5 mx-auto text-[#C5A45F] mb-1" />
            <span className="text-xs font-bold text-[#1C1A17] block">Check-in QR</span>
            <span className="text-[10px] text-neutral-400">Recepção</span>
          </div>
        </Link>

        <Link to={`/events/${eventId}/tables`}>
          <div className="p-3 bg-white rounded-xl border border-neutral-200 hover:border-[#C5A45F] text-center cursor-pointer transition-all shadow-sm">
            <Users className="w-5 h-5 mx-auto text-[#C5A45F] mb-1" />
            <span className="text-xs font-bold text-[#1C1A17] block">Mapa 20 Mesas</span>
            <span className="text-[10px] text-neutral-400">Trava & Cadeiras</span>
          </div>
        </Link>

        <Link to={`/events/${eventId}/checklist`}>
          <div className="p-3 bg-white rounded-xl border border-neutral-200 hover:border-[#C5A45F] text-center cursor-pointer transition-all shadow-sm">
            <ShieldAlert className="w-5 h-5 mx-auto text-[#C5A45F] mb-1" />
            <span className="text-xs font-bold text-[#1C1A17] block">Checklist</span>
            <span className="text-[10px] text-neutral-400">16 Áreas</span>
          </div>
        </Link>

        <Link to={`/events/${eventId}/buffet`}>
          <div className="p-3 bg-white rounded-xl border border-neutral-200 hover:border-[#C5A45F] text-center cursor-pointer transition-all shadow-sm">
            <Utensils className="w-5 h-5 mx-auto text-[#C5A45F] mb-1" />
            <span className="text-xs font-bold text-[#1C1A17] block">Buffet & Telão</span>
            <span className="text-[10px] text-neutral-400">Ondas 2-3</span>
          </div>
        </Link>

        <Link to={`/events/${eventId}/honorees`}>
          <div className="p-3 bg-white rounded-xl border border-neutral-200 hover:border-[#C5A45F] text-center cursor-pointer transition-all shadow-sm">
            <Award className="w-5 h-5 mx-auto text-[#C5A45F] mb-1" />
            <span className="text-xs font-bold text-[#1C1A17] block">30 Homenageados</span>
            <span className="text-[10px] text-neutral-400">11 Estados</span>
          </div>
        </Link>

        <Link to={`/events/${eventId}/live`}>
          <div className="p-3 bg-white rounded-xl border border-neutral-200 hover:border-[#C5A45F] text-center cursor-pointer transition-all shadow-sm">
            <Clock className="w-5 h-5 mx-auto text-[#C5A45F] mb-1" />
            <span className="text-xs font-bold text-[#1C1A17] block">Evento ao Vivo</span>
            <span className="text-[10px] text-neutral-400">Centro Tempo Real</span>
          </div>
        </Link>
      </div>

      {/* WHATSAPP ACTIVITY & AUDIT LOG PREVIEW (Requirements L & M) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Simulated WhatsApp Feed */}
        <Card className="bg-white border-2 border-neutral-200 shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-neutral-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-serif font-bold text-[#1C1A17] flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                WhatsApp Operacional Simulado
              </CardTitle>
              <CardDescription className="text-xs">
                {messages.length} disparos registrados (ondas de buffet, avisos aos homenageados,
                cobranças de checklist)
              </CardDescription>
            </div>
            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px]">
              Canal Principal
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 max-h-[280px] overflow-y-auto">
            {messages.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-[#1C1A17]">{m.recipient_name}</strong>
                  <Badge className="bg-neutral-800 text-[#C5A45F] text-[9px]">{m.status}</Badge>
                </div>
                <p className="text-neutral-600 text-[11px] leading-relaxed">{m.message}</p>
                <div className="text-[9px] text-neutral-400 flex items-center justify-between pt-1">
                  <span>Categoria: {m.category}</span>
                  <span>
                    {m.sent_at ? new Date(m.sent_at).toLocaleTimeString('pt-BR') : 'Agora'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live Ocorrências & Ações Rápidas */}
        <Card className="bg-white border-2 border-neutral-200 shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-neutral-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-serif font-bold text-[#1C1A17] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Ocorrências & Resoluções de Salão
              </CardTitle>
              <CardDescription className="text-xs">
                Histórico com responsável, setor e solução registrada
              </CardDescription>
            </div>
            <Link to={`/events/${eventId}/occurrences`}>
              <Button size="sm" variant="outline" className="text-xs h-7 text-[#C5A45F]">
                Ver Todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 max-h-[280px] overflow-y-auto">
            {occurrences.slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px]">
                    {o.category}
                  </Badge>
                  <span className="text-[10px] text-neutral-500">Resp: {o.responsible}</span>
                </div>
                <p className="text-[#1C1A17] font-semibold text-[11px]">{o.description}</p>
                {o.solution ? (
                  <div className="text-[10px] text-emerald-700 bg-emerald-50 p-1 rounded font-medium">
                    ✓ Solução: {o.solution}
                  </div>
                ) : (
                  <div className="text-[10px] text-red-600 font-bold">
                    Pendente de resolução pela coordenação
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
