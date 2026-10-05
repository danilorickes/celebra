import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventService } from '@/services/celebraService'
import type { EventRecord } from '@/types/celebra'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Calendar, Plus, Users, ArrowRight, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function EventSelect() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('2026-11-07')
  const [profile, setProfile] = useState('Elegante')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const { toast } = useToast()

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const list = await eventService.list()
      setEvents(list)
    } catch (_) {
      toast({
        title: 'Erro ao carregar eventos',
        description: 'Tente recarregar a página.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const created = await eventService.create({
        name,
        date: new Date(date).toISOString(),
        profile,
        status: 'ATIVO',
      })
      toast({
        title: 'Evento criado com sucesso!',
        description: `Evento "${created.name}" pronto para ser configurado.`,
      })
      setOpenCreate(false)
      setName('')
      loadEvents()
      navigate(`/app/${created.id}/dashboard`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar evento.'
      toast({
        title: 'Erro ao criar evento',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Sparkles className="w-4 h-4" /> Multi-Evento Operacional
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17] font-serif">
            Selecione o Evento Operacional
          </h1>
          <p className="text-sm text-[#6B6356] mt-1">
            Escolha o evento que a equipe do cerimonial irá operar hoje.
          </p>
        </div>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Criar Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px] bg-white">
            <form onSubmit={handleCreateEvent}>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Novo Evento</DialogTitle>
                <DialogDescription>
                  Adicione um novo evento para gerenciar homenageados, mesas e protocolos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="event-name">Nome do Evento</Label>
                  <Input
                    id="event-name"
                    required
                    placeholder="Ex: Baile de Gala 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-date">Data do Evento</Label>
                  <Input
                    id="event-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-profile">Perfil do Evento</Label>
                  <Select value={profile} onValueChange={setProfile}>
                    <SelectTrigger id="event-profile">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Elegante">Elegante / Solenidade</SelectItem>
                      <SelectItem value="Corporativo">Corporativo / Premiação</SelectItem>
                      <SelectItem value="Casamento">Casamento Luxo</SelectItem>
                      <SelectItem value="Social">Social / Debutante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenCreate(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar e Acessar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A45F] border-t-transparent" />
          <p className="text-sm text-[#6B6356]">Carregando eventos cadastrados...</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16 border-dashed bg-white">
          <CardContent>
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-[#6B6356]">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#221E1A]">Nenhum evento encontrado</h3>
            <p className="text-sm text-[#6B6356] max-w-sm mx-auto mt-1 mb-6">
              Comece cadastrando o evento principal para iniciar a operação do cerimonial.
            </p>
            <Button
              onClick={() => setOpenCreate(true)}
              className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold"
            >
              Criar Primeiro Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((ev) => {
            const isMainPilot = ev.name.toLowerCase().includes('destaques')
            const formattedDate = ev.date
              ? new Date(ev.date)
                  .toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                  .toUpperCase()
              : 'DATA NÃO DEFINIDA'

            return (
              <Card
                key={ev.id}
                onClick={() => navigate(`/app/${ev.id}/dashboard`)}
                className={`relative cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border ${
                  isMainPilot
                    ? 'border-[#C5A45F] bg-gradient-to-br from-[#1C1A17] to-[#2B2722] text-white'
                    : 'border-neutral-200 bg-white hover:border-[#C5A45F]'
                }`}
              >
                {isMainPilot && (
                  <div className="absolute top-4 right-4 bg-[#C5A45F] text-[#1C1A17] text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Sparkles className="w-3 h-3 fill-current" /> Evento Piloto Real
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C5A45F] uppercase">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate}
                  </div>
                  <CardTitle
                    className={`text-xl font-serif font-bold mt-1 ${isMainPilot ? 'text-white' : 'text-[#1C1A17]'}`}
                  >
                    {ev.name}
                  </CardTitle>
                  <CardDescription className={isMainPilot ? 'text-neutral-400' : 'text-[#6B6356]'}>
                    Perfil:{' '}
                    <span className="font-medium text-neutral-200">{ev.profile || 'Elegante'}</span>{' '}
                    • Status: <span className="text-emerald-400 font-semibold">{ev.status}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div
                    className={`flex items-center justify-between pt-4 border-t ${isMainPilot ? 'border-[#3D3833]' : 'border-neutral-100'}`}
                  >
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <Users className="w-4 h-4 text-[#C5A45F]" />
                        {isMainPilot ? '30 homenageados' : 'Equipe completa'}
                      </span>
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Comando Ativo
                      </span>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${isMainPilot ? 'text-[#C5A45F]' : 'text-[#C5A45F]'}`}
                    >
                      Acessar Central <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
