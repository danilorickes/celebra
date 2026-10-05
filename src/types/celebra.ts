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
