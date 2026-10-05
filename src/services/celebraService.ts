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
  async checkIn(eventId: string, guestId: string): Promise<void> {
    // 1. Update guest status to PRESENTE
    await pb.collection('guests').update(guestId, { status: 'PRESENTE' })
    // 2. Insert checkin record
    await pb.collection('checkins').create({
      event_id: eventId,
      guest_id: guestId,
      checked_in_at: new Date().toISOString(),
    })
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
