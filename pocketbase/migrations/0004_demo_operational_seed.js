migrate(
  (app) => {
    // 1. Get or confirm main event
    let eventRecord
    try {
      eventRecord = app.findFirstRecordByData('events', 'name', 'Festa dos Destaques')
    } catch (_) {
      const eventsCol = app.findCollectionByNameOrId('events')
      eventRecord = new Record(eventsCol)
      eventRecord.set('name', 'Festa dos Destaques')
      eventRecord.set('date', '2026-11-07 19:00:00.000Z')
      eventRecord.set('profile', 'Elegante')
      eventRecord.set('status', 'ATIVO')
      app.save(eventRecord)
    }
    const eventId = eventRecord.id

    // 2. Setup 20 tables with different capacities (8, 9, 10 places + contingência)
    // Capacities specified: 8, 9, 10
    const tablesCol = app.findCollectionByNameOrId('tables')
    const fullTablePlan = [
      {
        name: 'MESA 01',
        capacity: 10,
        planned_chairs: 10,
        physical_chairs: 10,
        status: 'CONFERIDA',
        is_reserve: false,
        special: 'Acesso facilitado para cadeirante e idosos',
      },
      {
        name: 'MESA 02',
        capacity: 10,
        planned_chairs: 10,
        physical_chairs: 10,
        status: 'CONFERIDA',
        is_reserve: false,
        special: 'Próxima ao palco lateral',
      },
      {
        name: 'MESA 03',
        capacity: 8,
        planned_chairs: 8,
        physical_chairs: 8,
        status: 'CONFERIDA',
        is_reserve: false,
        special: 'Rampa de acesso e recuo para cadeira de rodas',
      },
      {
        name: 'MESA 04',
        capacity: 9,
        planned_chairs: 9,
        physical_chairs: 9,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 05',
        capacity: 10,
        planned_chairs: 10,
        physical_chairs: 10,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 06',
        capacity: 8,
        planned_chairs: 8,
        physical_chairs: 8,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 07',
        capacity: 9,
        planned_chairs: 9,
        physical_chairs: 9,
        status: 'CONFERIDA',
        is_reserve: false,
        special: 'Próxima à saída de emergência',
      },
      {
        name: 'MESA 08',
        capacity: 10,
        planned_chairs: 10,
        physical_chairs: 10,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 09',
        capacity: 8,
        planned_chairs: 8,
        physical_chairs: 8,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 10',
        capacity: 10,
        planned_chairs: 10,
        physical_chairs: 10,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 11',
        capacity: 9,
        planned_chairs: 9,
        physical_chairs: 9,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 12',
        capacity: 8,
        planned_chairs: 8,
        physical_chairs: 8,
        status: 'CONFERIDA',
        is_reserve: false,
        special: 'Acomodação de bebê / carrinho',
      },
      {
        name: 'MESA 13',
        capacity: 10,
        planned_chairs: 10,
        physical_chairs: 10,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 14',
        capacity: 9,
        planned_chairs: 9,
        physical_chairs: 9,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 15',
        capacity: 8,
        planned_chairs: 8,
        physical_chairs: 8,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 16',
        capacity: 10,
        planned_chairs: 10,
        physical_chairs: 10,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 17',
        capacity: 9,
        planned_chairs: 9,
        physical_chairs: 9,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 18',
        capacity: 8,
        planned_chairs: 8,
        physical_chairs: 8,
        status: 'DIVERGENTE',
        is_reserve: false,
        special: 'Atenção: Conferência física acusou 7 cadeiras',
      },
      {
        name: 'MESA 19',
        capacity: 10,
        planned_chairs: 10,
        physical_chairs: 10,
        status: 'CONFERIDA',
        is_reserve: false,
        special: '',
      },
      {
        name: 'MESA 20',
        capacity: 8,
        planned_chairs: 8,
        physical_chairs: 8,
        status: 'CONFERIDA',
        is_reserve: false,
        special: 'Mesa de autoridades e imprensa',
      },
      {
        name: 'MESA CONTINGÊNCIA 01',
        capacity: 10,
        planned_chairs: 10,
        physical_chairs: 10,
        status: 'CONFERIDA',
        is_reserve: true,
        special: 'Reserva para surpresas e remanejamento',
      },
      {
        name: 'MESA CONTINGÊNCIA 02',
        capacity: 8,
        planned_chairs: 8,
        physical_chairs: 8,
        status: 'CONFERIDA',
        is_reserve: true,
        special: 'Reserva para apoio cerimonial',
      },
    ]

    const tableMap = {}
    for (let i = 0; i < fullTablePlan.length; i++) {
      const t = fullTablePlan[i]
      let rec
      try {
        const found = app.findRecordsByFilter(
          'tables',
          "event_id = '" + eventId + "' && name = '" + t.name + "'",
          '',
          1,
          0,
        )
        if (found.length > 0) {
          rec = found[0]
        }
      } catch (_) {}

      if (!rec) {
        rec = new Record(tablesCol)
        rec.set('event_id', eventId)
        rec.set('name', t.name)
      }
      rec.set('capacity', t.capacity)
      rec.set('planned_chairs', t.planned_chairs)
      rec.set(
        'physical_chairs',
        t.status === 'DIVERGENTE' ? t.physical_chairs - 1 : t.physical_chairs,
      )
      rec.set('conference_status', t.status)
      rec.set('conference_responsible', 'Renato Apoio')
      rec.set('conference_photo', 'mesa_conferida_ref_' + (i + 1) + '.jpg')
      rec.set('is_locked', true) // Mapa travado após aprovação cerimonial
      rec.set('buffet_status', 'AGUARDANDO')
      rec.set('is_reserve', t.is_reserve)
      rec.set('special_needs_note', t.special)
      rec.set(
        'operational_notes',
        'Não retirar, adicionar ou transferir cadeiras sem autorização da coordenação.',
      )
      app.save(rec)
      tableMap[t.name] = rec.id
    }

    // 3. Update 30 Honorees with rich data, orders and operational states
    const honoreesCol = app.findCollectionByNameOrId('honorees')
    const existingHonorees = app.findRecordsByFilter(
      'honorees',
      "event_id = '" + eventId + "'",
      'tribute_order',
      50,
      0,
    )
    for (let i = 0; i < existingHonorees.length; i++) {
      const h = existingHonorees[i]
      const order = h.getInt('tribute_order') || i + 1
      // Set operational states distributed realistically
      let state = 'AGUARDANDO'
      if (order === 1) state = 'NO_PALCO'
      else if (order === 2) state = 'PROXIMO'
      else if (order === 3) state = 'EM_PREPARACAO'
      else if (order === 4) state = 'CONFIRMOU_RECEBIMENTO'
      else if (order === 5) state = 'AVISADO'

      h.set('operational_state', state)
      h.set('conductor_responsible', order % 2 === 0 ? 'Renato Apoio' : 'Camila Nogueira')
      h.set(
        'presentation_text',
        'Homenagem pelo destaque e liderança no biênio 2025/2026 com impacto expressivo na comunidade.',
      )
      h.set('music_cue', 'Fanfarra Destaques Trilha ' + order)
      h.set(
        'stage_resources',
        'Púlpito com microfone + tela LED com foto biográfica + troféu dourado gravado',
      )
      h.set('escort_name', 'Acompanhante Oficial')
      // map to table
      const assignedTableName =
        'MESA ' +
        (order < 10
          ? '0' + (order <= 20 ? order : (order % 20) + 1)
          : order <= 20
            ? order
            : (order % 20) + 1)
      if (tableMap[assignedTableName]) {
        h.set('table_id', tableMap[assignedTableName])
      }
      app.save(h)
    }

    // 4. Seed Checklist Pré-Abertura (~20 items grouped by 16 areas)
    const checklistCol = app.findCollectionByNameOrId('checklist_items')
    const checklistSeed = [
      {
        area: 'MESAS_CADEIRAS',
        description:
          'Conferência física de cadeiras de todas as 20 mesas (8, 9 e 10 lugares) vs mapa planejado.',
        responsible: 'Renato Apoio',
        supplier_sector: 'Operações Internas',
        priority: 'ALTA',
        status: 'EM_ANDAMENTO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: '19 mesas conferidas; Mesa 18 com divergência física de 1 cadeira a menos.',
      },
      {
        area: 'MESAS_CADEIRAS',
        description:
          'Fixação de avisos: "Não retirar, adicionar ou transferir cadeiras sem autorização da coordenação".',
        responsible: 'Renato Apoio',
        supplier_sector: 'Operações Internas',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: false,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Placas e identificadores visíveis colados em todas as mesas.',
      },
      {
        area: 'ARRANJOS_DECORACAO',
        description: 'Posicionamento e hidratação dos 20 arranjos centrais de flores nobres.',
        responsible: 'Valéria Mendes',
        supplier_sector: 'Flores do Campo Cenografia',
        priority: 'MEDIA',
        status: 'CONCLUIDO',
        is_critical: false,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Todos os centros de mesa instalados sem obstrução da visão do palco.',
      },
      {
        area: 'RECEPCAO',
        description:
          'Testagem dos tablets/smartphones de leitura QR Code e kits de crachás da recepção.',
        responsible: 'Camila Nogueira',
        supplier_sector: 'Equipe Recepção',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Dispositivos carregados em 100% com banco local sincronizado.',
      },
      {
        area: 'BUFFET',
        description:
          'Conferência da linha de réchauds, aquecimento dos pratos quentes e travessas.',
        responsible: 'Chef Roberto Vasquez',
        supplier_sector: 'La Fête Buffet',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Gás e temperatura estabilizados a 75°C.',
      },
      {
        area: 'RESTRICOES_ALIMENTARES',
        description:
          'Conferência individual dos 5 pratos com restrição alimentar severa (sem glúten, vegano, camarão).',
        responsible: 'Chef Roberto Vasquez',
        supplier_sector: 'La Fête Buffet',
        priority: 'ALTA',
        status: 'EM_ANDAMENTO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Pratos etiquetados com nome do homenageado e mesa correspondente.',
      },
      {
        area: 'BEBIDAS',
        description:
          'Temperatura do espumante do brinde nos baldes de gelo das estações de garçons.',
        responsible: 'Metre Carlos',
        supplier_sector: 'Equipe Garçons',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: false,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Temperatura aferida a 6°C.',
      },
      {
        area: 'SOM',
        description:
          'Passagem de som do púlpito, microfones lapela do Hugo e trilha de entrada dos homenageados.',
        responsible: 'DJ Gabriel Rios',
        supplier_sector: 'Acústica Prime',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Sem microfonia; pilhas reservas novas inseridas.',
      },
      {
        area: 'ILUMINACAO',
        description:
          'Foco do canhão de luz no palco, iluminação suave do salão e iluminação de segurança.',
        responsible: 'Gabriel Rios',
        supplier_sector: 'Acústica Prime',
        priority: 'MEDIA',
        status: 'CONCLUIDO',
        is_critical: false,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Cenas pré-programadas no console DMX.',
      },
      {
        area: 'TELAO',
        description:
          'Teste do telão LED principal com tela de espera e sistema de chamada de mesas para o buffet.',
        responsible: 'Lucas Prado',
        supplier_sector: 'Prado & Luz Audiovisual',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Painel exibindo resolução 4K sem dead pixels.',
      },
      {
        area: 'PALCO',
        description:
          'Conferência dos 30 troféus dourados na mesa lateral, organizados estritamente pela ordem de chamada.',
        responsible: 'Hugo Cerimonial',
        supplier_sector: 'Cerimonial Hugo',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: '30 placas com nomes checadas uma a uma.',
      },
      {
        area: 'FOTOGRAFIA',
        description:
          'Posicionamento do backdrop oficial de fotos, iluminação softbox e fotógrafos volantes.',
        responsible: 'Lucas Prado Fotografia',
        supplier_sector: 'Prado & Luz Audiovisual',
        priority: 'MEDIA',
        status: 'CONCLUIDO',
        is_critical: false,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Área de estúdio pronta na entrada do foyer.',
      },
      {
        area: 'EQUIPE',
        description:
          'Briefing geral com os 68 profissionais envolvidos (horários, conduta, canais WhatsApp).',
        responsible: 'Hugo Cerimonial',
        supplier_sector: 'Cerimonial & Líderes',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Realizado às 18:00 com todos os líderes de equipe.',
      },
      {
        area: 'FORNECEDORES',
        description:
          'Confirmação da presença de todos os fornecedores no local com contatos de emergência ativos.',
        responsible: 'Renato Apoio',
        supplier_sector: 'Operações Internas',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: '100% dos 5 fornecedores cadastrados já no local.',
      },
      {
        area: 'ACESSIBILIDADE',
        description:
          'Desobstrução total das rotas acessíveis, rampa lateral do palco e rampa de acesso à Mesa 03.',
        responsible: 'Marcos Vinicius Chefe',
        supplier_sector: 'VipGuard Segurança',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Largura mínima de 1,20m garantida em todos os corredores.',
      },
      {
        area: 'CONTATOS_COMUNICACAO',
        description:
          'Teste dos grupos de WhatsApp operacional (Hugo, Renato, Danilo, Ana Paula, Líderes).',
        responsible: 'Hugo Cerimonial',
        supplier_sector: 'Coordenação Geral',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Mensagens de teste entregues e confirmadas.',
      },
      {
        area: 'MATERIAIS_CONTINGENCIA',
        description:
          'Conferência da Mesa de Contingência (Mesa Reserva) com 10 lugares e cadeiras extras no depósito.',
        responsible: 'Renato Apoio',
        supplier_sector: 'Operações Internas',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: '10 cadeiras de contingência prontas sem desmontar layout oficial.',
      },
      {
        area: 'BUFFET',
        description:
          'Verificação do plano de liberação de mesas em ondas de 2 a 3 mesas para evitar filas.',
        responsible: 'Hugo Cerimonial & Roberto',
        supplier_sector: 'Buffet & Cerimonial',
        priority: 'ALTA',
        status: 'CONCLUIDO',
        is_critical: true,
        received_confirmed: true,
        understood_confirmed: true,
        evidence_notes: 'Fluxo em ondas validado no sistema.',
      },
    ]

    for (let i = 0; i < checklistSeed.length; i++) {
      const c = checklistSeed[i]
      try {
        const found = app.findRecordsByFilter(
          'checklist_items',
          "event_id = '" + eventId + "' && description = '" + c.description + "'",
          '',
          1,
          0,
        )
        if (found.length > 0) continue
      } catch (_) {}
      const cRec = new Record(checklistCol)
      cRec.set('event_id', eventId)
      cRec.set('area', c.area)
      cRec.set('description', c.description)
      cRec.set('responsible', c.responsible)
      cRec.set('supplier_sector', c.supplier_sector)
      cRec.set('priority', c.priority)
      cRec.set('status', c.status)
      cRec.set('is_critical', c.is_critical)
      cRec.set('received_confirmed', c.received_confirmed)
      cRec.set('understood_confirmed', c.understood_confirmed)
      cRec.set('confirmed_at', new Date().toISOString())
      cRec.set('evidence_notes', c.evidence_notes)
      app.save(cRec)
    }

    // 5. Seed Realistic Dietary Tasks for Buffet
    const dietaryCol = app.findCollectionByNameOrId('dietary_tasks')
    const dietarySeed = [
      {
        guest_name: 'Ana Clara Souza (Homenageada 01)',
        table_name: 'MESA 01',
        type: 'Celíaca / Glúten Free',
        details: 'Contaminação cruzada proibida. Preparar em praça estéril.',
        status: 'PRONTO',
        buffet_responsible: 'Chef Roberto',
        prepared_confirmed: true,
      },
      {
        guest_name: 'Beatriz Vasconcelos (Homenageada 05)',
        table_name: 'MESA 02',
        type: 'Vegetariana Estrita',
        details: 'Sem carnes, laticínios ou ovos. Risoto com cogumelos e azeite trufado.',
        status: 'EM_PREPARO',
        buffet_responsible: 'Sous Chef Marcos',
        prepared_confirmed: false,
      },
      {
        guest_name: 'Juliana Barreto (Homenageada 09)',
        table_name: 'MESA 03',
        type: 'Alergia Severa a Camarão/Frutos do Mar',
        details: 'Anafilaxia grave. Zero contato com panelas de paella ou camarão.',
        status: 'RECEBIDO',
        buffet_responsible: 'Chef Roberto',
        prepared_confirmed: false,
      },
      {
        guest_name: 'Renata Vasconcelos',
        table_name: 'MESA 02',
        type: 'Intolerância Severa a Lactose',
        details: 'Sobremesa e prato principal 100% lacfree.',
        status: 'PRONTO',
        buffet_responsible: 'Cozinheira Lúcia',
        prepared_confirmed: true,
      },
    ]

    for (let i = 0; i < dietarySeed.length; i++) {
      const d = dietarySeed[i]
      try {
        const found = app.findRecordsByFilter(
          'dietary_tasks',
          "event_id = '" + eventId + "' && guest_name = '" + d.guest_name + "'",
          '',
          1,
          0,
        )
        if (found.length > 0) continue
      } catch (_) {}
      const dRec = new Record(dietaryCol)
      dRec.set('event_id', eventId)
      // assign first guest id matching or fallback
      let gId = ''
      try {
        const gList = app.findRecordsByFilter('guests', "event_id = '" + eventId + "'", '', 1, 0)
        if (gList.length > 0) gId = gList[0].id
      } catch (_) {}
      dRec.set('guest_id', gId)
      dRec.set('guest_code', 'REST-' + (100 + i))
      dRec.set('guest_name', d.guest_name)
      dRec.set('table_name', d.table_name)
      dRec.set('restriction_type', d.type)
      dRec.set('details', d.details)
      dRec.set('buffet_responsible', d.buffet_responsible)
      dRec.set('received_confirmed', true)
      dRec.set('prepared_confirmed', d.prepared_confirmed)
      dRec.set('status', d.status)
      app.save(dRec)
    }

    // 6. Seed Sample Chair Transfer Divergence / Attempt
    const chairTransCol = app.findCollectionByNameOrId('chair_transfers')
    try {
      const existingTransfers = app.findRecordsByFilter(
        'chair_transfers',
        "event_id = '" + eventId + "'",
        '',
        1,
        0,
      )
      if (existingTransfers.length === 0 && tableMap['MESA 03'] && tableMap['MESA 05']) {
        const ct = new Record(chairTransCol)
        ct.set('event_id', eventId)
        ct.set('source_table_id', tableMap['MESA 03'])
        ct.set('target_table_id', tableMap['MESA 05'])
        ct.set('chairs_count', 2)
        ct.set('requested_by', 'Garçom João Pedro')
        ct.set('reason', 'Convidados da Mesa 05 queriam juntar 2 cadeiras extras')
        ct.set('authorized_by', '')
        ct.set('status', 'BLOQUEADA_NEGADA')
        ct.set(
          'rejection_reason',
          'BLOQUEIO SISTÊMICO: Mesa 03 é configurada com 8 lugares por rampa de acessibilidade. Retirada proibida sem autorização do cerimonialista Hugo.',
        )
        ct.set('timestamp', new Date().toISOString())
        app.save(ct)
      }
    } catch (_) {}

    // 7. Seed Simulated WhatsApp Messages
    const whatsappCol = app.findCollectionByNameOrId('whatsapp_messages')
    const sampleWp = [
      {
        recipient: 'Hugo Cerimonial (Coordenação)',
        phone: '(11) 98765-4321',
        role: 'Cerimonialista Chefe',
        category: 'COBRANCA_CHECKLIST',
        msg: 'CELEBRA URGÊNCIA: Abertura em 45 minutos. Pendência crítica na Mesa 18 (divergência física de 1 cadeira). Responsável Renato Apoio acionado.',
        status: 'LIDA',
      },
      {
        recipient: 'Mesa 01 Convidados (Onda 1)',
        phone: '(11) 99123-4501',
        role: 'Convidado Homenageado',
        category: 'BUFFET_LIBERACAO',
        msg: 'Olá! A Mesa 01 está liberada para o Buffet Gastronômico com serviço exclusivo. Por favor, dirijam-se com tranquilidade.',
        status: 'ENTREGUE',
      },
      {
        recipient: 'Carlos Eduardo Lima',
        phone: '(11) 99123-4502',
        role: 'Homenageado',
        category: 'HOMENAGEADO_CHAMADA',
        msg: 'Atenção Sr. Carlos Eduardo: você é o próximo na ordem de homenagens. O apoio Renato irá conduzi-lo à lateral esquerda do palco.',
        status: 'ENTREGUE',
      },
    ]

    for (let i = 0; i < sampleWp.length; i++) {
      const w = sampleWp[i]
      try {
        const found = app.findRecordsByFilter(
          'whatsapp_messages',
          "event_id = '" + eventId + "' && message = '" + w.msg + "'",
          '',
          1,
          0,
        )
        if (found.length > 0) continue
      } catch (_) {}
      const wRec = new Record(whatsappCol)
      wRec.set('event_id', eventId)
      wRec.set('recipient_name', w.recipient)
      wRec.set('recipient_phone', w.phone)
      wRec.set('recipient_role', w.role)
      wRec.set('category', w.category)
      wRec.set('message', w.msg)
      wRec.set('status', w.status)
      wRec.set('attempts', 1)
      wRec.set('sent_at', new Date().toISOString())
      wRec.set('idempotency_key', 'seed_wp_' + i)
      app.save(wRec)
    }

    // 8. Expand Guests list toward ~400 items across the 20 tables
    const guestsCol = app.findCollectionByNameOrId('guests')
    const currentGuestsCount = app.countRecords('guests')
    if (currentGuestsCount < 100) {
      const familySurnames = [
        'Silva',
        'Santos',
        'Oliveira',
        'Souza',
        'Rodrigues',
        'Ferreira',
        'Alves',
        'Pereira',
        'Lima',
        'Gomes',
        'Costa',
        'Ribeiro',
        'Martins',
        'Carvalho',
        'Almeida',
        'Lopes',
        'Soares',
        'Fernandes',
        'Vieira',
        'Barbosa',
        'Rocha',
        'Dias',
        'Nascimento',
        'Andrade',
        'Moreira',
        'Nunes',
        'Marques',
        'Machado',
        'Mendes',
        'Freitas',
        'Cardoso',
        'Ramos',
      ]
      const firstNames = [
        'Arthur',
        'Bernardo',
        'Gabriel',
        'Lucas',
        'Matheus',
        'Heitor',
        'Rafael',
        'Enzo',
        'Nicolas',
        'Lorenzo',
        'Guilherme',
        'Samuel',
        'Theo',
        'Felipe',
        'Gustavo',
        'Murilo',
        'Alice',
        'Sophia',
        'Helena',
        'Valentina',
        'Laura',
        'Isabella',
        'Manuela',
        'Julia',
        'Heloísa',
        'Luiza',
        'Maria Luiza',
        'Lorena',
        'Lívia',
        'Giovanna',
        'Beatriz',
        'Carolina',
      ]

      const tableKeys = Object.keys(tableMap)
      let tableIndex = 0

      // Seed ~150 more realistic guests
      for (let i = 0; i < 150; i++) {
        const fn = firstNames[i % firstNames.length]
        const sn = familySurnames[(i * 3) % familySurnames.length]
        const fullName = fn + ' ' + sn
        const chosenTableKey = tableKeys[tableIndex % tableKeys.length]
        const tableId = tableMap[chosenTableKey]
        tableIndex++

        const g = new Record(guestsCol)
        g.set('event_id', eventId)
        g.set('name', fullName)
        g.set('phone', '(11) 9' + (8000 + (i % 1000)) + '-' + (1000 + i))
        g.set('confirmation', 'CONFIRMADO')
        g.set('status', i % 4 === 0 ? 'PRESENTE' : 'CONFIRMADO')
        g.set('role', i % 5 === 0 ? 'COMPRADOR' : 'CONVIDADO_HOMENAGEADO')
        g.set('table_id', tableId)
        g.set('qr_code', 'CELEBRA-' + (1000 + i))
        g.set('whatsapp_authorized', true)
        g.set('payment_status', 'PAGO')
        g.set('group_size', 1)
        if (i % 20 === 0) {
          g.set('dietary_restriction', 'Sem Lactose')
          g.set('dietary_details', 'Prato especial solicitado')
        }
        app.save(g)
      }
    }
  },
  (app) => {
    // down migration
  },
)
