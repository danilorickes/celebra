import type { RecordModel } from 'pocketbase'

export interface EventRecord extends RecordModel {
  name: string
  date: string
  profile: string
  status: 'PREPARACAO' | 'ATIVO' | 'FINALIZADO'
}

export interface TableRecord extends RecordModel {
  event_id: string
  name: string
  capacity: number
  planned_chairs?: number
  physical_chairs?: number
  conference_status?: 'PENDENTE' | 'CONFERIDA' | 'DIVERGENTE' | 'BLOQUEADA'
  conference_responsible?: string
  conference_photo?: string
  is_locked?: boolean
  buffet_status?: 'AGUARDANDO' | 'CHAMADA' | 'DIRIGINDO_AO_BUFFET' | 'ATENDIDA' | 'CONCLUIDA'
  special_needs_note?: string
  operational_notes?: string
  is_reserve: boolean
}

export interface TeamRecord extends RecordModel {
  event_id: string
  name: string
}

export interface TeamMemberRecord extends RecordModel {
  team_id: string
  user_id?: string
  name: string
  role: 'LEADER' | 'MEMBER'
}

export interface SupplierRecord extends RecordModel {
  event_id: string
  name: string
  category: string
  phone: string
  contact: string
}

export interface TimelineItemRecord extends RecordModel {
  event_id: string
  scheduled_time: string
  title: string
  description: string
  responsibles: string
  teams: string[]
  observations: string
  status: 'A_PREPARAR' | 'PRONTO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO'
  real_start_time?: string
  real_end_time?: string
  delay_minutes: number
  expand?: {
    teams?: TeamRecord[]
  }
}

export type HonoreeOperationalState =
  | 'AGUARDANDO'
  | 'AVISADO'
  | 'CONFIRMOU_RECEBIMENTO'
  | 'EM_PREPARACAO'
  | 'PROXIMO'
  | 'CHAMADO'
  | 'NO_PALCO'
  | 'FOTOGRAFIA'
  | 'CONCLUIDO'
  | 'AUSENTE'
  | 'EXCECAO'

export interface HonoreeRecord extends RecordModel {
  event_id: string
  name: string
  photo?: string
  phone: string
  whatsapp: string
  observations: string
  status: 'CONFIRMADO' | 'PENDENTE'
  important_info: string
  tribute_order?: number
  timeline_item_id?: string
  operational_state?: HonoreeOperationalState
  escort_name?: string
  table_id?: string
  stage_resources?: string
  music_cue?: string
  conductor_responsible?: string
  presentation_text?: string
  scheduled_time?: string
  actual_time?: string
}

export interface GuestRecord extends RecordModel {
  event_id: string
  honoree_id?: string
  name: string
  phone: string
  accompanant: string
  confirmation: 'CONFIRMADO' | 'PENDENTE'
  table_id?: string
  observations: string
  special_needs: string
  status:
    | 'CONVIDADO'
    | 'CONFIRMADO'
    | 'PENDENTE'
    | 'CANCELADO'
    | 'PRESENTE'
    | 'NAO_COMPARECEU'
    | 'NAO_ESTAVA_NA_LISTA'
  role?: 'HOMENAGEADO' | 'COMPRADOR' | 'CONVIDADO_HOMENAGEADO' | 'ACOMPANHANTE' | 'INTEGRANTE_GRUPO'
  qr_code?: string
  dietary_restriction?: string
  dietary_details?: string
  whatsapp_authorized?: boolean
  payment_status?: 'ISENTO' | 'PAGO' | 'PENDENTE' | 'CORTESIA'
  group_size?: number
  checkin_operator?: string
  checkin_mode?: 'QR' | 'MANUAL'
  expand?: {
    honoree_id?: HonoreeRecord
    table_id?: TableRecord
  }
}

export interface TableAssignmentRecord extends RecordModel {
  table_id: string
  guest_id: string
}

export interface AlertRecord extends RecordModel {
  event_id: string
  target_type: 'TODOS' | 'EQUIPE'
  target_team_id?: string
  message: string
  is_resolved: boolean
  expand?: {
    target_team_id?: TeamRecord
  }
}

export interface AcknowledgementRecord extends RecordModel {
  alert_id: string
  team_member_id?: string
  status: 'RECEBIDO' | 'PRONTO'
  acknowledged_at: string
}

export interface CheckinRecord extends RecordModel {
  event_id: string
  guest_id: string
  checked_in_at: string
  checkin_mode?: 'QR' | 'MANUAL'
  operator?: string
  override_authorized_by?: string
  is_duplicate_override?: boolean
  expand?: {
    guest_id?: GuestRecord
  }
}

export interface OccurrenceRecord extends RecordModel {
  event_id: string
  category: 'CONVIDADO' | 'MESA' | 'BUFFET' | 'EQUIPE' | 'FORNECEDOR' | 'PROTOCOLO' | 'OUTRO'
  description: string
  responsible: string
  solution: string
}

export type ChecklistArea =
  | 'MESAS_CADEIRAS'
  | 'ARRANJOS_DECORACAO'
  | 'RECEPCAO'
  | 'BUFFET'
  | 'BEBIDAS'
  | 'SOM'
  | 'ILUMINACAO'
  | 'TELAO'
  | 'PALCO'
  | 'FOTOGRAFIA'
  | 'EQUIPE'
  | 'FORNECEDORES'
  | 'ACESSIBILIDADE'
  | 'RESTRICOES_ALIMENTARES'
  | 'CONTATOS_COMUNICACAO'
  | 'MATERIAIS_CONTINGENCIA'

export type ChecklistStatus =
  | 'NAO_INICIADO'
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_TERCEIRO'
  | 'CONCLUIDO'
  | 'BLOQUEADO'
  | 'ATRASADO'

export interface ChecklistItemRecord extends RecordModel {
  event_id: string
  area: ChecklistArea
  description: string
  responsible: string
  supplier_sector?: string
  deadline?: string
  priority: 'ALTA' | 'MEDIA' | 'BAIXA'
  status: ChecklistStatus
  evidence_notes?: string
  evidence_photo?: string
  confirmed_at?: string
  received_confirmed?: boolean
  understood_confirmed?: boolean
  is_critical?: boolean
  bypass_authorized_by?: string
  bypass_justification?: string
  history_log?: Array<{
    timestamp: string
    actor: string
    action: string
    notes?: string
  }>
}

export interface ChairTransferRecord extends RecordModel {
  event_id: string
  source_table_id: string
  target_table_id: string
  chairs_count: number
  requested_by: string
  reason: string
  authorized_by?: string
  status: 'PENDENTE_APROVACAO' | 'APROVADA' | 'BLOQUEADA_NEGADA' | 'EXECUTADA'
  rejection_reason?: string
  timestamp: string
  expand?: {
    source_table_id?: TableRecord
    target_table_id?: TableRecord
  }
}

export interface DietaryTaskRecord extends RecordModel {
  event_id: string
  guest_id: string
  guest_code?: string
  guest_name: string
  table_id?: string
  table_name?: string
  restriction_type: string
  details?: string
  buffet_responsible?: string
  received_confirmed?: boolean
  received_at?: string
  prepared_confirmed?: boolean
  prepared_at?: string
  delivered_confirmed?: boolean
  delivered_at?: string
  delivery_responsible?: string
  status: 'PENDENTE' | 'RECEBIDO' | 'EM_PREPARO' | 'PRONTO' | 'ENTREGUE'
  notes?: string
}

export interface BuffetReleaseRecord extends RecordModel {
  event_id: string
  wave_number: number
  table_ids: string[]
  table_names: string
  operator: string
  released_at: string
  display_on_screen?: boolean
  whatsapp_sent_count?: number
  status: 'CHAMADAS' | 'DIRIGINDO_AO_BUFFET' | 'ATENDIDAS' | 'CONCLUIDAS'
  notes?: string
}

export interface WhatsappMessageRecord extends RecordModel {
  event_id: string
  recipient_name: string
  recipient_phone: string
  recipient_role?: string
  message: string
  category:
    | 'BUFFET_LIBERACAO'
    | 'HOMENAGEADO_CHAMADA'
    | 'COBRANCA_CHECKLIST'
    | 'ALERTA_EQUIPE'
    | 'GERAL'
  scheduled_for?: string
  sent_at?: string
  status: 'PREPARADA' | 'ENVIADA' | 'ENTREGUE' | 'LIDA' | 'FALHOU'
  attempts: number
  idempotency_key?: string
  error_details?: string
}

export interface AuditLogRecord extends RecordModel {
  event_id: string
  actor_name: string
  actor_role?: string
  action: string
  target_entity: string
  target_id?: string
  details?: string
  timestamp: string
}
