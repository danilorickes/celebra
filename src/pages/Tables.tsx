import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  tableService,
  guestService,
  honoreeService,
  chairService,
  auditService,
} from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type { TableRecord, GuestRecord, HonoreeRecord, ChairTransferRecord } from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Users,
  MoveRight,
  Plus,
  UserCheck,
  AlertCircle,
  Sparkles,
  Check,
  CheckCircle2,
  Lock,
  Unlock,
  Camera,
  MapPin,
  AlertTriangle,
  ArrowRightLeft,
  XCircle,
  FileCheck,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Tables() {
  const { eventId } = useParams<{ eventId: string }>()
  const [tables, setTables] = useState<TableRecord[]>([])
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [transfers, setTransfers] = useState<ChairTransferRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Selected Table for Inspection / Conference
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null)
  const [conferencePhotoInput, setConferencePhotoInput] = useState<string>('')
  const [physicalChairsInput, setPhysicalChairsInput] = useState<number>(0)
  const [isUpdatingConference, setIsUpdatingConference] = useState(false)

  // Move Guest Dialog
  const [guestToMove, setGuestToMove] = useState<GuestRecord | null>(null)
  const [targetTableId, setTargetTableId] = useState<string>('')
  const [isMoving, setIsMoving] = useState(false)

  // Strict Chair Transfer Request Modal (Requisito C: Controle Rígido de Cadeiras)
  const [isChairModalOpen, setIsChairModalOpen] = useState(false)
  const [chairSourceId, setChairSourceId] = useState('')
  const [chairTargetId, setChairTargetId] = useState('')
  const [chairCount, setChairCount] = useState(2)
  const [chairRequester, setChairRequester] = useState('Garçom Salão')
  const [chairReason, setChairReason] = useState(
    'Convidados solicitaram juntar cadeiras para acomodar amigos',
  )
  const [chairAuthorizer, setChairAuthorizer] = useState('')
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false)
  const [blockedTransferResult, setBlockedTransferResult] = useState<ChairTransferRecord | null>(
    null,
  )

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [tList, gList, hList, trList] = await Promise.all([
        tableService.list(eventId),
        guestService.list(eventId),
        honoreeService.list(eventId),
        chairService.listTransfers(eventId),
      ])
      setTables(tList)
      setGuests(gList)
      setHonorees(hList)
      setTransfers(trList)
    } catch (_) {
      toast({
        title: 'Erro ao carregar mesas',
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

  // Realtime updates
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
  useRealtime<ChairTransferRecord>('chair_transfers', () => {
    if (eventId)
      chairService
        .listTransfers(eventId)
        .then(setTransfers)
        .catch(() => {})
  })

  // Table computations
  const getTableGuests = (tableId: string) => {
    return guests.filter((g) => g.table_id === tableId)
  }

  const getTableOccupancy = (table: TableRecord) => {
    const assigned = getTableGuests(table.id).length
    const capacity = table.capacity || 10
    const physical = table.physical_chairs ?? capacity
    const planned = table.planned_chairs ?? capacity
    const isExceeded = assigned > capacity
    const isFull = assigned === capacity
    const hasSpots = assigned < capacity
    const hasChairDivergence = physical !== planned

    return {
      assigned,
      capacity,
      physical,
      planned,
      isFull,
      isExceeded,
      hasSpots,
      hasChairDivergence,
    }
  }

  // Get table status color class
  const getTableColorConfig = (table: TableRecord) => {
    const { isExceeded, isFull, hasChairDivergence } = getTableOccupancy(table)

    if (table.conference_status === 'BLOQUEADA') {
      return {
        badge: 'BLOQUEADA',
        badgeClass: 'bg-neutral-800 text-white border-neutral-700',
        cardBorder: 'border-neutral-700 bg-neutral-100',
        indicator: 'bg-neutral-800 text-white',
      }
    }
    if (table.buffet_status === 'CHAMADA' || table.buffet_status === 'DIRIGINDO_AO_BUFFET') {
      return {
        badge: 'LIBERADA BUFFET',
        badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold',
        cardBorder: 'border-indigo-500 bg-indigo-50/20',
        indicator: 'bg-indigo-600 text-white',
      }
    }
    if (hasChairDivergence || table.conference_status === 'DIVERGENTE') {
      return {
        badge: 'DIVERGÊNCIA CADEIRAS',
        badgeClass: 'bg-red-100 text-red-900 border-red-300 font-bold',
        cardBorder: 'border-red-500 bg-red-50/30',
        indicator: 'bg-red-600 text-white',
      }
    }
    if (table.conference_status === 'PENDENTE') {
      return {
        badge: 'AGUARD. CONFERÊNCIA',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        cardBorder: 'border-amber-400 bg-amber-50/20',
        indicator: 'bg-amber-600 text-white',
      }
    }
    if (isExceeded) {
      return {
        badge: 'CAPACIDADE EXCEDIDA',
        badgeClass: 'bg-red-600 text-white',
        cardBorder: 'border-red-600 bg-red-50/40',
        indicator: 'bg-red-700 text-white',
      }
    }
    if (isFull) {
      return {
        badge: 'COMPLETA',
        badgeClass: 'bg-neutral-900 text-[#C5A45F]',
        cardBorder: 'border-[#1C1A17] bg-[#1C1A17]/5',
        indicator: 'bg-[#1C1A17] text-[#C5A45F]',
      }
    }
    // Available spots
    return {
      badge: 'DISPONÍVEL',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      cardBorder: 'border-emerald-500/80 bg-emerald-50/10',
      indicator: 'bg-emerald-600 text-white',
    }
  }

  // Get primary honorees associated with this table
  const getTableHonorees = (tableId: string) => {
    const tableGuests = getTableGuests(tableId)
    const honoreeIds = Array.from(new Set(tableGuests.map((g) => g.honoree_id).filter(Boolean)))
    return honorees.filter((h) => honoreeIds.includes(h.id))
  }

  // Handle Physical Conference Update
  const handleSaveConference = async () => {
    if (!selectedTable) return
    setIsUpdatingConference(true)
    try {
      const isDiv = physicalChairsInput !== (selectedTable.planned_chairs || selectedTable.capacity)
      await tableService.update(selectedTable.id, {
        physical_chairs: physicalChairsInput,
        conference_status: isDiv ? 'DIVERGENTE' : 'CONFERIDA',
        conference_responsible: 'Renato Apoio',
        conference_photo: conferencePhotoInput || selectedTable.conference_photo,
      })
      toast({
        title: isDiv ? 'Divergência de cadeiras registrada!' : 'Mesa conferida com sucesso!',
        description: isDiv
          ? `Quantidade física (${physicalChairsInput}) difere do planejado (${selectedTable.planned_chairs}).`
          : 'Montagem validada conforme o layout.',
        variant: isDiv ? 'destructive' : 'default',
      })
      setSelectedTable(null)
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao salvar conferência', variant: 'destructive' })
    } finally {
      setIsUpdatingConference(false)
    }
  }

  // Move Guest between tables
  const handleMoveGuest = async () => {
    if (!guestToMove || !targetTableId) return
    setIsMoving(true)
    try {
      const targetTable = tables.find((t) => t.id === targetTableId)
      await guestService.update(guestToMove.id, { table_id: targetTableId })
      toast({
        title: 'Convidado realocado com sucesso!',
        description: `${guestToMove.name} foi movido(a) para ${targetTable?.name || 'outra mesa'}.`,
      })
      setGuestToMove(null)
      setTargetTableId('')
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao mover convidado', variant: 'destructive' })
    } finally {
      setIsMoving(false)
    }
  }

  // Chair transfer submission (Requirement C: Dor central do cliente)
  const handleRequestChairTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !chairSourceId || !chairTargetId) return
    setIsSubmittingTransfer(true)
    try {
      const result = await chairService.requestTransfer({
        event_id: eventId,
        source_table_id: chairSourceId,
        target_table_id: chairTargetId,
        chairs_count: chairCount,
        requested_by: chairRequester,
        reason: chairReason,
        authorized_by: chairAuthorizer,
      })

      if (result.status === 'BLOQUEADA_NEGADA') {
        setBlockedTransferResult(result)
      } else {
        toast({
          title: 'Transferência de cadeiras aprovada e executada!',
          description: `${chairCount} cadeiras movidas com autorização de ${chairAuthorizer}.`,
        })
        setIsChairModalOpen(false)
        setChairAuthorizer('')
      }
      loadData()
    } catch (err: unknown) {
      toast({ title: 'Erro ao processar transferência', variant: 'destructive' })
    } finally {
      setIsSubmittingTransfer(false)
    }
  }

  // Divergences Count
  const tablesWithDivergence = useMemo(() => {
    return tables.filter((t) => {
      const { hasChairDivergence } = getTableOccupancy(t)
      return hasChairDivergence || t.conference_status === 'DIVERGENTE'
    })
  }, [tables, guests])

  const reserveTables = tables.filter((t) => t.is_reserve)
  const regularTables = tables.filter((t) => !t.is_reserve)

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 sm:py-6 space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Users className="w-4 h-4" /> Layout do Salão & Gestão Rígida de Cadeiras
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-[#1C1A17]">
            Mapa Visual das Mesas (~20 Mesas)
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6356] mt-0.5">
            Capacidades variáveis (8, 9 e 10 lugares), trava cerimonial, conferência física por foto
            e controle estrito de transferências.
          </p>
        </div>

        {/* Action button to test / request chair transfer */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              if (tables.length >= 2) {
                // Preselect Mesa 03 (8 lugares) to Mesa 05 for scenario demonstration
                const m3 = tables.find((t) => t.name.includes('03'))
                const m5 = tables.find((t) => t.name.includes('05'))
                if (m3) setChairSourceId(m3.id)
                if (m5) setChairTargetId(m5.id)
              }
              setIsChairModalOpen(true)
            }}
            className="bg-[#1C1A17] hover:bg-[#282521] text-[#C5A45F] border border-[#3D3833] font-bold text-xs h-10 gap-1.5 shadow"
          >
            <ArrowRightLeft className="w-4 h-4 text-[#C5A45F]" />
            Solicitar Transferência de Cadeiras
          </Button>
        </div>
      </div>

      {/* Mandatory Fixed Warning Banner (Requirement C.9) */}
      <div className="bg-red-950 text-red-100 p-4 rounded-xl border-2 border-red-800 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-900 border border-red-700 flex items-center justify-center text-red-200 shrink-0">
            <Lock className="w-5 h-5 text-red-300" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 block">
              REGRA DE OURO OPERACIONAL — PROTOCOLO HUGO & RENATO
            </span>
            <strong className="text-xs sm:text-sm text-white font-serif tracking-wide block">
              "Não retirar, adicionar ou transferir cadeiras sem autorização da coordenação."
            </strong>
          </div>
        </div>
        <Badge className="bg-red-800 text-white border-red-600 text-[10px] shrink-0 font-mono hidden sm:inline-flex">
          MAPA TRAVADO
        </Badge>
      </div>

      {/* Painel de Divergências antes da abertura (Requirement C.12) */}
      {tablesWithDivergence.length > 0 && (
        <Card className="border-2 border-red-500 bg-red-50/60 shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-serif font-bold text-red-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
              Painel de Divergências de Montagem ({tablesWithDivergence.length} mesa com divergência
              física)
            </CardTitle>
            <CardDescription className="text-xs text-red-800">
              Atenção antes da abertura do salão: a quantidade de cadeiras montadas difere do
              planejamento homologado.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tablesWithDivergence.map((divTable) => {
                const { planned, physical } = getTableOccupancy(divTable)
                return (
                  <div
                    key={divTable.id}
                    onClick={() => {
                      setSelectedTable(divTable)
                      setPhysicalChairsInput(physical)
                      setConferencePhotoInput(divTable.conference_photo || '')
                    }}
                    className="p-3 bg-white rounded-xl border border-red-300 cursor-pointer hover:shadow transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="font-serif font-bold text-sm text-[#1C1A17]">
                        {divTable.name}
                      </div>
                      <div className="text-xs text-red-700 font-semibold mt-0.5">
                        Físico: <strong>{physical}</strong> / Planejado: <strong>{planned}</strong>
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        Resp: {divTable.conference_responsible || 'Renato'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-red-300 text-red-800"
                    >
                      Conferir
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend & Orientation Map Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-neutral-200 text-xs text-[#6B6356] shadow-sm">
        {/* Você Está Aqui Indicator */}
        <div className="flex items-center gap-2 font-bold text-[#1C1A17]">
          <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping inline-block" />
          <MapPin className="w-4 h-4 text-blue-700" />
          <span className="text-blue-950 font-serif">
            Você está aqui: Foyer / Entrada Principal
          </span>
        </div>

        {/* Status Colors Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Disponível
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1C1A17] inline-block" /> Completa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Divergência /
            Excedida
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Aguardando Conf.
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Liberada Buffet
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-800 inline-block" /> Bloqueada
          </span>
        </div>
      </div>

      {/* Visual Tables Grid (~20 Tables) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#6B6356]">
          <span className="font-semibold uppercase tracking-wider">
            Salão Nobre — 20 Mesas (Capacidades 8, 9 e 10 lugares)
          </span>
          <span>{regularTables.length} mesas ativas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {regularTables.map((table) => {
            const { assigned, capacity, planned, physical } = getTableOccupancy(table)
            const colorCfg = getTableColorConfig(table)
            const tableHonorees = getTableHonorees(table.id)

            return (
              <div
                key={table.id}
                onClick={() => {
                  setSelectedTable(table)
                  setPhysicalChairsInput(physical)
                  setConferencePhotoInput(table.conference_photo || '')
                }}
                className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border-2 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 ${colorCfg.cardBorder}`}
              >
                {/* Header: Table circular number + capacity badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-serif font-bold text-sm shadow-sm transition-transform group-hover:scale-105 ${colorCfg.indicator}`}
                    >
                      <span className="text-[9px] uppercase font-sans tracking-tight opacity-75">
                        Mesa
                      </span>
                      <span>{table.name.replace(/[^0-9]/g, '') || '•'}</span>
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-base text-[#1C1A17] flex items-center gap-1.5">
                        {table.name}
                        {table.is_locked && <Lock className="w-3 h-3 text-neutral-400" />}
                      </h4>
                      <span className="text-xs font-semibold text-[#6B6356]">
                        {assigned} ocupados /{' '}
                        <strong className="text-[#1C1A17]">{capacity} lugares</strong>
                      </span>
                    </div>
                  </div>

                  <Badge className={`text-[10px] font-bold ${colorCfg.badgeClass}`}>
                    {colorCfg.badge}
                  </Badge>
                </div>

                {/* Chair conference mini breakdown */}
                <div className="bg-neutral-50 p-2 rounded-lg text-[11px] flex items-center justify-between border border-neutral-200">
                  <span>
                    Cadeiras: <strong>{physical}</strong> físicas / <strong>{planned}</strong> plan.
                  </span>
                  {physical !== planned ? (
                    <span className="text-red-700 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> Divergente
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Conferida
                    </span>
                  )}
                </div>

                {/* Special Needs Indicator (SEM expor detalhes médicos a usuários sem permissão) */}
                {table.special_needs_note && (
                  <div className="mt-2 text-[10px] text-blue-900 bg-blue-50/80 p-1.5 rounded border border-blue-200 font-medium truncate">
                    ★ Acomodação Especial Ativa
                  </div>
                )}

                {/* Associated Honorees Chips */}
                <div className="mt-3 pt-2 border-t border-neutral-100 min-h-[38px]">
                  <div className="text-[10px] uppercase tracking-wider text-[#6B6356] font-semibold mb-1">
                    Homenageados:
                  </div>
                  {tableHonorees.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tableHonorees.map((h) => (
                        <span
                          key={h.id}
                          className="bg-[#1C1A17] text-[#C5A45F] text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        >
                          {h.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-400 italic">Convidados gerais</span>
                  )}
                </div>

                {/* Footer action hint */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#C5A45F] font-semibold group-hover:underline">
                  <span>Conferir & Convidados ({assigned})</span>
                  <MoveRight className="w-3.5 h-3.5" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contingency Tables Section (Requirement C.13: cadeiras + mesa de contingência sem desmontar as oficiais) */}
      <div className="space-y-3 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#1C1A17] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              Mesas de Contingência & Reserva Oficial
            </h3>
            <p className="text-xs text-[#6B6356]">
              Destinadas a imprevistos, autoridades e convidados de última hora sem desorganizar as
              20 mesas dos homenageados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reserveTables.map((rTable) => {
            const { assigned, capacity, physical } = getTableOccupancy(rTable)
            const free = Math.max(0, capacity - assigned)
            return (
              <Card
                key={rTable.id}
                onClick={() => {
                  setSelectedTable(rTable)
                  setPhysicalChairsInput(physical)
                  setConferencePhotoInput(rTable.conference_photo || '')
                }}
                className="bg-amber-50/40 border-2 border-amber-300 p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">
                      CONTINGÊNCIA ATIVA
                    </span>
                    <h4 className="font-serif font-bold text-base text-[#1C1A17] mt-0.5">
                      {rTable.name} ({capacity} lugares)
                    </h4>
                    <p className="text-xs text-[#6B6356] mt-0.5">
                      {assigned} ocupados •{' '}
                      <strong className="text-amber-900">{free} disponíveis</strong>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                  >
                    Gerenciar
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* TABLE DETAIL & CONFERENCE MODAL (Requirement C.5, C.6, C.7, C.8) */}
      {selectedTable && (
        <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
          <DialogContent className="sm:max-w-[650px] bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#1C1A17] text-[#C5A45F] font-bold">
                    {selectedTable.is_reserve ? 'CONTINGÊNCIA' : 'MESA REGULAR'}
                  </Badge>
                  <span className="text-xs text-[#6B6356]">
                    Capacidade: {selectedTable.capacity} lugares
                  </span>
                </div>
                {selectedTable.is_locked && (
                  <span className="text-xs text-neutral-500 flex items-center gap-1 font-semibold">
                    <Lock className="w-3.5 h-3.5 text-neutral-500" /> Trava Cerimonial Ativa
                  </span>
                )}
              </div>
              <DialogTitle className="text-2xl font-serif font-bold text-[#1C1A17]">
                {selectedTable.name}
              </DialogTitle>
              <DialogDescription>
                Checklist de conferência da montagem física, registro fotográfico e convidados
                vinculados.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2 text-xs">
              {/* Mandatory Checklist / Conference Box */}
              <div className="bg-[#F8F7F4] p-4 rounded-xl border border-neutral-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-[#1C1A17] flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#C5A45F]" /> Checklist de Conferência da
                    Mesa
                  </span>
                  <Badge
                    className={
                      physicalChairsInput ===
                      (selectedTable.planned_chairs || selectedTable.capacity)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-600 text-white animate-pulse'
                    }
                  >
                    {physicalChairsInput ===
                    (selectedTable.planned_chairs || selectedTable.capacity)
                      ? 'CONFORME'
                      : 'DIVERGÊNCIA FÍSICA'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="plan-chairs" className="text-[11px] text-[#6B6356]">
                      Cadeiras Planejadas:
                    </Label>
                    <Input
                      id="plan-chairs"
                      disabled
                      value={selectedTable.planned_chairs || selectedTable.capacity}
                      className="bg-neutral-100 font-bold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phys-chairs" className="text-[11px] font-bold text-[#1C1A17]">
                      Cadeiras Físicas Conferidas:
                    </Label>
                    <Input
                      id="phys-chairs"
                      type="number"
                      min={1}
                      value={physicalChairsInput}
                      onChange={(e) => setPhysicalChairsInput(parseInt(e.target.value) || 0)}
                      className="bg-white font-bold text-base"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="conf-photo"
                    className="text-[11px] text-[#6B6356] flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" /> Registro Fotográfico da Mesa Montada:
                  </Label>
                  <Input
                    id="conf-photo"
                    placeholder="URL ou arquivo de foto da conferência..."
                    value={conferencePhotoInput}
                    onChange={(e) => setConferencePhotoInput(e.target.value)}
                    className="bg-white text-xs h-9"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Foto de referência:{' '}
                    {selectedTable.conference_photo || 'conferencia_mesa_montada.jpg'} • Conferido
                    por: {selectedTable.conference_responsible || 'Renato Apoio'}
                  </span>
                </div>

                <Button
                  onClick={handleSaveConference}
                  disabled={isUpdatingConference}
                  className="w-full bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold text-xs h-9"
                >
                  {isUpdatingConference ? 'Salvando...' : 'Salvar Conferência Física da Mesa'}
                </Button>
              </div>

              {/* Move guest section if triggered */}
              {guestToMove && (
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <MoveRight className="w-4 h-4 text-amber-700" />
                      Mover "{guestToMove.name}" para:
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGuestToMove(null)}
                      className="text-xs text-neutral-500 h-6 px-2"
                    >
                      Cancelar
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Select value={targetTableId} onValueChange={setTargetTableId}>
                      <SelectTrigger className="h-10 text-xs bg-white">
                        <SelectValue placeholder="Selecione a mesa de destino..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tables
                          .filter((t) => t.id !== selectedTable.id)
                          .map((t) => {
                            const { assigned, capacity } = getTableOccupancy(t)
                            return (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name} ({assigned}/{capacity} lugares){' '}
                                {t.is_reserve ? '★ RESERVA' : ''}
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleMoveGuest}
                      disabled={!targetTableId || isMoving}
                      className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold text-xs shrink-0"
                    >
                      {isMoving ? 'Movendo...' : 'Confirmar Mudança'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Guest Roster for this table */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6B6356] flex items-center justify-between">
                  <span>
                    Ocupantes Vinculados ({getTableGuests(selectedTable.id).length} de{' '}
                    {selectedTable.capacity})
                  </span>
                  {selectedTable.special_needs_note && (
                    <span className="text-blue-800 font-normal">
                      ★ {selectedTable.special_needs_note}
                    </span>
                  )}
                </div>

                {getTableGuests(selectedTable.id).length === 0 ? (
                  <div className="text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <p className="text-xs text-[#6B6356]">Nenhum convidado alocado nesta mesa.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {getTableGuests(selectedTable.id).map((guest) => {
                      const targetHonoree = honorees.find((h) => h.id === guest.honoree_id)
                      const isPresent = guest.status === 'PRESENTE'

                      return (
                        <div
                          key={guest.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 hover:bg-neutral-100/70 transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-xs text-[#1C1A17] flex items-center gap-1.5">
                              {guest.name}
                              {isPresent && (
                                <Badge className="bg-emerald-600 text-white text-[8px] py-0 px-1">
                                  PRESENTE
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-[#6B6356]">
                              {targetHonoree && <span>Homenageado: {targetHonoree.name}</span>}
                              {guest.dietary_restriction && (
                                <span className="text-amber-800 ml-2">
                                  ★ {guest.dietary_restriction}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGuestToMove(guest)
                              setTargetTableId('')
                            }}
                            className="text-[11px] h-7 text-[#C5A45F] hover:bg-white border-neutral-300 font-medium"
                          >
                            Mover
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTable(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* STRICT CHAIR TRANSFER MODAL (Requisitos C.10 & C.11: Exigir quem solicitou, motivo, origem, destino, autorização do coordenador, horário e BLOQUEIO quando não autorizado) */}
      <Dialog open={isChairModalOpen} onOpenChange={setIsChairModalOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <form onSubmit={handleRequestChairTransfer}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl flex items-center gap-2 text-red-950">
                <Lock className="w-5 h-5 text-red-600" /> Solicitar Transferência de Cadeiras
              </DialogTitle>
              <DialogDescription className="text-xs">
                Qualquer transferência física exige justificativa formal e autorização expressa da
                coordenação cerimonial (Hugo ou Renato).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ct-source">Mesa de Origem *</Label>
                  <Select value={chairSourceId} onValueChange={setChairSourceId} required>
                    <SelectTrigger id="ct-source" className="h-9">
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.physical_chairs ?? t.capacity} cad.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ct-target">Mesa de Destino *</Label>
                  <Select value={chairTargetId} onValueChange={setChairTargetId} required>
                    <SelectTrigger id="ct-target" className="h-9">
                      <SelectValue placeholder="Selecione o destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables
                        .filter((t) => t.id !== chairSourceId)
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.physical_chairs ?? t.capacity} cad.)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ct-count">Quantidade de Cadeiras *</Label>
                  <Input
                    id="ct-count"
                    type="number"
                    min={1}
                    max={10}
                    value={chairCount}
                    onChange={(e) => setChairCount(parseInt(e.target.value) || 1)}
                    className="h-9 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ct-requester">Quem Solicitou *</Label>
                  <Input
                    id="ct-requester"
                    required
                    placeholder="Ex: Garçom João / Chefe Garçons"
                    value={chairRequester}
                    onChange={(e) => setChairRequester(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="ct-reason">Motivo da Solicitação *</Label>
                <Input
                  id="ct-reason"
                  required
                  placeholder="Por que mover as cadeiras?"
                  value={chairReason}
                  onChange={(e) => setChairReason(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 space-y-1.5">
                <Label
                  htmlFor="ct-auth"
                  className="font-bold text-amber-950 flex items-center justify-between"
                >
                  <span>Autorização do Coordenador (Hugo ou Renato):</span>
                  <span className="text-[10px] text-amber-800 font-normal">
                    Opcional para teste de bloqueio
                  </span>
                </Label>
                <Select value={chairAuthorizer} onValueChange={setChairAuthorizer}>
                  <SelectTrigger id="ct-auth" className="bg-white h-9 border-amber-300">
                    <SelectValue placeholder="Sem autorização (Simular tentativa indevida)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem autorização (Simular bloqueio)</SelectItem>
                    <SelectItem value="Hugo Cerimonial">
                      Hugo Cerimonial (Coordenador Chefe)
                    </SelectItem>
                    <SelectItem value="Renato Apoio">
                      Renato Apoio (Coordenação Operacional)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-amber-800">
                  Dica da Demo: Deixe em branco para testar o bloqueio estrito do sistema!
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsChairModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingTransfer || !chairSourceId || !chairTargetId}
                className="bg-red-700 hover:bg-red-800 text-white font-bold"
              >
                {isSubmittingTransfer ? 'Processando...' : 'Processar Solicitação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* BLOCKED TRANSFER ALERT RESULT MODAL (Requirement C: Sistema bloqueia sem autorização) */}
      <Dialog
        open={!!blockedTransferResult}
        onOpenChange={(open) => !open && setBlockedTransferResult(null)}
      >
        <DialogContent className="sm:max-w-[480px] bg-white border-4 border-red-600">
          <DialogHeader>
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2 border border-red-300">
              <XCircle className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-serif font-bold text-center text-red-950">
              TENTATIVA BLOQUEADA PELO SISTEMA
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-neutral-600">
              A alteração de cadeiras foi <strong>RECUSADA E REGISTRADA NO HISTÓRICO</strong> de
              auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs space-y-2 text-red-900">
            <div>
              <strong>Motivo do Bloqueio:</strong>
              <p className="mt-0.5">{blockedTransferResult?.rejection_reason}</p>
            </div>
            <div className="border-t border-red-200 pt-2 text-[11px] text-neutral-600">
              Horário do registro:{' '}
              {blockedTransferResult?.timestamp
                ? new Date(blockedTransferResult.timestamp).toLocaleTimeString('pt-BR')
                : 'Agora'}{' '}
              • Solicitante: {blockedTransferResult?.requested_by}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setBlockedTransferResult(null)
                setIsChairModalOpen(false)
              }}
              className="w-full bg-[#1C1A17] hover:bg-[#282521] text-white font-bold"
            >
              Compreendido (Manter Layout Oficial)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
