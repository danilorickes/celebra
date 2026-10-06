import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  checklistService,
  whatsappService,
  auditService,
  eventService,
} from '@/services/celebraService'
import { useRealtime } from '@/hooks/use-realtime'
import type { ChecklistItemRecord, ChecklistArea, ChecklistStatus } from '@/types/celebra'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckSquare,
  AlertTriangle,
  Send,
  ShieldAlert,
  Clock,
  Sparkles,
  Camera,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Lock,
  ArrowUpRight,
  Filter,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const AREA_LABELS: Record<ChecklistArea, string> = {
  MESAS_CADEIRAS: 'Mesas e Cadeiras',
  ARRANJOS_DECORACAO: 'Arranjos e Decoração',
  RECEPCAO: 'Recepção e Acesso',
  BUFFET: 'Buffet Gastronômico',
  BEBIDAS: 'Bebidas e Bar',
  SOM: 'Sonorização',
  ILUMINACAO: 'Iluminação Cênica',
  TELAO: 'Telão LED / Vídeo',
  PALCO: 'Palco e Cerimonial',
  FOTOGRAFIA: 'Fotografia e Backdrop',
  EQUIPE: 'Equipe e Briefing',
  FORNECEDORES: 'Fornecedores Gerais',
  ACESSIBILIDADE: 'Rotas de Acessibilidade',
  RESTRICOES_ALIMENTARES: 'Restrições Alimentares',
  CONTATOS_COMUNICACAO: 'Comunicação e Rádios/WhatsApp',
  MATERIAIS_CONTINGENCIA: 'Materiais de Contingência',
}

const STATUS_LABELS: Record<ChecklistStatus, { label: string; class: string }> = {
  NAO_INICIADO: { label: 'Não Iniciado', class: 'bg-neutral-200 text-neutral-800' },
  EM_ANDAMENTO: { label: 'Em Andamento', class: 'bg-amber-100 text-amber-900 border-amber-300' },
  AGUARDANDO_TERCEIRO: { label: 'Aguardando Fornecedor', class: 'bg-purple-100 text-purple-900' },
  CONCLUIDO: { label: 'Concluído', class: 'bg-emerald-600 text-white' },
  BLOQUEADO: { label: 'Bloqueado', class: 'bg-red-700 text-white font-bold animate-pulse' },
  ATRASADO: { label: 'Atrasado', class: 'bg-red-600 text-white' },
}

export default function Checklist() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<ChecklistItemRecord[]>([])
  const [selectedArea, setSelectedArea] = useState<string>('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Edit / Confirm Item modal
  const [editingItem, setEditingItem] = useState<ChecklistItemRecord | null>(null)
  const [editStatus, setEditStatus] = useState<ChecklistStatus>('CONCLUIDO')
  const [editEvidenceNotes, setEditEvidenceNotes] = useState('')
  const [editEvidencePhoto, setEditEvidencePhoto] = useState('')
  const [editReceived, setEditReceived] = useState(true)
  const [editUnderstood, setEditUnderstood] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Bypass / Override Dialog (Requirement D: Bloqueio só ignorável com justificativa e autorização)
  const [isBypassDialogOpen, setIsBypassDialogOpen] = useState(false)
  const [bypassItem, setBypassItem] = useState<ChecklistItemRecord | null>(null)
  const [bypassAuthorizer, setBypassAuthorizer] = useState('Hugo Cerimonial')
  const [bypassJustification, setBypassJustification] = useState('')

  // Simulated WhatsApp Urgency Alert Dialog
  const [whatsAppPromptItem, setWhatsAppPromptItem] = useState<ChecklistItemRecord | null>(null)
  const [whatsAppMsgCustom, setWhatsAppMsgCustom] = useState('')
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const list = await checklistService.list(eventId)
      setItems(list)
    } catch (_) {
      toast({ title: 'Erro ao carregar checklist', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  useRealtime<ChecklistItemRecord>('checklist_items', () => {
    if (eventId)
      checklistService
        .list(eventId)
        .then(setItems)
        .catch(() => {})
  })

  // Critical blocks calculation
  const criticalPendingItems = useMemo(() => {
    return items.filter((i) => i.is_critical && i.status !== 'CONCLUIDO' && !i.bypass_authorized_by)
  }, [items])

  const totalItems = items.length
  const completedItems = items.filter(
    (i) => i.status === 'CONCLUIDO' || i.bypass_authorized_by,
  ).length
  const isEventReady = totalItems > 0 && criticalPendingItems.length === 0

  // Filtered Items
  const filteredItems = useMemo(() => {
    let res = items
    if (selectedArea !== 'ALL') {
      res = res.filter((i) => i.area === selectedArea)
    }
    if (urgencyFilter) {
      res = res.filter((i) => i.is_critical || i.status === 'BLOQUEADO' || i.status === 'ATRASADO')
    }
    return res
  }, [items, selectedArea, urgencyFilter])

  // Save regular item confirmation
  const handleSaveItem = async () => {
    if (!editingItem) return
    setIsUpdating(true)
    try {
      await checklistService.update(editingItem.id, {
        status: editStatus,
        evidence_notes: editEvidenceNotes,
        evidence_photo: editEvidencePhoto,
        received_confirmed: editReceived,
        understood_confirmed: editUnderstood,
        confirmed_at: editStatus === 'CONCLUIDO' ? new Date().toISOString() : undefined,
      })
      toast({ title: 'Item do checklist atualizado com sucesso!' })
      setEditingItem(null)
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' })
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle Escalation & WhatsApp Charge (Requirement D)
  const handleSendUrgencyWhatsApp = async () => {
    if (!eventId || !whatsAppPromptItem) return
    setIsSendingWhatsApp(true)
    try {
      const text =
        whatsAppMsgCustom ||
        `URGÊNCIA CELEBRA: Abertura iminente! O item "${whatsAppPromptItem.description}" sob sua responsabilidade (${whatsAppPromptItem.responsible}) está PENDENTE. Por favor, confirme o status imediatamente.`

      await whatsappService.sendSimulated({
        event_id: eventId,
        recipient_name: whatsAppPromptItem.responsible,
        recipient_phone: '(11) 98765-0001',
        recipient_role: whatsAppPromptItem.supplier_sector || 'Responsável',
        category: 'COBRANCA_CHECKLIST',
        message: text,
      })

      toast({
        title: 'Cobrança enviada via WhatsApp simulado!',
        description: `Notificação despachada para ${whatsAppPromptItem.responsible}.`,
      })
      setWhatsAppPromptItem(null)
      setWhatsAppMsgCustom('')
    } catch (_) {
      toast({ title: 'Erro ao despachar cobrança', variant: 'destructive' })
    } finally {
      setIsSendingWhatsApp(false)
    }
  }

  // Handle Bypass / Authorization of Critical Block (Requirement D)
  const handleBypassBlock = async () => {
    if (!eventId || !bypassItem || !bypassJustification.trim()) return
    try {
      await checklistService.update(bypassItem.id, {
        bypass_authorized_by: bypassAuthorizer,
        bypass_justification: bypassJustification,
      })
      await auditService.log({
        event_id: eventId,
        actor_name: bypassAuthorizer,
        actor_role: 'Coordenação Geral',
        action: 'CHECKLIST_BLOQUEIO_IGNORADO_COM_AUTORIZACAO',
        target_entity: 'checklist_items',
        target_id: bypassItem.id,
        details: `Item "${bypassItem.description}" liberado com justificativa: ${bypassJustification}`,
      })
      toast({
        title: 'Bloqueio liberado pela coordenação com registro em auditoria!',
        description: `Autorizado por ${bypassAuthorizer}.`,
      })
      setIsBypassDialogOpen(false)
      setBypassItem(null)
      setBypassJustification('')
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao registrar autorização de bloqueio', variant: 'destructive' })
    }
  }

  // Handle Try Event Ready
  const handleMarkEventReady = () => {
    if (!isEventReady) {
      toast({
        title: 'IMPOSSÍVEL ABRIR EVENTO: Existem bloqueios críticos!',
        description: `Existem ${criticalPendingItems.length} pendências críticas sem autorização. Resolva ou justifique com Hugo/Renato.`,
        variant: 'destructive',
      })
      return
    }
    toast({
      title: 'EVENTO PRONTO PARA ABERTURA!',
      description: 'Salão liberado oficialmente para receber os 400 convidados.',
    })
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 sm:py-6 space-y-6 pb-24">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
            <CheckSquare className="w-4 h-4" /> Pré-Abertura & Homologação Operacional
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white tracking-tight">
            Checklist Pré-Abertura (~20 Itens por Setor)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Validação rigorosa antes da liberação do salão às 19h. Bloqueios impedem a abertura do
            evento.
          </p>
        </div>

        {/* Big readiness button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleMarkEventReady}
            className={`font-serif font-bold text-sm h-12 px-6 rounded-xl shadow-elevation transition-all ${
              isEventReady
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                : 'bg-red-700 hover:bg-red-800 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)]'
            }`}
          >
            {isEventReady ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> EVENTO PRONTO PARA ABRIR
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-5 h-5" /> ABERTURA BLOQUEADA ({criticalPendingItems.length})
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* MODO DE URGÊNCIA BANNER (Requirement D: Próximo da abertura com pendências críticas) */}
      {criticalPendingItems.length > 0 ? (
        <div className="bg-[#240C0C] text-red-100 p-5 rounded-2xl border-2 border-red-600/80 shadow-elevation space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-950/80 flex items-center justify-center text-red-200 shrink-0 border border-red-700">
                <ShieldAlert className="w-7 h-7 text-red-400 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                  MODO DE URGÊNCIA PRÉ-ABERTURA ATIVADO
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                  {criticalPendingItems.length} pendência(s) crítica(s) bloqueando a abertura do
                  salão!
                </h3>
              </div>
            </div>

            <Button
              onClick={() => setUrgencyFilter(true)}
              className="bg-red-700 text-white hover:bg-red-800 font-bold text-xs h-9 shrink-0 rounded-xl"
            >
              Focar Pendências Críticas
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-red-900/60">
            {criticalPendingItems.slice(0, 4).map((cp) => (
              <div
                key={cp.id}
                className="bg-[#311111] p-3 rounded-xl border border-red-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{cp.description}</div>
                  <div className="text-[11px] text-red-300 mt-0.5">
                    Responsável: <strong className="text-white">{cp.responsible}</strong> •{' '}
                    {cp.supplier_sector}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setWhatsAppPromptItem(cp)
                      setWhatsAppMsgCustom(
                        `URGÊNCIA CELEBRA: Abertura iminente! O item "${cp.description}" sob sua responsabilidade (${cp.responsible}) está PENDENTE. Por favor, confirme o status imediatamente.`,
                      )
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2 font-semibold gap-1 rounded-lg"
                  >
                    <Send className="w-3 h-3" /> Cobrar WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBypassItem(cp)
                      setIsBypassDialogOpen(true)
                    }}
                    className="bg-[#210D0D] hover:bg-[#381616] text-red-300 border-red-800 text-[11px] h-7 px-2 rounded-lg"
                  >
                    Escalonar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#0E2015] text-emerald-100 p-4 rounded-2xl border border-emerald-600/60 flex items-center justify-between shadow-elevation">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <strong className="text-white font-serif text-sm block">
                Nenhum bloqueio crítico pendente!
              </strong>
              <span className="text-xs text-emerald-300">
                Todos os itens essenciais de palco, som, buffet e mesas foram homologados pela
                coordenação.
              </span>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            100% PRONTO
          </Badge>
        </div>
      )}

      {/* Filter and Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-[#161412] p-3.5 border border-[#2B2620] rounded-2xl shadow-elevation">
          <span className="text-[10px] uppercase font-bold text-neutral-400">Total de Itens</span>
          <div className="text-2xl font-serif font-bold text-white mt-0.5">{totalItems}</div>
          <span className="text-[11px] text-neutral-500">16 setores auditados</span>
        </Card>
        <Card className="bg-[#161412] p-3.5 border border-[#2B2620] rounded-2xl shadow-elevation">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Concluídos</span>
          <div className="text-2xl font-serif font-bold text-emerald-400 mt-0.5">
            {completedItems}
          </div>
          <span className="text-[11px] text-emerald-500/80">
            {totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}% concluído
          </span>
        </Card>
        <Card className="bg-[#161412] p-3.5 border border-[#2B2620] rounded-2xl shadow-elevation">
          <span className="text-[10px] uppercase font-bold text-red-400">Pendências Críticas</span>
          <div className="text-2xl font-serif font-bold text-red-400 mt-0.5">
            {criticalPendingItems.length}
          </div>
          <span className="text-[11px] text-red-400/80">Bloqueiam abertura</span>
        </Card>
        <Card className="bg-[#161412] p-3.5 border border-[#2B2620] rounded-2xl shadow-elevation">
          <span className="text-[10px] uppercase font-bold text-neutral-400">Status Geral</span>
          <div className="text-sm font-serif font-bold text-white mt-1.5 flex items-center gap-1.5">
            {isEventReady ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Homologado
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Bloqueado
              </span>
            )}
          </div>
          <span className="text-[11px] text-neutral-500">Abertura: 19:00</span>
        </Card>
      </div>

      {/* Filter by Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161412] p-3.5 rounded-2xl border border-[#2B2620] shadow-elevation">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-semibold text-neutral-200">
            Filtrar por Área Operacional:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedArea} onValueChange={setSelectedArea}>
            <SelectTrigger className="w-full sm:w-[260px] h-9 text-xs bg-[#1C1915] border-[#332D24] text-white">
              <SelectValue placeholder="Todas as áreas" />
            </SelectTrigger>
            <SelectContent className="bg-[#1C1813] border-[#383125] text-white">
              <SelectItem value="ALL">Todas as 16 Áreas</SelectItem>
              {Object.entries(AREA_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {urgencyFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUrgencyFilter(false)}
              className="text-xs h-9 border-red-800/80 text-red-300 bg-[#261515] hover:bg-[#331C1C]"
            >
              Limpar Filtro de Urgência
            </Button>
          )}
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const st = STATUS_LABELS[item.status] || STATUS_LABELS.NAO_INICIADO
          const isCriticalPending =
            item.is_critical && item.status !== 'CONCLUIDO' && !item.bypass_authorized_by
          const isBypassed = !!item.bypass_authorized_by

          return (
            <Card
              key={item.id}
              className={`border transition-all shadow-elevation rounded-2xl ${
                isCriticalPending
                  ? 'border-red-600/80 bg-[#1D1212]'
                  : item.status === 'CONCLUIDO'
                    ? 'border-[#2B2620] bg-[#161412]'
                    : 'border-amber-600/40 bg-[#1A1612]'
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#24201B] text-[#C5A45F] border border-[#3D3425] text-[10px] font-bold">
                      {AREA_LABELS[item.area] || item.area}
                    </Badge>
                    <Badge className={`text-[10px] ${st.class}`}>{st.label}</Badge>
                    {item.is_critical && (
                      <Badge className="bg-red-900/60 text-red-300 border border-red-700/80 text-[10px] font-bold">
                        ★ CRÍTICO
                      </Badge>
                    )}
                    {isBypassed && (
                      <Badge className="bg-[#2B2418] text-amber-300 border border-amber-600/50 text-[10px]">
                        LIBERADO POR COORDENAÇÃO
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base text-white">{item.description}</h3>

                  <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>
                      Responsável: <strong className="text-neutral-200">{item.responsible}</strong>
                    </span>
                    {item.supplier_sector && <span>Setor: {item.supplier_sector}</span>}
                    {item.confirmed_at && (
                      <span className="text-emerald-400">
                        Confirmado às {new Date(item.confirmed_at).toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {/* Evidências / Notas */}
                  {item.evidence_notes && (
                    <div className="text-xs text-neutral-300 bg-[#1D1915] p-2.5 rounded-xl border border-[#2B2620] mt-1">
                      <strong className="text-white">Evidência:</strong> {item.evidence_notes}
                    </div>
                  )}

                  {/* Justificativa de bypass */}
                  {isBypassed && (
                    <div className="text-xs text-amber-200 bg-[#261E14] p-2.5 rounded-xl border border-amber-600/40 mt-1">
                      <strong className="text-amber-300">
                        Autorizado por {item.bypass_authorized_by}:
                      </strong>{' '}
                      {item.bypass_justification}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* WhatsApp urgency charge button */}
                  {item.status !== 'CONCLUIDO' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setWhatsAppPromptItem(item)
                        setWhatsAppMsgCustom(
                          `CELEBRA: Olá ${item.responsible}, cobrança de status da tarefa "${item.description}". Favor confirmar recebimento e conclusão.`,
                        )
                      }}
                      className="text-xs h-9 border-[#332D24] text-emerald-400 bg-[#16211A] hover:bg-[#1E2D23] gap-1.5 rounded-xl"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" /> Cobrar via WhatsApp
                    </Button>
                  )}

                  {/* Escalate button if critical */}
                  {item.is_critical && item.status !== 'CONCLUIDO' && !isBypassed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBypassItem(item)
                        setIsBypassDialogOpen(true)
                      }}
                      className="text-xs h-9 border-red-800/80 text-red-300 bg-[#261515] hover:bg-[#331C1C] gap-1 rounded-xl"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Escalonar
                    </Button>
                  )}

                  {/* Edit / Validate Button */}
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingItem(item)
                      setEditStatus(item.status)
                      setEditEvidenceNotes(item.evidence_notes || '')
                      setEditEvidencePhoto(item.evidence_photo || '')
                      setEditReceived(item.received_confirmed ?? true)
                      setEditUnderstood(item.understood_confirmed ?? true)
                    }}
                    className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-bold text-xs h-9 px-4 rounded-xl shadow-md"
                  >
                    Validar / Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* EDIT / VALIDATE ITEM MODAL */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="sm:max-w-[550px] bg-[#161412] text-white border border-[#332D24] rounded-2xl shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#24201B] text-[#C5A45F] border border-[#3D3425]">
                  {AREA_LABELS[editingItem.area]}
                </Badge>
                {editingItem.is_critical && (
                  <Badge className="bg-red-900/60 text-red-300 border border-red-700/80">
                    ITEM CRÍTICO
                  </Badge>
                )}
              </div>
              <DialogTitle className="font-serif text-xl text-white">
                {editingItem.description}
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-xs">
                Responsável: <strong className="text-white">{editingItem.responsible}</strong> •
                Setor: {editingItem.supplier_sector}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="chk-status" className="font-bold text-neutral-300">
                  Status da Tarefa:
                </Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v as ChecklistStatus)}
                >
                  <SelectTrigger
                    id="chk-status"
                    className="h-10 bg-[#1C1915] border-[#332D24] text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1813] border-[#383125] text-white">
                    <SelectItem value="NAO_INICIADO">Não Iniciado</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                    <SelectItem value="AGUARDANDO_TERCEIRO">
                      Aguardando Terceiro/Fornecedor
                    </SelectItem>
                    <SelectItem value="CONCLUIDO">Concluído (Validado)</SelectItem>
                    <SelectItem value="BLOQUEADO">Bloqueado (Gera Alerta Crítico)</SelectItem>
                    <SelectItem value="ATRASADO">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Requirement D: confirmação de recebimento, confirmação de entendimento */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#1C1915] rounded-xl border border-[#2B2620]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editReceived}
                    onChange={(e) => setEditReceived(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A45F] focus:ring-[#C5A45F] bg-[#12100E] border-[#383125]"
                  />
                  <span className="font-semibold text-neutral-200">Recebimento Confirmado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUnderstood}
                    onChange={(e) => setEditUnderstood(e.target.checked)}
                    className="w-4 h-4 rounded text-[#C5A45F] focus:ring-[#C5A45F] bg-[#12100E] border-[#383125]"
                  />
                  <span className="font-semibold text-neutral-200">Entendimento Confirmado</span>
                </label>
              </div>

              <div className="space-y-1">
                <Label htmlFor="chk-evidence" className="text-neutral-300 font-bold">
                  Evidência / Observações de Campo:
                </Label>
                <Input
                  id="chk-evidence"
                  placeholder="Ex: Todas as 10 mesas conferidas; cabos fixados com fita gaffer..."
                  value={editEvidenceNotes}
                  onChange={(e) => setEditEvidenceNotes(e.target.value)}
                  className="h-10 bg-[#1C1915] border-[#332D24] text-white"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="chk-photo"
                  className="text-neutral-300 font-bold flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5 text-[#C5A45F]" /> Foto da Evidência (Opcional):
                </Label>
                <Input
                  id="chk-photo"
                  placeholder="URL ou arquivo da foto comprobatória..."
                  value={editEvidencePhoto}
                  onChange={(e) => setEditEvidencePhoto(e.target.value)}
                  className="h-9 bg-[#1C1915] border-[#332D24] text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
                className="border-[#332D24] text-neutral-300 hover:bg-[#24201A]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveItem}
                disabled={isUpdating}
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#141210] font-bold rounded-xl"
              >
                {isUpdating ? 'Salvando...' : 'Salvar e Registrar Horário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* WHATSAPP SIMULATED CHARGE MODAL */}
      {whatsAppPromptItem && (
        <Dialog
          open={!!whatsAppPromptItem}
          onOpenChange={(open) => !open && setWhatsAppPromptItem(null)}
        >
          <DialogContent className="sm:max-w-[480px] bg-[#141E17] text-white border border-emerald-500/60 rounded-2xl shadow-2xl">
            <DialogHeader>
              <div className="w-12 h-12 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-700/80 flex items-center justify-center mx-auto mb-2">
                <Send className="w-6 h-6" />
              </div>
              <DialogTitle className="font-serif text-xl text-center text-emerald-300">
                Disparo de Cobrança via WhatsApp
              </DialogTitle>
              <DialogDescription className="text-center text-xs text-neutral-400">
                Destinatário:{' '}
                <strong className="text-white">{whatsAppPromptItem.responsible}</strong> (
                {whatsAppPromptItem.supplier_sector})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <Label htmlFor="wp-msg" className="text-neutral-300">
                Texto da Notificação:
              </Label>
              <textarea
                id="wp-msg"
                rows={3}
                value={whatsAppMsgCustom}
                onChange={(e) => setWhatsAppMsgCustom(e.target.value)}
                className="w-full rounded-xl border border-emerald-800/80 bg-[#1B291F] p-2.5 text-xs text-white focus:ring-2 focus:ring-[#C5A45F]"
              />
              <p className="text-[11px] text-neutral-400">
                A mensagem será registrada na central de mensagens WhatsApp e no log de auditoria
                operacional.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setWhatsAppPromptItem(null)}
                className="border-[#2B3B30] text-neutral-300 hover:bg-[#203126]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendUrgencyWhatsApp}
                disabled={isSendingWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
              >
                {isSendingWhatsApp ? 'Enviando...' : 'Despachar Notificação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ESCALATE / BYPASS DIALOG (Requirement D: Bloqueio só ignorável com justificativa e autorização) */}
      <Dialog open={isBypassDialogOpen} onOpenChange={setIsBypassDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#1A1111] text-white border border-red-700/80 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" /> Escalonamento de Bloqueio Crítico
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Item: <strong className="text-white">{bypassItem?.description}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="by-auth" className="font-bold text-red-300">
                Líder da Coordenação que Autoriza a Liberação:
              </Label>
              <Select value={bypassAuthorizer} onValueChange={setBypassAuthorizer}>
                <SelectTrigger id="by-auth" className="bg-[#1C1212] border-red-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1212] border-red-800 text-white">
                  <SelectItem value="Hugo Cerimonial">
                    Hugo Cerimonial (Cerimonialista Chefe)
                  </SelectItem>
                  <SelectItem value="Renato Apoio">
                    Renato Apoio (Coordenação Operacional)
                  </SelectItem>
                  <SelectItem value="Danilo">Danilo (Coordenação Geral)</SelectItem>
                  <SelectItem value="Ana Paula">Ana Paula (Coordenação Geral)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="by-just" className="font-bold text-red-300">
                Justificativa Formal Obrigatória:
              </Label>
              <Input
                id="by-just"
                placeholder="Ex: Fornecedor realizou ajuste emergencial in loco; contingência ativada..."
                value={bypassJustification}
                onChange={(e) => setBypassJustification(e.target.value)}
                className="h-11 bg-[#1C1212] border-red-800 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBypassDialogOpen(false)}
              className="border-[#382626] text-neutral-300 hover:bg-[#2B1B1B]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBypassBlock}
              disabled={!bypassJustification.trim()}
              className="bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl"
            >
              Autorizar e Liberar Abertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
