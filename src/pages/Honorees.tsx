import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { honoreeService, guestService, tableService } from '@/services/celebraService'
import type { HonoreeRecord, GuestRecord, TableRecord } from '@/types/celebra'
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
  Award,
  Phone,
  MessageSquare,
  Edit3,
  Trash2,
  Users,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Honorees() {
  const { eventId } = useParams<{ eventId: string }>()
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [tables, setTables] = useState<TableRecord[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingHonoree, setEditingHonoree] = useState<HonoreeRecord | null>(null)
  const [selectedHonoreeDetail, setSelectedHonoreeDetail] = useState<HonoreeRecord | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [observations, setObservations] = useState('')
  const [status, setStatus] = useState<'CONFIRMADO' | 'PENDENTE'>('CONFIRMADO')
  const [importantInfo, setImportantInfo] = useState('')
  const [tributeOrder, setTributeOrder] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [hList, gList, tList] = await Promise.all([
        honoreeService.list(eventId),
        guestService.list(eventId),
        tableService.list(eventId),
      ])
      setHonorees(hList)
      setGuests(gList)
      setTables(tList)
    } catch (_) {
      toast({
        title: 'Erro ao carregar homenageados',
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

  const openCreateDialog = () => {
    setEditingHonoree(null)
    setName('')
    setPhone('')
    setWhatsapp('')
    setObservations('')
    setStatus('CONFIRMADO')
    setImportantInfo('')
    setTributeOrder(honorees.length + 1)
    setIsDialogOpen(true)
  }

  const openEditDialog = (h: HonoreeRecord) => {
    setEditingHonoree(h)
    setName(h.name)
    setPhone(h.phone || '')
    setWhatsapp(h.whatsapp || '')
    setObservations(h.observations || '')
    setStatus(h.status || 'CONFIRMADO')
    setImportantInfo(h.important_info || '')
    setTributeOrder(h.tribute_order || 1)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !name.trim()) return
    setIsSubmitting(true)
    try {
      if (editingHonoree) {
        await honoreeService.update(editingHonoree.id, {
          name,
          phone,
          whatsapp,
          observations,
          status,
          important_info: importantInfo,
          tribute_order: tributeOrder,
        })
        toast({ title: 'Homenageado atualizado com sucesso!' })
      } else {
        await honoreeService.create({
          event_id: eventId,
          name,
          phone,
          whatsapp,
          observations,
          status,
          important_info: importantInfo,
          tribute_order: tributeOrder,
        })
        toast({ title: 'Homenageado cadastrado com sucesso!' })
      }
      setIsDialogOpen(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar homenageado.'
      toast({
        title: 'Erro ao salvar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover "${name}"?`)) return
    try {
      await honoreeService.delete(id)
      toast({ title: 'Homenageado removido.' })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  // Filtered list
  const filteredHonorees = useMemo(() => {
    return honorees.filter((h) => {
      const q = search.toLowerCase()
      return (
        h.name.toLowerCase().includes(q) ||
        (h.important_info && h.important_info.toLowerCase().includes(q)) ||
        (h.phone && h.phone.includes(q))
      )
    })
  }, [honorees, search])

  // Get table name for an honoree via their linked guests
  const getHonoreeTable = (honoreeId: string) => {
    const linked = guests.filter((g) => g.honoree_id === honoreeId && g.table_id)
    if (linked.length > 0) {
      const foundTable = tables.find((t) => t.id === linked[0].table_id)
      return foundTable ? foundTable.name : 'Mesa alocada'
    }
    return 'Sem mesa definida'
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Award className="w-4 h-4" /> Gestão de Personalidades
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-[#1C1A17]">
            Homenageados ({honorees.length})
          </h1>
          <p className="text-sm text-[#6B6356] mt-1">
            Cadastre, organize a ordem de homenagem e acompanhe observações críticas de cada um.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Novo Homenageado
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
        <Input
          placeholder="Pesquisar por nome, telefone ou observação importante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-white border-neutral-200 focus:border-[#C5A45F]"
        />
      </div>

      {/* List / Cards */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A45F] border-t-transparent" />
        </div>
      ) : filteredHonorees.length === 0 ? (
        <Card className="text-center py-16 bg-white border-dashed">
          <CardContent>
            <Award className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#221E1A]">Nenhum homenageado encontrado.</p>
            <p className="text-xs text-[#6B6356] mt-1">
              Tente ajustar a busca ou adicionar um novo homenageado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHonorees.map((h) => {
            const tableName = getHonoreeTable(h.id)
            const linkedGuests = guests.filter((g) => g.honoree_id === h.id)

            return (
              <Card
                key={h.id}
                className="bg-white border-neutral-200 hover:border-[#C5A45F] transition-all shadow-sm flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#1C1A17] text-[#C5A45F] flex items-center justify-center font-bold text-xs shrink-0">
                        #{h.tribute_order || '—'}
                      </div>
                      <div>
                        <CardTitle className="text-base font-serif font-bold text-[#1C1A17] line-clamp-1">
                          {h.name}
                        </CardTitle>
                        <span className="text-xs font-medium text-[#C5A45F]">{tableName}</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        h.status === 'CONFIRMADO'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {h.status || 'CONFIRMADO'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1 space-y-3">
                  {/* Important Info warning pill */}
                  {h.important_info && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{h.important_info}</span>
                    </div>
                  )}

                  <div className="text-xs text-[#6B6356] space-y-1">
                    {h.whatsapp && (
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp: {h.whatsapp}</span>
                      </div>
                    )}
                    {h.phone && !h.whatsapp && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Tel: {h.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      <Users className="w-3.5 h-3.5 text-[#C5A45F]" />
                      <span>{linkedGuests.length} convidado(s) vinculado(s)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedHonoreeDetail(h)}
                      className="text-xs text-[#6B6356] hover:text-[#1C1A17] p-0 h-auto font-medium"
                    >
                      Ver Detalhes
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(h)}
                        className="h-8 w-8 text-neutral-500 hover:text-black"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(h.id, h.name)}
                        className="h-8 w-8 text-neutral-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedHonoreeDetail && (
        <Dialog
          open={!!selectedHonoreeDetail}
          onOpenChange={(open) => !open && setSelectedHonoreeDetail(null)}
        >
          <DialogContent className="sm:max-w-[500px] bg-white">
            <DialogHeader>
              <div className="flex items-center gap-2 text-xs font-bold text-[#C5A45F] uppercase">
                <Sparkles className="w-3.5 h-3.5" /> Homenageado #
                {selectedHonoreeDetail.tribute_order || '1'}
              </div>
              <DialogTitle className="text-xl font-serif font-bold text-[#1C1A17]">
                {selectedHonoreeDetail.name}
              </DialogTitle>
              <DialogDescription>
                Mesa: {getHonoreeTable(selectedHonoreeDetail.id)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm text-[#221E1A]">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6356] block">
                  Informações Críticas / Protocolo
                </span>
                <p className="mt-1 bg-neutral-50 p-3 rounded-lg border border-neutral-200 leading-relaxed">
                  {selectedHonoreeDetail.important_info ||
                    'Nenhuma informação especial registrada.'}
                </p>
              </div>

              {selectedHonoreeDetail.observations && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6356] block">
                    Observações Internas
                  </span>
                  <p className="mt-1 text-xs text-[#6B6356]">
                    {selectedHonoreeDetail.observations}
                  </p>
                </div>
              )}

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6356] block mb-2">
                  Convidados Vinculados (
                  {guests.filter((g) => g.honoree_id === selectedHonoreeDetail.id).length})
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {guests
                    .filter((g) => g.honoree_id === selectedHonoreeDetail.id)
                    .map((g) => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between p-2 rounded bg-neutral-50 border border-neutral-100 text-xs"
                      >
                        <span className="font-medium text-[#1C1A17]">{g.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {g.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedHonoreeDetail(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {editingHonoree ? 'Editar Homenageado' : 'Novo Homenageado'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da personalidade que será homenageada na festa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="h-name">Nome Completo *</Label>
                <Input
                  id="h-name"
                  required
                  placeholder="Ex: Mariana Oliveira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="h-order">Ordem no Palco</Label>
                  <Input
                    id="h-order"
                    type="number"
                    min={1}
                    value={tributeOrder}
                    onChange={(e) => setTributeOrder(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val: 'CONFIRMADO' | 'PENDENTE') => setStatus(val)}
                  >
                    <SelectTrigger id="h-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="h-phone">Telefone</Label>
                  <Input
                    id="h-phone"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-whatsapp">WhatsApp</Label>
                  <Input
                    id="h-whatsapp"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="h-info" className="text-amber-900 font-semibold">
                  Informações Importantes (Alergias, Mobilidade, Púlpito)
                </Label>
                <Textarea
                  id="h-info"
                  rows={2}
                  placeholder="Ex: Não consome glúten. Sentar próxima à rampa de acesso."
                  value={importantInfo}
                  onChange={(e) => setImportantInfo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="h-obs">Observações Gerais</Label>
                <Textarea
                  id="h-obs"
                  rows={2}
                  placeholder="Ex: Acompanhada de 4 familiares."
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
                {isSubmitting ? 'Salvando...' : 'Salvar Homenageado'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
