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
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1C1A17]">
            Liberação das Mesas & Restrições Alimentares
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6356] mt-0.5">
            Liberação em ondas de 2-3 mesas para evitar filas, integração com telão, WhatsApp
            simulado e controle estrito de pratos especiais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsScreenModalOpen(true)}
            className="bg-[#1C1A17] hover:bg-[#282521] text-[#C5A45F] border border-[#3D3833] font-bold text-xs h-10 gap-2 shadow"
          >
            <Tv className="w-4 h-4 text-[#C5A45F]" /> Modo Telão LED do Salão
          </Button>
        </div>
      </div>

      {/* SECTION 1: LIBERAÇÃO DE MESAS EM ONDAS (Requirement G) */}
      <Card className="border-2 border-neutral-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="bg-[#FBFBFA] border-b border-neutral-100 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-serif font-bold text-[#1C1A17] flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#C5A45F]" />
                Painel de Liberação do Buffet em Ondas
              </CardTitle>
              <CardDescription className="text-xs text-[#6B6356]">
                Selecione até 3 mesas por onda para manter o réchaud fluido e abastecido.
              </CardDescription>
            </div>
            {latestRelease && (
              <Badge className="bg-indigo-100 text-indigo-900 border-indigo-300 font-bold self-start sm:self-auto">
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
            <div className="flex items-center justify-between text-xs text-[#6B6356]">
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
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-[#C5A45F] bg-[#C5A45F]/10 shadow-md ring-2 ring-[#C5A45F]'
                          : isCalled
                            ? 'border-indigo-500 bg-indigo-50/40'
                            : isDone
                              ? 'border-neutral-300 bg-neutral-100 opacity-60 cursor-not-allowed'
                              : 'border-neutral-200 bg-white hover:border-[#C5A45F]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-serif font-bold text-sm text-[#1C1A17]">
                          {table.name}
                        </span>
                        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-[#C5A45F]" />}
                      </div>

                      <div className="text-[11px] text-[#6B6356]">{table.capacity} lugares</div>

                      <Badge
                        className={`mt-2 text-[9px] w-full justify-center ${
                          isCalled
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : isAttended
                              ? 'bg-amber-100 text-amber-900'
                              : isDone
                                ? 'bg-neutral-800 text-white'
                                : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {table.buffet_status || 'AGUARDANDO'}
                      </Badge>

                      {/* State stepper quick control if called */}
                      {isCalled && (
                        <div className="mt-2 pt-1 border-t border-indigo-200 flex justify-between gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAdvanceTableStatus(table.id, 'CONCLUIDA')
                            }}
                            className="text-[9px] text-indigo-900 font-bold hover:underline"
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
      <Card className="border-2 border-amber-300 bg-white shadow-sm overflow-hidden">
        <CardHeader className="bg-amber-50/50 border-b border-amber-200 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-serif font-bold text-amber-950 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-700" />
                Painel de Tarefas Críticas do Buffet — Restrições Alimentares
              </CardTitle>
              <CardDescription className="text-xs text-amber-900">
                Cada restrição é tratada com rastreamento estrito de preparo, entrega e responsável
                para garantir segurança alimentar.
              </CardDescription>
            </div>
            <Badge className="bg-amber-200 text-amber-950 border-amber-400 font-bold self-start sm:self-auto">
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
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isDelivered
                      ? 'border-neutral-200 bg-neutral-50 opacity-80'
                      : isReady
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-sm'
                        : isInPrep
                          ? 'border-amber-400 bg-amber-50/20'
                          : 'border-red-400 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6356] block">
                        CÓDIGO: {task.guest_code || 'REST-ESP'} •{' '}
                        {task.table_name || 'Mesa não inf.'}
                      </span>
                      <h4 className="font-serif font-bold text-base text-[#1C1A17] mt-0.5">
                        {task.guest_name}
                      </h4>
                      <div className="text-xs font-bold text-amber-900 mt-1 flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-amber-700" />
                        {task.restriction_type}
                      </div>
                      {task.details && (
                        <p className="text-xs text-neutral-600 mt-1 bg-white p-2 rounded-lg border border-neutral-200">
                          {task.details}
                        </p>
                      )}
                    </div>

                    <Badge
                      className={`text-[10px] shrink-0 font-bold ${
                        isDelivered
                          ? 'bg-neutral-800 text-white'
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
                  <div className="mt-3 pt-2 border-t border-neutral-200 text-[11px] text-[#6B6356] flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Chef resp: <strong>{task.buffet_responsible || 'Chef Roberto'}</strong>
                    </span>
                    {task.delivery_responsible && (
                      <span>
                        Entregador: <strong>{task.delivery_responsible}</strong>
                      </span>
                    )}
                  </div>

                  {/* Workflow transition buttons */}
                  <div className="mt-3 flex items-center gap-2">
                    {task.status === 'PENDENTE' && (
                      <Button
                        size="sm"
                        onClick={() => handleSaveDietaryTask(task.id, 'RECEBIDO')}
                        className="w-full text-xs h-8 bg-neutral-800 hover:bg-neutral-900 text-white font-semibold"
                      >
                        [1] Confirmar Recebimento na Cozinha
                      </Button>
                    )}
                    {task.status === 'RECEBIDO' && (
                      <Button
                        size="sm"
                        onClick={() => handleSaveDietaryTask(task.id, 'EM_PREPARO')}
                        className="w-full text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                      >
                        [2] Iniciar Preparo Exclusivo
                      </Button>
                    )}
                    {task.status === 'EM_PREPARO' && (
                      <Button
                        size="sm"
                        onClick={() => handleSaveDietaryTask(task.id, 'PRONTO')}
                        className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
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
                        className="w-full text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> [4] Confirmar Entrega na Mesa
                      </Button>
                    )}
                    {isDelivered && (
                      <div className="w-full text-center text-xs text-emerald-700 font-semibold py-1 bg-emerald-50 rounded-lg">
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
          <DialogContent className="sm:max-w-[450px] bg-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl flex items-center gap-2 text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Confirmar Entrega do Prato
                Especial
              </DialogTitle>
              <DialogDescription>
                Convidado: <strong>{editingTask.guest_name}</strong> ({editingTask.table_name})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  Restrição: <strong>{editingTask.restriction_type}</strong>
                </div>
                {editingTask.details && (
                  <div className="text-neutral-500 mt-1">{editingTask.details}</div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="deliv-resp" className="font-bold text-neutral-800">
                  Nome do Garçom / Responsável pela Entrega:
                </Label>
                <Input
                  id="deliv-resp"
                  value={deliveryResponsible}
                  onChange={(e) => setDeliveryResponsible(e.target.value)}
                  placeholder="Nome do garçom"
                  className="h-10"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => handleSaveDietaryTask(editingTask.id, 'ENTREGUE')}
                disabled={isUpdatingTask || !deliveryResponsible.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {isUpdatingTask ? 'Gravando...' : 'Confirmar Prato na Mesa'}
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
