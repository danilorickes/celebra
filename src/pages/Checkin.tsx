import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { guestService, tableService, honoreeService } from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type { GuestRecord, TableRecord, HonoreeRecord } from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Search,
  UserCheck,
  UserPlus,
  QrCode,
  Sparkles,
  Phone,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Checkin() {
  const { eventId } = useParams<{ eventId: string }>()
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [tables, setTables] = useState<TableRecord[]>([])
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'search' | 'qr'>('search')
  const [isLoading, setIsLoading] = useState(true)

  // Quick Register Modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickPhone, setQuickPhone] = useState('')
  const [quickTableId, setQuickTableId] = useState('')
  const [quickHonoreeId, setQuickHonoreeId] = useState('')
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    try {
      const [gList, tList, hList] = await Promise.all([
        guestService.list(eventId),
        tableService.list(eventId),
        honoreeService.list(eventId),
      ])
      setGuests(gList)
      setTables(tList)
      setHonorees(hList)
    } catch (_) {
      toast({
        title: 'Erro ao carregar dados de check-in',
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

  // Realtime guest and check-in updates
  useRealtime<GuestRecord>('guests', () => {
    if (eventId)
      guestService
        .list(eventId)
        .then(setGuests)
        .catch(() => {})
  })

  // Fast search matches (min 2 characters)
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q.length < 2) return []
    return guests.filter((g) => {
      return (
        g.name.toLowerCase().includes(q) ||
        (g.phone && g.phone.includes(q)) ||
        (g.accompanant && g.accompanant.toLowerCase().includes(q))
      )
    })
  }, [guests, search])

  // Count presents
  const totalGuests = guests.length
  const presentCount = guests.filter((g) => g.status === 'PRESENTE').length

  // Execute Check-in
  const handleConfirmArrival = async (guest: GuestRecord) => {
    if (!eventId) return
    try {
      await guestService.checkIn(eventId, guest.id)
      toast({
        title: 'Entrada confirmada!',
        description: `${guest.name} registrado(a) com sucesso.`,
      })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao confirmar chegada', variant: 'destructive' })
    }
  }

  // Quick Add Guest
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !quickName.trim()) return
    setIsSubmittingQuick(true)
    try {
      // Find contingency table or open table if not selected
      let assignedTable = quickTableId
      if (!assignedTable) {
        const reserve = tables.find((t) => t.is_reserve)
        if (reserve) assignedTable = reserve.id
      }

      const created = await guestService.create({
        event_id: eventId,
        name: quickName,
        phone: quickPhone,
        table_id: assignedTable || undefined,
        honoree_id: quickHonoreeId || undefined,
        status: 'PRESENTE', // Already present!
        confirmation: 'CONFIRMADO',
        observations: 'Cadastrado na recepção via Check-in Rápido',
      })

      // Also create checkin record
      await guestService.checkIn(eventId, created.id)

      toast({
        title: 'Convidado cadastrado e presente!',
        description: `${quickName} alocado e check-in concluído.`,
      })

      setIsQuickAddOpen(false)
      setQuickName('')
      setQuickPhone('')
      setQuickTableId('')
      setQuickHonoreeId('')
      setSearch(quickName)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar convidado.'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setIsSubmittingQuick(false)
    }
  }

  // Suggest default table for unexpected guest
  const contingencyTable = tables.find((t) => t.is_reserve)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-[#1C1A17] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-[#2F2C27]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C5A45F] text-[#1C1A17] flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-serif font-bold text-white">
              Recepção & Check-in
            </h1>
            <p className="text-xs text-neutral-300">
              Presença confirmada:{' '}
              <strong className="text-emerald-400 font-bold">{presentCount}</strong> de{' '}
              {totalGuests} convidados
            </p>
          </div>
        </div>

        {/* Tab switch (Search vs QR) */}
        <div className="flex bg-[#282521] p-1 rounded-lg border border-[#3D3833]">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'search'
                ? 'bg-[#C5A45F] text-[#1C1A17]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Busca Rápida
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
              activeTab === 'qr'
                ? 'bg-[#C5A45F] text-[#1C1A17]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> QR Code
          </button>
        </div>
      </div>

      {activeTab === 'qr' ? (
        /* QR Code Placeholder for P1 */
        <Card className="text-center py-16 bg-white border-2 border-dashed border-neutral-300">
          <CardContent className="space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto text-[#6B6356]">
              <QrCode className="w-10 h-10 text-[#C5A45F]" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                Leitor QR Code em Breve
              </h3>
              <p className="text-xs text-[#6B6356] max-w-sm mx-auto mt-1">
                A validação por câmera está reservada para a versão P1. Para a operação de hoje,
                utilize o campo de busca ultra-rápido por nome.
              </p>
            </div>
            <Button
              onClick={() => setActiveTab('search')}
              className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold text-xs"
            >
              Voltar para Busca Rápida
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Mobile-First Search Interface */
        <div className="space-y-5">
          {/* Gigantic Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-4 w-6 h-6 text-neutral-400" />
            <Input
              type="text"
              autoFocus
              placeholder="Digite o nome do convidado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-14 h-16 text-lg sm:text-xl font-medium bg-white border-2 border-neutral-300 focus:border-[#C5A45F] rounded-2xl shadow-sm placeholder:text-neutral-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-4 text-xs font-semibold bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-2.5 py-1.5 rounded-lg"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Results Area */}
          {search.trim().length >= 2 ? (
            searchResults.length > 0 ? (
              <div className="space-y-4">
                <div className="text-xs font-semibold text-[#6B6356] uppercase tracking-wider">
                  {searchResults.length} convidado(s) encontrado(s):
                </div>

                {searchResults.map((guest) => {
                  const targetTable = tables.find((t) => t.id === guest.table_id)
                  const targetHonoree = honorees.find((h) => h.id === guest.honoree_id)
                  const isPresent = guest.status === 'PRESENTE'

                  return (
                    <Card
                      key={guest.id}
                      className={`border-2 transition-all shadow-md ${
                        isPresent
                          ? 'border-emerald-500 bg-emerald-50/20'
                          : 'border-neutral-200 bg-white hover:border-[#C5A45F]'
                      }`}
                    >
                      <CardContent className="p-5 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1A17]">
                                {guest.name}
                              </h2>
                              <Badge
                                className={`text-[10px] font-bold ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                {isPresent ? 'PRESENTE' : guest.status}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#6B6356]">
                              {guest.phone && <span>Tel: {guest.phone}</span>}
                              {guest.accompanant && (
                                <span className="text-neutral-800 font-medium">
                                  Acomp: {guest.accompanant}
                                </span>
                              )}
                              {targetHonoree && (
                                <span className="text-[#C5A45F] font-semibold">
                                  Homenageado: {targetHonoree.name}
                                </span>
                              )}
                            </div>

                            {guest.special_needs && (
                              <div className="mt-2 text-xs text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
                                <strong>Atenção:</strong> {guest.special_needs}
                              </div>
                            )}
                          </div>

                          {/* Table Badge */}
                          <div className="sm:text-right shrink-0">
                            <div className="text-[11px] uppercase tracking-wider text-[#6B6356] font-semibold">
                              Mesa Designada
                            </div>
                            <div className="text-xl sm:text-2xl font-bold font-serif text-[#C5A45F] mt-0.5">
                              {targetTable ? targetTable.name : 'SEM MESA'}
                            </div>
                          </div>
                        </div>

                        {/* Large Action Button */}
                        <div className="pt-2">
                          {isPresent ? (
                            <Button
                              disabled
                              className="w-full h-14 bg-emerald-600 text-white font-bold text-base sm:text-lg rounded-xl opacity-90 cursor-default gap-2"
                            >
                              <CheckCircle2 className="w-6 h-6" /> PRESENTE ✓
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleConfirmArrival(guest)}
                              className="w-full h-14 bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold text-base sm:text-lg rounded-xl shadow-lg transition-transform active:scale-[0.99] gap-2"
                            >
                              <UserCheck className="w-6 h-6" /> CONFIRMAR CHEGADA
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              /* No matches found */
              <Card className="text-center py-10 bg-amber-50/50 border-2 border-amber-200 rounded-2xl">
                <CardContent className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-800">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                      Convidado não encontrado na lista
                    </h3>
                    <p className="text-xs text-[#6B6356] max-w-sm mx-auto mt-1">
                      Nenhum registro para "{search}". Você pode cadastrá-lo agora na recepção e
                      alocar na Mesa Reserva.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setQuickName(search)
                      if (contingencyTable) setQuickTableId(contingencyTable.id)
                      setIsQuickAddOpen(true)
                    }}
                    className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold gap-2 text-sm h-11"
                  >
                    <UserPlus className="w-4 h-4" /> Cadastrar Novo Convidado
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            /* Idle state instructions */
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center space-y-3">
              <p className="text-sm text-[#6B6356]">
                Digite pelo menos <strong>2 caracteres</strong> do nome para localizar o convidado e
                sua respectiva mesa.
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuickName('')
                    if (contingencyTable) setQuickTableId(contingencyTable.id)
                    setIsQuickAddOpen(true)
                  }}
                  className="text-xs text-[#6B6356] hover:text-[#1C1A17] gap-2 border-neutral-300"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Convidado Extra / Não Estava na Lista
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Add Dialog */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white">
          <form onSubmit={handleQuickAdd}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Cadastro Rápido de Recepção</DialogTitle>
              <DialogDescription>
                Adiciona o convidado de última hora e confirma imediatamente sua entrada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <Label htmlFor="q-name">Nome Completo *</Label>
                <Input
                  id="q-name"
                  required
                  placeholder="Nome do convidado"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="q-phone">Telefone / WhatsApp</Label>
                <Input
                  id="q-phone"
                  placeholder="(11) 99999-9999"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="q-table">Mesa para Acomodação</Label>
                <Select value={quickTableId} onValueChange={setQuickTableId}>
                  <SelectTrigger id="q-table">
                    <SelectValue placeholder="Selecione a mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.is_reserve ? '★ MESA CONTINGÊNCIA' : `(${t.capacity} lugares)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contingencyTable && (
                  <p className="text-[11px] text-amber-800">
                    Sugestão de Contingência: <strong>{contingencyTable.name}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="q-honoree">Homenageado Vinculado (Opcional)</Label>
                <Select value={quickHonoreeId} onValueChange={setQuickHonoreeId}>
                  <SelectTrigger id="q-honoree">
                    <SelectValue placeholder="Nenhum (Independente)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (Independente)</SelectItem>
                    {honorees.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickAddOpen(false)}
                disabled={isSubmittingQuick}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingQuick}
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold"
              >
                {isSubmittingQuick ? 'Salvando...' : 'Confirmar Presença'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
