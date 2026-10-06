import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  guestService,
  tableService,
  honoreeService,
  occurrenceService,
} from '@/services/celebraService'
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
  RotateCcw,
  Wifi,
  WifiOff,
  Clock,
  Camera,
  XCircle,
  HelpCircle,
  Utensils,
  Accessibility,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OfflineQueueItem {
  id: string
  guestId: string
  guestName: string
  mode: 'QR' | 'MANUAL'
  timestamp: string
}

export default function Checkin() {
  const { eventId } = useParams<{ eventId: string }>()
  const [guests, setGuests] = useState<GuestRecord[]>([])
  const [tables, setTables] = useState<TableRecord[]>([])
  const [honorees, setHonorees] = useState<HonoreeRecord[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'qr' | 'search'>('qr')
  const [isLoading, setIsLoading] = useState(true)

  // QR / Guest Read State
  const [scannedGuest, setScannedGuest] = useState<GuestRecord | null>(null)
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Contingency & Offline state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([])

  // Duplicate Check-in Modal
  const [duplicateGuest, setDuplicateGuest] = useState<GuestRecord | null>(null)
  const [authCoordinatorName, setAuthCoordinatorName] = useState('Hugo Cerimonial')

  // Exception Modal
  const [exceptionGuest, setExceptionGuest] = useState<GuestRecord | null>(null)
  const [exceptionReason, setExceptionReason] = useState('')
  const [isSavingException, setIsSavingException] = useState(false)

  // Quick Add Modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickPhone, setQuickPhone] = useState('')
  const [quickTableId, setQuickTableId] = useState('')
  const [quickHonoreeId, setQuickHonoreeId] = useState('')
  const [quickSpecialNeeds, setQuickSpecialNeeds] = useState('')
  const [quickDietary, setQuickDietary] = useState('')
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false)

  const { toast } = useToast()

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({ title: 'Conexão restabelecida', description: 'Sincronizando fila offline...' })
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: 'Modo contingência offline ativado',
        description: 'Check-ins serão armazenados localmente e sincronizados.',
        variant: 'destructive',
      })
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  // Sync offline queue when back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && eventId) {
      const sync = async () => {
        const queueToSync = [...offlineQueue]
        for (const item of queueToSync) {
          try {
            await guestService.checkIn(eventId, item.guestId, {
              mode: item.mode,
              operator: 'Recepção (Sync Offline)',
            })
          } catch {
            /* intentionally ignored */
          }
        }
        setOfflineQueue([])
        toast({
          title: 'Fila sincronizada com sucesso!',
          description: `${queueToSync.length} entradas enviadas ao servidor.`,
        })
        loadData()
      }
      sync()
    }
  }, [isOnline, offlineQueue, eventId, toast])

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

  // Realtime guest updates
  useRealtime<GuestRecord>('guests', () => {
    if (eventId)
      guestService
        .list(eventId)
        .then(setGuests)
        .catch(() => {})
  })

  // Timer visual de 5 segundos após leitura
  useEffect(() => {
    if (scannedGuest && timerSeconds !== null && timerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))
      }, 1000)
    } else if (timerSeconds === 0) {
      // Timer finished: auto-prompt next
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [scannedGuest, timerSeconds])

  // Start Scanned Guest inspection
  const handleSelectScanned = (guest: GuestRecord, mode: 'QR' | 'MANUAL' = 'QR') => {
    // If already checked-in, trigger duplicate guard
    if (guest.status === 'PRESENTE') {
      setDuplicateGuest(guest)
      return
    }
    setScannedGuest(guest)
    setTimerSeconds(5) // Inicia timer visual de 5 segundos
  }

  // Confirm arrival (with offline support)
  const handleConfirmEntrance = async (guest: GuestRecord, isDuplicateOverride = false) => {
    if (!eventId) return

    if (!isOnline) {
      // Local queue contingency
      const newItem: OfflineQueueItem = {
        id: 'off_' + Date.now(),
        guestId: guest.id,
        guestName: guest.name,
        mode: scannedGuest ? 'QR' : 'MANUAL',
        timestamp: new Date().toISOString(),
      }
      setOfflineQueue((prev) => [...prev, newItem])
      // Optimistic local update
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, status: 'PRESENTE' as const } : g)),
      )
      toast({
        title: 'Check-in guardado em contingência local (Offline)',
        description: `${guest.name} entrará na fila de sincronização.`,
      })
      setScannedGuest(null)
      setTimerSeconds(null)
      setDuplicateGuest(null)
      return
    }

    try {
      await guestService.checkIn(eventId, guest.id, {
        mode: scannedGuest ? 'QR' : 'MANUAL',
        operator: 'Recepção',
        overrideAuthorizedBy: isDuplicateOverride ? authCoordinatorName : undefined,
        isDuplicateOverride,
      })
      toast({
        title: isDuplicateOverride ? 'Entrada duplicada autorizada!' : 'Entrada confirmada!',
        description: `${guest.name} liberado(a) com sucesso.`,
      })
      setScannedGuest(null)
      setTimerSeconds(null)
      setDuplicateGuest(null)
      loadData()
    } catch (_) {
      toast({ title: 'Erro ao confirmar entrada', variant: 'destructive' })
    }
  }

  // Register Exception / Occurrence from Reception
  const handleSaveException = async () => {
    if (!eventId || !exceptionGuest || !exceptionReason.trim()) return
    setIsSavingException(true)
    try {
      await occurrenceService.create({
        event_id: eventId,
        category: 'CONVIDADO',
        description: `Exceção na Recepção para ${exceptionGuest.name}: ${exceptionReason}`,
        responsible: 'Recepção (Camila / Danilo)',
        solution: 'Registrado para acompanhamento do cerimonial Hugo.',
      })
      toast({ title: 'Exceção registrada com sucesso!' })
      setExceptionGuest(null)
      setExceptionReason('')
      setScannedGuest(null)
      setTimerSeconds(null)
    } catch (_) {
      toast({ title: 'Erro ao salvar exceção', variant: 'destructive' })
    } finally {
      setIsSavingException(false)
    }
  }

  // Search filter (name, phone, honoree)
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q.length < 2) return []
    return guests.filter((g) => {
      const matchName = g.name.toLowerCase().includes(q)
      const matchPhone = g.phone ? g.phone.includes(q) : false
      const matchHonoree = g.expand?.honoree_id?.name
        ? g.expand.honoree_id.name.toLowerCase().includes(q)
        : false
      const matchQr = g.qr_code ? g.qr_code.toLowerCase().includes(q) : false
      return matchName || matchPhone || matchHonoree || matchQr
    })
  }, [guests, search])

  // Presets for demo simulation
  const pendingSampleGuests = useMemo(() => {
    return guests.filter((g) => g.status !== 'PRESENTE').slice(0, 5)
  }, [guests])

  const totalGuests = guests.length
  const presentCount = guests.filter((g) => g.status === 'PRESENTE').length
  const contingencyTable = tables.find((t) => t.is_reserve)

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-5 pb-24">
      {/* Top Banner with Online/Offline & Status */}
      <div className="bg-[#1C1A17] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-[#2F2C27] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C5A45F] text-[#1C1A17] flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-serif font-bold text-white">
                Recepção & Check-in Mobile
              </h1>
              {isOnline ? (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 font-bold animate-pulse">
                  <WifiOff className="w-3 h-3" /> Offline ({offlineQueue.length} fila)
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-300">
              Presença: <strong className="text-emerald-400">{presentCount}</strong> de{' '}
              {totalGuests} convidados
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#282521] p-1 rounded-lg border border-[#3D3833] self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('qr')
              setSearch('')
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'qr'
                ? 'bg-[#C5A45F] text-[#1C1A17]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Leitor QR
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'search'
                ? 'bg-[#C5A45F] text-[#1C1A17]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Busca Manual
          </button>
        </div>
      </div>

      {/* INSPECTION MODAL / ACTIVE SCAN DISPLAY (Requirements: name, honoree, table, group size, dietary, special needs, status, 5s visual timer) */}
      {scannedGuest && (
        <Card className="border-4 border-[#C5A45F] bg-white shadow-2xl rounded-2xl overflow-hidden animate-fade-in">
          {/* Header with visual 5s Timer Bar */}
          <div className="bg-[#1C1A17] text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A45F] flex items-center gap-1">
                  <QrCode className="w-4 h-4" /> LEITURA DE QR CODE IDENTIFICADA
                </span>
              </div>
              {timerSeconds !== null && (
                <Badge
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 ${
                    timerSeconds <= 2
                      ? 'bg-red-600 text-white animate-ping'
                      : 'bg-[#C5A45F] text-[#1C1A17]'
                  }`}
                >
                  <Clock className="w-3 h-3 mr-1 inline" /> {timerSeconds}s
                </Badge>
              )}
            </div>

            {/* Visual countdown progress */}
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#C5A45F] h-full transition-all duration-1000 ease-linear"
                style={{ width: `${((timerSeconds ?? 5) / 5) * 100}%` }}
              />
            </div>
          </div>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Guest identity & Table number */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6356]">
                  Papel: {scannedGuest.role || 'CONVIDADO DO HOMENAGEADO'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A17] mt-0.5">
                  {scannedGuest.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B6356] mt-1">
                  {scannedGuest.phone && <span>Tel: {scannedGuest.phone}</span>}
                  <span>
                    Grupo: <strong>{scannedGuest.group_size || 1} pessoa(s)</strong>
                  </span>
                  {scannedGuest.accompanant && (
                    <span>Acompanhante: {scannedGuest.accompanant}</span>
                  )}
                </div>
              </div>

              {/* Huge Table Box */}
              <div className="bg-[#1C1A17] text-[#C5A45F] p-4 rounded-xl text-center sm:text-right shrink-0 border border-[#332E27]">
                <div className="text-[10px] uppercase font-sans tracking-widest text-neutral-400">
                  MESA DESIGNADA
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold mt-0.5">
                  {scannedGuest.expand?.table_id?.name ||
                    tables.find((t) => t.id === scannedGuest.table_id)?.name ||
                    'MESA 01'}
                </div>
              </div>
            </div>

            {/* Operational details: Honoree, Dietary, Special Needs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F8F7F4] border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-[#6B6356] block">
                  Homenageado Vinculado
                </span>
                <span className="font-serif font-bold text-sm text-[#1C1A17] mt-0.5 block">
                  {scannedGuest.expand?.honoree_id?.name ||
                    honorees.find((h) => h.id === scannedGuest.honoree_id)?.name ||
                    'Personalidade de Honra'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F8F7F4] border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-[#6B6356] block">
                  Situação do Check-in
                </span>
                <Badge
                  className={`mt-1 font-bold ${
                    scannedGuest.status === 'PRESENTE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {scannedGuest.status}
                </Badge>
              </div>

              {/* Dietary Restriction Alert */}
              <div
                className={`p-3 rounded-xl border ${
                  scannedGuest.dietary_restriction
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Utensils className="w-3.5 h-3.5 text-amber-800" />
                  <span>Restrição Alimentar:</span>
                </div>
                <div className="mt-1 font-semibold">
                  {scannedGuest.dietary_restriction || 'Nenhuma restrição registrada'}
                </div>
                {scannedGuest.dietary_details && (
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    {scannedGuest.dietary_details}
                  </div>
                )}
              </div>

              {/* Special Needs Alert */}
              <div
                className={`p-3 rounded-xl border ${
                  scannedGuest.special_needs
                    ? 'bg-blue-50/80 border-blue-300 text-blue-950'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Accessibility className="w-3.5 h-3.5 text-blue-800" />
                  <span>Acomodação Especial:</span>
                </div>
                <div className="mt-1 font-semibold">
                  {scannedGuest.special_needs || 'Sem exigência de acessibilidade'}
                </div>
              </div>
            </div>

            {/* 4 Mandatory Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => handleConfirmEntrance(scannedGuest)}
                className="w-full h-14 bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold text-base sm:text-lg rounded-xl shadow-lg gap-2"
              >
                <CheckCircle2 className="w-6 h-6" /> [CONFIRMAR ENTRADA]
              </Button>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setScannedGuest(null)
                    setTimerSeconds(null)
                  }}
                  className="h-11 text-xs border-neutral-300 font-semibold"
                >
                  [Próximo Convidado]
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setScannedGuest(null)
                    setTimerSeconds(null)
                  }}
                  className="h-11 text-xs text-neutral-500 hover:text-neutral-800"
                >
                  [Cancelar]
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setExceptionGuest(scannedGuest)}
                  className="h-11 text-xs border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 font-semibold"
                >
                  [Registrar Exceção]
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR READER TAB / SIMULATOR (Não deixar o QR atrasar a demo!) */}
      {activeTab === 'qr' && !scannedGuest && (
        <Card className="bg-white border-2 border-neutral-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-neutral-100 bg-[#FBFBFA]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-serif font-bold text-[#1C1A17] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#C5A45F]" />
                  Simulador de Câmera / Leitura Rápida de QR Code
                </CardTitle>
                <p className="text-xs text-[#6B6356] mt-0.5">
                  Pressione qualquer convidado abaixo para simular a leitura do crachá
                  instantaneamente.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Visual Camera Viewfinder Graphic */}
            <div className="relative rounded-2xl border-2 border-dashed border-[#C5A45F] bg-[#1C1A17] p-8 text-center text-white overflow-hidden shadow-inner">
              <div className="w-20 h-20 rounded-2xl border-2 border-[#C5A45F] mx-auto flex items-center justify-center bg-[#25221E] shadow-lg animate-pulse">
                <QrCode className="w-10 h-10 text-[#C5A45F]" />
              </div>
              <p className="text-xs text-neutral-300 font-medium mt-3">
                Aponte o crachá ou use os atalhos de demonstração abaixo
              </p>
              <div className="text-[11px] text-[#C5A45F] font-semibold mt-1">
                Leitura em ~0.2 segundos • Sincronismo ativo
              </div>
            </div>

            {/* Quick Demo Simulator Buttons */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B6356] mb-2 flex items-center justify-between">
                <span>Simular leitura de convidados reais (Clique para testar):</span>
                <span className="text-[10px] text-[#C5A45F]">
                  {pendingSampleGuests.length} prontos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {pendingSampleGuests.map((g) => {
                  const targetTable = tables.find((t) => t.id === g.table_id)
                  const targetHonoree = honorees.find((h) => h.id === g.honoree_id)

                  return (
                    <button
                      key={g.id}
                      onClick={() => handleSelectScanned(g, 'QR')}
                      className="text-left p-3 rounded-xl border border-neutral-200 hover:border-[#C5A45F] hover:bg-neutral-50 transition-all flex items-center justify-between group shadow-sm bg-white"
                    >
                      <div>
                        <div className="font-serif font-bold text-sm text-[#1C1A17] group-hover:text-[#C5A45F] flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#C5A45F]" />
                          {g.name}
                        </div>
                        <div className="text-[11px] text-[#6B6356] mt-0.5">
                          {targetTable?.name || 'Mesa 01'} • {targetHonoree?.name || 'Homenageado'}
                        </div>
                        {g.dietary_restriction && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded mt-1 inline-block font-semibold">
                            {g.dietary_restriction}
                          </span>
                        )}
                      </div>
                      <Badge className="bg-[#1C1A17] text-[#C5A45F] text-[10px] shrink-0 font-bold group-hover:bg-[#C5A45F] group-hover:text-[#1C1A17]">
                        Ler QR
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEARCH / MANUAL FIND TAB */}
      {activeTab === 'search' && !scannedGuest && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-4 w-6 h-6 text-neutral-400" />
            <Input
              type="text"
              autoFocus
              placeholder="Buscar por nome, telefone ou homenageado..."
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

          {search.trim().length >= 2 ? (
            searchResults.length > 0 ? (
              <div className="space-y-3">
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
                      className={`border-2 transition-all shadow-sm ${
                        isPresent
                          ? 'border-emerald-500 bg-emerald-50/20'
                          : 'border-neutral-200 bg-white hover:border-[#C5A45F]'
                      }`}
                    >
                      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                              {guest.name}
                            </h3>
                            <Badge
                              className={`text-[9px] font-bold ${
                                isPresent
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-neutral-200 text-neutral-800'
                              }`}
                            >
                              {isPresent ? 'PRESENTE' : guest.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-[#6B6356] mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                            {targetTable && (
                              <span className="font-semibold text-[#C5A45F]">
                                {targetTable.name}
                              </span>
                            )}
                            {targetHonoree && <span>Homenageado: {targetHonoree.name}</span>}
                            {guest.phone && <span>Tel: {guest.phone}</span>}
                          </div>
                          {guest.dietary_restriction && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">
                              Restrição: {guest.dietary_restriction}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSelectScanned(guest, 'MANUAL')}
                            className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-bold text-xs h-10 px-4"
                          >
                            Abrir Ficha
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="text-center py-10 bg-amber-50/50 border-2 border-amber-200 rounded-2xl">
                <CardContent className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-800">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#1C1A17]">
                      Convidado não consta na lista oficial
                    </h3>
                    <p className="text-xs text-[#6B6356] max-w-sm mx-auto mt-1">
                      Você pode registrar este convidado imediatamente com autorização da
                      coordenação e alocá-lo na Mesa Reserva de contingência.
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
                    <UserPlus className="w-4 h-4" /> Cadastrar Convidado Fora da Lista
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 text-center space-y-3">
              <p className="text-sm text-[#6B6356]">
                Digite pelo menos <strong>2 caracteres</strong> para pesquisar por nome, telefone ou
                homenageado.
              </p>
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
          )}
        </div>
      )}

      {/* DUPLICATE CHECK-IN GUARD MODAL (Requirement: Impedir check-in duplicado sem autorização da coordenação) */}
      <Dialog open={!!duplicateGuest} onOpenChange={(open) => !open && setDuplicateGuest(null)}>
        <DialogContent className="sm:max-w-[480px] bg-white border-2 border-red-500">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl font-serif font-bold text-center text-red-950">
              ALERTA DE CHECK-IN DUPLICADO
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-neutral-600">
              O convidado <strong>{duplicateGuest?.name}</strong> já possui entrada registrada hoje!
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-xs space-y-2 text-red-900">
            <p>
              Para evitar fraude ou uso indevido da credencial, uma reentrada só é permitida
              mediante autorização da coordenação do cerimonial.
            </p>
            <div className="space-y-1 pt-1">
              <Label htmlFor="auth-coord" className="text-[11px] font-bold uppercase text-red-950">
                Coordenador que autoriza:
              </Label>
              <Select value={authCoordinatorName} onValueChange={setAuthCoordinatorName}>
                <SelectTrigger id="auth-coord" className="bg-white border-red-300 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hugo Cerimonial">
                    Hugo Cerimonial (Coordenador Chefe)
                  </SelectItem>
                  <SelectItem value="Renato Apoio">
                    Renato Apoio (Coordenação Operacional)
                  </SelectItem>
                  <SelectItem value="Danilo">Danilo (Coordenação Geral)</SelectItem>
                  <SelectItem value="Ana Paula">Ana Paula (Coordenação Geral)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDuplicateGuest(null)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => duplicateGuest && handleConfirmEntrance(duplicateGuest, true)}
              className="w-full sm:w-auto bg-red-700 hover:bg-red-800 text-white font-bold"
            >
              Autorizar Reentrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXCEPTION REGISTRATION MODAL */}
      <Dialog open={!!exceptionGuest} onOpenChange={(open) => !open && setExceptionGuest(null)}>
        <DialogContent className="sm:max-w-[480px] bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Registrar Exceção na Recepção
            </DialogTitle>
            <DialogDescription>
              Convidado: <strong>{exceptionGuest?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <Label htmlFor="exc-reason">Descreva o ocorrido ou solicitação especial:</Label>
            <Input
              id="exc-reason"
              placeholder="Ex: Convidado chegou com acompanhante não previsto / Mudança de mesa / Necessidade médica..."
              value={exceptionReason}
              onChange={(e) => setExceptionReason(e.target.value)}
              className="h-11"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExceptionGuest(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveException}
              disabled={isSavingException || !exceptionReason.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {isSavingException ? 'Salvando...' : 'Salvar Exceção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK ADD GUEST MODAL */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!eventId || !quickName.trim()) return
              setIsSubmittingQuick(true)
              try {
                let assignedTable = quickTableId
                if (!assignedTable && contingencyTable) assignedTable = contingencyTable.id

                const created = await guestService.create({
                  event_id: eventId,
                  name: quickName,
                  phone: quickPhone,
                  table_id: assignedTable || undefined,
                  honoree_id: quickHonoreeId || undefined,
                  status: 'PRESENTE',
                  confirmation: 'CONFIRMADO',
                  special_needs: quickSpecialNeeds,
                  dietary_restriction: quickDietary,
                  role: 'CONVIDADO_HOMENAGEADO',
                  observations: 'Cadastrado de surpresa na recepção via Check-in Rápido',
                })
                await guestService.checkIn(eventId, created.id, {
                  mode: 'MANUAL',
                  operator: 'Recepção (Entrada de Contingência)',
                })
                toast({ title: 'Convidado cadastrado e check-in concluído!' })
                setIsQuickAddOpen(false)
                setQuickName('')
                setQuickPhone('')
                loadData()
              } catch (_) {
                toast({ title: 'Erro ao cadastrar', variant: 'destructive' })
              } finally {
                setIsSubmittingQuick(false)
              }
            }}
          >
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Cadastro Rápido de Recepção</DialogTitle>
              <DialogDescription>
                Adiciona o convidado de última hora com alocação automática de mesa.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm">
              <div className="space-y-1">
                <Label htmlFor="q-name">Nome Completo *</Label>
                <Input
                  id="q-name"
                  required
                  placeholder="Nome do convidado"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="q-phone">Telefone / WhatsApp</Label>
                <Input
                  id="q-phone"
                  placeholder="(11) 99999-9999"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="q-table">Mesa para Acomodação</Label>
                <Select value={quickTableId} onValueChange={setQuickTableId}>
                  <SelectTrigger id="q-table">
                    <SelectValue placeholder="Selecione a mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.is_reserve ? '★ CONTINGÊNCIA' : `(${t.capacity} lugares)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="q-diet">Restrição Alimentar (Opcional)</Label>
                <Input
                  id="q-diet"
                  placeholder="Ex: Vegetariano, Sem Glúten..."
                  value={quickDietary}
                  onChange={(e) => setQuickDietary(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="q-needs">Acomodação Especial (Opcional)</Label>
                <Input
                  id="q-needs"
                  placeholder="Ex: Cadeira de rodas, idoso..."
                  value={quickSpecialNeeds}
                  onChange={(e) => setQuickSpecialNeeds(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsQuickAddOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingQuick}
                className="bg-[#C5A45F] hover:bg-[#B08F4A] text-[#1C1A17] font-semibold"
              >
                {isSubmittingQuick ? 'Salvando...' : 'Confirmar e Liberar Entrada'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
