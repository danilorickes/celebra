migrate(
  (app) => {
    const eventsId = app.findCollectionByNameOrId('events').id
    const tablesId = app.findCollectionByNameOrId('tables').id
    const guestsId = app.findCollectionByNameOrId('guests').id
    const honoreesId = app.findCollectionByNameOrId('honorees').id

    // 1. Add fields to existing collections if missing
    // tables: add planned_chairs, physical_chairs, conference_status, conference_responsible, conference_photo, is_locked, buffet_status, special_needs_note, notes
    const tablesCol = app.findCollectionByNameOrId('tables')
    if (!tablesCol.fields.getByName('planned_chairs')) {
      tablesCol.fields.add(new NumberField({ name: 'planned_chairs', min: 0 }))
    }
    if (!tablesCol.fields.getByName('physical_chairs')) {
      tablesCol.fields.add(new NumberField({ name: 'physical_chairs', min: 0 }))
    }
    if (!tablesCol.fields.getByName('conference_status')) {
      tablesCol.fields.add(
        new SelectField({
          name: 'conference_status',
          values: ['PENDENTE', 'CONFERIDA', 'DIVERGENTE', 'BLOQUEADA'],
          maxSelect: 1,
        }),
      )
    }
    if (!tablesCol.fields.getByName('conference_responsible')) {
      tablesCol.fields.add(new TextField({ name: 'conference_responsible' }))
    }
    if (!tablesCol.fields.getByName('conference_photo')) {
      tablesCol.fields.add(new TextField({ name: 'conference_photo' }))
    }
    if (!tablesCol.fields.getByName('is_locked')) {
      tablesCol.fields.add(new BoolField({ name: 'is_locked' }))
    }
    if (!tablesCol.fields.getByName('buffet_status')) {
      tablesCol.fields.add(
        new SelectField({
          name: 'buffet_status',
          values: ['AGUARDANDO', 'CHAMADA', 'DIRIGINDO_AO_BUFFET', 'ATENDIDA', 'CONCLUIDA'],
          maxSelect: 1,
        }),
      )
    }
    if (!tablesCol.fields.getByName('special_needs_note')) {
      tablesCol.fields.add(new TextField({ name: 'special_needs_note' }))
    }
    if (!tablesCol.fields.getByName('operational_notes')) {
      tablesCol.fields.add(new TextField({ name: 'operational_notes' }))
    }
    app.save(tablesCol)

    // guests: add role, qr_code, dietary_restriction, dietary_details, whatsapp_authorized, payment_status, checkin_mode, group_size, checkin_operator
    const guestsCol = app.findCollectionByNameOrId('guests')
    if (!guestsCol.fields.getByName('role')) {
      guestsCol.fields.add(
        new SelectField({
          name: 'role',
          values: [
            'HOMENAGEADO',
            'COMPRADOR',
            'CONVIDADO_HOMENAGEADO',
            'ACOMPANHANTE',
            'INTEGRANTE_GRUPO',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!guestsCol.fields.getByName('qr_code')) {
      guestsCol.fields.add(new TextField({ name: 'qr_code' }))
    }
    if (!guestsCol.fields.getByName('dietary_restriction')) {
      guestsCol.fields.add(new TextField({ name: 'dietary_restriction' }))
    }
    if (!guestsCol.fields.getByName('dietary_details')) {
      guestsCol.fields.add(new TextField({ name: 'dietary_details' }))
    }
    if (!guestsCol.fields.getByName('whatsapp_authorized')) {
      guestsCol.fields.add(new BoolField({ name: 'whatsapp_authorized' }))
    }
    if (!guestsCol.fields.getByName('payment_status')) {
      guestsCol.fields.add(
        new SelectField({
          name: 'payment_status',
          values: ['ISENTO', 'PAGO', 'PENDENTE', 'CORTESIA'],
          maxSelect: 1,
        }),
      )
    }
    if (!guestsCol.fields.getByName('group_size')) {
      guestsCol.fields.add(new NumberField({ name: 'group_size', min: 1 }))
    }
    if (!guestsCol.fields.getByName('checkin_operator')) {
      guestsCol.fields.add(new TextField({ name: 'checkin_operator' }))
    }
    if (!guestsCol.fields.getByName('checkin_mode')) {
      guestsCol.fields.add(
        new SelectField({ name: 'checkin_mode', values: ['QR', 'MANUAL'], maxSelect: 1 }),
      )
    }
    app.save(guestsCol)

    // checkins: add checkin_mode, operator, override_authorized_by, notes
    const checkinsCol = app.findCollectionByNameOrId('checkins')
    if (!checkinsCol.fields.getByName('checkin_mode')) {
      checkinsCol.fields.add(
        new SelectField({ name: 'checkin_mode', values: ['QR', 'MANUAL'], maxSelect: 1 }),
      )
    }
    if (!checkinsCol.fields.getByName('operator')) {
      checkinsCol.fields.add(new TextField({ name: 'operator' }))
    }
    if (!checkinsCol.fields.getByName('override_authorized_by')) {
      checkinsCol.fields.add(new TextField({ name: 'override_authorized_by' }))
    }
    if (!checkinsCol.fields.getByName('is_duplicate_override')) {
      checkinsCol.fields.add(new BoolField({ name: 'is_duplicate_override' }))
    }
    app.save(checkinsCol)

    // honorees: add operational_state (11 states), escort, stage_resources, music, stage_photo_url, conductor_responsible, scheduled_time, actual_time
    const honoreesCol = app.findCollectionByNameOrId('honorees')
    if (!honoreesCol.fields.getByName('operational_state')) {
      honoreesCol.fields.add(
        new SelectField({
          name: 'operational_state',
          values: [
            'AGUARDANDO',
            'AVISADO',
            'CONFIRMOU_RECEBIMENTO',
            'EM_PREPARACAO',
            'PROXIMO',
            'CHAMADO',
            'NO_PALCO',
            'FOTOGRAFIA',
            'CONCLUIDO',
            'AUSENTE',
            'EXCECAO',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!honoreesCol.fields.getByName('escort_name')) {
      honoreesCol.fields.add(new TextField({ name: 'escort_name' }))
    }
    if (!honoreesCol.fields.getByName('table_id')) {
      honoreesCol.fields.add(
        new RelationField({ name: 'table_id', collectionId: tablesId, maxSelect: 1 }),
      )
    }
    if (!honoreesCol.fields.getByName('stage_resources')) {
      honoreesCol.fields.add(new TextField({ name: 'stage_resources' }))
    }
    if (!honoreesCol.fields.getByName('music_cue')) {
      honoreesCol.fields.add(new TextField({ name: 'music_cue' }))
    }
    if (!honoreesCol.fields.getByName('conductor_responsible')) {
      honoreesCol.fields.add(new TextField({ name: 'conductor_responsible' }))
    }
    if (!honoreesCol.fields.getByName('presentation_text')) {
      honoreesCol.fields.add(new TextField({ name: 'presentation_text' }))
    }
    if (!honoreesCol.fields.getByName('scheduled_time')) {
      honoreesCol.fields.add(new DateField({ name: 'scheduled_time' }))
    }
    if (!honoreesCol.fields.getByName('actual_time')) {
      honoreesCol.fields.add(new DateField({ name: 'actual_time' }))
    }
    app.save(honoreesCol)

    // 2. Create checklist_items collection
    const checklistItems = new Collection({
      name: 'checklist_items',
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
          name: 'area',
          type: 'select',
          values: [
            'MESAS_CADEIRAS',
            'ARRANJOS_DECORACAO',
            'RECEPCAO',
            'BUFFET',
            'BEBIDAS',
            'SOM',
            'ILUMINACAO',
            'TELAO',
            'PALCO',
            'FOTOGRAFIA',
            'EQUIPE',
            'FORNECEDORES',
            'ACESSIBILIDADE',
            'RESTRICOES_ALIMENTARES',
            'CONTATOS_COMUNICACAO',
            'MATERIAIS_CONTINGENCIA',
          ],
          maxSelect: 1,
          required: true,
        },
        { name: 'description', type: 'text', required: true },
        { name: 'responsible', type: 'text', required: true },
        { name: 'supplier_sector', type: 'text' },
        { name: 'deadline', type: 'date' },
        {
          name: 'priority',
          type: 'select',
          values: ['ALTA', 'MEDIA', 'BAIXA'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          values: [
            'NAO_INICIADO',
            'EM_ANDAMENTO',
            'AGUARDANDO_TERCEIRO',
            'CONCLUIDO',
            'BLOQUEADO',
            'ATRASADO',
          ],
          maxSelect: 1,
          required: true,
        },
        { name: 'evidence_notes', type: 'text' },
        { name: 'evidence_photo', type: 'text' },
        { name: 'confirmed_at', type: 'date' },
        { name: 'received_confirmed', type: 'bool' },
        { name: 'understood_confirmed', type: 'bool' },
        { name: 'is_critical', type: 'bool' },
        { name: 'bypass_authorized_by', type: 'text' },
        { name: 'bypass_justification', type: 'text' },
        { name: 'history_log', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_checklist_event_area ON checklist_items (event_id, area)',
        'CREATE INDEX idx_checklist_status ON checklist_items (status)',
      ],
    })
    app.save(checklistItems)

    // 3. Create chair_transfers collection
    const chairTransfers = new Collection({
      name: 'chair_transfers',
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
          name: 'source_table_id',
          type: 'relation',
          collectionId: tablesId,
          required: true,
          maxSelect: 1,
        },
        {
          name: 'target_table_id',
          type: 'relation',
          collectionId: tablesId,
          required: true,
          maxSelect: 1,
        },
        { name: 'chairs_count', type: 'number', min: 1, required: true },
        { name: 'requested_by', type: 'text', required: true },
        { name: 'reason', type: 'text', required: true },
        { name: 'authorized_by', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['PENDENTE_APROVACAO', 'APROVADA', 'BLOQUEADA_NEGADA', 'EXECUTADA'],
          maxSelect: 1,
          required: true,
        },
        { name: 'rejection_reason', type: 'text' },
        { name: 'timestamp', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_chair_transfers_event ON chair_transfers (event_id)'],
    })
    app.save(chairTransfers)

    // 4. Create dietary_tasks collection
    const dietaryTasks = new Collection({
      name: 'dietary_tasks',
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
          maxSelect: 1,
        },
        { name: 'guest_code', type: 'text' },
        { name: 'guest_name', type: 'text', required: true },
        { name: 'table_id', type: 'relation', collectionId: tablesId, maxSelect: 1 },
        { name: 'table_name', type: 'text' },
        { name: 'restriction_type', type: 'text', required: true },
        { name: 'details', type: 'text' },
        { name: 'buffet_responsible', type: 'text' },
        { name: 'received_confirmed', type: 'bool' },
        { name: 'received_at', type: 'date' },
        { name: 'prepared_confirmed', type: 'bool' },
        { name: 'prepared_at', type: 'date' },
        { name: 'delivered_confirmed', type: 'bool' },
        { name: 'delivered_at', type: 'date' },
        { name: 'delivery_responsible', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['PENDENTE', 'RECEBIDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE'],
          maxSelect: 1,
          required: true,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_dietary_event_status ON dietary_tasks (event_id, status)'],
    })
    app.save(dietaryTasks)

    // 5. Create buffet_releases collection (waves)
    const buffetReleases = new Collection({
      name: 'buffet_releases',
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
        { name: 'wave_number', type: 'number', min: 1, required: true },
        { name: 'table_ids', type: 'json' },
        { name: 'table_names', type: 'text', required: true },
        { name: 'operator', type: 'text', required: true },
        { name: 'released_at', type: 'date' },
        { name: 'display_on_screen', type: 'bool' },
        { name: 'whatsapp_sent_count', type: 'number', min: 0 },
        {
          name: 'status',
          type: 'select',
          values: ['CHAMADAS', 'DIRIGINDO_AO_BUFFET', 'ATENDIDAS', 'CONCLUIDAS'],
          maxSelect: 1,
          required: true,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_buffet_releases_event ON buffet_releases (event_id, wave_number)',
      ],
    })
    app.save(buffetReleases)

    // 6. Create whatsapp_messages collection (simulation)
    const whatsappMessages = new Collection({
      name: 'whatsapp_messages',
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
        { name: 'recipient_name', type: 'text', required: true },
        { name: 'recipient_phone', type: 'text', required: true },
        { name: 'recipient_role', type: 'text' },
        { name: 'message', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          values: [
            'BUFFET_LIBERACAO',
            'HOMENAGEADO_CHAMADA',
            'COBRANCA_CHECKLIST',
            'ALERTA_EQUIPE',
            'GERAL',
          ],
          maxSelect: 1,
          required: true,
        },
        { name: 'scheduled_for', type: 'date' },
        { name: 'sent_at', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['PREPARADA', 'ENVIADA', 'ENTREGUE', 'LIDA', 'FALHOU'],
          maxSelect: 1,
          required: true,
        },
        { name: 'attempts', type: 'number', min: 0 },
        { name: 'idempotency_key', type: 'text' },
        { name: 'error_details', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_whatsapp_event_cat ON whatsapp_messages (event_id, category)',
        'CREATE INDEX idx_whatsapp_idemp ON whatsapp_messages (idempotency_key)',
      ],
    })
    app.save(whatsappMessages)

    // 7. Create audit_logs collection
    const auditLogs = new Collection({
      name: 'audit_logs',
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
        { name: 'actor_name', type: 'text', required: true },
        { name: 'actor_role', type: 'text' },
        { name: 'action', type: 'text', required: true },
        { name: 'target_entity', type: 'text', required: true },
        { name: 'target_id', type: 'text' },
        { name: 'details', type: 'text' },
        { name: 'timestamp', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_audit_event_time ON audit_logs (event_id, timestamp)'],
    })
    app.save(auditLogs)
  },
  (app) => {
    const toDelete = [
      'audit_logs',
      'whatsapp_messages',
      'buffet_releases',
      'dietary_tasks',
      'chair_transfers',
      'checklist_items',
    ]
    for (let i = 0; i < toDelete.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(toDelete[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
