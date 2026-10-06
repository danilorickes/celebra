import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  tableService,
  dietaryService,
  buffetReleaseService,
  whatsappService,
  guestService,
} from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type {
  TableRecord,
  DietaryTaskRecord,
  BuffetReleaseRecord,
  GuestRecord,
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
  Utensils,
  Tv,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  AlertTriangle,
  Flame,
  ChefHat,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Buffet() {
  const { eventId } = useParams<{ eventId: string }>()
  const [tables, setTables] = useState<TableRecord[]>([])
  const [dietaryTasks, setDietaryTasks] = useState<DietaryTaskRecord[]>([])
  const [releases, setReleases] = useState<BuffetReleaseRecord[]>([])
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Wave Selection (2-3 tables)
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [displayOnScreen, setDisplayOnScreen] = useState(true)
  const [operatorName, setOperatorName] = useState('Hugo Cerimonial')
  const [isReleasing, setIsReleasing] = useState(false)

  // Full Screen / Telão Display Mode Modal (Requirement G.7)
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false)

  // Dietary Task update modal
  const [editingTask, setEditingTask] = useState<DietaryTaskRecord | null>(null)
  const [deliveryResponsible, setDeliveryResponsible] = useState('Garçom Salão')
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [tList, dList, rList, gList] = await Promise.all([
        tableService.list(eventId),
        dietaryService.list(eventId),
        buffetReleaseService.list(eventId),
        guestService.list(eventId),
      ])
      setTables(tList)
      setDietaryTasks(dList)
      setReleases(rList)
      setGuests(gList)
    } catch (_) {
      toast({ title: 'Erro ao carregar dados do Buffet', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  useRealtime<TableRecord>('tables', () => {
    if (eventId)
      tableService
        .list(eventId)
        .then(setTables)
        .catch(() => {})
  })
  useRealtime<DietaryTaskRecord>('dietary_tasks', () => {
    if (eventId)
      dietaryService
        .list(eventId)
        .then(setDietaryTasks)
        .catch(() => {})
  })
  useRealtime<BuffetReleaseRecord>('buffet_releases', () => {
    if (eventId)
      buffetReleaseService
        .list(eventId)
        .then(setReleases)
        .catch(() => {})
  })

  // Table status categorization
  const availableTables = useMemo(() => {
    return tables.filter(
      (t) => !t.is_reserve && (!t.buffet_status || t.buffet_status === 'AGUARDANDO'),
    )
  }, [tables])

  const activeReleases = useMemo(() => {
    return tables.filter(
      (t) => t.buffet_status && t.buffet_status !== 'AGUARDANDO' && t.buffet_status !== 'CONCLUIDA',
    )
  }, [tables])

  // Suggested next 2-3 tables (Requirement G.10: Sugestão das próximas mantendo fluxo organizado)
  const suggestedTables = useMemo(() => {
    return availableTables.slice(0, 3)
  }, [availableTables])

  // Toggle table for wave
  const toggleTableSelection = (id: string) => {
    setSelectedTableIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= 3) {
        toast({
          title: 'Limite recomendado de 3 mesas por onda atingido!',
          description: 'Liberar em ondas de 2-3 mesas evita filas e sobrecarga no réchaud.',
        })
        return prev
      }
      return [...prev, id]
    })
  }

  // Release Wave (Requirement G: 1 a 10)
  const handleReleaseWave = async () => {
    if (!eventId || selectedTableIds.length === 0) return
    setIsReleasing(true)
    try {
      const selectedNames = tables
        .filter((t) => selectedTableIds.includes(t.id))
        .map((t) => t.name)
        .join(', ')

      await buffetReleaseService.releaseWave({
        event_id: eventId,
        table_ids: selectedTableIds,
        table_names: selectedNames,
        operator: operatorName,
        display_on_screen: displayOnScreen,
      })

      toast({
        title: `Onda liberada com sucesso! (${selectedNames})`,
        description: 'Cor atualizada no mapa e WhatsApp simulado enviado aos convidados.',
      })

      setSelectedTableIds([])
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao liberar mesas para o buffet', variant: 'destructive' })
    } finally {
      setIsReleasing(false)
    }
  }

  // Advance Table Buffet Status
  const handleAdvanceTableStatus = async (
    tableId: string,
    nextStatus: TableRecord['buffet_status'],
  ) => {
    try {
      await tableService.update(tableId, { buffet_status: nextStatus })
      toast({ title: `Status atualizado para: ${nextStatus}` })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  // Update Dietary Task Status
  const handleSaveDietaryTask = async (taskId: string, newStatus: DietaryTaskRecord['status']) => {
    setIsUpdatingTask(true)
    try {
      const patch: Partial<DietaryTaskRecord> = { status: newStatus }
      if (newStatus === 'RECEBIDO') {
        patch.received_confirmed = true
        patch.received_at = new Date().toISOString()
      } else if (newStatus === 'PRONTO') {
        patch.prepared_confirmed = true
        patch.prepared_at = new Date().toISOString()
      } else if (newStatus === 'ENTREGUE') {
        patch.delivered_confirmed = true
        patch.delivered_at = new Date().toISOString()
        patch.delivery_responsible = deliveryResponsible
      }
      await dietaryService.update(taskId, patch)
      toast({ title: `Restrição alimentar marcada como: ${newStatus}` })
      setEditingTask(null)
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao atualizar tarefa dietética', variant: 'destructive' })
    } finally {
      setIsUpdatingTask(false)
    }
  }

  const latestRelease = releases[0]

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 sm:py-6 space-y-6 pb-24">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Utensils className="w-4 h-4" /> Gestão Gastronômica & Fluxo do Salão
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white tracking-tight">
            Liberação das Mesas & Restrições Alimentares
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Liberação em ondas de 2-3 mesas para evitar filas, integração com telão, WhatsApp
            simulado e controle estrito de pratos especiais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsScreenModalOpen(true)}
            className="bg-[#1C1915] hover:bg-[#28231D] text-[#C5A45F] border border-[#3D3425] font-bold text-xs h-10 gap-2 shadow-elevation rounded-xl"
          >
            <Tv className="w-4 h-4 text-[#C5A45F]" /> Modo Telão LED do Salão
          </Button>
        </div>
      </div>

      {/* SECTION 1: LIBERAÇÃO DE MESAS EM ONDAS (Requirement G) */}
      <Card className="border border-[#2B2620] bg-[#161412] text-white shadow-elevation rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#191613] border-b border-[#25201A] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#C5A45F]" />
                Painel de Liberação do Buffet em Ondas
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Selecione até 3 mesas por onda para manter o réchaud fluido e abastecido.
              </CardDescription>
            </div>
            {latestRelease && (
              <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold self-start sm:self-auto">
                Última Onda #{latestRelease.wave_number}: {latestRelease.table_names}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-5">
          {/* Wave Launcher Bar */}
          <div className="bg-[#1C1A17] text-white p-4 sm:p-5 rounded-2xl border border-[#332E27] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A45F] block">
                  ONDA ATUAL EM PREPARAÇÃO
                </span>
                <h3 className="text-xl font-serif font-bold text-white mt-0.5">
                  {selectedTableIds.length > 0
                    ? `${selectedTableIds.length} mesa(s) selecionada(s)`
                    : 'Nenhuma mesa selecionada'}
                </h3>
                <div className="text-xs text-neutral-300 mt-0.5">
                  {selectedTableIds.length > 0 ? (
                    <span>
                      Mesas:{' '}
                      <strong className="text-[#C5A45F]">
                        {tables
                          .filter((t) => selectedTableIds.includes(t.id))
                          .map((t) => t.name)
                          .join(', ')}
                      </strong>
                    </span>
                  ) : (
                    <span>Dica: clique nas sugestões abaixo ou no mapa de mesas.</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer bg-white/10 px-3 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={displayOnScreen}
                    onChange={(e) => setDisplayOnScreen(e.target.checked)}
                    className="w-4 h-4 text-[#C5A45F] rounded"
                  />
                  <span>Projetar no Telão LED</span>
                </label>

                <Button
                  onClick={handleReleaseWave}
                  disabled={selectedTableIds.length === 0 || isReleasing}
                  className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold text-sm h-11 px-6 rounded-xl shadow-lg gap-2"
                >
                  <Send className="w-4 h-4" /> [CONFIRMAR LIBERAÇÃO DA ONDA]
                </Button>
              </div>
            </div>

            {/* Quick Suggestion Chips (Requirement G.10) */}
            {suggestedTables.length > 0 && (
              <div className="pt-3 border-t border-[#332E27] flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-neutral-400 font-semibold">
                  Sugestão inteligente para a próxima onda:
                </span>
                {suggestedTables.map((st) => (
                  <Button
                    key={st.id}
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTableSelection(st.id)}
                    className={`text-xs h-7 rounded-lg border-neutral-700 ${
                      selectedTableIds.includes(st.id)
                        ? 'bg-[#C5A45F] text-[#1C1A17] font-bold border-[#C5A45F]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    + {st.name} ({st.capacity} lug)
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Grid of Tables by State */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold uppercase tracking-wider">
                Status das Mesas no Buffet (Clique para alternar seleção)
              </span>
              <span>{availableTables.length} mesas aguardando liberação</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {tables
                .filter((t) => !t.is_reserve)
                .map((table) => {
                  const isSelected = selectedTableIds.includes(table.id)
                  const isCalled =
                    table.buffet_status === 'CHAMADA' ||
                    table.buffet_status === 'DIRIGINDO_AO_BUFFET'
                  const isDone = table.buffet_status === 'CONCLUIDA'
                  const isAttended = table.buffet_status === 'ATENDIDA'

                  return (
                    <div
                      key={table.id}
                      onClick={() => !isCalled && !isDone && toggleTableSelection(table.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-[#C5A45F] bg-[#C5A45F]/15 shadow-md ring-2 ring-[#C5A45F]'
                          : isCalled
                            ? 'border-indigo-500 bg-indigo-950/40'
                            : isDone
                              ? 'border-[#26221C] bg-[#141210] opacity-50 cursor-not-allowed'
                              : 'border-[#2B2620] bg-[#181512] hover:border-[#C5A45F]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-serif font-bold text-sm text-white">
                          {table.name}
                        </span>
                        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-[#C5A45F]" />}
                      </div>

                      <div className="text-[11px] text-neutral-400">{table.capacity} lugares</div>

                      <Badge
                        className={`mt-2 text-[9px] w-full justify-center ${
                          isCalled
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : isAttended
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isDone
                                ? 'bg-neutral-800 text-neutral-300'
                                : 'bg-[#24201B] text-neutral-300 border border-[#383125]'
                        }`}
                      >
                        {table.buffet_status || 'AGUARDANDO'}
                      </Badge>

                      {/* State stepper quick control if called */}
                      {isCalled && (
                        <div className="mt-2 pt-1 border-t border-indigo-500/30 flex justify-between gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAdvanceTableStatus(table.id, 'CONCLUIDA')
                            }}
                            className="text-[9px] text-indigo-300 font-bold hover:underline"
                          >
                            ✓ Concluir
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: PAINEL DE RESTRIÇÕES ALIMENTARES (Requirement F) */}
      <Card className="border border-amber-600/40 bg-[#161412] text-white shadow-elevation rounded-2xl overflow-hidden">
        <CardHeader className="bg-[#1C1813] border-b border-[#292218] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-400" />
                Painel de Tarefas Críticas do Buffet — Restrições Alimentares
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Cada restrição é tratada com rastreamento estrito de preparo, entrega e responsável
                para garantir segurança alimentar.
              </CardDescription>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold self-start sm:self-auto">
              {dietaryTasks.filter((t) => t.status !== 'ENTREGUE').length} prato(s) pendente(s)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {dietaryTasks.map((task) => {
              const isDelivered = task.status === 'ENTREGUE'
              const isReady = task.status === 'PRONTO'
              const isInPrep = task.status === 'EM_PREPARO'

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDelivered
                      ? 'border-[#26221C] bg-[#141210] opacity-80'
                      : isReady
                        ? 'border-emerald-500/70 bg-[#121E16] shadow-elevation'
                        : isInPrep
                          ? 'border-amber-500/70 bg-[#1E1912]'
                          : 'border-red-500/70 bg-[#1F1212]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        CÓDIGO: {task.guest_code || 'REST-ESP'} •{' '}
                        {task.table_name || 'Mesa não inf.'}
                      </span>
                      <h4 className="font-serif font-bold text-base text-white mt-0.5">
                        {task.guest_name}
                      </h4>
                      <div className="text-xs font-bold text-amber-300 mt-1 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-amber-400" />
                        {task.restriction_type}
                      </div>
                      {task.details && (
                        <p className="text-xs text-neutral-300 mt-1 bg-[#1C1813] p-2.5 rounded-xl border border-[#2F271D]">
                          {task.details}
                        </p>
                      )}
                    </div>

                    <Badge
                      className={`text-[10px] shrink-0 font-bold ${
                        isDelivered
                          ? 'bg-neutral-800 text-neutral-300'
                          : isReady
                            ? 'bg-emerald-600 text-white animate-bounce'
                            : isInPrep
                              ? 'bg-amber-500 text-white'
                              : 'bg-red-600 text-white'
                      }`}
                    >
                      {task.status}
                    </Badge>
                  </div>

                  {/* Flow checklist line */}
                  <div className="mt-3 pt-2 border-t border-[#292218] text-[11px] text-neutral-400 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Chef resp:{' '}
                      <strong className="text-neutral-200">
                        {task.buffet_responsible || 'Chef Roberto'}
                      </strong>
                    </span>
                    {task.delivery_responsible && (
                      <span>
                        Entregador:{' '}
                        <strong className="text-neutral-200">{task.delivery_responsible}</strong>
                      </span>
                    )}
                  </div>

                  {/* Workflow transition buttons */}
                  <div className="mt-3 flex items-center gap-2">
                    {task.status === 'PENDENTE' && (
                      <Button
                        size="sm"
                        onClick={() => handleSaveDietaryTask(task.id, 'RECEBIDO')}
                        className="w-full text-xs h-8 bg-[#24201B] hover:bg-[#322C25] text-white border border-[#3D3528] font-semibold rounded-xl"
                      >
                        [1] Confirmar Recebimento na Cozinha
                      </Button>
                    )}
                    {task.status === 'RECEBIDO' && (
                      <Button
                        size="sm"
                        onClick={() => handleSaveDietaryTask(task.id, 'EM_PREPARO')}
                        className="w-full text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
                      >
                        [2] Iniciar Preparo Exclusivo
                      </Button>
                    )}
                    {task.status === 'EM_PREPARO' && (
                      <Button
                        size="sm"
                        onClick={() => handleSaveDietaryTask(task.id, 'PRONTO')}
                        className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                      >
                        [3] Marcar como Prato Pronto!
                      </Button>
                    )}
                    {task.status === 'PRONTO' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingTask(task)
                        }}
                        className="w-full text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow gap-1 rounded-xl"
                      >
                        <Check className="w-3.5 h-3.5" /> [4] Confirmar Entrega na Mesa
                      </Button>
                    )}
                    {isDelivered && (
                      <div className="w-full text-center text-xs text-emerald-300 font-semibold py-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl">
                        ✓ Entregue com segurança às{' '}
                        {task.delivered_at
                          ? new Date(task.delivered_at).toLocaleTimeString('pt-BR')
                          : ''}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* DELIVERY CONFIRMATION MODAL */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="sm:max-w-[450px] bg-[#161412] text-white border border-[#332D24] rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Confirmar Entrega do Prato
                Especial
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs">
                Convidado: <strong className="text-white">{editingTask.guest_name}</strong> (
                {editingTask.table_name})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-[#1C1813] rounded-xl border border-[#2F271D]">
                <div>
                  Restrição:{' '}
                  <strong className="text-amber-300">{editingTask.restriction_type}</strong>
                </div>
                {editingTask.details && (
                  <div className="text-neutral-400 mt-1">{editingTask.details}</div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="deliv-resp" className="font-bold text-neutral-300">
                  Nome do Garçom / Responsável pela Entrega:
                </Label>
                <Input
                  id="deliv-resp"
                  value={deliveryResponsible}
                  onChange={(e) => setDeliveryResponsible(e.target.value)}
                  placeholder="Nome do garçom"
                  className="h-10 bg-[#12100E] border-[#383125] text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingTask(null)}
                className="border-[#332D24] text-neutral-300 hover:bg-[#24201A]"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleSaveDietaryTask(editingTask.id, 'ENTREGUE')}
                disabled={isUpdatingTask || !deliveryResponsible.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                {isUpdatingTask ? 'Salvando...' : 'Confirmar Entrega na Mesa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* FULL SCREEN TELÃO LED SIMULATION MODAL (Requirement G.7) */}
      <Dialog open={isScreenModalOpen} onOpenChange={setIsScreenModalOpen}>
        <DialogContent className="sm:max-w-[900px] bg-[#12110F] text-white border-4 border-[#C5A45F] p-8 text-center rounded-3xl shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-widest text-[#C5A45F] uppercase">
              <Tv className="w-4 h-4" /> TELÃO LED — SALÃO PRINCIPAL FESTA DOS DESTAQUES 2026
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-wide">
                BUFFET GASTRONÔMICO LIBERADO
              </h2>
              <p className="text-sm sm:text-base text-neutral-300">
                Por favor, os ocupantes das mesas abaixo dirijam-se com tranquilidade aos réchauds:
              </p>
            </div>

            {/* Huge Tables Display */}
            <div className="py-4">
              <div className="inline-block bg-[#1C1A17] border-2 border-[#C5A45F] px-8 py-5 rounded-2xl shadow-inner">
                <span className="text-4xl sm:text-6xl font-serif font-bold text-[#C5A45F] tracking-wider block">
                  {latestRelease ? latestRelease.table_names : 'MESA 01, MESA 02, MESA 03'}
                </span>
              </div>
            </div>

            <div className="text-xs text-neutral-400 max-w-md mx-auto">
              As demais mesas serão chamadas em instantes pelo cerimonial Hugo. Bom apetite a todos!
            </div>

            <Button
              onClick={() => setIsScreenModalOpen(false)}
              variant="outline"
              className="border-neutral-700 text-neutral-300 hover:bg-white/10 text-xs"
            >
              Fechar Visualização do Telão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
