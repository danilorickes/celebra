migrate(
  (app) => {
    // 1. Seed or ensure admin user: danilorickes@gmail.com / Skip@Pass
    let adminUserId = ''
    try {
      const existing = app.findAuthRecordByEmail('_pb_users_auth_', 'danilorickes@gmail.com')
      adminUserId = existing.id
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const user = new Record(usersCol)
      user.setEmail('danilorickes@gmail.com')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Hugo Cerimonial')
      app.save(user)
      adminUserId = user.id
    }

    // 2. Seed main event: Festa dos Destaques
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

    // 3. Seed tables (Mesa 01 a 09 + Mesa Reserva)
    const tablesCol = app.findCollectionByNameOrId('tables')
    const tableNames = [
      { name: 'MESA 01', capacity: 10, is_reserve: false },
      { name: 'MESA 02', capacity: 10, is_reserve: false },
      { name: 'MESA 03', capacity: 10, is_reserve: false },
      { name: 'MESA 04', capacity: 10, is_reserve: false },
      { name: 'MESA 05', capacity: 10, is_reserve: false },
      { name: 'MESA 06', capacity: 10, is_reserve: false },
      { name: 'MESA 07', capacity: 10, is_reserve: false },
      { name: 'MESA 08', capacity: 10, is_reserve: false },
      { name: 'MESA 09', capacity: 10, is_reserve: false },
      { name: 'MESA RESERVA / CONTINGÊNCIA', capacity: 5, is_reserve: true },
    ]

    const tableMap = {}
    for (let i = 0; i < tableNames.length; i++) {
      const t = tableNames[i]
      try {
        const records = app.findRecordsByFilter(
          'tables',
          "event_id = '" + eventId + "' && name = '" + t.name + "'",
          '',
          1,
          0,
        )
        if (records.length > 0) {
          tableMap[t.name] = records[0].id
          continue
        }
      } catch (_) {}
      const rec = new Record(tablesCol)
      rec.set('event_id', eventId)
      rec.set('name', t.name)
      rec.set('capacity', t.capacity)
      rec.set('is_reserve', t.is_reserve)
      app.save(rec)
      tableMap[t.name] = rec.id
    }

    // 4. Seed teams
    const teamsCol = app.findCollectionByNameOrId('teams')
    const teamNames = [
      'CERIMONIAL',
      'RECEPÇÃO',
      'BUFFET',
      'GARÇONS',
      'FOTOGRAFIA',
      'VÍDEO',
      'SOM / DJ',
      'SEGURANÇA',
      'DECORAÇÃO',
      'OUTROS',
    ]
    const teamMap = {}
    for (let i = 0; i < teamNames.length; i++) {
      const tName = teamNames[i]
      try {
        const recs = app.findRecordsByFilter(
          'teams',
          "event_id = '" + eventId + "' && name = '" + tName + "'",
          '',
          1,
          0,
        )
        if (recs.length > 0) {
          teamMap[tName] = recs[0].id
          continue
        }
      } catch (_) {}
      const teamRec = new Record(teamsCol)
      teamRec.set('event_id', eventId)
      teamRec.set('name', tName)
      app.save(teamRec)
      teamMap[tName] = teamRec.id
    }

    // 5. Seed team members (Hugo as Leader of Cerimonial + leaders/members for others)
    const teamMembersCol = app.findCollectionByNameOrId('team_members')
    const membersToSeed = [
      { team: 'CERIMONIAL', name: 'Hugo Cerimonial', role: 'LEADER', user_id: adminUserId },
      { team: 'RECEPÇÃO', name: 'Camila Nogueira', role: 'LEADER' },
      { team: 'RECEPÇÃO', name: 'Larissa Dias', role: 'MEMBER' },
      { team: 'BUFFET', name: 'Chef Roberto Vasquez', role: 'LEADER' },
      { team: 'FOTOGRAFIA', name: 'Lucas Prado Fotografia', role: 'LEADER' },
      { team: 'SOM / DJ', name: 'DJ Gabriel Rios', role: 'LEADER' },
      { team: 'SEGURANÇA', name: 'Marcos Vinicius Chefe', role: 'LEADER' },
    ]

    for (let i = 0; i < membersToSeed.length; i++) {
      const m = membersToSeed[i]
      const tId = teamMap[m.team]
      if (!tId) continue
      try {
        const recs = app.findRecordsByFilter(
          'team_members',
          "team_id = '" + tId + "' && name = '" + m.name + "'",
          '',
          1,
          0,
        )
        if (recs.length > 0) continue
      } catch (_) {}
      const mRec = new Record(teamMembersCol)
      mRec.set('team_id', tId)
      mRec.set('name', m.name)
      mRec.set('role', m.role)
      if (m.user_id) mRec.set('user_id', m.user_id)
      app.save(mRec)
    }

    // 6. Seed suppliers
    const suppliersCol = app.findCollectionByNameOrId('suppliers')
    const suppliersSeed = [
      {
        name: 'La Fête Buffet & Alta Gastronomia',
        category: 'BUFFET',
        phone: '(11) 98765-4321',
        contact: 'Roberto Vasquez',
      },
      {
        name: 'Prado & Luz Audiovisual',
        category: 'FOTOGRAFIA',
        phone: '(11) 97654-3210',
        contact: 'Lucas Prado',
      },
      {
        name: 'Acústica Prime Som & Luz',
        category: 'SOM / DJ',
        phone: '(11) 96543-2109',
        contact: 'Gabriel Rios',
      },
      {
        name: 'Flores do Campo Cenografia',
        category: 'DECORAÇÃO',
        phone: '(11) 95432-1098',
        contact: 'Valéria Mendes',
      },
      {
        name: 'VipGuard Segurança Operacional',
        category: 'SEGURANÇA',
        phone: '(11) 94321-0987',
        contact: 'Marcos Vinicius',
      },
    ]

    for (let i = 0; i < suppliersSeed.length; i++) {
      const s = suppliersSeed[i]
      try {
        const recs = app.findRecordsByFilter(
          'suppliers',
          "event_id = '" + eventId + "' && name = '" + s.name + "'",
          '',
          1,
          0,
        )
        if (recs.length > 0) continue
      } catch (_) {}
      const sRec = new Record(suppliersCol)
      sRec.set('event_id', eventId)
      sRec.set('name', s.name)
      sRec.set('category', s.category)
      sRec.set('phone', s.phone)
      sRec.set('contact', s.contact)
      app.save(sRec)
    }

    // 7. Seed timeline items
    const timelineCol = app.findCollectionByNameOrId('timeline_items')
    const timelineSeed = [
      {
        time: '2026-11-07 19:00:00.000Z',
        title: 'Recepção dos Convidados e Welcome Drink',
        description: 'Acolhimento no foyer, verificação de convites e direcionamento às mesas.',
        responsibles: 'Camila Nogueira e equipe de Recepção',
        teams: [teamMap['RECEPÇÃO'], teamMap['CERIMONIAL'], teamMap['SOM / DJ']].filter(Boolean),
        status: 'EM_ANDAMENTO',
        observations: 'Música ambiente suave (jazz/bossa). Buffet volante com espumante.',
        delay_minutes: 0,
      },
      {
        time: '2026-11-07 20:00:00.000Z',
        title: 'Abertura Oficial e Boas-Vindas',
        description: 'Hugo sobe ao palco para abertura institucional e apresentação da cerimônia.',
        responsibles: 'Hugo Cerimonial',
        teams: [
          teamMap['CERIMONIAL'],
          teamMap['SOM / DJ'],
          teamMap['FOTOGRAFIA'],
          teamMap['VÍDEO'],
        ].filter(Boolean),
        status: 'A_PREPARAR',
        observations: 'Atenuar luz do salão e focar canhão no púlpito.',
        delay_minutes: 0,
      },
      {
        time: '2026-11-07 20:15:00.000Z',
        title: 'Início das Homenagens — Bloco 1',
        description: 'Chamada nominal dos homenageados, entrega de troféus e fotos oficiais.',
        responsibles: 'Hugo e Equipe Cerimonial',
        teams: [
          teamMap['CERIMONIAL'],
          teamMap['FOTOGRAFIA'],
          teamMap['SOM / DJ'],
          teamMap['VÍDEO'],
        ].filter(Boolean),
        status: 'A_PREPARAR',
        observations: 'Troféus organizados na mesa de apoio na lateral do palco.',
        delay_minutes: 0,
      },
      {
        time: '2026-11-07 21:30:00.000Z',
        title: 'Jantar Principal & Serviço Gastronômico',
        description: 'Abertura do buffet quente e serviço empratado para homenageados.',
        responsibles: 'Chef Roberto e Metre',
        teams: [teamMap['BUFFET'], teamMap['GARÇONS'], teamMap['CERIMONIAL']].filter(Boolean),
        status: 'A_PREPARAR',
        observations: 'Garantir reposição rápida e atendimento preferencial às mesas 01 a 03.',
        delay_minutes: 0,
      },
      {
        time: '2026-11-07 22:30:00.000Z',
        title: 'Momento Especial: Brinde Coletivo e Homenagem Surpresa',
        description: 'Brinde com todas as personalidades e vídeo comemorativo no telão.',
        responsibles: 'Hugo e Lucas Prado',
        teams: [
          teamMap['CERIMONIAL'],
          teamMap['GARÇONS'],
          teamMap['VÍDEO'],
          teamMap['SOM / DJ'],
        ].filter(Boolean),
        status: 'A_PREPARAR',
        observations: 'Taças servidas nas mesas com 5 minutos de antecedência.',
        delay_minutes: 0,
      },
      {
        time: '2026-11-07 23:30:00.000Z',
        title: 'Encerramento e Início da Pista de Dança',
        description: 'Agradecimentos finais e abertura da pista pelo DJ convidado.',
        responsibles: 'DJ Gabriel e Cerimonial',
        teams: [teamMap['SOM / DJ'], teamMap['CERIMONIAL'], teamMap['SEGURANÇA']].filter(Boolean),
        status: 'A_PREPARAR',
        observations: 'Liberação do lounge externo e iluminação de pista.',
        delay_minutes: 0,
      },
    ]

    const timelineMap = {}
    for (let i = 0; i < timelineSeed.length; i++) {
      const item = timelineSeed[i]
      try {
        const recs = app.findRecordsByFilter(
          'timeline_items',
          "event_id = '" + eventId + "' && title = '" + item.title + "'",
          '',
          1,
          0,
        )
        if (recs.length > 0) {
          timelineMap[item.title] = recs[0].id
          continue
        }
      } catch (_) {}
      const tRec = new Record(timelineCol)
      tRec.set('event_id', eventId)
      tRec.set('scheduled_time', item.time)
      tRec.set('title', item.title)
      tRec.set('description', item.description)
      tRec.set('responsibles', item.responsibles)
      tRec.set('teams', item.teams)
      tRec.set('status', item.status)
      tRec.set('observations', item.observations)
      tRec.set('delay_minutes', item.delay_minutes)
      app.save(tRec)
      timelineMap[item.title] = tRec.id
    }

    // 8. Seed Honorees (30 fictional honorees for Festa dos Destaques)
    const honoreesCol = app.findCollectionByNameOrId('honorees')
    const honoreesList = [
      {
        name: 'Ana Clara Souza',
        phone: '(11) 99123-4501',
        whatsapp: '(11) 99123-4501',
        table: 'MESA 01',
        tribute_order: 1,
        info: 'Não consome glúten. Sentar próxima à rampa de acesso.',
      },
      {
        name: 'Carlos Eduardo Lima',
        phone: '(11) 99123-4502',
        whatsapp: '(11) 99123-4502',
        table: 'MESA 01',
        tribute_order: 2,
        info: 'Prefere vinho tinto seco.',
      },
      {
        name: 'Mariana Oliveira',
        phone: '(11) 99123-4503',
        whatsapp: '(11) 99123-4503',
        table: 'MESA 01',
        tribute_order: 3,
        info: 'Acompanhada dos pais idosos.',
      },
      {
        name: 'Rodrigo Mendonça',
        phone: '(11) 99123-4504',
        whatsapp: '(11) 99123-4504',
        table: 'MESA 02',
        tribute_order: 4,
        info: 'Destaque do ano em Inovação.',
      },
      {
        name: 'Beatriz Vasconcelos',
        phone: '(11) 99123-4505',
        whatsapp: '(11) 99123-4505',
        table: 'MESA 02',
        tribute_order: 5,
        info: 'Vegetariana estrita.',
      },
      {
        name: 'Gustavo Henrique Rocha',
        phone: '(11) 99123-4506',
        whatsapp: '(11) 99123-4506',
        table: 'MESA 02',
        tribute_order: 6,
        info: 'Pediu fotógrafo dedicado na homenagem.',
      },
      {
        name: 'Fernanda Castilho',
        phone: '(11) 99123-4507',
        whatsapp: '(11) 99123-4507',
        table: 'MESA 03',
        tribute_order: 7,
        info: 'Destaque em Ação Comunitária.',
      },
      {
        name: 'Thiago Pavanelli',
        phone: '(11) 99123-4508',
        whatsapp: '(11) 99123-4508',
        table: 'MESA 03',
        tribute_order: 8,
        info: 'Cadeira de rodas temporária por torção no tornozelo.',
      },
      {
        name: 'Juliana Barreto',
        phone: '(11) 99123-4509',
        whatsapp: '(11) 99123-4509',
        table: 'MESA 03',
        tribute_order: 9,
        info: 'Alérgica severa a camarão.',
      },
      {
        name: 'Lucas Furtado',
        phone: '(11) 99123-4510',
        whatsapp: '(11) 99123-4510',
        table: 'MESA 04',
        tribute_order: 10,
        info: 'Chegará às 19:45 após voo de Brasília.',
      },
      {
        name: 'Camila Ribeiro',
        phone: '(11) 99123-4511',
        whatsapp: '(11) 99123-4511',
        table: 'MESA 04',
        tribute_order: 11,
        info: 'Reitora universitária homenageada.',
      },
      {
        name: 'Marcelo Antunes',
        phone: '(11) 99123-4512',
        whatsapp: '(11) 99123-4512',
        table: 'MESA 04',
        tribute_order: 12,
        info: 'Presidente da associação comercial.',
      },
      {
        name: 'Patrícia Fagundes',
        phone: '(11) 99123-4513',
        whatsapp: '(11) 99123-4513',
        table: 'MESA 05',
        tribute_order: 13,
        info: 'Médica cardiologista homenageada.',
      },
      {
        name: 'Rafael Bittencourt',
        phone: '(11) 99123-4514',
        whatsapp: '(11) 99123-4514',
        table: 'MESA 05',
        tribute_order: 14,
        info: 'Diretor da orquestra jovem.',
      },
      {
        name: 'Sabrina Moraes',
        phone: '(11) 99123-4515',
        whatsapp: '(11) 99123-4515',
        table: 'MESA 05',
        tribute_order: 15,
        info: 'Engenheira premiada.',
      },
      {
        name: 'Felipe Zanin',
        phone: '(11) 99123-4516',
        whatsapp: '(11) 99123-4516',
        table: 'MESA 06',
        tribute_order: 16,
        info: 'Empresário do ramo de sustentabilidade.',
      },
      {
        name: 'Vanessa Diniz',
        phone: '(11) 99123-4517',
        whatsapp: '(11) 99123-4517',
        table: 'MESA 06',
        tribute_order: 17,
        info: 'Educadora e escritora.',
      },
      {
        name: 'Renato Albuquerque',
        phone: '(11) 99123-4518',
        whatsapp: '(11) 99123-4518',
        table: 'MESA 06',
        tribute_order: 18,
        info: 'Arquiteto de patrimônio histórico.',
      },
      {
        name: 'Aline Meirelles',
        phone: '(11) 99123-4519',
        whatsapp: '(11) 99123-4519',
        table: 'MESA 07',
        tribute_order: 19,
        info: 'Advogada de direitos humanos.',
      },
      {
        name: 'Diego Guimarães',
        phone: '(11) 99123-4520',
        whatsapp: '(11) 99123-4520',
        table: 'MESA 07',
        tribute_order: 20,
        info: 'Atleta paralímpico destaque.',
      },
      {
        name: 'Tatiane Rezende',
        phone: '(11) 99123-4521',
        whatsapp: '(11) 99123-4521',
        table: 'MESA 07',
        tribute_order: 21,
        info: 'Pesquisadora em biotecnologia.',
      },
      {
        name: 'Bruno Nogueira',
        phone: '(11) 99123-4522',
        whatsapp: '(11) 99123-4522',
        table: 'MESA 08',
        tribute_order: 22,
        info: 'Jornalista cultural.',
      },
      {
        name: 'Letícia Peixoto',
        phone: '(11) 99123-4523',
        whatsapp: '(11) 99123-4523',
        table: 'MESA 08',
        tribute_order: 23,
        info: 'Voluntária da Cruz Vermelha.',
      },
      {
        name: 'Leandro Fontes',
        phone: '(11) 99123-4524',
        whatsapp: '(11) 99123-4524',
        table: 'MESA 08',
        tribute_order: 24,
        info: 'Líder de cooperativa agrícola.',
      },
      {
        name: 'Priscila Vianna',
        phone: '(11) 99123-4525',
        whatsapp: '(11) 99123-4525',
        table: 'MESA 09',
        tribute_order: 25,
        info: 'Designer premiada internacionalmente.',
      },
      {
        name: 'Vinicius Tavares',
        phone: '(11) 99123-4526',
        whatsapp: '(11) 99123-4526',
        table: 'MESA 09',
        tribute_order: 26,
        info: 'Veterinário do projeto de fauna.',
      },
      {
        name: 'Helena Carvalho',
        phone: '(11) 99123-4527',
        whatsapp: '(11) 99123-4527',
        table: 'MESA 09',
        tribute_order: 27,
        info: 'Maestrina homenageada de honra.',
      },
      {
        name: 'Otávio Martins',
        phone: '(11) 99123-4528',
        whatsapp: '(11) 99123-4528',
        table: 'MESA 01',
        tribute_order: 28,
        info: 'Fundador de projeto de acolhimento infantil.',
      },
      {
        name: 'Cláudia Esteves',
        phone: '(11) 99123-4529',
        whatsapp: '(11) 99123-4529',
        table: 'MESA 02',
        tribute_order: 29,
        info: 'Professora emérita homenageada.',
      },
      {
        name: 'Alexandre Gusmão',
        phone: '(11) 99123-4530',
        whatsapp: '(11) 99123-4530',
        table: 'MESA 03',
        tribute_order: 30,
        info: 'Pioneiro da gastronomia regional.',
      },
    ]

    const tributeTimelineId = timelineMap['Início das Homenagens — Bloco 1'] || ''
    const honoreeMap = {}

    for (let i = 0; i < honoreesList.length; i++) {
      const h = honoreesList[i]
      try {
        const recs = app.findRecordsByFilter(
          'honorees',
          "event_id = '" + eventId + "' && name = '" + h.name + "'",
          '',
          1,
          0,
        )
        if (recs.length > 0) {
          honoreeMap[h.name] = recs[0].id
          continue
        }
      } catch (_) {}
      const hRec = new Record(honoreesCol)
      hRec.set('event_id', eventId)
      hRec.set('name', h.name)
      hRec.set('phone', h.phone)
      hRec.set('whatsapp', h.whatsapp)
      hRec.set('status', 'CONFIRMADO')
      hRec.set('important_info', h.info)
      hRec.set('tribute_order', h.tribute_order)
      if (tributeTimelineId) hRec.set('timeline_item_id', tributeTimelineId)
      app.save(hRec)
      honoreeMap[h.name] = hRec.id
    }

    // 9. Seed Guests (2-3 per honoree, with realistic statuses)
    const guestsCol = app.findCollectionByNameOrId('guests')
    const checkinsCol = app.findCollectionByNameOrId('checkins')

    // Sample guest roster for key honorees + general coverage
    const guestRoster = [
      // Ana Clara Souza (Mesa 01)
      {
        name: 'Paulo Roberto Souza',
        honoree: 'Ana Clara Souza',
        table: 'MESA 01',
        status: 'PRESENTE',
        phone: '(11) 98111-0001',
        accomp: 'Esposo',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Beatriz Souza',
        honoree: 'Ana Clara Souza',
        table: 'MESA 01',
        status: 'PRESENTE',
        phone: '(11) 98111-0002',
        accomp: 'Filha',
        conf: 'CONFIRMADO',
        needs: 'Cadeira alta para criança',
      },
      {
        name: 'Guilherme Souza',
        honoree: 'Ana Clara Souza',
        table: 'MESA 01',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0003',
        accomp: 'Filho',
        conf: 'CONFIRMADO',
        needs: '',
      },

      // Carlos Eduardo Lima (Mesa 01)
      {
        name: 'Heloísa Lima',
        honoree: 'Carlos Eduardo Lima',
        table: 'MESA 01',
        status: 'PRESENTE',
        phone: '(11) 98111-0004',
        accomp: 'Esposa',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Mateus Lima',
        honoree: 'Carlos Eduardo Lima',
        table: 'MESA 01',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0005',
        accomp: '',
        conf: 'CONFIRMADO',
        needs: '',
      },

      // Mariana Oliveira (Mesa 01)
      {
        name: 'Sérgio Oliveira',
        honoree: 'Mariana Oliveira',
        table: 'MESA 01',
        status: 'PRESENTE',
        phone: '(11) 98111-0006',
        accomp: 'Pai',
        conf: 'CONFIRMADO',
        needs: 'Mobilidade reduzida',
      },
      {
        name: 'Elza Oliveira',
        honoree: 'Mariana Oliveira',
        table: 'MESA 01',
        status: 'PRESENTE',
        phone: '(11) 98111-0007',
        accomp: 'Mãe',
        conf: 'CONFIRMADO',
        needs: '',
      },

      // Rodrigo Mendonça (Mesa 02)
      {
        name: 'Clarice Mendonça',
        honoree: 'Rodrigo Mendonça',
        table: 'MESA 02',
        status: 'PRESENTE',
        phone: '(11) 98111-0008',
        accomp: 'Esposa',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Eduardo Mendonça',
        honoree: 'Rodrigo Mendonça',
        table: 'MESA 02',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0009',
        accomp: '',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'André Luiz Silveira',
        honoree: 'Rodrigo Mendonça',
        table: 'MESA 02',
        status: 'PENDENTE',
        phone: '(11) 98111-0010',
        accomp: 'Sócio',
        conf: 'PENDENTE',
        needs: '',
      },

      // Beatriz Vasconcelos (Mesa 02)
      {
        name: 'Leonardo Vasconcelos',
        honoree: 'Beatriz Vasconcelos',
        table: 'MESA 02',
        status: 'PRESENTE',
        phone: '(11) 98111-0011',
        accomp: 'Irmão',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Renata Vasconcelos',
        honoree: 'Beatriz Vasconcelos',
        table: 'MESA 02',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0012',
        accomp: '',
        conf: 'CONFIRMADO',
        needs: 'Cardápio vegetariano',
      },

      // Gustavo Henrique Rocha (Mesa 02)
      {
        name: 'Isabela Rocha',
        honoree: 'Gustavo Henrique Rocha',
        table: 'MESA 02',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0013',
        accomp: 'Esposa',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Marcos Henrique Rocha',
        honoree: 'Gustavo Henrique Rocha',
        table: 'MESA 02',
        status: 'NAO_COMPARECEU',
        phone: '(11) 98111-0014',
        accomp: 'Irmão',
        conf: 'CONFIRMADO',
        needs: '',
      },

      // Fernanda Castilho (Mesa 03)
      {
        name: 'Daniel Castilho',
        honoree: 'Fernanda Castilho',
        table: 'MESA 03',
        status: 'PRESENTE',
        phone: '(11) 98111-0015',
        accomp: 'Esposo',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Sofia Castilho',
        honoree: 'Fernanda Castilho',
        table: 'MESA 03',
        status: 'PRESENTE',
        phone: '(11) 98111-0016',
        accomp: 'Filha',
        conf: 'CONFIRMADO',
        needs: '',
      },

      // Thiago Pavanelli (Mesa 03)
      {
        name: 'Carolina Pavanelli',
        honoree: 'Thiago Pavanelli',
        table: 'MESA 03',
        status: 'PRESENTE',
        phone: '(11) 98111-0017',
        accomp: 'Esposa',
        conf: 'CONFIRMADO',
        needs: 'Espaço para cadeira de rodas ao lado da mesa',
      },
      {
        name: 'Pedro Pavanelli',
        honoree: 'Thiago Pavanelli',
        table: 'MESA 03',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0018',
        accomp: '',
        conf: 'CONFIRMADO',
        needs: '',
      },

      // Juliana Barreto (Mesa 03)
      {
        name: 'Marcio Barreto',
        honoree: 'Juliana Barreto',
        table: 'MESA 03',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0019',
        accomp: 'Irmão',
        conf: 'CONFIRMADO',
        needs: 'Sem frutos do mar',
      },
      {
        name: 'Fabiana Barreto',
        honoree: 'Juliana Barreto',
        table: 'MESA 03',
        status: 'PENDENTE',
        phone: '(11) 98111-0020',
        accomp: 'Cunhada',
        conf: 'PENDENTE',
        needs: '',
      },

      // Lucas Furtado (Mesa 04)
      {
        name: 'Thaís Furtado',
        honoree: 'Lucas Furtado',
        table: 'MESA 04',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0021',
        accomp: 'Esposa',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Jorge Furtado',
        honoree: 'Lucas Furtado',
        table: 'MESA 04',
        status: 'PENDENTE',
        phone: '(11) 98111-0022',
        accomp: 'Pai',
        conf: 'PENDENTE',
        needs: '',
      },

      // Camila Ribeiro (Mesa 04)
      {
        name: 'Antônio Carlos Ribeiro',
        honoree: 'Camila Ribeiro',
        table: 'MESA 04',
        status: 'PRESENTE',
        phone: '(11) 98111-0023',
        accomp: 'Esposo',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Alice Ribeiro',
        honoree: 'Camila Ribeiro',
        table: 'MESA 04',
        status: 'PRESENTE',
        phone: '(11) 98111-0024',
        accomp: 'Filha',
        conf: 'CONFIRMADO',
        needs: '',
      },

      // Marcelo Antunes (Mesa 04)
      {
        name: 'Viviane Antunes',
        honoree: 'Marcelo Antunes',
        table: 'MESA 04',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0025',
        accomp: 'Esposa',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Bruno Antunes',
        honoree: 'Marcelo Antunes',
        table: 'MESA 04',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0026',
        accomp: 'Filho',
        conf: 'CONFIRMADO',
        needs: '',
      },

      // Outros convidados para preencher mesas
      {
        name: 'Flávia Bittencourt',
        honoree: 'Rafael Bittencourt',
        table: 'MESA 05',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0027',
        accomp: 'Esposa',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Joana Moraes',
        honoree: 'Sabrina Moraes',
        table: 'MESA 05',
        status: 'PRESENTE',
        phone: '(11) 98111-0028',
        accomp: 'Mãe',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Renato Diniz Jr.',
        honoree: 'Vanessa Diniz',
        table: 'MESA 06',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0029',
        accomp: 'Filho',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Marina Albuquerque',
        honoree: 'Renato Albuquerque',
        table: 'MESA 06',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0030',
        accomp: 'Esposa',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Luciana Meirelles',
        honoree: 'Aline Meirelles',
        table: 'MESA 07',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0031',
        accomp: 'Irmã',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Claudio Guimarães',
        honoree: 'Diego Guimarães',
        table: 'MESA 07',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0032',
        accomp: 'Treinador',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Otávio Martins Filho',
        honoree: 'Otávio Martins',
        table: 'MESA 08',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0033',
        accomp: 'Filho',
        conf: 'CONFIRMADO',
        needs: '',
      },
      {
        name: 'Gabriel Esteves',
        honoree: 'Cláudia Esteves',
        table: 'MESA 09',
        status: 'CONFIRMADO',
        phone: '(11) 98111-0034',
        accomp: 'Esposo',
        conf: 'CONFIRMADO',
        needs: '',
      },

      // Caso de convidado surpresa alocado na Mesa Reserva
      {
        name: 'Dr. Walter Siqueira (Convidado VIP Imprensa)',
        honoree: '',
        table: 'MESA RESERVA / CONTINGÊNCIA',
        status: 'NAO_ESTAVA_NA_LISTA',
        phone: '(11) 98111-0099',
        accomp: 'Assessor de Imprensa',
        conf: 'CONFIRMADO',
        needs: 'Assento imediato na mesa de contingência',
      },
    ]

    for (let i = 0; i < guestRoster.length; i++) {
      const g = guestRoster[i]
      try {
        const recs = app.findRecordsByFilter(
          'guests',
          "event_id = '" + eventId + "' && name = '" + g.name + "'",
          '',
          1,
          0,
        )
        if (recs.length > 0) continue
      } catch (_) {}
      const gRec = new Record(guestsCol)
      gRec.set('event_id', eventId)
      gRec.set('name', g.name)
      gRec.set('phone', g.phone)
      gRec.set('accompanant', g.accomp)
      gRec.set('confirmation', g.conf)
      gRec.set('status', g.status)
      gRec.set('special_needs', g.needs)
      if (g.honoree && honoreeMap[g.honoree]) {
        gRec.set('honoree_id', honoreeMap[g.honoree])
      }
      if (g.table && tableMap[g.table]) {
        gRec.set('table_id', tableMap[g.table])
      }
      app.save(gRec)

      // Se o status for PRESENTE, gera registro de check-in correspondente
      if (g.status === 'PRESENTE') {
        const cRec = new Record(checkinsCol)
        cRec.set('event_id', eventId)
        cRec.set('guest_id', gRec.id)
        cRec.set('checked_in_at', new Date().toISOString())
        app.save(cRec)
      }
    }

    // 10. Seed Alerts & Acknowledgements
    const alertsCol = app.findCollectionByNameOrId('alerts')
    const acksCol = app.findCollectionByNameOrId('acknowledgements')

    const alertSeed = [
      {
        team: 'FOTOGRAFIA',
        type: 'EQUIPE',
        msg: 'ATENÇÃO FOTOGRAFIA: Posicionar na lateral esquerda do palco para início das homenagens em 15 min.',
        resolved: false,
        status: 'PRONTO',
      },
      {
        team: 'SOM / DJ',
        type: 'EQUIPE',
        msg: 'ATENÇÃO SOM: Testar microfones sem fio do púlpito e abaixar trilha para o anúncio.',
        resolved: false,
        status: 'PRONTO',
      },
      {
        team: 'BUFFET',
        type: 'EQUIPE',
        msg: 'BUFFET: Reforçar serviço de espumante nas mesas 01, 02 e 03 para o brinde que se aproxima.',
        resolved: false,
        status: 'RECEBIDO',
      },
      {
        team: 'CERIMONIAL',
        type: 'EQUIPE',
        msg: 'CERIMONIAL: Checar alinhamento dos troféus no biombo lateral.',
        resolved: false,
        status: 'PRONTO',
      },
    ]

    for (let i = 0; i < alertSeed.length; i++) {
      const a = alertSeed[i]
      const tId = teamMap[a.team]
      try {
        const recs = app.findRecordsByFilter(
          'alerts',
          "event_id = '" + eventId + "' && message = '" + a.msg + "'",
          '',
          1,
          0,
        )
        if (recs.length > 0) continue
      } catch (_) {}
      const aRec = new Record(alertsCol)
      aRec.set('event_id', eventId)
      aRec.set('target_type', a.type)
      if (tId) aRec.set('target_team_id', tId)
      aRec.set('message', a.msg)
      aRec.set('is_resolved', a.resolved)
      app.save(aRec)

      // Acknowledgement record
      const ackRec = new Record(acksCol)
      ackRec.set('alert_id', aRec.id)
      ackRec.set('status', a.status)
      ackRec.set('acknowledged_at', new Date().toISOString())
      app.save(ackRec)
    }

    // 11. Seed Occurrences
    const occurrencesCol = app.findCollectionByNameOrId('occurrences')
    const occurrencesSeed = [
      {
        category: 'CONVIDADO',
        description:
          'Convidado Dr. Walter Siqueira (Imprensa) compareceu sem prévio aviso com acompanhante.',
        responsible: 'Camila Nogueira (Recepção)',
        solution:
          'Alocado com acompanhante na Mesa Reserva de contingência. Ambos muito satisfeitos.',
      },
      {
        category: 'PROTOCOLO',
        description:
          'Homenageado Thiago Pavanelli necessitou de ajuste de rampa e afastamento de cadeira na Mesa 03.',
        responsible: 'Hugo Cerimonial',
        solution:
          'Equipe de apoio removeu duas cadeiras da ponta da Mesa 03 criando espaço ergonômico.',
      },
      {
        category: 'BUFFET',
        description: 'Convidada Juliana Barreto reforçou alergia grave a frutos do mar.',
        responsible: 'Chef Roberto (Buffet)',
        solution:
          'Prato especial de risoto de cogumelos frescos servido diretamente pelo metre na Mesa 03.',
      },
    ]

    for (let i = 0; i < occurrencesSeed.length; i++) {
      const occ = occurrencesSeed[i]
      try {
        const recs = app.findRecordsByFilter(
          'occurrences',
          "event_id = '" + eventId + "' && description = '" + occ.description + "'",
          '',
          1,
          0,
        )
        if (recs.length > 0) continue
      } catch (_) {}
      const oRec = new Record(occurrencesCol)
      oRec.set('event_id', eventId)
      oRec.set('category', occ.category)
      oRec.set('description', occ.description)
      oRec.set('responsible', occ.responsible)
      oRec.set('solution', occ.solution)
      app.save(oRec)
    }
  },
  (app) => {
    // Rollback seed data if needed
    try {
      const ev = app.findFirstRecordByData('events', 'name', 'Festa dos Destaques')
      app.delete(ev)
    } catch (_) {}
  },
)
