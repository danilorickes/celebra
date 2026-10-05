import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { occurrenceService } from '@/services/celebraService'
import { useAuth } from '@/context/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import type { OccurrenceRecord } from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertTriangle,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type OccurrenceCategory = OccurrenceRecord['category']

export default function Occurrences() {
  const { eventId } = useParams<{ eventId: string }>()
  const { user } = useAuth()
  const [occurrences, setOccurrences] = useState<OccurrenceRecord[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [category, setCategory] = useState<OccurrenceCategory>('CONVIDADO')
  const [description, setDescription] = useState('')
  const [responsible, setResponsible] = useState(user?.name || 'Hugo Cerimonial')
  const [solution, setSolution] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const list = await occurrenceService.list(eventId)
      setOccurrences(list)
    } catch (_) {
      toast({
        title: 'Erro ao carregar ocorrências',
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

  useRealtime<OccurrenceRecord>('occurrences', () => {
    if (eventId)
      occurrenceService
        .list(eventId)
        .then(setOccurrences)
        .catch(() => {})
  })

  const openCreateDialog = () => {
    setCategory('CONVIDADO')
    setDescription('')
    setResponsible(user?.name || 'Hugo Cerimonial')
    setSolution('')
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !description.trim()) return
    setIsSubmitting(true)
    try {
      await occurrenceService.create({
        event_id: eventId,
        category,
        description,
        responsible,
        solution,
      })
      toast({
        title: 'Ocorrência registrada!',
        description: 'Registro salvo no histórico do evento.',
      })
      setIsDialogOpen(false)
      loadData()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar ocorrência.'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta ocorrência?')) return
    try {
      await occurrenceService.delete(id)
      toast({ title: 'Ocorrência removida.' })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao remover', variant: 'destructive' })
    }
  }

  const filteredOccurrences = useMemo(() => {
    if (categoryFilter === 'ALL') return occurrences
    return occurrences.filter((o) => o.category === categoryFilter)
  }, [occurrences, categoryFilter])

  const getCategoryBadge = (cat: OccurrenceCategory) => {
    switch (cat) {
      case 'CONVIDADO':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">CONVIDADO</Badge>
        )
      case 'MESA':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">MESA</Badge>
        )
      case 'BUFFET':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-[10px]">
            BUFFET
          </Badge>
        )
      case 'EQUIPE':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-[10px]">
            EQUIPE
          </Badge>
        )
      case 'FORNECEDOR':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
            FORNECEDOR
          </Badge>
        )
      case 'PROTOCOLO':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 text-[10px]">PROTOCOLO</Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            OUTRO
          </Badge>
        )
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <AlertTriangle className="w-4 h-4" /> Gestão de Incidentes
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-[#1C1A17]">
            Registro de Ocorrências ({occurrences.length})
          </h1>
          <p className="text-sm text-[#6B6356] mt-1">
            Histórico cronológico de imprevistos, responsáveis acionados e soluções imediatas
            adotadas.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Adicionar Ocorrência
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6B6356]" />
          <span className="font-semibold text-[#6B6356]">Filtrar por Categoria:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-44 text-xs bg-neutral-50">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Categorias</SelectItem>
              <SelectItem value="CONVIDADO">Convidado</SelectItem>
              <SelectItem value="MESA">Mesa</SelectItem>
              <SelectItem value="BUFFET">Buffet</SelectItem>
              <SelectItem value="EQUIPE">Equipe</SelectItem>
              <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
              <SelectItem value="PROTOCOLO">Protocolo</SelectItem>
              <SelectItem value="OUTRO">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {categoryFilter !== 'ALL' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryFilter('ALL')}
            className="text-xs text-[#6B6356]"
          >
            Limpar Filtro
          </Button>
        )}
      </div>

      {/* Occurrences List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A45F] border-t-transparent" />
        </div>
      ) : filteredOccurrences.length === 0 ? (
        <Card className="text-center py-16 bg-white border-dashed">
          <CardContent>
            <AlertTriangle className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#221E1A]">Nenhuma ocorrência registrada.</p>
            <p className="text-xs text-[#6B6356] mt-1">
              O evento está transcorrendo em perfeita harmonia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOccurrences.map((occ) => {
            const timeStr = occ.created
              ? new Date(occ.created).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '--:--'

            return (
              <Card
                key={occ.id}
                className="bg-white border-neutral-200 hover:border-[#C5A45F] transition-all shadow-sm"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {getCategoryBadge(occ.category)}
                      <span className="flex items-center gap-1 text-xs text-[#6B6356]">
                        <Clock className="w-3.5 h-3.5 text-[#C5A45F]" />
                        {timeStr}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(occ.id)}
                      className="h-7 w-7 text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1C1A17]">
                      {occ.description}
                    </h3>
                  </div>

                  {/* Solution Box */}
                  {occ.solution && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 uppercase tracking-wider text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Solução Adotada:
                      </div>
                      <p className="leading-relaxed pl-5">{occ.solution}</p>
                    </div>
                  )}

                  {/* Responsible footer */}
                  <div className="pt-2 border-t border-neutral-100 text-xs text-[#6B6356] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      Responsável pelo registro:{' '}
                      <strong className="text-neutral-800">
                        {occ.responsible || 'Cerimonial'}
                      </strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) on mobile */}
      <div className="sm:hidden fixed bottom-20 right-4 z-40">
        <Button
          onClick={openCreateDialog}
          className="w-14 h-14 rounded-full bg-[#C5A45F] text-[#1C1A17] hover:bg-[#B08F4A] shadow-2xl flex items-center justify-center p-0"
        >
          <Plus className="w-7 h-7" />
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Registrar Ocorrência</DialogTitle>
              <DialogDescription>
                Anote o incidente ocorrido durante a festa e a respectiva solução rápida.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <Label htmlFor="occ-cat">Categoria da Ocorrência</Label>
                <Select
                  value={category}
                  onValueChange={(val: OccurrenceCategory) => setCategory(val)}
                >
                  <SelectTrigger id="occ-cat">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONVIDADO">Convidado</SelectItem>
                    <SelectItem value="MESA">Mesa</SelectItem>
                    <SelectItem value="BUFFET">Buffet</SelectItem>
                    <SelectItem value="EQUIPE">Equipe</SelectItem>
                    <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                    <SelectItem value="PROTOCOLO">Protocolo</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occ-desc">Descrição do Fato *</Label>
                <Textarea
                  id="occ-desc"
                  required
                  rows={3}
                  placeholder="Ex: Convidado solicitou troca de mesa pois prefere sentar perto do ar condicionado."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occ-resp">Responsável Acionado</Label>
                <Input
                  id="occ-resp"
                  placeholder="Ex: Hugo Cerimonial / Camila (Recepção)"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occ-sol">Solução Adotada</Label>
                <Textarea
                  id="occ-sol"
                  rows={2}
                  placeholder="Ex: Convidado transferido para a Mesa 04 com vaga livre."
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
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
                {isSubmitting ? 'Salvando...' : 'Salvar Ocorrência'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
