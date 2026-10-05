import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { teamService, supplierService } from '@/services/celebraService'
import type { TeamRecord, TeamMemberRecord, SupplierRecord } from '@/types/celebra'
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
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  Truck,
  Phone,
  User,
  Crown,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Teams() {
  const { eventId } = useParams<{ eventId: string }>()
  const [teams, setTeams] = useState<TeamRecord[]>([])
  const [members, setMembers] = useState<TeamMemberRecord[]>([])
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Member Dialog
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [memberName, setMemberName] = useState('')
  const [memberRole, setMemberRole] = useState<'LEADER' | 'MEMBER'>('MEMBER')
  const [isSubmittingMember, setIsSubmittingMember] = useState(false)

  // Supplier Dialog
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [supplierName, setSupplierName] = useState('')
  const [supplierCategory, setSupplierCategory] = useState('BUFFET')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false)

  const { toast } = useToast()

  const loadData = async () => {
    if (!eventId) return
    setIsLoading(true)
    try {
      const [tList, mList, sList] = await Promise.all([
        teamService.list(eventId),
        teamService.listMembers(),
        supplierService.list(eventId),
      ])
      setTeams(tList)
      setMembers(mList)
      setSuppliers(sList)
    } catch (_) {
      toast({
        title: 'Erro ao carregar equipes e fornecedores',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [eventId])

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeamId || !memberName.trim()) return
    setIsSubmittingMember(true)
    try {
      await teamService.createMember({
        team_id: selectedTeamId,
        name: memberName,
        role: memberRole,
      })
      toast({ title: 'Membro adicionado à equipe!' })
      setIsMemberDialogOpen(false)
      setMemberName('')
      setMemberRole('MEMBER')
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao adicionar membro', variant: 'destructive' })
    } finally {
      setIsSubmittingMember(false)
    }
  }

  const handleDeleteMember = async (memberId: string, name: string) => {
    if (!confirm(`Remover "${name}" desta equipe?`)) return
    try {
      await teamService.deleteMember(memberId)
      toast({ title: 'Membro removido.' })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao remover membro', variant: 'destructive' })
    }
  }

  // Add Supplier
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !supplierName.trim()) return
    setIsSubmittingSupplier(true)
    try {
      await supplierService.create({
        event_id: eventId,
        name: supplierName,
        category: supplierCategory,
        phone: supplierPhone,
        contact: supplierContact,
      })
      toast({ title: 'Fornecedor cadastrado com sucesso!' })
      setIsSupplierDialogOpen(false)
      setSupplierName('')
      setSupplierPhone('')
      setSupplierContact('')
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao cadastrar fornecedor', variant: 'destructive' })
    } finally {
      setIsSubmittingSupplier(false)
    }
  }

  const handleDeleteSupplier = async (supplierId: string, name: string) => {
    if (!confirm(`Remover fornecedor "${name}"?`)) return
    try {
      await supplierService.delete(supplierId)
      toast({ title: 'Fornecedor removido.' })
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao remover fornecedor', variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 lg:py-8 space-y-10">
      {/* Section 1: Equipes & Staff */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" /> Gestão Operacional
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-[#1C1A17]">
              Equipes de Apoio & Staff ({teams.length})
            </h1>
            <p className="text-sm text-[#6B6356] mt-1">
              Conceito operacional: <strong>HUGO → LÍDER → EQUIPE</strong>. Alertas e confirmações
              fluem pelos líderes.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C5A45F] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map((team) => {
              const teamMembers = members.filter((m) => m.team_id === team.id)
              const leader = teamMembers.find((m) => m.role === 'LEADER')
              const regularMembers = teamMembers.filter((m) => m.role !== 'LEADER')

              return (
                <Card
                  key={team.id}
                  className="bg-white border-neutral-200 shadow-sm hover:border-[#C5A45F] transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2 border-b border-neutral-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-serif font-bold text-base text-[#1C1A17] tracking-wide">
                        {team.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-semibold text-[#6B6356]">
                        {teamMembers.length} pessoas
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      {/* Leader Card */}
                      <div className="bg-[#1C1A17] text-white p-2.5 rounded-lg text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-[#C5A45F] shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#C5A45F] block leading-none">
                              Líder Responsável
                            </span>
                            <span className="font-semibold text-white">
                              {leader ? leader.name : 'Nenhum líder atribuído'}
                            </span>
                          </div>
                        </div>

                        {leader && (
                          <button
                            onClick={() => handleDeleteMember(leader.id, leader.name)}
                            className="text-neutral-500 hover:text-red-400 p-1"
                            title="Remover Líder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Members list */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#6B6356] tracking-wider block mb-1">
                          Integrantes da Equipe:
                        </span>
                        {regularMembers.length === 0 ? (
                          <p className="text-xs text-neutral-400 italic">Sem outros membros</p>
                        ) : (
                          <div className="space-y-1">
                            {regularMembers.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between text-xs p-1.5 rounded bg-neutral-50 border border-neutral-100"
                              >
                                <span className="text-neutral-800 font-medium">{m.name}</span>
                                <button
                                  onClick={() => handleDeleteMember(m.id, m.name)}
                                  className="text-neutral-400 hover:text-red-600 p-0.5"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Member Button */}
                    <div className="pt-2 border-t border-neutral-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTeamId(team.id)
                          setMemberName('')
                          setMemberRole(leader ? 'MEMBER' : 'LEADER')
                          setIsMemberDialogOpen(true)
                        }}
                        className="w-full text-xs h-8 border-dashed border-neutral-300 text-[#C5A45F] hover:text-[#B08F4A] hover:bg-neutral-50 gap-1"
                      >
                        <Plus className="w-3 h-3" /> Adicionar Integrante
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 2: Fornecedores */}
      <div className="space-y-6 pt-6 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A45F] font-semibold mb-1">
              <Truck className="w-4 h-4" /> Parceiros Operacionais
            </div>
            <h2 className="text-xl lg:text-2xl font-serif font-bold tracking-tight text-[#1C1A17]">
              Fornecedores ({suppliers.length})
            </h2>
            <p className="text-sm text-[#6B6356] mt-1">
              Contatos diretos de buffet, som, foto, vídeo e iluminação para acionamento imediato
              durante a festa.
            </p>
          </div>

          <Button
            onClick={() => setIsSupplierDialogOpen(true)}
            className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold gap-2 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Fornecedor
          </Button>
        </div>

        {suppliers.length === 0 ? (
          <Card className="text-center py-12 bg-white border-dashed">
            <CardContent>
              <Truck className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-[#6B6356]">Nenhum fornecedor cadastrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <Card
                key={s.id}
                className="bg-white border-neutral-200 shadow-sm hover:border-[#C5A45F] transition-all"
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge className="bg-[#1C1A17] text-[#C5A45F] text-[10px] font-bold mb-1">
                        {s.category}
                      </Badge>
                      <h4 className="font-serif font-bold text-base text-[#1C1A17]">{s.name}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSupplier(s.id, s.name)}
                      className="h-7 w-7 text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="text-xs text-[#6B6356] space-y-1 pt-1 border-t border-neutral-100">
                    {s.contact && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Contato: {s.contact}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <a href={`tel:${s.phone}`} className="hover:underline">
                          {s.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Member Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white">
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Adicionar Integrante</DialogTitle>
              <DialogDescription>Cadastre o profissional na equipe selecionada.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <Label htmlFor="m-name">Nome do Integrante *</Label>
                <Input
                  id="m-name"
                  required
                  placeholder="Ex: Pedro Fonseca"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="m-role">Função na Equipe</Label>
                <Select
                  value={memberRole}
                  onValueChange={(val: 'LEADER' | 'MEMBER') => setMemberRole(val)}
                >
                  <SelectTrigger id="m-role">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEADER">Líder da Equipe</SelectItem>
                    <SelectItem value="MEMBER">Membro / Apoio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMemberDialogOpen(false)}
                disabled={isSubmittingMember}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingMember}
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold"
              >
                {isSubmittingMember ? 'Salvando...' : 'Salvar Integrante'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <form onSubmit={handleAddSupplier}>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Novo Fornecedor</DialogTitle>
              <DialogDescription>
                Cadastre empresa parceira e dados de contato para o evento.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <Label htmlFor="s-name">Nome da Empresa *</Label>
                <Input
                  id="s-name"
                  required
                  placeholder="Ex: Iluminação Master Som"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="s-cat">Categoria</Label>
                <Select value={supplierCategory} onValueChange={setSupplierCategory}>
                  <SelectTrigger id="s-cat">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUFFET">Buffet & Gastronomia</SelectItem>
                    <SelectItem value="FOTOGRAFIA">Fotografia</SelectItem>
                    <SelectItem value="VÍDEO">Filmagem / Vídeo</SelectItem>
                    <SelectItem value="SOM / DJ">Som & Iluminação</SelectItem>
                    <SelectItem value="DECORAÇÃO">Decoração & Flores</SelectItem>
                    <SelectItem value="SEGURANÇA">Segurança</SelectItem>
                    <SelectItem value="OUTROS">Outros Serviços</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="s-phone">Telefone / Plantão</Label>
                  <Input
                    id="s-phone"
                    placeholder="(11) 98888-7777"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-contact">Nome do Responsável</Label>
                  <Input
                    id="s-contact"
                    placeholder="Ex: Rogério Silva"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSupplierDialogOpen(false)}
                disabled={isSubmittingSupplier}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingSupplier}
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold"
              >
                {isSubmittingSupplier ? 'Salvando...' : 'Salvar Fornecedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
