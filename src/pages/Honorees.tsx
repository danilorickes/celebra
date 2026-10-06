import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  honoreeService,
  tableService,
  guestService,
  whatsappService,
  auditService,
} from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type {
  HonoreeRecord,
  TableRecord,
  GuestRecord,
  HonoreeOperationalState,
} from '@/types/celebra'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Award,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Music,
  Camera,
  Tv,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// 11 OPERATIONAL STATES (Requirement H)
const OPERATIONAL_STATES: Record<
  HonoreeOperationalState,
  { label: string; badgeClass: string; desc: string }
> = {
  AGUARDANDO: {
    label: 'Aguardando',
    badgeClass: 'bg-neutral-200 text-neutral-800',
    desc: 'Na mesa aguardando programação',
  },
  AVISADO: {
    label: 'Avisado',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    desc: 'Notificação enviada por WhatsApp',
  },
  CONFIRMOU_RECEBIMENTO: {
    label: 'Confirmou Recebimento',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    desc: 'Homenageado ciente de que será o próximo',
  },
  EM_PREPARACAO: {
    label: 'Em Preparação',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    desc: 'Condutor localizando e posicionando no recuo',
  },
  PROXIMO: {
    label: 'Próximo a Subir',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse',
    desc: 'Pronto na lateral esquerda do palco',
  },
  CHAMADO: {
    label: 'Chamado no Microfone',
    badgeClass: 'bg-amber-500 text-white font-bold',
    desc: 'Hugo anunciando o nome',
  },
  NO_PALCO: {
    label: 'No Palco',
    badgeClass: 'bg-emerald-600 text-white font-bold',
    desc: 'Recebendo troféu e homenagens',
  },
  FOTOGRAFIA: {
    label: 'Fotografia Oficial',
    badgeClass: 'bg-indigo-600 text-white',
    desc: 'Posando no backdrop com fotógrafo',
  },
  CONCLUIDO: {
    label: 'Concluído',
    badgeClass: 'bg-neutral-800 text-[#C5A45F]',
    desc: 'Homenagem finalizada com sucesso',
  },
  AUSENTE: {
    label: 'Ausente',
    badgeClass: 'bg-red-600 text-white',
    desc: 'Não compareceu ao evento',
  },
  EXCECAO: {
    label: 'Exceção / Remanejado',
    badgeClass: 'bg-red-800 text-white',
    desc: 'Inversão ou atraso de ordem',
  },
}

export default function Honorees() {
  const { eventId } = useParams<{ eventId: string }>()
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [tables, setTables] = useState<TableRecord[]>([])
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [search, setSearch] = useState('')
  const [filterState, setFilterState] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)

  // Edit / Conduct Honoree Modal
  const [selectedHonoree, setSelectedHonoree] = useState<HonoreeRecord | null>(null)
  const [editState, setEditState] = useState<HonoreeOperationalState>('AGUARDANDO')
  const [editEscort, setEditEscort] = useState('')
  const [editConductor, setEditConductor] = useState('Renato Apoio')
  const [editMusic, setEditMusic] = useState('')
  const [editResources, setEditResources] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // WhatsApp Alert Modal
  const [wpModalHonoree, setWpModalHonoree] = useState<HonoreeRecord | null>(null)
  const [wpMsg, setWpMsg] = useState('')
  const [isSendingWp, setIsSendingWp] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [hList, tList, gList] = await Promise.all([
        honoreeService.list(eventId),
        tableService.list(eventId),
        guestService.list(eventId),
      ])
      setHonorees(hList)
      setTables(tList)
      setGuests(gList)
    } catch (_) {
      toast({ title: 'Erro ao carregar homenageados', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  useRealtime<HonoreeRecord>('honorees', () => {
    if (eventId)
      honoreeService
        .list(eventId)
        .then(setHonorees)
        .catch(() => {})
  })

  // Recalculate automatic sequence notice (Requirement H: Mudanças na programação recalculam os próximos avisos automaticamente sem Hugo comunicar manualmente)
  const handleAdvanceState = async (honoree: HonoreeRecord, nextState: HonoreeOperationalState) => {
    if (!eventId) return
    try {
      await honoreeService.update(honoree.id, {
        operational_state: nextState,
        actual_time: nextState === 'NO_PALCO' ? new Date().toISOString() : undefined,
      })

      // If this one is NO_PALCO, automatically advance the next in order to PROXIMO and dispatch WhatsApp
      if (nextState === 'NO_PALCO') {
        const nextOrder = (honoree.tribute_order || 0) + 1
        const nextHonoree = honorees.find((h) => (h.tribute_order || 0) === nextOrder)
        if (nextHonoree && nextHonoree.operational_state !== 'CONCLUIDO') {
          await honoreeService.update(nextHonoree.id, {
            operational_state: 'PROXIMO',
          })
          // Auto dispatch WhatsApp alert to next honoree
          whatsappService
            .sendSimulated({
              event_id: eventId,
              recipient_name: nextHonoree.name,
              recipient_phone: nextHonoree.phone || '(11) 98765-0000',
              recipient_role: 'Homenageado',
              category: 'HOMENAGEADO_CHAMADA',
              message: `Olá ${nextHonoree.name}! Você é o PRÓXIMO na ordem de homenagens da Festa dos Destaques 2026. O apoio ${nextHonoree.conductor_responsible || 'Renato'} já está a caminho da sua mesa para conduzi-lo ao palco.`,
            })
            .catch(() => {})
        }
      }

      toast({
        title: `Status de ${honoree.name} atualizado para: ${OPERATIONAL_STATES[nextState].label}`,
      })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  // Save detailed honoree info
  const handleSaveHonoree = async () => {
    if (!selectedHonoree) return
    setIsUpdating(true)
    try {
      await honoreeService.update(selectedHonoree.id, {
        operational_state: editState,
        escort_name: editEscort,
        conductor_responsible: editConductor,
        music_cue: editMusic,
        stage_resources: editResources,
      })
      toast({ title: 'Dados do homenageado salvos com sucesso!' })
      setSelectedHonoree(null)
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao salvar homenageado', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }

  // Send WhatsApp manually
  const handleSendManualWhatsApp = async () => {
    if (!eventId || !wpModalHonoree) return
    setIsSendingWp(true)
    try {
      await whatsappService.sendSimulated({
        event_id: eventId,
        recipient_name: wpModalHonoree.name,
        recipient_phone: wpModalHonoree.phone || '(11) 99999-0000',
        recipient_role: 'Homenageado',
        category: 'HOMENAGEADO_CHAMADA',
        message: wpMsg,
      })
      await honoreeService.update(wpModalHonoree.id, {
        operational_state: 'AVISADO',
      })
      toast({
        title: 'Mensagem enviada com sucesso!',
        description: `Status alterado para "Avisado" automaticamente.`,
      })
      setWpModalHonoree(null)
      setWpMsg('')
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao enviar WhatsApp', variant: 'destructive' })
    } finally {
      setIsSendingWp(false)
    }
  }

  // Filtered Honorees
  const filteredHonorees = useMemo(() => {
    return honorees.filter((h) => {
      const matchSearch =
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        (h.escort_name && h.escort_name.toLowerCase().includes(search.toLowerCase()))
      const matchFilter =
        filterState === 'ALL' || (h.operational_state || 'AGUARDANDO') === filterState
      return matchSearch && matchFilter
    })
  }, [honorees, search, filterState])

  const onStageHonoree = honorees.find((h) => h.operational_state === 'NO_PALCO')
  const nextHonoree = honorees.find((h) => h.operational_state === 'PROXIMO')

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 sm:py-6 space-y-6 pb-24">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <Award className="w-4 h-4" /> Cerimonial de Premiação & Protocolo
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white tracking-tight">
            Painel dos 30 Homenageados da Festa
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            11 estados operacionais, recálculo automático de chamadas, condutores responsáveis e
            trilhas musicais.
          </p>
        </div>

        {/* Live Stage Highlights */}
        <div className="flex items-center gap-2">
          {onStageHonoree && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-serif text-xs py-1.5 px-3">
              No Palco Agora: #{onStageHonoree.tribute_order} {onStageHonoree.name}
            </Badge>
          )}
          {nextHonoree && (
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-serif text-xs py-1.5 px-3 animate-pulse">
              Próximo: #{nextHonoree.tribute_order} {nextHonoree.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Control / Search Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#161412] p-3.5 rounded-2xl border border-[#2B2620] shadow-elevation">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
          <Input
            placeholder="Buscar por nome do homenageado ou acompanhante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-xs bg-[#1C1915] border-[#332D24] text-white focus:border-[#C5A45F]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger className="w-[200px] h-10 text-xs bg-[#1C1915] border-[#332D24] text-white">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-[#1C1813] border-[#383125] text-white">
              <SelectItem value="ALL">Todos os Estados ({honorees.length})</SelectItem>
              {Object.entries(OPERATIONAL_STATES).map(([k, cfg]) => (
                <SelectItem key={k} value={k}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 30 Honorees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHonorees.map((h) => {
          const stKey = (h.operational_state || 'AGUARDANDO') as HonoreeOperationalState
          const stateCfg = OPERATIONAL_STATES[stKey] || OPERATIONAL_STATES.AGUARDANDO
          const assignedTable = tables.find((t) => t.id === h.table_id)
          const isOnStage = stKey === 'NO_PALCO'
          const isNext = stKey === 'PROXIMO'

          return (
            <div
              key={h.id}
              className={`rounded-2xl p-5 border transition-all bg-[#161412] shadow-elevation flex flex-col justify-between ${
                isOnStage
                  ? 'border-emerald-500 bg-[#121F16] ring-2 ring-emerald-500 shadow-md'
                  : isNext
                    ? 'border-amber-400 bg-[#1F1911] ring-2 ring-amber-400'
                    : 'border-[#2B2620] hover:border-[#C5A45F]'
              }`}
            >
              <div>
                {/* Header: Order badge + State Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#24201B] border border-[#383125] text-[#C5A45F] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                      #{h.tribute_order || '•'}
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-base text-white leading-tight">
                        {h.name}
                      </h3>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Mesa:{' '}
                        <strong className="text-[#C5A45F]">
                          {assignedTable?.name || 'Mesa 01'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <Badge className={`text-[10px] font-bold shrink-0 ${stateCfg.badgeClass}`}>
                    {stateCfg.label}
                  </Badge>
                </div>

                {/* Presentation & Details */}
                <div className="space-y-2 text-xs py-2 border-t border-[#25201A]">
                  {h.escort_name && (
                    <div className="text-neutral-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-neutral-500" />
                      <span>
                        Acompanhante: <strong className="text-white">{h.escort_name}</strong>
                      </span>
                    </div>
                  )}

                  <div className="text-neutral-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>
                      Condutor:{' '}
                      <strong className="text-white">
                        {h.conductor_responsible || 'Renato Apoio'}
                      </strong>
                    </span>
                  </div>

                  {h.music_cue && (
                    <div className="text-[11px] text-purple-300 bg-purple-950/40 border border-purple-800/60 p-2 rounded-xl flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-purple-400" />
                      <span>Trilha: {h.music_cue}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action footer */}
              <div className="pt-3 border-t border-[#25201A] space-y-2">
                {/* Stepper buttons according to state */}
                <div className="grid grid-cols-2 gap-2">
                  {stKey === 'AGUARDANDO' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setWpModalHonoree(h)
                        setWpMsg(
                          `Olá ${h.name}! Informamos que a sua homenagem na Festa dos Destaques 2026 está próxima. O apoio ${h.conductor_responsible || 'Renato'} irá localizá-lo em sua mesa (${assignedTable?.name || 'Mesa'}).`,
                        )
                      }}
                      className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1 rounded-xl"
                    >
                      <Send className="w-3 h-3" /> [1] Avisar WhatsApp
                    </Button>
                  )}
                  {stKey === 'AVISADO' && (
                    <Button
                      size="sm"
                      onClick={() => handleAdvanceState(h, 'CONFIRMOU_RECEBIMENTO')}
                      className="text-xs h-8 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-xl"
                    >
                      [2] Confirmou Ciente
                    </Button>
                  )}
                  {stKey === 'CONFIRMOU_RECEBIMENTO' && (
                    <Button
                      size="sm"
                      onClick={() => handleAdvanceState(h, 'EM_PREPARACAO')}
                      className="text-xs h-8 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl"
                    >
                      [3] Em Preparação
                    </Button>
                  )}
                  {stKey === 'EM_PREPARACAO' && (
                    <Button
                      size="sm"
                      onClick={() => handleAdvanceState(h, 'PROXIMO')}
                      className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                    >
                      [4] Chamar p/ Recuo
                    </Button>
                  )}
                  {stKey === 'PROXIMO' && (
                    <Button
                      size="sm"
                      onClick={() => handleAdvanceState(h, 'NO_PALCO')}
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                    >
                      [5] Subir ao Palco!
                    </Button>
                  )}
                  {stKey === 'NO_PALCO' && (
                    <Button
                      size="sm"
                      onClick={() => handleAdvanceState(h, 'FOTOGRAFIA')}
                      className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                    >
                      [6] Ir p/ Fotografia
                    </Button>
                  )}
                  {stKey === 'FOTOGRAFIA' && (
                    <Button
                      size="sm"
                      onClick={() => handleAdvanceState(h, 'CONCLUIDO')}
                      className="text-xs h-8 bg-[#24201B] hover:bg-[#322C25] text-white border border-[#3D3528] font-bold rounded-xl"
                    >
                      [7] Finalizar
                    </Button>
                  )}
                  {stKey === 'CONCLUIDO' && (
                    <div className="col-span-2 text-center text-xs text-emerald-300 font-semibold py-1 bg-emerald-950/40 rounded-xl border border-emerald-800/60">
                      ✓ Homenagem Realizada
                    </div>
                  )}

                  {/* Edit details button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedHonoree(h)
                      setEditState((h.operational_state || 'AGUARDANDO') as HonoreeOperationalState)
                      setEditEscort(h.escort_name || '')
                      setEditConductor(h.conductor_responsible || 'Renato Apoio')
                      setEditMusic(h.music_cue || '')
                      setEditResources(h.stage_resources || '')
                    }}
                    className={`text-xs h-8 border-[#332D24] text-neutral-300 hover:bg-[#201D18] font-medium rounded-xl ${
                      stKey === 'CONCLUIDO' ? 'col-span-2' : ''
                    }`}
                  >
                    Ficha / Recursos
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* EDIT HONOREE MODAL */}
      {selectedHonoree && (
        <Dialog open={!!selectedHonoree} onOpenChange={(open) => !open && setSelectedHonoree(null)}>
          <DialogContent className="sm:max-w-[550px] bg-[#161412] text-white border border-[#332D24] rounded-2xl shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#24201B] border border-[#383125] text-[#C5A45F] font-serif font-bold text-xs flex items-center justify-center">
                  #{selectedHonoree.tribute_order}
                </span>
                <DialogTitle className="font-serif text-xl text-white">
                  {selectedHonoree.name}
                </DialogTitle>
              </div>
              <DialogDescription className="text-neutral-400 text-xs">
                Configuração operacional de palco, acompanhante, condutor e áudio.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="h-state" className="font-bold text-neutral-300">
                  Estado Operacional Atual:
                </Label>
                <Select
                  value={editState}
                  onValueChange={(v) => setEditState(v as HonoreeOperationalState)}
                >
                  <SelectTrigger
                    id="h-state"
                    className="h-10 bg-[#1C1915] border-[#332D24] text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1813] border-[#383125] text-white">
                    {Object.entries(OPERATIONAL_STATES).map(([k, cfg]) => (
                      <SelectItem key={k} value={k}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="h-escort" className="text-neutral-300">
                    Acompanhante:
                  </Label>
                  <Input
                    id="h-escort"
                    value={editEscort}
                    onChange={(e) => setEditEscort(e.target.value)}
                    className="h-9 bg-[#1C1915] border-[#332D24] text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="h-cond" className="text-neutral-300">
                    Condutor Responsável:
                  </Label>
                  <Input
                    id="h-cond"
                    value={editConductor}
                    onChange={(e) => setEditConductor(e.target.value)}
                    className="h-9 bg-[#1C1915] border-[#332D24] text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="h-music" className="text-neutral-300">
                  Música / Deixa de Entrada:
                </Label>
                <Input
                  id="h-music"
                  placeholder="Ex: Fanfarra Destaques Trilha 12"
                  value={editMusic}
                  onChange={(e) => setEditMusic(e.target.value)}
                  className="h-9 bg-[#1C1915] border-[#332D24] text-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="h-res" className="text-neutral-300">
                  Recursos de Palco / Especial:
                </Label>
                <Input
                  id="h-res"
                  placeholder="Ex: Rampa de acesso, microfone sem fio, slide no telão..."
                  value={editResources}
                  onChange={(e) => setEditResources(e.target.value)}
                  className="h-9 bg-[#1C1915] border-[#332D24] text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedHonoree(null)}
                className="border-[#332D24] text-neutral-300 hover:bg-[#201D18]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveHonoree}
                disabled={isUpdating}
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-bold rounded-xl"
              >
                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* WHATSAPP MODAL FOR HONOREE */}
      {wpModalHonoree && (
        <Dialog open={!!wpModalHonoree} onOpenChange={(open) => !open && setWpModalHonoree(null)}>
          <DialogContent className="sm:max-w-[480px] bg-[#141E17] text-white border border-emerald-500/60 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl flex items-center gap-2 text-emerald-300">
                <Send className="w-5 h-5 text-emerald-400" /> Aviso de Chamada via WhatsApp
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Homenageado: <strong className="text-white">{wpModalHonoree.name}</strong> • Ordem:
                #{wpModalHonoree.tribute_order}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <Label htmlFor="h-wp-text" className="text-neutral-300">
                Mensagem para o Homenageado:
              </Label>
              <textarea
                id="h-wp-text"
                rows={3}
                value={wpMsg}
                onChange={(e) => setWpMsg(e.target.value)}
                className="w-full rounded-xl border border-emerald-800/80 bg-[#1B291F] p-2.5 text-xs text-white focus:ring-2 focus:ring-[#C5A45F]"
              />
              <p className="text-[11px] text-neutral-400">
                O envio será registrado no WhatsApp simulado e mudará o status para{' '}
                <strong className="text-white">"Avisado"</strong>.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setWpModalHonoree(null)}
                className="border-[#2B3B30] text-neutral-300 hover:bg-[#203126]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendManualWhatsApp}
                disabled={isSendingWp || !wpMsg.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                {isSendingWp ? 'Enviando...' : 'Despachar WhatsApp'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
