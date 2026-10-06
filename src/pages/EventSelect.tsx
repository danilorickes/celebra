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
    <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12 text-[#F6F4F0]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Sparkles className="w-4 h-4" /> Multi-Evento Operacional
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
            Selecione o Evento Operacional
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Escolha o evento que a equipe do cerimonial irá operar hoje.
          </p>
        </div>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-semibold gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(197,164,95,0.3)] h-11 min-h-[44px] px-5 rounded-xl">
              <Plus className="w-4 h-4" /> Criar Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[460px] bg-[#161412] border-[#29241E] text-[#F6F4F0] shadow-2xl">
            <form onSubmit={handleCreateEvent}>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl text-white">Novo Evento</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Adicione um novo evento para gerenciar homenageados, mesas e protocolos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="event-name"
                    className="text-neutral-300 text-xs uppercase tracking-wider font-medium"
                  >
                    Nome do Evento
                  </Label>
                  <Input
                    id="event-name"
                    required
                    placeholder="Ex: Baile de Gala 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[#1A1816] border-[#312B22] text-white focus:border-[#C5A45F] focus:ring-[#C5A45F]/30 h-11 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="event-date"
                    className="text-neutral-300 text-xs uppercase tracking-wider font-medium"
                  >
                    Data do Evento
                  </Label>
                  <Input
                    id="event-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-[#1A1816] border-[#312B22] text-white focus:border-[#C5A45F] focus:ring-[#C5A45F]/30 h-11 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="event-profile"
                    className="text-neutral-300 text-xs uppercase tracking-wider font-medium"
                  >
                    Perfil do Evento
                  </Label>
                  <Select value={profile} onValueChange={setProfile}>
                    <SelectTrigger
                      id="event-profile"
                      className="bg-[#1A1816] border-[#312B22] text-white focus:border-[#C5A45F] focus:ring-[#C5A45F]/30 h-11 rounded-xl text-sm"
                    >
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1816] border-[#312B22] text-[#F6F4F0]">
                      <SelectItem value="Elegante">Elegante / Solenidade</SelectItem>
                      <SelectItem value="Corporativo">Corporativo / Premiação</SelectItem>
                      <SelectItem value="Casamento">Casamento Luxo</SelectItem>
                      <SelectItem value="Social">Social / Debutante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenCreate(false)}
                  disabled={isSubmitting}
                  className="bg-[#1A1816] border-[#312B22] text-neutral-300 hover:text-white hover:bg-[#211E1B] h-11 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-semibold h-11 rounded-xl shadow-md"
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
          <p className="text-sm text-neutral-400">Carregando eventos cadastrados...</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-[#29241E] bg-[#161412] text-[#F6F4F0] rounded-2xl">
          <CardContent>
            <div className="w-12 h-12 rounded-full bg-[#1A1816] border border-[#312B22] flex items-center justify-center mx-auto mb-4 text-[#C5A45F]">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Nenhum evento encontrado</h3>
            <p className="text-sm text-neutral-400 max-w-sm mx-auto mt-1 mb-6">
              Comece cadastrando o evento principal para iniciar a operação do cerimonial.
            </p>
            <Button
              onClick={() => setOpenCreate(true)}
              className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-semibold h-11 px-5 rounded-xl shadow-md"
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
                className={`relative cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl border rounded-2xl ${
                  isMainPilot
                    ? 'border-[#C5A45F] bg-gradient-to-br from-[#161412] via-[#1A1816] to-[#211E1B] text-[#F6F4F0] ring-1 ring-[#C5A45F]/30 shadow-[0_0_20px_rgba(197,164,95,0.12)]'
                    : 'border-[#29241E] bg-[#161412] hover:border-[#C5A45F]/60 hover:bg-[#1A1816] text-[#F6F4F0]'
                }`}
              >
                {isMainPilot && (
                  <div className="absolute top-4 right-4 bg-[#C5A45F] text-[#141210] text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Sparkles className="w-3 h-3 fill-current" /> Evento Piloto Real
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C5A45F] uppercase">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate}
                  </div>
                  <CardTitle className="text-xl font-serif font-bold mt-1 text-white">
                    {ev.name}
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    Perfil:{' '}
                    <span className="font-medium text-neutral-200">{ev.profile || 'Elegante'}</span>{' '}
                    • Status: <span className="text-emerald-400 font-semibold">{ev.status}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="flex items-center justify-between pt-4 border-t border-[#29241E]">
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

                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#C5A45F] group-hover:text-[#E5C989]">
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
