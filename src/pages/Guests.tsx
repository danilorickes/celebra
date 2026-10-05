import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { guestService, honoreeService, tableService } from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type { GuestRecord, HonoreeRecord, TableRecord } from '@/types/celebra'
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
  DialogTrigger,
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
  Search,
  Plus,
  Users,
  Phone,
  Edit3,
  Trash2,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  Grid,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type GuestStatus = GuestRecord['status']

export default function Guests() {
  const { eventId } = useParams<{ eventId: string }>()
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [tables, setTables] = useState<TableRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [honoreeFilter, setHonoreeFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<GuestRecord | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [honoreeId, setHonoreeId] = useState<string>('')
  const [accompanant, setAccompanant] = useState('')
  const [confirmation, setConfirmation] = useState<'CONFIRMADO' | 'PENDENTE'>('CONFIRMADO')
  const [tableId, setTableId] = useState<string>('')
  const [status, setStatus] = useState<GuestStatus>('CONFIRMADO')
  const [specialNeeds, setSpecialNeeds] = useState('')
  const [observations, setObservations] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [gList, hList, tList] = await Promise.all([
        guestService.list(eventId),
        honoreeService.list(eventId),
        tableService.list(eventId),
      ])
      setGuests(gList)
      setHonorees(hList)
      setTables(tList)
    } catch (_) {
      toast({
        title: 'Erro ao carregar convidados',
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

  // Realtime guest updates
  useRealtime<GuestRecord>('guests', () => {
    if (eventId) {
      guestService
        .list(eventId)
        .then(setGuests)
        .catch(() => {})
    }
  })

  const openCreateDialog = () => {
    setEditingGuest(null)
    setName('')
    setPhone('')
    setHonoreeId('')
    setAccompanant('')
    setConfirmation('CONFIRMADO')
    setTableId('')
    setStatus('CONFIRMADO')
    setSpecialNeeds('')
    setObservations('')
    setIsDialogOpen(true)
  }

  const openEditDialog = (g: GuestRecord) => {
    setEditingGuest(g)
    setName(g.name)
    setPhone(g.phone || '')
    setHonoreeId(g.honoree_id || '')
    setAccompanant(g.accompanant || '')
    setConfirmation(g.confirmation || 'CONFIRMADO')
    setTableId(g.table_id || '')
    setStatus(g.status || 'CONFIRMADO')
    setSpecialNeeds(g.special_needs || '')
    setObservations(g.observations || '')
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !name.trim()) return
    setIsSubmitting(true)
    try {
      const payload: Partial<GuestRecord> = {
        name,
        phone,
        accompanant,
        confirmation,
        status,
        special_needs: specialNeeds,
        observations,
        honoree_id: honoreeId || undefined,
        table_id: tableId || undefined,
      }

      if (editingGuest) {
        await guestService.update(editingGuest.id, payload)
        toast({ title: 'Convidado atualizado com sucesso!' })
      } else {
        await guestService.create({
          ...payload,
          event_id: eventId,
        })
        toast({ title: 'Convidado cadastrado com sucesso!' })
      }
      setIsDialogOpen(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar convidado.'
      toast({
        title: 'Erro ao salvar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, guestName: string) => {
    if (!confirm(`Remover convidado "${guestName}" da lista?`)) return
    try {
      await guestService.delete(id)
      toast({ title: 'Convidado removido.' })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const handleQuickCheckin = async (guest: GuestRecord) => {
    if (!eventId) return
    try {
      await guestService.checkIn(eventId, guest.id)
      toast({
        title: `Check-in confirmado!`,
        description: `${guest.name} está presente no evento.`,
      })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao registrar check-in', variant: 'destructive' })
    }
  }

  // Filtered
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const q = search.toLowerCase()
      const matchSearch =
        g.name.toLowerCase().includes(q) ||
        (g.phone && g.phone.includes(q)) ||
        (g.accompanant && g.accompanant.toLowerCase().includes(q)) ||
        (g.expand?.honoree_id?.name && g.expand.honoree_id.name.toLowerCase().includes(q))

      const matchStatus = statusFilter === 'ALL' || g.status === statusFilter
      const matchHonoree = honoreeFilter === 'ALL' || g.honoree_id === honoreeFilter

      return matchSearch && matchStatus && matchHonoree
    })
  }, [guests, search, statusFilter, honoreeFilter])

  const getStatusBadge = (st: GuestStatus) => {
    switch (st) {
      case 'PRESENTE':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]">
            PRESENTE ✓
          </Badge>
        )
      case 'CONFIRMADO':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px]">
            CONFIRMADO
          </Badge>
        )
      case 'PENDENTE':
        return (
          <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px]">
            PENDENTE
          </Badge>
        )
      case 'CANCELADO':
        return <Badge className="bg-neutral-200 text-neutral-600 text-[10px]">CANCELADO</Badge>
      case 'NAO_COMPARECEU':
        return (
          <Badge className="bg-red-100 text-red-800 border border-red-300 text-[10px]">
            NÃO COMPARECEU
          </Badge>
        )
      case 'NAO_ESTAVA_NA_LISTA':
        return (
          <Badge className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px]">
            EXTRA / NÃO ESTAVA
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {st}
          </Badge>
        )
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Users className="w-4 h-4" /> Gestão de Convidados
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-[#1C1A17]">
            Convidados ({guests.length})
          </h1>
          <p className="text-sm text-[#6B6356] mt-1">
            Busca ultra-rápida, associação de mesas e controle do status de chegada.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo Convidado
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Pesquisar por nome do convidado, acompanhante, telefone ou homenageado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-neutral-50/50 border-neutral-200 focus:border-[#C5A45F]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B6356]">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-44 text-xs bg-white">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="PRESENTE">Presentes</SelectItem>
                <SelectItem value="CONFIRMADO">Confirmados</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="NAO_COMPARECEU">Não Compareceu</SelectItem>
                <SelectItem value="NAO_ESTAVA_NA_LISTA">Não Estava na Lista</SelectItem>
                <SelectItem value="CANCELADO">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B6356]">Homenageado:</span>
            <Select value={honoreeFilter} onValueChange={setHonoreeFilter}>
              <SelectTrigger className="h-9 w-52 text-xs bg-white">
                <SelectValue placeholder="Todos os homenageados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os homenageados</SelectItem>
                {honorees.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== 'ALL' || honoreeFilter !== 'ALL' || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
                setHonoreeFilter('ALL')
              }}
              className="text-xs text-[#6B6356] hover:text-[#1C1A17] ml-auto"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Guest Table/List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A45F] border-t-transparent" />
        </div>
      ) : filteredGuests.length === 0 ? (
        <Card className="text-center py-16 bg-white border-dashed">
          <CardContent>
            <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#221E1A]">Nenhum convidado encontrado.</p>
            <p className="text-xs text-[#6B6356] mt-1">
              Ajuste os filtros ou cadastre um novo convidado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C1A17] text-neutral-300 uppercase font-semibold tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Nome do Convidado</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Mesa</th>
                  <th className="py-3.5 px-4">Homenageado Vinculado</th>
                  <th className="py-3.5 px-4">Acompanhante</th>
                  <th className="py-3.5 px-4">Necessidades Especiais</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredGuests.map((g) => {
                  const targetTable = tables.find((t) => t.id === g.table_id)
                  const targetHonoree = honorees.find((h) => h.id === g.honoree_id)
                  const isPresent = g.status === 'PRESENTE'

                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-neutral-50/80 transition-colors ${
                        isPresent ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#1C1A17]">{g.name}</div>
                        {g.phone && <div className="text-[11px] text-[#6B6356]">{g.phone}</div>}
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(g.status)}</td>

                      <td className="py-3.5 px-4">
                        {targetTable ? (
                          <span
                            className={`font-semibold text-xs px-2.5 py-1 rounded-md inline-block ${
                              targetTable.is_reserve
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {targetTable.name}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">Sem mesa</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {targetHonoree ? (
                          <span className="font-medium text-[#1C1A17]">{targetHonoree.name}</span>
                        ) : (
                          <span className="text-neutral-400 italic">Independente</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {g.accompanant ? (
                          <span className="text-neutral-700 font-medium">{g.accompanant}</span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {g.special_needs ? (
                          <div className="text-[11px] text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200 inline-block line-clamp-1">
                            {g.special_needs}
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {!isPresent && (
                            <Button
                              size="sm"
                              onClick={() => handleQuickCheckin(g)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-7 text-[11px] px-2.5 gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Presente
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(g)}
                            className="h-7 w-7 text-neutral-500 hover:text-black"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(g.id, g.name)}
                            className="h-7 w-7 text-neutral-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guest Modal Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {editingGuest ? 'Editar Convidado' : 'Cadastrar Convidado'}
              </DialogTitle>
              <DialogDescription>
                Informe os dados do convidado para vincular à mesa e ao homenageado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <Label htmlFor="g-name">Nome Completo *</Label>
                <Input
                  id="g-name"
                  required
                  placeholder="Ex: Beatriz Souza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="g-phone">Telefone</Label>
                  <Input
                    id="g-phone"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="g-status">Status de Chegada</Label>
                  <Select value={status} onValueChange={(val: GuestStatus) => setStatus(val)}>
                    <SelectTrigger id="g-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                      <SelectItem value="PRESENTE">Presente</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="CONVIDADO">Convidado</SelectItem>
                      <SelectItem value="CANCELADO">Cancelado</SelectItem>
                      <SelectItem value="NAO_COMPARECEU">Não Compareceu</SelectItem>
                      <SelectItem value="NAO_ESTAVA_NA_LISTA">Não Estava na Lista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="g-table">Mesa Designada</Label>
                  <Select value={tableId} onValueChange={setTableId}>
                    <SelectTrigger id="g-table">
                      <SelectValue placeholder="Selecione a mesa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma Mesa</SelectItem>
                      {tables.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.is_reserve ? 'CONTINGÊNCIA' : `${t.capacity} lug.`})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="g-honoree">Homenageado Vinculado</Label>
                  <Select value={honoreeId} onValueChange={setHonoreeId}>
                    <SelectTrigger id="g-honoree">
                      <SelectValue placeholder="Vincular a homenageado" />
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

              <div className="space-y-2">
                <Label htmlFor="g-accomp">Acompanhante (Nome/Parentesco)</Label>
                <Input
                  id="g-accomp"
                  placeholder="Ex: Esposo / Filha"
                  value={accompanant}
                  onChange={(e) => setAccompanant(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="g-needs" className="text-amber-900 font-semibold">
                  Necessidades Especiais (Alergias / Acessibilidade)
                </Label>
                <Input
                  id="g-needs"
                  placeholder="Ex: Cadeira de rodas / Cardápio sem glúten"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="g-obs">Observações Gerais</Label>
                <Textarea
                  id="g-obs"
                  rows={2}
                  placeholder="Ex: Confirmou presença pelo WhatsApp."
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
                {isSubmitting ? 'Salvando...' : 'Salvar Convidado'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
