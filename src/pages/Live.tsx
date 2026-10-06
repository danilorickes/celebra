import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  eventService,
  timelineService,
  alertService,
  occurrenceService,
  honoreeService,
  buffetReleaseService,
  whatsappService,
  auditService,
} from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type {
  EventRecord,
  TimelineItemRecord,
  AlertRecord,
  OccurrenceRecord,
  HonoreeRecord,
  BuffetReleaseRecord,
  WhatsappMessageRecord,
  AuditLogRecord,
} from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Clock,
  Sparkles,
  Award,
  Utensils,
  AlertTriangle,
  Send,
  CheckCircle2,
  Tv,
  Users,
  ShieldCheck,
  Plus,
  RotateCcw,
  History,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// ROLE SELECTION (Requirement I: Hugo, Renato, recepção, buffet, garçons, palco, som, iluminação, fotografia, fornecedores, admins)
type OperationalRole =
  | 'HUGO_COORD'
  | 'RENATO_APOIO'
  | 'RECEPCAO'
  | 'BUFFET'
  | 'GARCONS'
  | 'PALCO'
  | 'SOM'
  | 'ILUMINACAO'
  | 'FOTOGRAFIA'
  | 'ADMIN'

const ROLE_CONFIGS: Record<OperationalRole, { label: string; badge: string; focus: string }> = {
  HUGO_COORD: {
    label: 'Hugo Cerimonial (Coordenador Chefe)',
    badge: 'bg-[#1C1A17] text-[#C5A45F]',
    focus: 'Visão Geral, Decisões & Escalonamentos',
  },
  RENATO_APOIO: {
    label: 'Renato Apoio (Coordenação Operacional)',
    badge: 'bg-amber-900 text-amber-100',
    focus: 'Mesas, Cadeiras & Condução de Homenageados',
  },
  RECEPCAO: {
    label: 'Recepção & Credenciamento',
    badge: 'bg-emerald-800 text-emerald-100',
    focus: 'Check-in QR, Exceções & Fila de Entrada',
  },
  BUFFET: {
    label: 'Buffet Gastronômico (Chef Roberto)',
    badge: 'bg-amber-800 text-white',
    focus: 'Liberação em Ondas & Pratos Especiais',
  },
  GARCONS: {
    label: 'Equipe de Garçons & Salão',
    badge: 'bg-neutral-800 text-neutral-200',
    focus: 'Serviço de Mesas, Entrega de Restrições',
  },
  PALCO: {
    label: 'Palco & Cerimonial',
    badge: 'bg-purple-900 text-purple-100',
    focus: '30 Homenageados, Ordem & Troféus',
  },
  SOM: {
    label: 'Sonorização & DJ',
    badge: 'bg-blue-900 text-blue-100',
    focus: 'Trilhas Musicais & Microfones Lapela',
  },
  ILUMINACAO: {
    label: 'Iluminação Cênica',
    badge: 'bg-yellow-900 text-yellow-100',
    focus: 'Cenas DMX & Foco do Palco',
  },
  FOTOGRAFIA: {
    label: 'Fotografia & Telão LED',
    badge: 'bg-indigo-900 text-indigo-100',
    focus: 'Backdrop Oficial & Projeção',
  },
  ADMIN: {
    label: 'Administrador / Danilo & Ana Paula',
    badge: 'bg-neutral-900 text-white',
    focus: 'Controle Total do Evento',
  },
}

export default function Live() {
  const { eventId } = useParams<{ eventId: string }>()
  const [event, setEvent] = useState<EventRecord | null>(null)
  const [timeline, setTimeline] = useState<TimelineItemRecord[]>([])
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [occurrences, setOccurrences] = useState<OccurrenceRecord[]>([])
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [releases, setReleases] = useState<BuffetReleaseRecord[]>([])
  const [messages, setMessages] = useState<WhatsappMessageRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [currentRole, setCurrentRole] = useState<OperationalRole>('HUGO_COORD')
  const [isLoading, setIsLoading] = useState(true)

  // New Occurrence Dialog
  const [isNewOccOpen, setIsNewOccOpen] = useState(false)
  const [occCategory, setOccCategory] = useState<OccurrenceRecord['category']>('MESA')
  const [occDesc, setOccDesc] = useState('')
  const [occResp, setOccResp] = useState('Renato Apoio')
  const [occSol, setOccSol] = useState('')
  const [isSubmittingOcc, setIsSubmittingOcc] = useState(false)

  // Resolve Occurrence Modal
  const [resolvingOcc, setResolvingOcc] = useState<OccurrenceRecord | null>(null)
  const [solutionText, setSolutionText] = useState('')

  // WhatsApp Broadcast Modal
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
  const [broadcastTarget, setBroadcastTarget] = useState('TODOS_LIDERES')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [ev, tl, al, occ, hon, rel, msg, aud] = await Promise.all([
        eventService.getById(eventId),
        timelineService.list(eventId),
        alertService.list(eventId),
        occurrenceService.list(eventId),
        honoreeService.list(eventId),
        buffetReleaseService.list(eventId),
        whatsappService.list(eventId),
        auditService.list(eventId),
      ])
      setEvent(ev)
      setTimeline(tl)
      setAlerts(al)
      setOccurrences(occ)
      setHonorees(hon)
      setReleases(rel)
      setMessages(msg)
      setAuditLogs(aud)
    } catch (_) {
      toast({ title: 'Erro ao carregar dados ao vivo', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  // Realtime updates
  useRealtime<TimelineItemRecord>('timeline_items', () => {
    if (eventId)
      timelineService
        .list(eventId)
        .then(setTimeline)
        .catch(() => {})
  })
  useRealtime<OccurrenceRecord>('occurrences', () => {
    if (eventId)
      occurrenceService
        .list(eventId)
        .then(setOccurrences)
        .catch(() => {})
  })
  useRealtime<HonoreeRecord>('honorees', () => {
    if (eventId)
      honoreeService
        .list(eventId)
        .then(setHonorees)
        .catch(() => {})
  })
  useRealtime<BuffetReleaseRecord>('buffet_releases', () => {
    if (eventId)
      buffetReleaseService
        .list(eventId)
        .then(setReleases)
        .catch(() => {})
  })
  useRealtime<WhatsappMessageRecord>('whatsapp_messages', () => {
    if (eventId)
      whatsappService
        .list(eventId)
        .then(setMessages)
        .catch(() => {})
  })

  // Timeline current item calculation
  const currentTimelineItem = useMemo(() => {
    return (
      timeline.find((t) => t.status === 'EM_ANDAMENTO') ||
      timeline.find((t) => t.status === 'PRONTO') ||
      timeline[0]
    )
  }, [timeline])

  const nextTimelineItem = useMemo(() => {
    if (!currentTimelineItem) return null
    const idx = timeline.findIndex((t) => t.id === currentTimelineItem.id)
    return timeline[idx + 1] || null
  }, [timeline, currentTimelineItem])

  // Current Honorees on stage & next
  const onStageHonoree = honorees.find((h) => h.operational_state === 'NO_PALCO')
  const nextHonoree = honorees.find((h) => h.operational_state === 'PROXIMO')
  const upcomingHonorees = honorees
    .filter((h) => h.operational_state !== 'CONCLUIDO' && h.operational_state !== 'NO_PALCO')
    .slice(0, 3)

  // Latest Buffet Wave
  const latestWave = releases[0]

  // Create Occurrence
  const handleCreateOccurrence = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !occDesc.trim()) return
    setIsSubmittingOcc(true)
    try {
      const created = await occurrenceService.create({
        event_id: eventId,
        category: occCategory,
        description: occDesc,
        responsible: occResp,
        solution: occSol,
      })
      await auditService.log({
        event_id: eventId,
        actor_name: ROLE_CONFIGS[currentRole].label,
        actor_role: currentRole,
        action: 'OCORRENCIA_CRIADA',
        target_entity: 'occurrences',
        target_id: created.id,
        details: `Categoria: ${occCategory}. Responsável: ${occResp}. Descrição: ${occDesc}`,
      })
      toast({ title: 'Ocorrência registrada com sucesso!' })
      setIsNewOccOpen(false)
      setOccDesc('')
      setOccSol('')
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao criar ocorrência', variant: 'destructive' })
    } finally {
      setIsSubmittingOcc(false)
    }
  }

  // Resolve Occurrence
  const handleResolveOccurrence = async () => {
    if (!eventId || !resolvingOcc || !solutionText.trim()) return
    try {
      await occurrenceService.update(resolvingOcc.id, {
        solution: solutionText,
      })
      await auditService.log({
        event_id: eventId,
        actor_name: ROLE_CONFIGS[currentRole].label,
        actor_role: currentRole,
        action: 'OCORRENCIA_RESOLVIDA',
        target_entity: 'occurrences',
        target_id: resolvingOcc.id,
        details: `Solução aplicada: ${solutionText}`,
      })
      toast({ title: 'Ocorrência marcada como resolvida!' })
      setResolvingOcc(null)
      setSolutionText('')
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao resolver ocorrência', variant: 'destructive' })
    }
  }

  // Send WhatsApp Broadcast to leaders
  const handleSendBroadcast = async () => {
    if (!eventId || !broadcastMessage.trim()) return
    setIsSendingBroadcast(true)
    try {
      await whatsappService.sendSimulated({
        event_id: eventId,
        recipient_name: `Líderes de Equipe (${broadcastTarget})`,
        recipient_phone: '(11) 98888-7777',
        recipient_role: 'Coordenação',
        category: 'ALERTA_EQUIPE',
        message: `COMUNICADO GERAL HUGO CERIMONIAL: ${broadcastMessage}`,
      })
      await auditService.log({
        event_id: eventId,
        actor_name: ROLE_CONFIGS[currentRole].label,
        actor_role: currentRole,
        action: 'COMUNICADO_WHATSAPP_DISPARADO',
        target_entity: 'whatsapp_messages',
        details: broadcastMessage,
      })
      toast({ title: 'Comunicado despachado via WhatsApp simulado!' })
      setIsBroadcastOpen(false)
      setBroadcastMessage('')
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao disparar comunicado', variant: 'destructive' })
    } finally {
      setIsSendingBroadcast(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 sm:py-6 space-y-6 pb-24">
      {/* Top Main Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
            <Clock className="w-4 h-4 text-red-500" /> Evento Ao Vivo — Festa dos Destaques 2026
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1C1A17]">
            Centro de Operações em Tempo Real
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6356] mt-0.5">
            Coordenação: Hugo Cerimonial (Líderes) & Renato Apoio (Equipes) • WhatsApp Integrado
          </p>
        </div>

        {/* ROLE SWITCHER SELECTOR (Requirement I: Cada função vê só o que precisa executar) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="text-right sm:text-left">
            <span className="text-[10px] uppercase font-bold text-[#6B6356] block">
              Visão por Função Ativa:
            </span>
            <Select value={currentRole} onValueChange={(v) => setCurrentRole(v as OperationalRole)}>
              <SelectTrigger className="w-full sm:w-[280px] h-10 bg-[#1C1915] border border-[#3D3528] text-xs font-bold text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1C1813] border-[#383125] text-white">
                {Object.entries(ROLE_CONFIGS).map(([k, cfg]) => (
                  <SelectItem key={k} value={k}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => setIsBroadcastOpen(true)}
            className="bg-[#1C1915] hover:bg-[#28231D] text-[#C5A45F] font-bold text-xs h-10 gap-1.5 border border-[#3D3528] shadow-elevation rounded-xl"
          >
            <Send className="w-4 h-4" /> Disparar WhatsApp Geral
          </Button>
        </div>
      </div>

      {/* Role Context Chip */}
      <div className="bg-[#161412] text-white p-3 rounded-2xl border border-[#2B2620] flex items-center justify-between text-xs shadow-elevation">
        <div className="flex items-center gap-2">
          <Badge className={ROLE_CONFIGS[currentRole].badge}>
            {ROLE_CONFIGS[currentRole].label}
          </Badge>
          <span className="text-neutral-400">
            Foco Operacional:{' '}
            <strong className="text-neutral-200">{ROLE_CONFIGS[currentRole].focus}</strong>
          </span>
        </div>
        <span className="text-[11px] text-[#C5A45F] font-semibold hidden sm:inline">
          Modo Operador Ativo
        </span>
      </div>

      {/* THREE PILLAR PANELS: TIMELINE / HONOREES / BUFFET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pillar 1: Programação Atual & Próxima Atividade */}
        <Card className="bg-[#161412] text-white border border-[#2B2620] shadow-elevation flex flex-col justify-between rounded-2xl">
          <CardHeader className="p-4 pb-2 border-b border-[#25201A]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                CRONOGRAMA DO PALCO
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold animate-pulse">
                EM ANDAMENTO
              </Badge>
            </div>
            <CardTitle className="text-base font-serif font-bold text-white mt-1">
              {currentTimelineItem ? currentTimelineItem.title : 'Recepção dos Convidados'}
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Horário previsto: {currentTimelineItem?.scheduled_time || '19:00'} • Responsável:{' '}
              {currentTimelineItem?.responsibles || 'Hugo Cerimonial'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-neutral-300 bg-[#1C1813] p-3 rounded-xl border border-[#2B2620]">
              {currentTimelineItem?.description ||
                'Entrada musical, recepção com espumante no foyer e direcionamento às 20 mesas.'}
            </p>

            {nextTimelineItem && (
              <div className="pt-2 border-t border-[#25201A]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  PRÓXIMA ATIVIDADE PROGRAMADA:
                </span>
                <div className="font-serif font-bold text-sm text-white mt-0.5">
                  {nextTimelineItem.title} ({nextTimelineItem.scheduled_time})
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 pt-0">
            <Link to={`/events/${eventId}/timeline`}>
              <Button
                variant="outline"
                className="w-full text-xs h-8 border-[#332D24] text-neutral-300 hover:bg-[#201D18] rounded-xl"
              >
                Abrir Roteiro Completo do Cerimonial
              </Button>
            </Link>
          </div>
        </Card>

        {/* Pillar 2: Próximos Homenageados */}
        <Card className="bg-[#161412] text-white border border-[#2B2620] shadow-elevation flex flex-col justify-between rounded-2xl">
          <CardHeader className="p-4 pb-2 border-b border-[#25201A]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                HOMENAGEADOS EM DESTAQUE
              </span>
              <Badge className="bg-[#24201B] text-[#C5A45F] border border-[#383125] text-[10px] font-bold">
                30 Homenagens
              </Badge>
            </div>
            <CardTitle className="text-base font-serif font-bold text-white mt-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#C5A45F]" />
              {onStageHonoree ? `No Palco: ${onStageHonoree.name}` : 'Preparando Palco'}
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              {onStageHonoree
                ? `Ordem #${onStageHonoree.tribute_order} • Acompanhante: ${onStageHonoree.escort_name || 'Sim'}`
                : 'Cerimônia de premiação prestes a iniciar'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Próximos na Fila de Chamada:
            </span>
            <div className="space-y-1.5">
              {upcomingHonorees.map((uh) => (
                <div
                  key={uh.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#1C1813] border border-[#2B2620] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#24201B] text-[#C5A45F] border border-[#383125] text-[10px] font-bold flex items-center justify-center">
                      {uh.tribute_order}
                    </span>
                    <span className="font-semibold text-white">{uh.name}</span>
                  </div>
                  <Badge className="text-[9px] bg-[#24201B] text-neutral-300 border border-[#383125]">
                    {uh.operational_state || 'AGUARDANDO'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-4 pt-0">
            <Link to={`/events/${eventId}/honorees`}>
              <Button
                variant="outline"
                className="w-full text-xs h-8 border-[#332D24] text-neutral-300 hover:bg-[#201D18] rounded-xl"
              >
                Gerenciar Painel dos 30 Homenageados
              </Button>
            </Link>
          </div>
        </Card>

        {/* Pillar 3: Liberação do Buffet */}
        <Card className="bg-[#161412] text-white border border-[#2B2620] shadow-elevation flex flex-col justify-between rounded-2xl">
          <CardHeader className="p-4 pb-2 border-b border-[#25201A]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                BUFFET GASTRONÔMICO
              </span>
              <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                Ondas de 2-3 Mesas
              </Badge>
            </div>
            <CardTitle className="text-base font-serif font-bold text-white mt-1 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-[#C5A45F]" />
              {latestWave
                ? `Última Onda: ${latestWave.table_names}`
                : 'Aguardando Início do Buffet'}
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              {latestWave
                ? `Liberado às ${new Date(latestWave.released_at).toLocaleTimeString('pt-BR')} por ${latestWave.operator}`
                : 'Programado para 20:30'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="p-3 bg-[#1C1813] rounded-xl border border-[#2B2620]">
              <span className="font-semibold text-neutral-300 block">Status no Telão LED:</span>
              <span className="text-emerald-400 font-bold">
                {latestWave?.display_on_screen
                  ? '✓ Projetando no Telão Principal'
                  : 'Aguardando ativação'}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400">
              WhatsApp automático despachado em lote para os convidados das mesas chamadas.
            </div>
          </CardContent>
          <div className="p-4 pt-0">
            <Link to={`/events/${eventId}/buffet`}>
              <Button className="w-full text-xs h-8 bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-bold rounded-xl">
                Liberar Próxima Onda de Mesas
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* OCORRÊNCIAS EM TEMPO REAL & HISTÓRICO DE AUDITORIA (Requirement K & M) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ocorrências com resolução */}
        <Card className="bg-[#161412] text-white border border-[#2B2620] shadow-elevation rounded-2xl">
          <CardHeader className="p-4 pb-2 border-b border-[#25201A] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-serif font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Ocorrências de Salão & Resoluções
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Registre imprevistos com setor, responsável e solução tomada
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsNewOccOpen(true)}
              className="bg-[#24201B] hover:bg-[#322C25] text-[#C5A45F] border border-[#3D3528] font-bold text-xs h-8 gap-1 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Ocorrência
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
            {occurrences.map((occ) => {
              const isResolved = !!occ.solution && occ.solution.trim().length > 0

              return (
                <div
                  key={occ.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                    isResolved ? 'border-[#2B2620] bg-[#1C1813]' : 'border-red-600/60 bg-[#211111]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#24201B] text-[#C5A45F] border border-[#383125] text-[9px]">
                          {occ.category}
                        </Badge>
                        <span className="text-xs font-bold text-white">{occ.description}</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        Responsável: <strong className="text-neutral-200">{occ.responsible}</strong>
                      </div>
                    </div>

                    <Badge
                      className={`text-[9px] font-bold shrink-0 ${
                        isResolved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                      }`}
                    >
                      {isResolved ? 'RESOLVIDA' : 'PENDENTE'}
                    </Badge>
                  </div>

                  {isResolved ? (
                    <div className="text-xs text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/60">
                      <strong>Solução Adotada:</strong> {occ.solution}
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          setResolvingOcc(occ)
                          setSolutionText('')
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 px-3 rounded-lg"
                      >
                        ✓ Registrar Solução
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Audit Log / Histórico de Auditoria */}
        <Card className="bg-[#161412] text-white border border-[#2B2620] shadow-elevation rounded-2xl">
          <CardHeader className="p-4 pb-2 border-b border-[#25201A] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-serif font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#C5A45F]" />
                Histórico de Auditoria Operacional
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Rastreamento completo: quem executou, horário, ação e entidade alvo
              </CardDescription>
            </div>
            <Badge className="bg-[#24201B] text-neutral-300 border border-[#383125] text-[10px]">
              {auditLogs.length} registros
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 max-h-[350px] overflow-y-auto font-mono text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-[#1C1813] border border-[#2B2620] space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <strong className="text-white">{log.actor_name}</strong>
                  <span className="text-neutral-500">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('pt-BR') : 'Agora'}
                  </span>
                </div>
                <div className="text-[#C5A45F] font-bold text-[10px]">{log.action}</div>
                <div className="text-neutral-400 text-[11px] font-sans">{log.details}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* NEW OCCURRENCE MODAL */}
      <Dialog open={isNewOccOpen} onOpenChange={setIsNewOccOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[#161412] text-white border border-[#332D24] rounded-2xl shadow-2xl">
          <form onSubmit={handleCreateOccurrence}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> Registrar Nova Ocorrência
              </DialogTitle>
              <DialogDescription className="text-xs">
                Fica registrada no log de auditoria com atribuição imediata ao responsável.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="occ-cat">Categoria:</Label>
                <Select
                  value={occCategory}
                  onValueChange={(v) => setOccCategory(v as OccurrenceRecord['category'])}
                >
                  <SelectTrigger id="occ-cat" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MESA">Mesa / Cadeiras</SelectItem>
                    <SelectItem value="CONVIDADO">Convidado / Recepção</SelectItem>
                    <SelectItem value="BUFFET">Buffet / Restrição Alimentar</SelectItem>
                    <SelectItem value="PROTOCOLO">Protocolo / Palco</SelectItem>
                    <SelectItem value="EQUIPE">Equipe Operacional</SelectItem>
                    <SelectItem value="FORNECEDOR">Fornecedor Externo</SelectItem>
                    <SelectItem value="OUTRO">Outro Imprevisto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="occ-desc">Descrição do Ocorrido *</Label>
                <Input
                  id="occ-desc"
                  required
                  placeholder="Ex: Convidado solicitou trocar de mesa / Falha em microfone lapela..."
                  value={occDesc}
                  onChange={(e) => setOccDesc(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="occ-resp">Responsável por Resolver:</Label>
                <Input
                  id="occ-resp"
                  value={occResp}
                  onChange={(e) => setOccResp(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="occ-sol">Ação Tomada / Solução (Opcional se já resolvida):</Label>
                <Input
                  id="occ-sol"
                  placeholder="Se já resolvido, descreva aqui..."
                  value={occSol}
                  onChange={(e) => setOccSol(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewOccOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingOcc || !occDesc.trim()}
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold"
              >
                {isSubmittingOcc ? 'Salvando...' : 'Registrar Ocorrência'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RESOLVE OCCURRENCE MODAL */}
      {resolvingOcc && (
        <Dialog open={!!resolvingOcc} onOpenChange={(open) => !open && setResolvingOcc(null)}>
          <DialogContent className="sm:max-w-[480px] bg-[#161412] text-white border border-[#332D24] rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl flex items-center gap-2 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Registrar Solução da
                Ocorrência
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ocorrência: <strong>{resolvingOcc.description}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <Label htmlFor="sol-text">Descreva a solução adotada e validada:</Label>
              <Input
                id="sol-text"
                placeholder="Ex: Alocado na Mesa Reserva 01 com autorização de Hugo..."
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                className="h-11"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setResolvingOcc(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleResolveOccurrence}
                disabled={!solutionText.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Salvar Solução e Concluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* BROADCAST WHATSAPP MODAL */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#141E17] text-white border border-emerald-500/60 rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
              <Send className="w-6 h-6" />
            </div>
            <DialogTitle className="font-serif text-xl text-center text-emerald-950">
              Comunicado WhatsApp em Massa para as Equipes
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Simulação de disparo aos líderes dos 68 profissionais envolvidos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="bc-target">Destinatários:</Label>
              <Select value={broadcastTarget} onValueChange={setBroadcastTarget}>
                <SelectTrigger id="bc-target" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS_LIDERES">
                    Todos os Líderes de Equipe (68 prof.)
                  </SelectItem>
                  <SelectItem value="CERIMONIAL_PALCO">Apenas Palco e Cerimonial</SelectItem>
                  <SelectItem value="BUFFET_GARCONS">Apenas Buffet e Garçons</SelectItem>
                  <SelectItem value="RECEPCAO_SEGURANCA">Apenas Recepção e Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="bc-msg">Mensagem da Coordenação:</Label>
              <textarea
                id="bc-msg"
                rows={3}
                placeholder="Ex: Atenção líderes, início da cerimônia de premiação em 10 minutos. Todos nos seus postos..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-2.5 text-xs focus:ring-2 focus:ring-[#C5A45F]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendBroadcast}
              disabled={isSendingBroadcast || !broadcastMessage.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              {isSendingBroadcast ? 'Disparando...' : 'Disparar Comunicado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
