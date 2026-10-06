import pb from '@/lib/pocketbase/client'
import type {
  EventRecord,
  HonoreeRecord,
  GuestRecord,
  TableRecord,
  TeamRecord,
  TeamMemberRecord,
  SupplierRecord,
  TimelineItemRecord,
  AlertRecord,
  AcknowledgementRecord,
  CheckinRecord,
  OccurrenceRecord,
  ChecklistItemRecord,
  ChairTransferRecord,
  DietaryTaskRecord,
  BuffetReleaseRecord,
  WhatsappMessageRecord,
  AuditLogRecord,
} from '@/types/celebra'

export const eventService = {
  async list(): Promise<EventRecord[]> {
    return await pb.collection('events').getFullList<EventRecord>({ sort: '-date' })
  },
  async getById(id: string): Promise<EventRecord> {
    return await pb.collection('events').getOne<EventRecord>(id)
  },
  async create(data: Partial<EventRecord>): Promise<EventRecord> {
    return await pb.collection('events').create<EventRecord>(data)
  },
  async update(id: string, data: Partial<EventRecord>): Promise<EventRecord> {
    return await pb.collection('events').update<EventRecord>(id, data)
  },
}

export const tableService = {
  async list(eventId: string): Promise<TableRecord[]> {
    return await pb.collection('tables').getFullList<TableRecord>({
      filter: `event_id = "${eventId}"`,
      sort: 'name',
    })
  },
  async create(data: Partial<TableRecord>): Promise<TableRecord> {
    return await pb.collection('tables').create<TableRecord>(data)
  },
  async update(id: string, data: Partial<TableRecord>): Promise<TableRecord> {
    return await pb.collection('tables').update<TableRecord>(id, data)
  },
  async delete(id: string): Promise<boolean> {
    return await pb.collection('tables').delete(id)
  },
}

export const honoreeService = {
  async list(eventId: string): Promise<HonoreeRecord[]> {
    return await pb.collection('honorees').getFullList<HonoreeRecord>({
      filter: `event_id = "${eventId}"`,
      sort: 'tribute_order,name',
    })
  },
  async create(data: FormData | Partial<HonoreeRecord>): Promise<HonoreeRecord> {
    return await pb.collection('honorees').create<HonoreeRecord>(data)
  },
  async update(id: string, data: FormData | Partial<HonoreeRecord>): Promise<HonoreeRecord> {
    return await pb.collection('honorees').update<HonoreeRecord>(id, data)
  },
  async delete(id: string): Promise<boolean> {
    return await pb.collection('honorees').delete(id)
  },
}

export const guestService = {
  async list(eventId: string): Promise<GuestRecord[]> {
    return await pb.collection('guests').getFullList<GuestRecord>({
      filter: `event_id = "${eventId}"`,
      sort: 'name',
      expand: 'honoree_id,table_id',
    })
  },
  async create(data: Partial<GuestRecord>): Promise<GuestRecord> {
    return await pb.collection('guests').create<GuestRecord>(data, {
      expand: 'honoree_id,table_id',
    })
  },
  async update(id: string, data: Partial<GuestRecord>): Promise<GuestRecord> {
    return await pb.collection('guests').update<GuestRecord>(id, data, {
      expand: 'honoree_id,table_id',
    })
  },
  async delete(id: string): Promise<boolean> {
    return await pb.collection('guests').delete(id)
  },
  async checkIn(
    eventId: string,
    guestId: string,
    options?: {
      mode?: 'QR' | 'MANUAL'
      operator?: string
      overrideAuthorizedBy?: string
      isDuplicateOverride?: boolean
    },
  ): Promise<CheckinRecord> {
    // 1. Update guest status to PRESENTE
    await pb.collection('guests').update(guestId, {
      status: 'PRESENTE',
      checkin_mode: options?.mode || 'MANUAL',
      checkin_operator: options?.operator || 'Recepção',
    })
    // 2. Insert checkin record
    const record = await pb.collection('checkins').create<CheckinRecord>({
      event_id: eventId,
      guest_id: guestId,
      checked_in_at: new Date().toISOString(),
      checkin_mode: options?.mode || 'MANUAL',
      operator: options?.operator || 'Recepção',
      override_authorized_by: options?.overrideAuthorizedBy || '',
      is_duplicate_override: !!options?.isDuplicateOverride,
    })

    // 3. Log audit
    auditService
      .log({
        event_id: eventId,
        actor_name: options?.operator || 'Recepção',
        actor_role: 'Recepção',
        action: options?.isDuplicateOverride
          ? 'CHECKIN_DUPLICADO_AUTORIZADO'
          : 'CHECKIN_CONFIRMADO',
        target_entity: 'guests',
        target_id: guestId,
        details: `Modo: ${options?.mode || 'MANUAL'}. Autorizado por: ${options?.overrideAuthorizedBy || 'Operador'}`,
      })
      .catch(() => {})

    return record
  },
}

export const teamService = {
  async list(eventId: string): Promise<TeamRecord[]> {
    return await pb.collection('teams').getFullList<TeamRecord>({
      filter: `event_id = "${eventId}"`,
      sort: 'name',
    })
  },
  async create(data: Partial<TeamRecord>): Promise<TeamRecord> {
    return await pb.collection('teams').create<TeamRecord>(data)
  },
  async listMembers(teamId?: string): Promise<TeamMemberRecord[]> {
    const filter = teamId ? `team_id = "${teamId}"` : ''
    return await pb.collection('team_members').getFullList<TeamMemberRecord>({
      filter,
      sort: '-role,name',
    })
  },
  async createMember(data: Partial<TeamMemberRecord>): Promise<TeamMemberRecord> {
    return await pb.collection('team_members').create<TeamMemberRecord>(data)
  },
  async updateMember(id: string, data: Partial<TeamMemberRecord>): Promise<TeamMemberRecord> {
    return await pb.collection('team_members').update<TeamMemberRecord>(id, data)
  },
  async deleteMember(id: string): Promise<boolean> {
    return await pb.collection('team_members').delete(id)
  },
}

export const supplierService = {
  async list(eventId: string): Promise<SupplierRecord[]> {
    return await pb.collection('suppliers').getFullList<SupplierRecord>({
      filter: `event_id = "${eventId}"`,
      sort: 'name',
    })
  },
  async create(data: Partial<SupplierRecord>): Promise<SupplierRecord> {
    return await pb.collection('suppliers').create<SupplierRecord>(data)
  },
  async update(id: string, data: Partial<SupplierRecord>): Promise<SupplierRecord> {
    return await pb.collection('suppliers').update<SupplierRecord>(id, data)
  },
  async delete(id: string): Promise<boolean> {
    return await pb.collection('suppliers').delete(id)
  },
}

export const timelineService = {
  async list(eventId: string): Promise<TimelineItemRecord[]> {
    return await pb.collection('timeline_items').getFullList<TimelineItemRecord>({
      filter: `event_id = "${eventId}"`,
      sort: 'scheduled_time',
      expand: 'teams',
    })
  },
  async create(data: Partial<TimelineItemRecord>): Promise<TimelineItemRecord> {
    return await pb.collection('timeline_items').create<TimelineItemRecord>(data, {
      expand: 'teams',
    })
  },
  async update(id: string, data: Partial<TimelineItemRecord>): Promise<TimelineItemRecord> {
    return await pb.collection('timeline_items').update<TimelineItemRecord>(id, data, {
      expand: 'teams',
    })
  },
  async delete(id: string): Promise<boolean> {
    return await pb.collection('timeline_items').delete(id)
  },
}

export const alertService = {
  async list(eventId: string): Promise<AlertRecord[]> {
    return await pb.collection('alerts').getFullList<AlertRecord>({
      filter: `event_id = "${eventId}"`,
      sort: '-created',
      expand: 'target_team_id',
    })
  },
  async create(data: Partial<AlertRecord>): Promise<AlertRecord> {
    return await pb.collection('alerts').create<AlertRecord>(data, {
      expand: 'target_team_id',
    })
  },
  async update(id: string, data: Partial<AlertRecord>): Promise<AlertRecord> {
    return await pb.collection('alerts').update<AlertRecord>(id, data)
  },
  async listAcks(alertId?: string): Promise<AcknowledgementRecord[]> {
    const filter = alertId ? `alert_id = "${alertId}"` : ''
    return await pb.collection('acknowledgements').getFullList<AcknowledgementRecord>({
      filter,
      sort: '-created',
    })
  },
  async acknowledge(
    alertId: string,
    status: 'RECEBIDO' | 'PRONTO',
    teamMemberId?: string,
  ): Promise<AcknowledgementRecord> {
    return await pb.collection('acknowledgements').create<AcknowledgementRecord>({
      alert_id: alertId,
      team_member_id: teamMemberId,
      status,
      acknowledged_at: new Date().toISOString(),
    })
  },
}

export const occurrenceService = {
  async list(eventId: string): Promise<OccurrenceRecord[]> {
    return await pb.collection('occurrences').getFullList<OccurrenceRecord>({
      filter: `event_id = "${eventId}"`,
      sort: '-created',
    })
  },
  async create(data: Partial<OccurrenceRecord>): Promise<OccurrenceRecord> {
    return await pb.collection('occurrences').create<OccurrenceRecord>(data)
  },
  async update(id: string, data: Partial<OccurrenceRecord>): Promise<OccurrenceRecord> {
    return await pb.collection('occurrences').update<OccurrenceRecord>(id, data)
  },
  async delete(id: string): Promise<boolean> {
    return await pb.collection('occurrences').delete(id)
  },
}

// ---------------- NEW DEMO SERVICES ----------------

export const checklistService = {
  async list(eventId: string): Promise<ChecklistItemRecord[]> {
    return await pb.collection('checklist_items').getFullList<ChecklistItemRecord>({
      filter: `event_id = "${eventId}"`,
      sort: 'priority,area',
    })
  },
  async update(id: string, data: Partial<ChecklistItemRecord>): Promise<ChecklistItemRecord> {
    return await pb.collection('checklist_items').update<ChecklistItemRecord>(id, data)
  },
  async create(data: Partial<ChecklistItemRecord>): Promise<ChecklistItemRecord> {
    return await pb.collection('checklist_items').create<ChecklistItemRecord>(data)
  },
}

export const chairService = {
  async listTransfers(eventId: string): Promise<ChairTransferRecord[]> {
    return await pb.collection('chair_transfers').getFullList<ChairTransferRecord>({
      filter: `event_id = "${eventId}"`,
      sort: '-timestamp',
      expand: 'source_table_id,target_table_id',
    })
  },
  async requestTransfer(data: {
    event_id: string
    source_table_id: string
    target_table_id: string
    chairs_count: number
    requested_by: string
    reason: string
    authorized_by?: string
  }): Promise<ChairTransferRecord> {
    // If no coordinator authorization provided, block automatically
    const isApproved = !!data.authorized_by && data.authorized_by.trim().length > 0
    const status = isApproved ? 'APROVADA' : 'BLOQUEADA_NEGADA'
    const rejectionReason = !isApproved
      ? 'TRAVA DE SEGURANÇA: Alteração de cadeiras bloqueada. Exige autorização formal de Hugo ou Renato.'
      : undefined

    const record = await pb.collection('chair_transfers').create<ChairTransferRecord>({
      ...data,
      status,
      rejection_reason: rejectionReason,
      timestamp: new Date().toISOString(),
    })

    // If approved, update physical chairs on both tables
    if (isApproved) {
      try {
        const source = await pb.collection('tables').getOne<TableRecord>(data.source_table_id)
        const target = await pb.collection('tables').getOne<TableRecord>(data.target_table_id)
        await pb.collection('tables').update(source.id, {
          physical_chairs: Math.max(
            0,
            (source.physical_chairs || source.capacity) - data.chairs_count,
          ),
          conference_status: 'DIVERGENTE',
        })
        await pb.collection('tables').update(target.id, {
          physical_chairs: (target.physical_chairs || target.capacity) + data.chairs_count,
          conference_status: 'DIVERGENTE',
        })
      } catch {
        /* intentionally ignored */
      }
    }

    // Audit log
    auditService
      .log({
        event_id: data.event_id,
        actor_name: data.requested_by,
        actor_role: 'Operacional',
        action: isApproved ? 'TRANSFERENCIA_CADEIRAS_APROVADA' : 'TRANSFERENCIA_CADEIRAS_BLOQUEADA',
        target_entity: 'tables',
        target_id: data.source_table_id,
        details: `${data.chairs_count} cadeiras da mesa ${data.source_table_id} para ${data.target_table_id}. Motivo: ${data.reason}. Status: ${status}`,
      })
      .catch(() => {})

    return record
  },
  async approveTransfer(transferId: string, authorizedBy: string): Promise<ChairTransferRecord> {
    const transfer = await pb.collection('chair_transfers').getOne<ChairTransferRecord>(transferId)
    const updated = await pb.collection('chair_transfers').update<ChairTransferRecord>(transferId, {
      status: 'APROVADA',
      authorized_by: authorizedBy,
      rejection_reason: '',
    })

    // Adjust tables
    try {
      const source = await pb.collection('tables').getOne<TableRecord>(transfer.source_table_id)
      const target = await pb.collection('tables').getOne<TableRecord>(transfer.target_table_id)
      await pb.collection('tables').update(source.id, {
        physical_chairs: Math.max(
          0,
          (source.physical_chairs || source.capacity) - transfer.chairs_count,
        ),
        conference_status: 'DIVERGENTE',
      })
      await pb.collection('tables').update(target.id, {
        physical_chairs: (target.physical_chairs || target.capacity) + transfer.chairs_count,
        conference_status: 'DIVERGENTE',
      })
    } catch {
      /* intentionally ignored */
    }

    return updated
  },
}

export const dietaryService = {
  async list(eventId: string): Promise<DietaryTaskRecord[]> {
    return await pb.collection('dietary_tasks').getFullList<DietaryTaskRecord>({
      filter: `event_id = "${eventId}"`,
      sort: 'status,table_name',
    })
  },
  async update(id: string, data: Partial<DietaryTaskRecord>): Promise<DietaryTaskRecord> {
    return await pb.collection('dietary_tasks').update<DietaryTaskRecord>(id, data)
  },
  async create(data: Partial<DietaryTaskRecord>): Promise<DietaryTaskRecord> {
    return await pb.collection('dietary_tasks').create<DietaryTaskRecord>(data)
  },
}

export const buffetReleaseService = {
  async list(eventId: string): Promise<BuffetReleaseRecord[]> {
    return await pb.collection('buffet_releases').getFullList<BuffetReleaseRecord>({
      filter: `event_id = "${eventId}"`,
      sort: '-wave_number',
    })
  },
  async releaseWave(data: {
    event_id: string
    table_ids: string[]
    table_names: string
    operator: string
    display_on_screen?: boolean
  }): Promise<BuffetReleaseRecord> {
    // 1. Calculate wave number
    const existing = await this.list(data.event_id)
    const waveNumber = existing.length + 1

    // 2. Mark each table buffet_status as CHAMADA
    for (const tid of data.table_ids) {
      await pb.collection('tables').update(tid, { buffet_status: 'CHAMADA' })
    }

    // 3. Create buffet release record
    const record = await pb.collection('buffet_releases').create<BuffetReleaseRecord>({
      event_id: data.event_id,
      wave_number: waveNumber,
      table_ids: data.table_ids,
      table_names: data.table_names,
      operator: data.operator,
      released_at: new Date().toISOString(),
      display_on_screen: !!data.display_on_screen,
      whatsapp_sent_count: data.table_ids.length * 8, // simulated guest count
      status: 'CHAMADAS',
    })

    // 4. Send simulated batch WhatsApp
    whatsappService
      .sendSimulatedBatch({
        event_id: data.event_id,
        category: 'BUFFET_LIBERACAO',
        recipient_role: 'Convidado da Mesa',
        recipients: data.table_ids.map((tid, idx) => ({
          name: `Convidados ${data.table_names.split(',')[idx] || 'Mesa'}`,
          phone: `(11) 99123-000${idx + 1}`,
        })),
        message: `Atenção: A sua mesa (${data.table_names}) foi liberada para o Buffet Gastronômico! Por favor, dirijam-se tranquilamente ao salão de réchauds.`,
      })
      .catch(() => {})

    // 5. Audit log
    auditService
      .log({
        event_id: data.event_id,
        actor_name: data.operator,
        actor_role: 'Cerimonial / Coordenação',
        action: 'LIBERACAO_BUFFET_ONDA',
        target_entity: 'buffet_releases',
        target_id: record.id,
        details: `Onda ${waveNumber} liberada para ${data.table_names}. Telão: ${data.display_on_screen ? 'Sim' : 'Não'}`,
      })
      .catch(() => {})

    return record
  },
}

export const whatsappService = {
  async list(eventId: string): Promise<WhatsappMessageRecord[]> {
    return await pb.collection('whatsapp_messages').getFullList<WhatsappMessageRecord>({
      filter: `event_id = "${eventId}"`,
      sort: '-created',
    })
  },
  async sendSimulated(data: {
    event_id: string
    recipient_name: string
    recipient_phone: string
    recipient_role?: string
    message: string
    category: WhatsappMessageRecord['category']
  }): Promise<WhatsappMessageRecord> {
    const key = `wp_${data.event_id}_${data.recipient_phone}_${Date.now()}`
    return await pb.collection('whatsapp_messages').create<WhatsappMessageRecord>({
      ...data,
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      status: 'ENTREGUE',
      attempts: 1,
      idempotency_key: key,
    })
  },
  async sendSimulatedBatch(data: {
    event_id: string
    category: WhatsappMessageRecord['category']
    recipient_role?: string
    message: string
    recipients: Array<{ name: string; phone: string }>
  }): Promise<void> {
    for (const r of data.recipients) {
      await this.sendSimulated({
        event_id: data.event_id,
        recipient_name: r.name,
        recipient_phone: r.phone,
        recipient_role: data.recipient_role,
        message: data.message,
        category: data.category,
      })
    }
  },
}

export const auditService = {
  async list(eventId: string): Promise<AuditLogRecord[]> {
    return await pb.collection('audit_logs').getFullList<AuditLogRecord>({
      filter: `event_id = "${eventId}"`,
      sort: '-timestamp',
    })
  },
  async log(data: {
    event_id: string
    actor_name: string
    actor_role?: string
    action: string
    target_entity: string
    target_id?: string
    details?: string
  }): Promise<AuditLogRecord> {
    return await pb.collection('audit_logs').create<AuditLogRecord>({
      ...data,
      timestamp: new Date().toISOString(),
    })
  },
}
