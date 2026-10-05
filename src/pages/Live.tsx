import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  eventService,
  timelineService,
  alertService,
  teamService,
  guestService,
  tableService,
} from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type {
  TimelineItemRecord,
  AlertRecord,
  AcknowledgementRecord,
  TeamRecord,
  GuestRecord,
  TableRecord,
} from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Radio,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  BellRing,
  Users,
  Grid,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Live() {
  const { eventId } = useParams<{ eventId: string }>()
  const [timelineItems, setTimelineItems] = useState<TimelineItemRecord[]>([])
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [acks, setAcks] = useState<AcknowledgementRecord[]>([])
  const [teams, setTeams] = useState<TeamRecord[]>([])
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [tables, setTables] = useState<TableRecord[]>([])
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // Delay Modal State
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
  const [delayInput, setDelayInput] = useState<number>(10)
  const [recalcNext, setRecalcNext] = useState<boolean>(true)

  // Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')
  const [targetTeamId, setTargetTeamId] = useState('')

  const { toast } = useToast()

  // Realtime clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadData = async () => {
    if (!eventId) return
    try {
      const [tList, alList, ackList, tmList, gList, tabList] = await Promise.all([
        timelineService.list(eventId),
        alertService.list(eventId),
        alertService.listAcks(),
        teamService.list(eventId),
        guestService.list(eventId),
        tableService.list(eventId),
      ])
      setTimelineItems(tList)
      setAlerts(alList)
      setAcks(ackList)
      setTeams(tmList)
      setGuests(gList)
      setTables(tabList)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  // Realtime updates on Live screen
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
  useRealtime<AcknowledgementRecord>('acknowledgements', () => {
    alertService
      .listAcks()
      .then(setAcks)
      .catch(() => {})
  })
  useRealtime<GuestRecord>('guests', () => {
    if (eventId)
      guestService
        .list(eventId)
        .then(setGuests)
        .catch(() => {})
  })

  // AGORA & PRÓXIMO computation
  const { currentItem, nextItem } = useMemo(() => {
    const inProgress = timelineItems.find((i) => i.status === 'EM_ANDAMENTO')
    const pending = timelineItems.filter((i) => i.status === 'A_PREPARAR' || i.status === 'PRONTO')
    const current = inProgress || pending[0] || null
    const next = pending.filter((i) => i.id !== current?.id)[0] || null
    return { currentItem: current, nextItem: next }
  }, [timelineItems])

  // Countdown computation
  const countdownText = useMemo(() => {
    if (!nextItem?.scheduled_time) return '--:--'
    const target = new Date(nextItem.scheduled_time).getTime()
    const diff = target - currentTime.getTime()
    if (diff <= 0) return '00:00 (Início iminente)'
    const mins = Math.floor(diff / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [nextItem, currentTime])

  // Complete current stage
  const handleCompleteCurrent = async () => {
    if (!currentItem) return
    try {
      await timelineService.update(currentItem.id, {
        status: 'CONCLUIDO',
        real_end_time: new Date().toISOString(),
      })
      // If there is a next item, automatically start it
      if (nextItem) {
        await timelineService.update(nextItem.id, {
          status: 'EM_ANDAMENTO',
          real_start_time: new Date().toISOString(),
        })
      }
      toast({
        title: 'Etapa concluída!',
        description: `"${currentItem.title}" finalizado com sucesso.`,
      })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao concluir etapa', variant: 'destructive' })
    }
  }

  // Apply Delay in Live mode
  const handleApplyLiveDelay = async () => {
    if (!currentItem || !eventId) return
    try {
      const newDelay = (currentItem.delay_minutes || 0) + delayInput
      await timelineService.update(currentItem.id, {
        status: 'ATRASADO',
        delay_minutes: newDelay,
      })

      if (recalcNext) {
        const itemIndex = timelineItems.findIndex((i) => i.id === currentItem.id)
        if (itemIndex >= 0) {
          const subsequent = timelineItems.slice(itemIndex + 1)
          for (const sub of subsequent) {
            if (sub.scheduled_time) {
              const prev = new Date(sub.scheduled_time)
              const shifted = new Date(prev.getTime() + delayInput * 60000)
              await timelineService.update(sub.id, {
                scheduled_time: shifted.toISOString(),
                delay_minutes: (sub.delay_minutes || 0) + delayInput,
              })
            }
          }
        }
      }

      toast({
        title: `+${delayInput}m de atraso registrado`,
        description: recalcNext ? 'Próximas etapas recalculadas!' : '',
      })
      setIsDelayModalOpen(false)
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao registrar atraso', variant: 'destructive' })
    }
  }

  // Send Alert from Live
  const handleSendLiveAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !alertMsg.trim()) return
    try {
      await alertService.create({
        event_id: eventId,
        target_type: targetTeamId ? 'EQUIPE' : 'TODOS',
        target_team_id: targetTeamId || undefined,
        message: alertMsg,
        is_resolved: false,
      })
      toast({
        title: 'Alerta disparado!',
        description: 'Enviado com sucesso para a equipe.',
      })
      setIsAlertModalOpen(false)
      setAlertMsg('')
      setTargetTeamId('')
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao enviar alerta', variant: 'destructive' })
    }
  }

  // Mark an acknowledgement for an alert (operational confirmation)
  const handleConfirmAlertAck = async (alertId: string, status: 'RECEBIDO' | 'PRONTO') => {
    try {
      await alertService.acknowledge(alertId, status)
      toast({ title: `Status da equipe atualizado: ${status} ✓` })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao confirmar', variant: 'destructive' })
    }
  }

  // Operational readiness calculations
  // Map of team readiness based on acknowledgements of latest alerts
  const teamReadiness = useMemo(() => {
    return teams.map((team) => {
      // Find latest alert targeted to this team or to all
      const teamAlerts = alerts.filter(
        (a) => a.target_team_id === team.id || a.target_type === 'TODOS',
      )
      if (teamAlerts.length === 0) {
        return { team, status: 'PRONTO' as const }
      }
      const latest = teamAlerts[0]
      const ack = acks.find((ac) => ac.alert_id === latest.id)
      if (!ack) return { team, status: 'AGUARDANDO' as const }
      return { team, status: ack.status }
    })
  }, [teams, alerts, acks])

  // Guest counters
  const totalGuests = guests.length
  const presentCount = guests.filter((g) => g.status === 'PRESENTE').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-5 pb-28">
      {/* Live Header with Pulsing Beacon */}
      <div className="bg-[#1C1A17] text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-[#332E27] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center font-bold">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-bold text-red-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                COMANDO AO VIVO
              </span>
              <span className="text-neutral-500 text-xs">•</span>
              <span className="text-neutral-400 text-xs font-mono">
                {currentTime.toLocaleTimeString('pt-BR')}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-serif font-bold text-white">
              Central Operacional do Hugo
            </h1>
          </div>
        </div>

        {/* Guest counter pill */}
        <div className="bg-[#24211D] px-3.5 py-1.5 rounded-xl border border-[#3A342D] text-right">
          <div className="text-[10px] uppercase font-bold text-[#C5A45F]">Presentes / Total</div>
          <div className="text-base sm:text-lg font-bold text-white">
            <span className="text-emerald-400">{presentCount}</span> / {totalGuests}
          </div>
        </div>
      </div>

      {/* Main Focus: AGORA vs PRÓXIMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AGORA Section */}
        <Card className="bg-[#1C1A17] text-white border-2 border-[#C5A45F] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A45F]/10 rounded-full blur-2xl pointer-events-none" />

          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                AGORA NO PALCO
              </span>
              <span className="text-xs font-serif font-bold text-[#C5A45F]">
                {currentItem?.scheduled_time
                  ? new Date(currentItem.scheduled_time).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '19:00'}
              </span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
              {currentItem?.title || 'Recepção dos Convidados'}
            </CardTitle>
            <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
              {currentItem?.description || 'Acolhimento institucional e direcionamento às mesas.'}
            </p>
          </CardHeader>

          <CardContent className="p-5 pt-3 space-y-3">
            {currentItem?.responsibles && (
              <div className="text-xs text-neutral-300 bg-[#26231F] p-2.5 rounded-lg border border-[#3A342D]">
                <strong className="text-[#C5A45F]">Responsáveis:</strong> {currentItem.responsibles}
              </div>
            )}

            {/* Quick in-card stage control */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={handleCompleteCurrent}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-xs sm:text-sm gap-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" /> Concluir Etapa
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDelayModalOpen(true)}
                className="bg-[#24211D] border-red-500/40 text-red-400 hover:bg-red-950/30 hover:text-red-300 font-semibold h-12 text-xs sm:text-sm gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" /> Atrasar Minutos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PRÓXIMO Section with Countdown */}
        <Card className="bg-white border-2 border-neutral-200 shadow-md">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                PRÓXIMO MOMENTO
              </span>
              <span className="text-xs font-semibold text-[#6B6356]">
                {nextItem?.scheduled_time
                  ? new Date(nextItem.scheduled_time).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--'}
              </span>
            </div>
            <CardTitle className="text-lg sm:text-xl font-serif font-bold text-[#1C1A17] mt-1">
              {nextItem?.title || 'Sem próxima etapa'}
            </CardTitle>
            <p className="text-xs text-[#6B6356] mt-1 line-clamp-2">
              {nextItem?.description || 'Aguardando próxima definição da programação.'}
            </p>
          </CardHeader>

          <CardContent className="p-5 pt-3 space-y-3">
            {/* Countdown Clock Display */}
            <div className="bg-[#F8F7F4] border border-neutral-200 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#6B6356]">
                Contagem Regressiva para Início
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[#1C1A17] mt-0.5">
                {countdownText}
              </div>
            </div>

            <Button
              onClick={() => {
                setAlertMsg(
                  `ATENÇÃO: Momento "${nextItem?.title || ''}" se aproxima. Equipes prontas!`,
                )
                setIsAlertModalOpen(true)
              }}
              className="w-full bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold h-11 text-xs gap-1.5"
            >
              <BellRing className="w-4 h-4" /> Avisar Equipes deste Momento
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Operational Confirmation: Painel do Hugo (Readiness Widget) */}
      <Card className="bg-white border-neutral-200 shadow-sm">
        <CardHeader className="p-4 pb-2 border-b border-neutral-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-serif font-bold text-[#1C1A17] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Confirmação Operacional das Equipes
            </CardTitle>
            <p className="text-xs text-[#6B6356] mt-0.5">
              Hugo: Comunicação vira confirmação. Veja quem já está pronto para o momento.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsAlertModalOpen(true)}
            className="bg-[#1C1A17] text-[#C5A45F] hover:bg-[#282521] text-xs h-8 gap-1"
          >
            <BellRing className="w-3.5 h-3.5" /> Novo Alerta
          </Button>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {teamReadiness.slice(0, 8).map(({ team, status }) => {
              const isReady = status === 'PRONTO'
              const isReceived = status === 'RECEBIDO'
              const isWaiting = status === 'AGUARDANDO'

              return (
                <div
                  key={team.id}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                    isReady
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                      : isReceived
                        ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                        : 'bg-amber-50/70 border-amber-300 text-amber-900'
                  }`}
                >
                  <span className="font-serif font-bold text-xs truncate">{team.name}</span>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 text-[10px] font-bold">
                    <span>{isReady ? 'PRONTO ✓' : isReceived ? 'RECEBIDO' : 'AGUARDANDO ⚠'}</span>
                    {/* Toggle button to simulate or confirm readiness */}
                    <button
                      onClick={() => {
                        const targetAlert = alerts.find(
                          (a) => a.target_team_id === team.id || a.target_type === 'TODOS',
                        )
                        if (targetAlert) {
                          handleConfirmAlertAck(targetAlert.id, isReady ? 'RECEBIDO' : 'PRONTO')
                        } else {
                          toast({ title: `Equipe ${team.name} confirmada!` })
                        }
                      }}
                      className="opacity-70 hover:opacity-100 underline"
                      title="Alternar confirmação"
                    >
                      {isReady ? 'Revisar' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts Feed */}
      <Card className="bg-white border-neutral-200 shadow-sm">
        <CardHeader className="p-4 pb-2 border-b border-neutral-100">
          <CardTitle className="text-sm font-serif font-bold text-[#1C1A17] flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#C5A45F]" />
            Feed de Alertas e Instruções em Tempo Real
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          {alerts.length === 0 ? (
            <p className="text-xs text-neutral-400">Nenhum alerta recente emitido.</p>
          ) : (
            alerts.slice(0, 4).map((al) => (
              <div
                key={al.id}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#C5A45F] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-[#1C1A17]">{al.message}</span>
                    <div className="text-[10px] text-[#6B6356] mt-0.5">
                      Destino:{' '}
                      <strong>{al.expand?.target_team_id?.name || 'TODAS AS EQUIPES'}</strong> •{' '}
                      {new Date(al.created).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConfirmAlertAck(al.id, 'RECEBIDO')}
                    className="text-[11px] h-7 px-2 border-blue-300 text-blue-800 hover:bg-blue-50"
                  >
                    Recebido
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleConfirmAlertAck(al.id, 'PRONTO')}
                    className="text-[11px] h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Pronto ✓
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Large Thumb-Reach Bottom Action Buttons (Sticky above bottom nav) */}
      <div className="fixed bottom-14 lg:bottom-4 left-0 right-0 z-30 px-4 max-w-4xl mx-auto pointer-events-none">
        <div className="bg-[#1C1A17]/95 backdrop-blur border border-[#3D3833] p-2.5 rounded-2xl shadow-2xl flex items-center justify-between gap-2 pointer-events-auto">
          <Button
            onClick={handleCompleteCurrent}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-xs sm:text-sm gap-1.5 shadow"
          >
            <CheckCircle2 className="w-4 h-4" /> Concluir Etapa
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsDelayModalOpen(true)}
            className="bg-[#26231F] border-red-500/50 text-red-300 hover:bg-red-950/40 font-bold h-12 text-xs sm:text-sm gap-1.5"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" /> Atrasar
          </Button>

          <Button
            onClick={() => setIsAlertModalOpen(true)}
            className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold h-12 text-xs sm:text-sm gap-1.5 shadow"
          >
            <BellRing className="w-4 h-4" /> Avisar Equipes
          </Button>

          <Link to={`/app/${eventId}/checkin`} className="hidden sm:inline-block">
            <Button
              variant="outline"
              className="bg-[#26231F] border-neutral-700 text-neutral-200 hover:bg-neutral-800 h-12 text-xs"
            >
              <Users className="w-4 h-4" />
            </Button>
          </Link>
          <Link to={`/app/${eventId}/tables`} className="hidden sm:inline-block">
            <Button
              variant="outline"
              className="bg-[#26231F] border-neutral-700 text-neutral-200 hover:bg-neutral-800 h-12 text-xs"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Delay Modal */}
      <Dialog open={isDelayModalOpen} onOpenChange={setIsDelayModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" /> Registrar Atraso Operacional
            </DialogTitle>
            <DialogDescription>
              Ajuste o cronômetro do Hugo e recalcule os próximos momentos da cerimônia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-sm">
            <div className="space-y-2">
              <Label htmlFor="live-delay">Minutos de atraso:</Label>
              <Input
                id="live-delay"
                type="number"
                min={1}
                value={delayInput}
                onChange={(e) => setDelayInput(parseInt(e.target.value) || 0)}
                className="h-12 font-bold text-xl"
              />
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant="outline"
                    onClick={() => setDelayInput(m)}
                    className="flex-1 text-xs h-9"
                  >
                    +{m} min
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-neutral-100">
              <input
                type="checkbox"
                id="live-recalc"
                checked={recalcNext}
                onChange={(e) => setRecalcNext(e.target.checked)}
                className="mt-1 rounded text-[#C5A45F]"
              />
              <label htmlFor="live-recalc" className="text-xs text-neutral-800 cursor-pointer">
                <strong>Recalcular automaticamente</strong> os horários dos momentos seguintes (+
                {delayInput}m).
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDelayModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApplyLiveDelay}
              className="bg-red-700 hover:bg-red-800 text-white font-semibold"
            >
              Aplicar no Ao Vivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Alert Modal */}
      <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
        <DialogContent className="sm:max-w-[460px] bg-white">
          <form onSubmit={handleSendLiveAlert}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#C5A45F]" /> Enviar Ordem / Alerta
              </DialogTitle>
              <DialogDescription>
                Transmita uma orientação imediata para as equipes selecionadas.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-sm">
              <div className="space-y-2">
                <Label htmlFor="live-alert-team">Equipe Alvo:</Label>
                <Select value={targetTeamId} onValueChange={setTargetTeamId}>
                  <SelectTrigger id="live-alert-team">
                    <SelectValue placeholder="Todas as Equipes (Geral)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as Equipes (Geral)</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="live-alert-msg">Mensagem da Ordem:</Label>
                <Input
                  id="live-alert-msg"
                  required
                  placeholder="Ex: Homenagem em 10 minutos. Som e foto preparados!"
                  value={alertMsg}
                  onChange={(e) => setAlertMsg(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAlertModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold"
              >
                Disparar Alerta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
