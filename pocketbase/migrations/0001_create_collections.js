migrate(
  (app) => {
    // 1. events collection
    const events = new Collection({
      name: 'events',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'date', type: 'date' },
        { name: 'profile', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['PREPARACAO', 'ATIVO', 'FINALIZADO'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_events_status ON events (status)'],
    })
    app.save(events)
    const eventsId = events.id

    // 2. tables collection
    const tables = new Collection({
      name: 'tables',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'event_id',
          type: 'relation',
          collectionId: eventsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'capacity', type: 'number', min: 1 },
        { name: 'is_reserve', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_tables_event_id ON tables (event_id)'],
    })
    app.save(tables)
    const tablesId = tables.id

    // 3. teams collection
    const teams = new Collection({
      name: 'teams',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'event_id',
          type: 'relation',
          collectionId: eventsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_teams_event_id ON teams (event_id)'],
    })
    app.save(teams)
    const teamsId = teams.id

    // 4. team_members collection
    const teamMembers = new Collection({
      name: 'team_members',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'team_id',
          type: 'relation',
          collectionId: teamsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'user_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'name', type: 'text' },
        {
          name: 'role',
          type: 'select',
          values: ['LEADER', 'MEMBER'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_team_members_team_id ON team_members (team_id)'],
    })
    app.save(teamMembers)
    const teamMembersId = teamMembers.id

    // 5. suppliers collection
    const suppliers = new Collection({
      name: 'suppliers',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'event_id',
          type: 'relation',
          collectionId: eventsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'category', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'contact', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_suppliers_event_id ON suppliers (event_id)'],
    })
    app.save(suppliers)

    // 6. timeline_items collection
    const timelineItems = new Collection({
      name: 'timeline_items',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'event_id',
          type: 'relation',
          collectionId: eventsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'scheduled_time', type: 'date' },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'responsibles', type: 'text' },
        { name: 'teams', type: 'relation', collectionId: teamsId, maxSelect: 10 },
        { name: 'observations', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['A_PREPARAR', 'PRONTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'ATRASADO'],
          maxSelect: 1,
        },
        { name: 'real_start_time', type: 'date' },
        { name: 'real_end_time', type: 'date' },
        { name: 'delay_minutes', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_timeline_items_event_time ON timeline_items (event_id, scheduled_time)',
      ],
    })
    app.save(timelineItems)
    const timelineItemsId = timelineItems.id

    // 7. honorees collection
    const honorees = new Collection({
      name: 'honorees',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'event_id',
          type: 'relation',
          collectionId: eventsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        {
          name: 'photo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'phone', type: 'text' },
        { name: 'whatsapp', type: 'text' },
        { name: 'observations', type: 'text' },
        { name: 'status', type: 'select', values: ['CONFIRMADO', 'PENDENTE'], maxSelect: 1 },
        { name: 'important_info', type: 'text' },
        { name: 'tribute_order', type: 'number' },
        { name: 'timeline_item_id', type: 'relation', collectionId: timelineItemsId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_honorees_event_id ON honorees (event_id)'],
    })
    app.save(honorees)
    const honoreesId = honorees.id

    // 8. guests collection
    const guests = new Collection({
      name: 'guests',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'event_id',
          type: 'relation',
          collectionId: eventsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'honoree_id', type: 'relation', collectionId: honoreesId, maxSelect: 1 },
        { name: 'name', type: 'text', required: true },
        { name: 'phone', type: 'text' },
        { name: 'accompanant', type: 'text' },
        { name: 'confirmation', type: 'select', values: ['CONFIRMADO', 'PENDENTE'], maxSelect: 1 },
        { name: 'table_id', type: 'relation', collectionId: tablesId, maxSelect: 1 },
        { name: 'observations', type: 'text' },
        { name: 'special_needs', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: [
            'CONVIDADO',
            'CONFIRMADO',
            'PENDENTE',
            'CANCELADO',
            'PRESENTE',
            'NAO_COMPARECEU',
            'NAO_ESTAVA_NA_LISTA',
          ],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_guests_event_id ON guests (event_id)',
        'CREATE INDEX idx_guests_honoree_id ON guests (honoree_id)',
        'CREATE INDEX idx_guests_table_id ON guests (table_id)',
      ],
    })
    app.save(guests)
    const guestsId = guests.id

    // 9. table_assignments collection (history/tracking)
    const tableAssignments = new Collection({
      name: 'table_assignments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'table_id',
          type: 'relation',
          collectionId: tablesId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'guest_id',
          type: 'relation',
          collectionId: guestsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(tableAssignments)

    // 10. alerts collection
    const alerts = new Collection({
      name: 'alerts',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'event_id',
          type: 'relation',
          collectionId: eventsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'target_type',
          type: 'select',
          values: ['TODOS', 'EQUIPE'],
          maxSelect: 1,
          required: true,
        },
        { name: 'target_team_id', type: 'relation', collectionId: teamsId, maxSelect: 1 },
        { name: 'message', type: 'text', required: true },
        { name: 'is_resolved', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_alerts_event_id ON alerts (event_id)'],
    })
    app.save(alerts)
    const alertsId = alerts.id

    // 11. acknowledgements collection
    const acknowledgements = new Collection({
      name: 'acknowledgements',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'alert_id',
          type: 'relation',
          collectionId: alertsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'team_member_id', type: 'relation', collectionId: teamMembersId, maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          values: ['RECEBIDO', 'PRONTO'],
          maxSelect: 1,
          required: true,
        },
        { name: 'acknowledged_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_ack_alert_id ON acknowledgements (alert_id)'],
    })
    app.save(acknowledgements)

    // 12. checkins collection
    const checkins = new Collection({
      name: 'checkins',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'event_id',
          type: 'relation',
          collectionId: eventsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'guest_id',
          type: 'relation',
          collectionId: guestsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'checked_in_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_checkins_event_id ON checkins (event_id)'],
    })
    app.save(checkins)

    // 13. occurrences collection
    const occurrences = new Collection({
      name: 'occurrences',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'event_id',
          type: 'relation',
          collectionId: eventsId,
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'category',
          type: 'select',
          values: ['CONVIDADO', 'MESA', 'BUFFET', 'EQUIPE', 'FORNECEDOR', 'PROTOCOLO', 'OUTRO'],
          maxSelect: 1,
          required: true,
        },
        { name: 'description', type: 'text', required: true },
        { name: 'responsible', type: 'text' },
        { name: 'solution', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_occurrences_event_id ON occurrences (event_id)'],
    })
    app.save(occurrences)
  },
  (app) => {
    const toDelete = [
      'occurrences',
      'checkins',
      'acknowledgements',
      'alerts',
      'table_assignments',
      'guests',
      'honorees',
      'timeline_items',
      'suppliers',
      'team_members',
      'teams',
      'tables',
      'events',
    ]
    for (let i = 0; i < toDelete.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(toDelete[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
