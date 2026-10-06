import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { timelineService, teamService, alertService } from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type { TimelineItemRecord, TeamRecord } from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
  BellRing,
  Edit3,
  Trash2,
  Users,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type ItemStatus = TimelineItemRecord['status']

export default function Timeline() {
  const { eventId } = useParams<{ eventId: string }>()
  const [items, setItems] = useState<TimelineItemRecord[]>([])
  const [teams, setTeams] = useState<TeamRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Edit / Create Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TimelineItemRecord | null>(null)
  const [title, setTitle] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [description, setDescription] = useState('')
  const [responsibles, setResponsibles] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [observations, setObservations] = useState('')
  const [status, setStatus] = useState<ItemStatus>('A_PREPARAR')
  const [delayMinutes, setDelayMinutes] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delay Modal
  const [delayItem, setDelayItem] = useState<TimelineItemRecord | null>(null)
  const [delayInput, setDelayInput] = useState<number>(10)
  const [recalcNext, setRecalcNext] = useState<boolean>(true)

  // Alert Broadcast Modal
  const [alertTargetItem, setAlertTargetItem] = useState<TimelineItemRecord | null>(null)
  const [customAlertMsg, setCustomAlertMsg] = useState('')
  const [isSendingAlert, setIsSendingAlert] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [tList, tmList] = await Promise.all([
        timelineService.list(eventId),
        teamService.list(eventId),
      ])
      setItems(tList)
      setTeams(tmList)
    } catch (_) {
      toast({
        title: 'Erro ao carregar roteiro',
        description: 'Tente recarregar a página.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  useRealtime<TimelineItemRecord>('timeline_items', () => {
    if (eventId)
      timelineService
        .list(eventId)
        .then(setItems)
        .catch(() => {})
  })

  const openCreateDialog = () => {
    setEditingItem(null)
    setTitle('')
    setScheduledTime('2026-11-07T20:00')
    setDescription('')
    setResponsibles('')
    setSelectedTeams([])
    setObservations('')
    setStatus('A_PREPARAR')
    setDelayMinutes(0)
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: TimelineItemRecord) => {
    setEditingItem(item)
    setTitle(item.title)
    setScheduledTime(
      item.scheduled_time ? new Date(item.scheduled_time).toISOString().slice(0, 16) : '',
    )
    setDescription(item.description || '')
    setResponsibles(item.responsibles || '')
    setSelectedTeams(item.teams || [])
    setObservations(item.observations || '')
    setStatus(item.status || 'A_PREPARAR')
    setDelayMinutes(item.delay_minutes || 0)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !title.trim()) return
    setIsSubmitting(true)
    try {
      const payload: Partial<TimelineItemRecord> = {
        title,
        scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : undefined,
        description,
        responsibles,
        teams: selectedTeams,
        observations,
        status,
        delay_minutes: delayMinutes,
      }

      if (editingItem) {
        await timelineService.update(editingItem.id, payload)
        toast({ title: 'Momento atualizado com sucesso!' })
      } else {
        await timelineService.create({
          ...payload,
          event_id: eventId,
        })
        toast({ title: 'Momento adicionado ao protocolo!' })
      }
      setIsDialogOpen(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar momento.'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStart = async (item: TimelineItemRecord) => {
    try {
      await timelineService.update(item.id, {
        status: 'EM_ANDAMENTO',
        real_start_time: new Date().toISOString(),
      })
      toast({
        title: 'Momento iniciado!',
        description: `"${item.title}" está agora em andamento.`,
      })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao iniciar momento', variant: 'destructive' })
    }
  }

  const handleComplete = async (item: TimelineItemRecord) => {
    try {
      await timelineService.update(item.id, {
        status: 'CONCLUIDO',
        real_end_time: new Date().toISOString(),
      })
      toast({
        title: 'Momento concluído!',
        description: `"${item.title}" marcado como concluído.`,
      })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao concluir momento', variant: 'destructive' })
    }
  }

  // Handle Delay with optional recalculation
  const handleApplyDelay = async () => {
    if (!delayItem || !eventId) return
    try {
      const newDelay = (delayItem.delay_minutes || 0) + delayInput

      await timelineService.update(delayItem.id, {
        status: 'ATRASADO',
        delay_minutes: newDelay,
      })

      if (recalcNext) {
        const itemIndex = items.findIndex((i) => i.id === delayItem.id)
        if (itemIndex >= 0) {
          const subsequent = items.slice(itemIndex + 1)
          for (const sub of subsequent) {
            if (sub.scheduled_time) {
              const prevDate = new Date(sub.scheduled_time)
              const shiftedDate = new Date(prevDate.getTime() + delayInput * 60000)
              await timelineService.update(sub.id, {
                scheduled_time: shiftedDate.toISOString(),
                delay_minutes: (sub.delay_minutes || 0) + delayInput,
              })
            }
          }
        }
      }

      toast({
        title: `Atraso de ${delayInput} min registrado`,
        description: recalcNext
          ? 'Horários dos próximos momentos recalculados automaticamente.'
          : 'Apenas este momento foi atualizado.',
      })
      setDelayItem(null)
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao registrar atraso', variant: 'destructive' })
    }
  }

  // Handle Broadcast Alert to involved teams
  const handleSendAlert = async () => {
    if (!alertTargetItem || !eventId) return
    setIsSendingAlert(true)
    try {
      const involvedTeamIds = alertTargetItem.teams || []
      const message =
        customAlertMsg ||
        `ATENÇÃO: Momento "${alertTargetItem.title}" iniciando em breve. Equipes posicionar!`

      if (involvedTeamIds.length === 0) {
        // Send to all
        await alertService.create({
          event_id: eventId,
          target_type: 'TODOS',
          message,
          is_resolved: false,
        })
      } else {
        // Targeted per-team
        for (const tId of involvedTeamIds) {
          await alertService.create({
            event_id: eventId,
            target_type: 'EQUIPE',
            target_team_id: tId,
            message,
            is_resolved: false,
          })
        }
      }

      toast({
        title: 'Alerta disparado às equipes!',
        description: 'Notificação enviada para as equipes responsáveis.',
      })
      setAlertTargetItem(null)
      setCustomAlertMsg('')
    } catch (_) {
      toast({ title: 'Erro ao disparar alerta', variant: 'destructive' })
    } finally {
      setIsSendingAlert(false)
    }
  }

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!confirm(`Remover "${itemTitle}" do protocolo?`)) return
    try {
      await timelineService.delete(id)
      toast({ title: 'Momento removido.' })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const getStatusBadge = (st: ItemStatus, delay: number) => {
    switch (st) {
      case 'EM_ANDAMENTO':
        return (
          <Badge className="bg-emerald-600 text-white font-bold animate-pulse text-[10px]">
            EM ANDAMENTO
          </Badge>
        )
      case 'CONCLUIDO':
        return <Badge className="bg-neutral-200 text-neutral-800 text-[10px]">CONCLUÍDO ✓</Badge>
      case 'ATRASADO':
        return (
          <Badge className="bg-red-600 text-white font-bold text-[10px]">
            ATRASADO (+{delay}m)
          </Badge>
        )
      case 'PRONTO':
        return <Badge className="bg-blue-100 text-blue-800 text-[10px]">PRONTO</Badge>
      default:
        return <Badge className="bg-neutral-100 text-neutral-700 text-[10px]">A PREPARAR</Badge>
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Clock className="w-4 h-4" /> Roteiro Operacional
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-white">
            Protocolo & Linha do Tempo
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Ordem cronológica precisa, controle de atrasos em minutos e disparo de alertas
            segmentados por equipe.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-bold gap-2 shadow-elevation shrink-0 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Novo Momento
        </Button>
      </div>

      {/* Timeline List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A45F] border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-16 bg-[#161412] border-dashed border-[#2B2620] rounded-2xl">
          <CardContent>
            <Clock className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-white">Nenhum momento cadastrado no roteiro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-[#C5A45F]/40 space-y-6">
          {items.map((item, index) => {
            const formattedTime = item.scheduled_time
              ? new Date(item.scheduled_time).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '--:--'

            const isCurrent = item.status === 'EM_ANDAMENTO'

            // Find associated team names
            const associatedTeams = teams.filter((t) => item.teams?.includes(t.id))

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node circle */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-4 w-5 h-5 rounded-full border-4 transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 border-[#121E15] ring-4 ring-emerald-500/30'
                      : item.status === 'CONCLUIDO'
                        ? 'bg-neutral-600 border-[#141210]'
                        : 'bg-[#C5A45F] border-[#141210]'
                  }`}
                />

                <Card
                  className={`transition-all shadow-elevation rounded-2xl ${
                    isCurrent
                      ? 'border border-emerald-500 bg-[#121F16]'
                      : 'border border-[#2B2620] bg-[#161412] hover:border-[#C5A45F]'
                  }`}
                >
                  <CardContent className="p-5 sm:p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-serif font-bold text-xl sm:text-2xl text-[#C5A45F]">
                            {formattedTime}
                          </span>
                          {getStatusBadge(item.status, item.delay_minutes)}
                          {item.delay_minutes > 0 && item.status !== 'ATRASADO' && (
                            <span className="text-xs text-red-400 font-semibold">
                              (+{item.delay_minutes}m atraso)
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif font-bold text-lg sm:text-xl text-white mt-1">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-xs sm:text-sm text-neutral-400 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Fast Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-start">
                        {item.status !== 'EM_ANDAMENTO' && item.status !== 'CONCLUIDO' && (
                          <Button
                            size="sm"
                            onClick={() => handleStart(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 rounded-xl"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> Iniciar
                          </Button>
                        )}

                        {item.status === 'EM_ANDAMENTO' && (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(item)}
                            className="bg-[#24201B] hover:bg-[#322C25] text-[#C5A45F] border border-[#3D3528] font-semibold text-xs h-8 gap-1.5 rounded-xl"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDelayItem(item)
                            setDelayInput(10)
                          }}
                          className="text-xs h-8 border-red-800/80 text-red-300 bg-[#261515] hover:bg-[#331C1C] gap-1 rounded-xl"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Atrasar
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAlertTargetItem(item)
                            setCustomAlertMsg(
                              `ATENÇÃO: Momento "${item.title}" em preparação. Equipes atenção!`,
                            )
                          }}
                          className="text-xs h-8 border-[#3D3528] text-[#C5A45F] bg-[#1C1813] hover:bg-[#25201A] gap-1 rounded-xl"
                        >
                          <BellRing className="w-3.5 h-3.5" /> Avisar Equipes
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          className="h-8 w-8 text-neutral-400 hover:text-white"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id, item.title)}
                          className="h-8 w-8 text-neutral-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Metadata & Team chips */}
                    <div className="pt-2 border-t border-[#25201A] flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-neutral-400 font-medium mr-1">Equipes:</span>
                        {associatedTeams.length > 0 ? (
                          associatedTeams.map((team) => (
                            <Badge
                              key={team.id}
                              variant="outline"
                              className="bg-[#1C1915] text-neutral-200 border-[#2B2620] text-[10px]"
                            >
                              {team.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-neutral-500 italic">Geral / Cerimonial</span>
                        )}
                      </div>

                      {item.responsibles && (
                        <div className="text-neutral-400">
                          <span className="font-semibold text-neutral-500">Responsável:</span>{' '}
                          <span className="text-neutral-200">{item.responsibles}</span>
                        </div>
                      )}
                    </div>

                    {item.observations && (
                      <div className="text-[11px] text-neutral-300 bg-[#1C1813] p-2.5 rounded-xl border border-[#2B2620]">
                        <strong className="text-white">Obs:</strong> {item.observations}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Delay Modal with Recalculation Option */}
      {delayItem && (
        <Dialog open={!!delayItem} onOpenChange={(open) => !open && setDelayItem(null)}>
          <DialogContent className="sm:max-w-[440px] bg-[#1A1111] text-white border border-red-700/80 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> Registrar Atraso
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs">
                Informe quantos minutos este momento atrasou. Você pode recalcular a programação dos
                próximos momentos automaticamente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-sm">
              <div className="space-y-2">
                <Label htmlFor="delay-mins" className="text-neutral-300">
                  Minutos de atraso:
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="delay-mins"
                    type="number"
                    min={1}
                    max={120}
                    value={delayInput}
                    onChange={(e) => setDelayInput(parseInt(e.target.value) || 0)}
                    className="h-11 font-bold text-lg bg-[#241717] border-red-800 text-white"
                  />
                  <div className="flex gap-1">
                    {[5, 10, 15, 20].map((m) => (
                      <Button
                        key={m}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDelayInput(m)}
                        className="text-xs h-11 border-red-800 text-red-300 bg-[#241717] hover:bg-[#321F1F]"
                      >
                        +{m}m
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-red-900/60">
                <input
                  type="checkbox"
                  id="recalc-next"
                  checked={recalcNext}
                  onChange={(e) => setRecalcNext(e.target.checked)}
                  className="mt-1 rounded text-[#C5A45F] focus:ring-[#C5A45F] bg-[#12100E] border-red-800"
                />
                <label htmlFor="recalc-next" className="text-xs text-neutral-300 cursor-pointer">
                  <strong className="text-white">Recalcular automaticamente</strong> os horários dos
                  momentos seguintes (+
                  {delayInput} minutos na timeline).
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDelayItem(null)}
                className="border-[#382626] text-neutral-300 hover:bg-[#2B1B1B]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApplyDelay}
                className="bg-red-700 hover:bg-red-800 text-white font-semibold rounded-xl"
              >
                Aplicar Atraso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Broadcast Alert Modal */}
      {alertTargetItem && (
        <Dialog open={!!alertTargetItem} onOpenChange={(open) => !open && setAlertTargetItem(null)}>
          <DialogContent className="sm:max-w-[480px] bg-[#161412] text-white border border-[#332D24] rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl flex items-center gap-2 text-white">
                <BellRing className="w-5 h-5 text-[#C5A45F]" /> Enviar Alerta Operacional
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs">
                Dispare uma ordem/alerta segmentada diretamente para as equipes envolvidas neste
                momento.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm">
              <div>
                <span className="text-xs uppercase font-semibold text-neutral-400 block">
                  Momento do Protocolo:
                </span>
                <span className="font-serif font-bold text-base text-white">
                  {alertTargetItem.title}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-alert-msg" className="text-neutral-300">
                  Mensagem para as Equipes:
                </Label>
                <Textarea
                  id="custom-alert-msg"
                  rows={3}
                  value={customAlertMsg}
                  onChange={(e) => setCustomAlertMsg(e.target.value)}
                  placeholder="Ex: Homenagem em 10 minutos. Som e foto atentos ao palco!"
                  className="bg-[#1C1915] border-[#332D24] text-white"
                />
              </div>

              <div className="bg-[#1C1915] p-3 rounded-xl border border-[#2B2620] text-xs text-neutral-400">
                <strong className="text-white">Destinatários:</strong>{' '}
                {alertTargetItem.teams?.length
                  ? teams
                      .filter((t) => alertTargetItem.teams.includes(t.id))
                      .map((t) => t.name)
                      .join(', ')
                  : 'Todas as equipes (Alerta Geral)'}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAlertTargetItem(null)}
                className="border-[#332D24] text-neutral-300 hover:bg-[#201D18]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendAlert}
                disabled={isSendingAlert}
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-bold gap-1.5 rounded-xl"
              >
                {isSendingAlert ? 'Disparando...' : 'Disparar Alerta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#161412] text-white border border-[#332D24] rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {editingItem ? 'Editar Momento' : 'Novo Momento do Protocolo'}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes, responsáveis e horário previsto no roteiro.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <Label htmlFor="i-title">Título do Momento *</Label>
                <Input
                  id="i-title"
                  required
                  placeholder="Ex: Homenagens — Bloco 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="i-time">Horário Previsto</Label>
                  <Input
                    id="i-time"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="i-status">Status</Label>
                  <Select value={status} onValueChange={(val: ItemStatus) => setStatus(val)}>
                    <SelectTrigger id="i-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A_PREPARAR">A Preparar</SelectItem>
                      <SelectItem value="PRONTO">Pronto</SelectItem>
                      <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                      <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                      <SelectItem value="ATRASADO">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="i-resp">Responsáveis Principais</Label>
                <Input
                  id="i-resp"
                  placeholder="Ex: Hugo Cerimonial e DJ Gabriel"
                  value={responsibles}
                  onChange={(e) => setResponsibles(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Equipes Envolvidas (Segmentação de Alertas)</Label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  {teams.map((t) => {
                    const isChecked = selectedTeams.includes(t.id)
                    return (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-xs text-[#221E1A] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTeams([...selectedTeams, t.id])
                            } else {
                              setSelectedTeams(selectedTeams.filter((id) => id !== t.id))
                            }
                          }}
                          className="rounded text-[#C5A45F]"
                        />
                        <span>{t.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="i-desc">Descrição / Roteiro da Ação</Label>
                <Textarea
                  id="i-desc"
                  rows={2}
                  placeholder="Breve instrução do que acontece neste momento..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="i-obs">Observações Internas (Luz, Som, Púlpito)</Label>
                <Textarea
                  id="i-obs"
                  rows={2}
                  placeholder="Instruções técnicas reservadas..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Momento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
