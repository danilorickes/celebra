import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tableService, guestService, honoreeService } from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type { TableRecord, GuestRecord, HonoreeRecord } from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Tables() {
  const { eventId } = useParams<{ eventId: string }>()
  const [tables, setTables] = useState<TableRecord[]>([])
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal Table State
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null)
  const [guestToMove, setGuestToMove] = useState<GuestRecord | null>(null)
  const [targetTableId, setTargetTableId] = useState<string>('')
  const [isMoving, setIsMoving] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [tList, gList, hList] = await Promise.all([
        tableService.list(eventId),
        guestService.list(eventId),
        honoreeService.list(eventId),
      ])
      setTables(tList)
      setGuests(gList)
      setHonorees(hList)
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

  // Realtime
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

  // Table computations
  const getTableGuests = (tableId: string) => {
    return guests.filter((g) => g.table_id === tableId)
  }

  const getTableOccupancy = (table: TableRecord) => {
    const assigned = getTableGuests(table.id).length
    const capacity = table.capacity || 10
    const isFull = assigned >= capacity
    const hasSpots = assigned < capacity
    return { assigned, capacity, isFull, hasSpots }
  }

  // Get primary honorees associated with this table
  const getTableHonorees = (tableId: string) => {
    const tableGuests = getTableGuests(tableId)
    const honoreeIds = Array.from(new Set(tableGuests.map((g) => g.honoree_id).filter(Boolean)))
    return honorees.filter((h) => honoreeIds.includes(h.id))
  }

  // Move guest between tables
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

  const reserveTable = tables.find((t) => t.is_reserve)
  const regularTables = tables.filter((t) => !t.is_reserve)

  const reserveCapacity = reserveTable?.capacity || 5
  const reserveAssigned = reserveTable ? getTableGuests(reserveTable.id).length : 0
  const reserveFree = Math.max(0, reserveCapacity - reserveAssigned)

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Users className="w-4 h-4" /> Layout do Salão & Contingência
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-[#1C1A17]">
            Mapa Operacional de Mesas
          </h1>
          <p className="text-sm text-[#6B6356] mt-1">
            Grid visual de ocupação das mesas circulares e gestão rápida de contingência para Hugo e
            recepção.
          </p>
        </div>
      </div>

      {/* Contingency Highlight Banner */}
      {reserveTable && (
        <Card className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 shadow-sm">
          <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-amber-900">
                    MESA RESERVA / CONTINGÊNCIA
                  </span>
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                    {reserveAssigned}/{reserveCapacity} Ocupados
                  </Badge>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1C1A17] mt-0.5">
                  CAPACIDADE DE CONTINGÊNCIA:{' '}
                  <span className="text-amber-800">{reserveFree} lugares disponíveis</span>
                </h3>
                <p className="text-xs text-[#6B6356] mt-0.5">
                  Para acomodar convidados surpresa ou ajustes de última hora sem desorganizar as
                  famílias dos homenageados.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setSelectedTable(reserveTable)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 shrink-0 shadow-sm"
            >
              Gerenciar Mesa Reserva ({reserveAssigned})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Visual Tables Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A45F] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#6B6356]">
            <span className="font-semibold uppercase tracking-wider">
              Salão Principal (Mesas 10 Lugares)
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Vagas Livres
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Lotada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Reserva
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {regularTables.map((table) => {
              const { assigned, capacity, isFull } = getTableOccupancy(table)
              const tableHonorees = getTableHonorees(table.id)
              const freeSpots = Math.max(0, capacity - assigned)

              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border-2 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 ${
                    isFull
                      ? 'border-red-400/80 bg-red-50/10'
                      : 'border-emerald-500/80 bg-emerald-50/10'
                  }`}
                >
                  {/* Circular shape indicator */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-serif font-bold text-sm shadow-sm transition-transform group-hover:scale-105 ${
                          isFull ? 'bg-red-600 text-white' : 'bg-[#1C1A17] text-[#C5A45F]'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-sans tracking-tight opacity-75">
                          Mesa
                        </span>
                        <span>{table.name.replace(/[^0-9]/g, '') || '•'}</span>
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-base text-[#1C1A17]">
                          {table.name}
                        </h4>
                        <span
                          className={`text-xs font-semibold ${
                            isFull ? 'text-red-700' : 'text-emerald-700'
                          }`}
                        >
                          {assigned} / {capacity} lugares
                        </span>
                      </div>
                    </div>

                    <Badge
                      className={`text-[10px] font-bold ${
                        isFull
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {isFull ? 'LOTADA' : `${freeSpots} VAGAS`}
                    </Badge>
                  </div>

                  {/* Associated Honorees Chips */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 min-h-[44px]">
                    <div className="text-[10px] uppercase tracking-wider text-[#6B6356] font-semibold mb-1">
                      Homenageados na Mesa:
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

                  {/* Quick Action Hint */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#C5A45F] font-semibold group-hover:underline">
                    <span>Ver convidados ({assigned})</span>
                    <MoveRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Table Detail & Move Guest Modal */}
      {selectedTable && (
        <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
          <DialogContent className="sm:max-w-[620px] bg-white">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    selectedTable.is_reserve
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-[#1C1A17] text-[#C5A45F]'
                  }`}
                >
                  {selectedTable.is_reserve ? 'CONTINGÊNCIA' : 'MESA REGULAR'}
                </span>
                <span className="text-xs text-[#6B6356]">
                  Capacidade: {selectedTable.capacity} pessoas
                </span>
              </div>
              <DialogTitle className="text-2xl font-serif font-bold text-[#1C1A17]">
                {selectedTable.name}
              </DialogTitle>
              <DialogDescription>
                Lista de convidados acomodados nesta mesa. Você pode mover qualquer pessoa para
                outra mesa instantaneamente.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-4">
              {/* Move guest section if selected */}
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
                                {t.is_reserve ? '— RESERVA' : ''}
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
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6B6356]">
                  Ocupantes ({getTableGuests(selectedTable.id).length} de {selectedTable.capacity})
                </div>

                {getTableGuests(selectedTable.id).length === 0 ? (
                  <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                    <p className="text-xs text-[#6B6356]">
                      Esta mesa ainda não possui convidados alocados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {getTableGuests(selectedTable.id).map((guest) => {
                      const targetHonoree = honorees.find((h) => h.id === guest.honoree_id)
                      const isPresent = guest.status === 'PRESENTE'

                      return (
                        <div
                          key={guest.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-xs hover:bg-neutral-100/70 transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-sm text-[#1C1A17] flex items-center gap-2">
                              {guest.name}
                              {isPresent && (
                                <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1.5">
                                  PRESENTE
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B6356] mt-0.5 flex items-center gap-2">
                              {guest.accompanant && <span>Acomp: {guest.accompanant}</span>}
                              {targetHonoree && (
                                <span className="text-[#C5A45F] font-medium">
                                  • Homenageado: {targetHonoree.name}
                                </span>
                              )}
                            </div>
                            {guest.special_needs && (
                              <div className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                {guest.special_needs}
                              </div>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGuestToMove(guest)
                              setTargetTableId('')
                            }}
                            className="text-xs h-8 text-[#C5A45F] hover:text-[#B08F4A] hover:bg-white border-neutral-300 font-medium shrink-0"
                          >
                            Mover de Mesa
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
    </div>
  )
}
