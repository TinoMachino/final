import {SeedClient} from './client'

export default async (sc: SeedClient) => {
  const createdAt = () => new Date().toISOString()
  const login = async (identifier: string, password: string) => {
    const agent = sc.network.pds.getAgent()
    await agent.login({identifier, password})
    return agent
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  USERS  (20 total — 3 from minimal setup + 17 new)
  // ═══════════════════════════════════════════════════════════════════════

  const alice = await login('alice.test', 'hunter2')
  const bob = await login('bob.test', 'hunter2')
  const carla = await login('carla.test', 'hunter2')

  const newUsers = [
    {short: 'dan', email: 'dan@test.com', handle: 'dan.test', password: 'hunter2', displayName: 'Dan Martínez', description: 'Activista ambiental. Yucatán 🌿 | Presupuesto participativo | Ciclista urbano'},
    {short: 'eva', email: 'eva@test.com', handle: 'eva.test', password: 'hunter2', displayName: 'Eva Hernández', description: 'Líder sindical. Puebla ✊ | Derechos laborales | Vivienda digna para todxs'},
    {short: 'fernando', email: 'fernando@test.com', handle: 'fernando.test', password: 'hunter2', displayName: 'Fernando Ruiz', description: 'Emprendedor social. Querétaro 🚀 | Economía circular | Transparencia fiscal'},
    {short: 'gabriela', email: 'gabriela@test.com', handle: 'gabriela.test', password: 'hunter2', displayName: 'Gaby Torres', description: 'Periodista independiente. CDMX 📰 | Datos abiertos | Seguimiento legislativo'},
    {short: 'hector', email: 'hector@test.com', handle: 'hector.test', password: 'hunter2', displayName: 'Hector Camacho', description: 'Profesor ITAM. CDMX 📚 | Economía del comportamiento | Políticas públicas'},
    {short: 'isabel', email: 'isabel@test.com', handle: 'isabel.test', password: 'hunter2', displayName: 'Isa Cruz', description: 'Activista feminista. Oaxaca 💜 | DDHH | Justicia territorial'},
    {short: 'jorge', email: 'jorge@test.com', handle: 'jorge.test', password: 'hunter2', displayName: 'Jorge Silva', description: 'Empresario tech. Monterrey, NL 💻 | Movilidad inteligente | Smart cities'},
    {short: 'karla', email: 'karla@test.com', handle: 'karla.test', password: 'hunter2', displayName: 'Karla Jiménez', description: 'Maestra rural. Chiapas 🍎 | Educación indígena | Bibliotecas comunitarias'},
    {short: 'luis', email: 'luis@test.com', handle: 'luis.test', password: 'hunter2', displayName: 'Luis Morales', description: 'Médico comunitario. Guerrero 🏥 | Salud preventiva | Agua potable'},
    {short: 'mariana', email: 'mariana@test.com', handle: 'mariana.test', password: 'hunter2', displayName: 'Mariana Vásquez', description: 'Abogada DDHH. CDMX ⚖️ | Transparencia | Anticorrupción'},
    {short: 'nicolas', email: 'nicolas@test.com', handle: 'nicolas.test', password: 'hunter2', displayName: 'Nico Reyes', description: 'Ingeniero civil. Guadalajara 🏗️ | Infraestructura verde | Movilidad sostenible'},
    {short: 'olivia', email: 'olivia@test.com', handle: 'olivia.test', password: 'hunter2', displayName: 'Olivia Paredes', description: 'Artista urbana. CDMX 🎨 | Cultura digital | Espacios públicos creativos'},
    {short: 'pablo', email: 'pablo@test.com', handle: 'pablo.test', password: 'hunter2', displayName: 'Pablo Soto', description: 'Estudiante BUAP. Puebla 📖 | Juventud política | Primer voto informado'},
    {short: 'quetzali', email: 'quetzali@test.com', handle: 'quetzali.test', password: 'hunter2', displayName: 'Quetzali López', description: 'Comunidad zapoteca. Oaxaca 🌽 | Soberanía alimentaria | Derechos indígenas'},
    {short: 'rodrigo', email: 'rodrigo@test.com', handle: 'rodrigo.test', password: 'hunter2', displayName: 'Rodrigo Domínguez', description: 'Taxista organizado. CDMX 🚕 | Movilidad justa | Seguridad vial'},
    {short: 'sofia', email: 'sofia@test.com', handle: 'sofia.test', password: 'hunter2', displayName: 'Sofía Castillo', description: 'Chef restaurantera. CDMX 🍽️ | Soberanía alimentaria | Mercados locales'},
    {short: 'tomas', email: 'tomas@test.com', handle: 'tomas.test', password: 'hunter2', displayName: 'Tomás Aguilar', description: 'Jubilado IMSS. Mérida, Yuc 🏛️ | Pensiones dignas | Adultos mayores activos'},
  ]

  for (const u of newUsers) {
    if (!sc.dids[u.short]) {
      await sc.createAccount(u.short, {
        email: u.email,
        handle: u.handle,
        password: u.password,
      })
    }
  }

  await sc.network.processAll()

  // Login all new users
  const userAgents: Record<string, any> = {}
  for (const u of newUsers) {
    userAgents[u.short] = await login(u.handle, u.password)
  }

  // Build user array with metadata
  const users = [
    {short: 'alice', agent: alice, did: alice.assertDid, name: 'Alice', region: 'CDMX', party: 'Morena', role: 'Diputada federal'},
    {short: 'bob', agent: bob, did: bob.assertDid, name: 'Bob', region: 'Jalisco', party: 'PAN', role: 'Senador'},
    {short: 'carla', agent: carla, did: carla.assertDid, name: 'Carla', region: 'Nuevo León', party: 'PRI', role: 'Regidora'},
    {short: 'dan', agent: userAgents.dan, did: userAgents.dan.assertDid, name: 'Dan', region: 'Yucatán', party: 'PVEM', role: 'Activista ambiental'},
    {short: 'eva', agent: userAgents.eva, did: userAgents.eva.assertDid, name: 'Eva', region: 'Puebla', party: 'PT', role: 'Líder sindical'},
    {short: 'fernando', agent: userAgents.fernando, did: userAgents.fernando.assertDid, name: 'Fernando', region: 'Querétaro', party: 'MC', role: 'Emprendedor social'},
    {short: 'gabriela', agent: userAgents.gabriela, did: userAgents.gabriela.assertDid, name: 'Gabriela', region: 'CDMX', party: 'Independiente', role: 'Periodista'},
    {short: 'hector', agent: userAgents.hector, did: userAgents.hector.assertDid, name: 'Hector', region: 'CDMX', party: 'Independiente', role: 'Académico'},
    {short: 'isabel', agent: userAgents.isabel, did: userAgents.isabel.assertDid, name: 'Isabel', region: 'Oaxaca', party: 'Independiente', role: 'Activista feminista'},
    {short: 'jorge', agent: userAgents.jorge, did: userAgents.jorge.assertDid, name: 'Jorge', region: 'Nuevo León', party: 'MC', role: 'Empresario tech'},
    {short: 'karla', agent: userAgents.karla, did: userAgents.karla.assertDid, name: 'Karla', region: 'Chiapas', party: 'Morena', role: 'Maestra rural'},
    {short: 'luis', agent: userAgents.luis, did: userAgents.luis.assertDid, name: 'Luis', region: 'Guerrero', party: 'PT', role: 'Médico comunitario'},
    {short: 'mariana', agent: userAgents.mariana, did: userAgents.mariana.assertDid, name: 'Mariana', region: 'CDMX', party: 'Independiente', role: 'Abogada DDHH'},
    {short: 'nicolas', agent: userAgents.nicolas, did: userAgents.nicolas.assertDid, name: 'Nicolas', region: 'Jalisco', party: 'PAN', role: 'Ingeniero civil'},
    {short: 'olivia', agent: userAgents.olivia, did: userAgents.olivia.assertDid, name: 'Olivia', region: 'CDMX', party: 'Independiente', role: 'Artista urbana'},
    {short: 'pablo', agent: userAgents.pablo, did: userAgents.pablo.assertDid, name: 'Pablo', region: 'Puebla', party: 'Morena', role: 'Estudiante'},
    {short: 'quetzali', agent: userAgents.quetzali, did: userAgents.quetzali.assertDid, name: 'Quetzali', region: 'Oaxaca', party: 'Independiente', role: 'Comunidad zapoteca'},
    {short: 'rodrigo', agent: userAgents.rodrigo, did: userAgents.rodrigo.assertDid, name: 'Rodrigo', region: 'CDMX', party: 'PT', role: 'Taxista organizado'},
    {short: 'sofia', agent: userAgents.sofia, did: userAgents.sofia.assertDid, name: 'Sofia', region: 'CDMX', party: 'Independiente', role: 'Chef restaurantera'},
    {short: 'tomas', agent: userAgents.tomas, did: userAgents.tomas.assertDid, name: 'Tomas', region: 'Yucatán', party: 'Morena', role: 'Jubilado IMSS'},
  ]

  // ═══════════════════════════════════════════════════════════════════════
  //  PROFILES  (update existing + create new)
  // ═══════════════════════════════════════════════════════════════════════

  // Update existing profiles
  for (const u of users.slice(0, 3)) {
    await u.agent.app.bsky.actor.profile.put(
      {repo: u.did},
      {
        displayName: u.name,
        description: newUsers.find(n => n.short === u.short)?.description || '',
        createdAt: createdAt(),
      },
    )
  }

  await sc.network.processAll()

  // ═══════════════════════════════════════════════════════════════════════
  //  SOCIAL GRAPH  (realistic follows — clustered, not complete)
  // ═══════════════════════════════════════════════════════════════════════

  const follow = async (from: any, to: any) => {
    try {
      await from.agent.app.bsky.graph.follow.create(
        {repo: from.did},
        {subject: to.did, createdAt: createdAt()},
      )
    } catch (e) {
      // ignore duplicate follows
    }
  }

  // Party clusters: everyone follows their own party members
  const parties = ['Morena', 'PAN', 'PRI', 'PVEM', 'PT', 'MC', 'Independiente']
  for (const party of parties) {
    const members = users.filter(u => u.party === party)
    for (const a of members) {
      for (const b of members) {
        if (a.did !== b.did) await follow(a, b)
      }
    }
  }

  // Cross-party follows: key politicians follow each other
  const crossFollows = [
    ['alice', 'bob'], ['alice', 'carla'], ['bob', 'carla'],
    ['alice', 'eva'], ['eva', 'karla'], ['eva', 'luis'],
    ['bob', 'nicolas'], ['carla', 'nicolas'],
    ['gabriela', 'alice'], ['gabriela', 'bob'], ['gabriela', 'carla'],
    ['gabriela', 'mariana'], ['gabriela', 'hector'],
    ['hector', 'alice'], ['hector', 'bob'], ['hector', 'carla'],
    ['mariana', 'gabriela'], ['mariana', 'hector'],
    ['jorge', 'bob'], ['jorge', 'nicolas'],
    ['fernando', 'carla'], ['fernando', 'jorge'],
    ['isabel', 'eva'], ['isabel', 'mariana'],
    ['olivia', 'isabel'], ['olivia', 'gabriela'],
    ['pablo', 'alice'], ['pablo', 'eva'],
    ['rodrigo', 'alice'], ['rodrigo', 'eva'],
    ['tomas', 'alice'], ['tomas', 'eva'],
    ['quetzali', 'isabel'], ['quetzali', 'karla'],
    ['sofia', 'olivia'], ['sofia', 'isabel'],
    ['luis', 'karla'], ['luis', 'tomas'],
    ['dan', 'fernando'], ['dan', 'jorge'],
  ]
  for (const [a, b] of crossFollows) {
    const from = users.find(u => u.short === a)
    const to = users.find(u => u.short === b)
    if (from && to) await follow(from, to)
  }

  await sc.network.processAll()

  // ═══════════════════════════════════════════════════════════════════════
  //  VERIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════

  const verifiedUsers = ['alice', 'bob', 'carla', 'gabriela', 'hector', 'mariana', 'jorge', 'fernando']
  for (const short of verifiedUsers) {
    const u = users.find(u => u.short === short)
    if (u) {
      await sc.verify(u.did, u.did, {displayName: u.name, handle: `${short}.test`})
    }
  }

  await sc.network.processAll()


  // ═══════════════════════════════════════════════════════════════════════
  //  PARTY BOARDS  (8 major parties + independientes)
  // ═══════════════════════════════════════════════════════════════════════

  const partyDefs = [
    {name: 'Morena', color: '#610200', creator: 'alice', official: 'alice', deputy: 'eva', deputy2: 'karla'},
    {name: 'PAN', color: '#004990', creator: 'bob', official: 'bob', deputy: 'nicolas', deputy2: 'carla'},
    {name: 'PRI', color: '#CE1126', creator: 'carla', official: 'carla', deputy: 'fernando', deputy2: 'jorge'},
    {name: 'PVEM', color: '#50B747', creator: 'dan', official: 'dan', deputy: 'fernando', deputy2: 'eva'},
    {name: 'PT', color: '#D92027', creator: 'eva', official: 'eva', deputy: 'luis', deputy2: 'rodrigo'},
    {name: 'MC', color: '#FF8300', creator: 'fernando', official: 'fernando', deputy: 'jorge', deputy2: 'nicolas'},
    {name: 'PRD', color: '#FFD700', creator: 'mariana', official: 'mariana', deputy: 'isabel', deputy2: 'olivia'},
    {name: 'Independientes', color: '#6B7280', creator: 'gabriela', official: 'gabriela', deputy: 'hector', deputy2: 'mariana'},
  ]

  const partyBoards: any[] = []
  for (const p of partyDefs) {
    const creator = users.find(u => u.short === p.creator)!
    const board = await creator.agent.com.para.community.createBoard({
      name: p.name,
      quadrant: 'national',
      description: `Comunidad oficial del partido político ${p.name}. Espacio de deliberación, propuestas y coordinación ciudadana.`,
    })
    const uri = board.data.uri
    const rkey = uri.split('/').pop()!
    const slugBase = p.name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const slug = `${slugBase}-${rkey}`
    partyBoards.push({...p, uri, cid: board.data.cid, creatorDid: creator.did, slug, rkey})
  }

  // Activate boards
  for (const pb of partyBoards) {
    const creator = users.find(u => u.did === pb.creatorDid)!
    const current = await creator.agent.com.atproto.repo.getRecord({
      repo: pb.creatorDid, collection: 'com.para.community.board', rkey: pb.rkey,
    })
    await creator.agent.com.atproto.repo.putRecord({
      repo: pb.creatorDid, collection: 'com.para.community.board', rkey: pb.rkey,
      record: {...(current.data.value as any), status: 'active'},
      swapRecord: current.data.cid,
    })
  }

  // Mass join
  for (const user of users) {
    for (const pb of partyBoards) {
      if (user.party === pb.name || (pb.name === 'Independientes' && user.party === 'Independiente')) {
        // auto-joined by being in party; skip explicit join
      } else {
        try {
          await user.agent.com.para.community.join({communityUri: pb.uri})
        } catch (e) {/* ignore */}
      }
    }
  }

  // Governance with officials and deputies
  for (let i = 0; i < partyDefs.length; i++) {
    const p = partyDefs[i]
    const pb = partyBoards[i]
    const creator = users.find(u => u.short === p.creator)!
    const deputy1 = users.find(u => u.short === p.deputy)!
    const deputy2 = users.find(u => u.short === p.deputy2)!
    const current = await creator.agent.com.atproto.repo.getRecord({
      repo: creator.did, collection: 'com.para.community.governance', rkey: pb.slug,
    })
    const currentGov = current.data.value as any
    await creator.agent.com.atproto.repo.putRecord({
      repo: creator.did, collection: 'com.para.community.governance', rkey: pb.slug,
      record: {
        ...currentGov,
        updatedAt: createdAt(),
        officials: [{did: creator.did, office: 'Representante Oficial', mandate: `Mandato como representante oficial de ${p.name}`}],
        deputies: [
          {key: `deputy-1-${p.name.toLowerCase()}`, tier: 'community', role: 'Diputado Digital', description: `Representante digital de ${p.name}`, capabilities: ['vote', 'propose', 'delegate'], activeHolder: {did: deputy1.did, handle: `${deputy1.short}.test`, displayName: deputy1.name}, votes: 1, applicants: []},
          {key: `deputy-2-${p.name.toLowerCase()}`, tier: 'community', role: 'Vocal Ciudadano', description: `Voz ciudadana de ${p.name}`, capabilities: ['vote', 'propose'], activeHolder: {did: deputy2.did, handle: `${deputy2.short}.test`, displayName: deputy2.name}, votes: 1, applicants: []},
        ],
        metadata: {...currentGov.metadata, state: 'active', lastPublishedAt: createdAt()},
        editHistory: [
          ...(currentGov.editHistory || []),
          {id: `seed-officials-${p.name.toLowerCase()}`, action: 'set_official_representatives', actorDid: creator.did, createdAt: createdAt(), summary: `Seeded officials for ${p.name}.`},
        ],
      },
      swapRecord: current.data.cid,
    })
  }

  await sc.network.processAll()

  // ═══════════════════════════════════════════════════════════════════════
  //  CIVIC COMMUNITIES  (12 topic-based)
  // ═══════════════════════════════════════════════════════════════════════

  const communityCreators = [
    {creator: 'alice', name: 'Presupuesto Participativo Centro', quadrant: 'centro', description: 'Asamblea ciudadana para decidir la inversión pública en el centro de la ciudad.'},
    {creator: 'bob', name: 'Movilidad Sostenible Norte', quadrant: 'norte', description: 'Espacio de deliberación sobre transporte público, ciclovías y movilidad activa.'},
    {creator: 'carla', name: 'Educación y Cultura Sur', quadrant: 'sur', description: 'Comunidad dedicada a la mejora de escuelas públicas y centros culturales.'},
    {creator: 'dan', name: 'Medio Ambiente y Clima', quadrant: 'norte', description: 'Iniciativas de protección ambiental, energías renovables y adaptación climática.'},
    {creator: 'eva', name: 'Derechos Laborales', quadrant: 'centro', description: 'Defensa de los derechos de trabajadores, salarios dignos y condiciones justas.'},
    {creator: 'fernando', name: 'Transparencia y Anticorrupción', quadrant: 'centro', description: 'Seguimiento del gasto público, contratos gubernamentales y rendición de cuentas.'},
    {creator: 'gabriela', name: 'Seguridad Ciudadana', quadrant: 'norte', description: 'Diálogo sobre estrategias de seguridad, justicia restaurativa y prevención del delito.'},
    {creator: 'hector', name: 'Economía y Desarrollo', quadrant: 'centro', description: 'Análisis de políticas económicas, desarrollo regional e inclusión financiera.'},
    {creator: 'isabel', name: 'Derechos Humanos', quadrant: 'sur', description: 'Protección de grupos vulnerables, mujeres, niñez, personas migrantes y LGBTIQ+.'},
    {creator: 'jorge', name: 'Innovación y Tecnología', quadrant: 'norte', description: 'Gobierno digital, datos abiertos, inteligencia artificial ética y ciberseguridad.'},
    {creator: 'karla', name: 'Cultura Indígena', quadrant: 'sur', description: 'Preservación de lenguas originarias, medicina tradicional y territorios comunales.'},
    {creator: 'luis', name: 'Salud Pública', quadrant: 'sur', description: 'Acceso a servicios de salud, medicamentos, prevención y atención primaria.'},
  ]

  const communities: any[] = []
  for (const c of communityCreators) {
    const creator = users.find(u => u.short === c.creator)!
    const board = await creator.agent.com.para.community.createBoard({
      name: c.name, quadrant: c.quadrant as any, description: c.description,
    })
    communities.push({uri: board.data.uri, name: c.name, creatorDid: creator.did, cid: board.data.cid})
  }

  // Mass join all communities
  for (const user of users) {
    for (const comm of communities) {
      if (user.did !== comm.creatorDid) {
        try { await user.agent.com.para.community.join({communityUri: comm.uri}) } catch (e) {/* ignore */}
      }
    }
  }

  await sc.network.processAll()


  // ═══════════════════════════════════════════════════════════════════════
  //  CABILDEOS  (20 — rich variety across all phases)
  // ═══════════════════════════════════════════════════════════════════════

  const cabildeoDefs = [
    // DRAFT (2)
    {creator: 'alice', title: 'Centro Cultural Independiente Roma', description: 'Propuesta para convertir un edificio histórico abandonado en un centro cultural autogestionado con talleres, galería y café comunitario. Se busca convenio con la alcaldía para uso de suelo.', communityIdx: 0, options: [{label: 'Autogestión total', description: 'Cooperativa ciudadana sin intermediarios'}, {label: 'Convenio público-privado', description: 'Alcaldía aporta espacio, ciudadanía opera'}, {label: 'Venta a desarrollador', description: 'Liberar espacio para vivienda mixta'}], phase: 'draft', deadline: 30, minQuorum: 15, flairs: ['||#PresupuestoParticipativo', '|#Cultura']},
    {creator: 'hector', title: 'Impuesto Progresivo al Carbono', description: 'Estudio de factibilidad para implementar un impuesto escalonado a emisiones de carbono en industrias manufactureras del centro del país, con devolución directa a hogares de bajos ingresos.', communityIdx: 7, options: [{label: 'Implementar en 2026', description: 'Tarifa inicial $50/ton CO2'}, {label: 'Estudio piloto sectorial', description: 'Solo cemento y acero por 2 años'}, {label: 'Rechazar y fortalecer subsidios verdes', description: 'Invertir en transición energética directa'}], phase: 'draft', deadline: 45, minQuorum: 20, flairs: ['||#Economia', '|#CambioClimatico']},

    // OPEN (4)
    {creator: 'bob', title: 'Ciclovía Metropolitana Conectada', description: 'Diseño de una red ciclista de 45 km que conecte la periferia norte con los centros de trabajo, escuelas y mercados. Incluye carriles protegidos y estaciones de reparación. Estudio de impacto ya aprobado.', communityIdx: 1, options: [{label: 'Construir red completa', description: '45 km en 24 meses, $450M MXN'}, {label: 'Construir tramo piloto', description: '8 km zona universitaria, $80M MXN'}, {label: 'Ampliar ciclovías existentes', description: 'Conectar tramos actuales sin carriles protegidos'}], phase: 'open', deadline: 21, minQuorum: 15, flairs: ['||#MovilidadActiva', '|#Ciclovia']},
    {creator: 'carla', title: 'Becas de Excelencia Ampliadas', description: 'Ampliación del programa de becas para estudiantes de escuelas públicas en zonas rurales y marginadas. Incluye transporte, alimentación y materiales. Actualmente cubre 5,000 estudiantes; se propone llegar a 25,000.', communityIdx: 2, options: [{label: 'Ampliación total inmediata', description: '25,000 becas en 12 meses'}, {label: 'Fase escalonada', description: '15,000 en año 1, 25,000 en año 2'}, {label: 'Mantener cobertura actual', description: 'Enfocar recursos en calidad educativa'}], phase: 'open', deadline: 28, minQuorum: 20, flairs: ['||#EducacionLaica', '|#Becas']},
    {creator: 'dan', title: 'Reforestación Urbana Masiva', description: 'Plantar 100,000 árboles nativos en zonas urbanas de alta densidad para reducir islas de calor y mejorar calidad del aire. Cada colonia elegirá especies mediante asamblea vecinal.', communityIdx: 3, options: [{label: '100,000 árboles en 18 meses', description: 'Inversión $120M MXN con mantenimiento 3 años'}, {label: '50,000 árboles + mantenimiento extendido', description: 'Priorizar zonas críticas de calor'}, {label: 'Programa de adopción vecinal', description: 'Gobierno aporta plantones, vecinos plantan y cuidan'}], phase: 'open', deadline: 14, minQuorum: 12, flairs: ['||#MedioAmbiente', '|#Reforestacion']},
    {creator: 'isabel', title: 'Refugios Seguros para Mujeres', description: 'Creación de 15 refugios integrales para mujeres en situación de violencia en el estado. Cada refugio incluirá atención psicológica, legal, médica y capacitación laboral.', communityIdx: 8, options: [{label: '15 refugios con atención 24/7', description: 'Inversión $85M MXN anuales'}, {label: '8 refugios + unidades móviles', description: 'Cobertura rural con atención itinerante'}, {label: 'Fortalecer casas de refugio existentes', description: 'Ampliar capacidad de refugios privados con subsidio'}], phase: 'open', deadline: 35, minQuorum: 18, flairs: ['||#DerechosHumanos', '|#NiUnaMenos']},

    // DELIBERATING (5)
    {creator: 'eva', title: 'Salario Mínimo Digno 2026', description: 'Propuesta para incrementar el salario mínimo a $12,000 mensuales con prestaciones completas (aguinaldo, vacaciones, prima vacacional). Análisis de impacto en PYMEs incluido.', communityIdx: 4, options: [{label: 'Aumento inmediato a $12,000', description: 'Implementación en 6 meses'}, {label: 'Escalón progresivo', description: '$10,500 en 2026, $12,000 en 2027'}, {label: 'Bonificación por productividad', description: 'Mantener salario base + bono escalonado'}], phase: 'deliberating', deadline: 14, minQuorum: 25, flairs: ['||#DerechosLaborales', '|#SalarioMinimo']},
    {creator: 'fernando', title: 'Plataforma de Contratos Abiertos', description: 'Sistema público de seguimiento en tiempo real de todos los contratos gubernamentales con alertas automáticas de sobreprecios, conexiones entre empresas y funcionarios.', communityIdx: 5, options: [{label: 'Implementación total', description: 'Todos los contratos federales, estatales y municipales'}, {label: 'Fase federal primero', description: 'Solo contratos federales por 2 años'}, {label: 'Auditoría externa paralela', description: 'Contratar 3 firmas internacionales de auditoría'}], phase: 'deliberating', deadline: 10, minQuorum: 15, flairs: ['||#Transparencia', '|#Anticorrupcion']},
    {creator: 'gabriela', title: 'Policía de Proximidad Comunitaria', description: 'Reforma del modelo de seguridad ciudadana basado en policías de proximidad con formación en derechos humanos, mediación de conflictos y primer respondiente. Evaluación semestral por comités vecinales.', communityIdx: 6, options: [{label: 'Reforma integral inmediata', description: 'Capacitación 6 meses, despliegue en 12'}, {label: 'Piloto por alcaldías', description: '3 alcaldías modelo por 18 meses'}, {label: 'Fortalecer ministerios públicos', description: 'Invertir en investigación y persecución del delito'}], phase: 'deliberating', deadline: 18, minQuorum: 22, flairs: ['||#Seguridad', '|#Justicia']},
    {creator: 'jorge', title: 'Identidad Digital Soberana', description: 'Creación de una credencial digital gubernamental descentralizada que permita a ciudadanos controlar sus datos personales, compartirlos selectivamente con instituciones y revocar accesos.', communityIdx: 9, options: [{label: 'Implementar credencial blockchain', description: 'Infraestructura open-source, datos encriptados'}, {label: 'Federar identidades existentes', description: 'Conectar CURP, INE, RFC en capa de interoperabilidad'}, {label: 'Fortalecer plataforma existente', description: 'Mejorar seguridad de sistemas actuales sin cambio radical'}], phase: 'deliberating', deadline: 21, minQuorum: 15, flairs: ['||#Innovacion', '|#GobiernoDigital']},
    {creator: 'karla', title: 'Escuelas Interculturales Bilingües', description: 'Programa de educación bilingüe español-lengua originaria en 500 escuelas de comunidades indígenas. Formación de maestros bilingües, materiales didácticos culturales y evaluación adaptada.', communityIdx: 10, options: [{label: '500 escuelas en 3 años', description: 'Inversión $200M MXN anuales'}, {label: '200 escuelas piloto', description: 'Evaluación antes de escalar'}, {label: 'Programa de maestros visitantes', description: 'Especialistas indígenas rotan entre escuelas'}], phase: 'deliberating', deadline: 28, minQuorum: 12, flairs: ['||#EducacionIndigena', '|#Interculturalidad']},

    // VOTING (6)
    {creator: 'alice', title: 'Renovación de Parques Públicos del Centro', description: 'Propuesta para renovar 12 parques públicos del centro histórico con mobiliario urbano accesible, áreas verdes y centros de carga solar. Presupuesto participativo 2025. Dictamen técnico aprobado.', communityIdx: 0, options: [{label: 'Aprobar presupuesto completo', description: '12 parques, 18 meses, $180M MXN'}, {label: 'Aprobar fase piloto', description: '4 parques, 6 meses, evaluación'}, {label: 'Rechazar y reponer', description: 'Esperar dictamen ambiental completo'}], phase: 'voting', deadline: 7, minQuorum: 10, flairs: ['||#PresupuestoParticipativo', '|#EspacioPublico']},
    {creator: 'luis', title: 'Clínicas Móviles de Salud Preventiva', description: 'Despliegue de 30 unidades móviles de atención primaria en zonas rurales y semiurbanas sin acceso a centros de salud. Incluye vacunación, detección de diabetes, hipertensión y cáncer.', communityIdx: 11, options: [{label: '30 unidades 24/7', description: 'Cobertura 100% de localidades sin servicio'}, {label: '15 unidades + telemedicina', description: 'Combinar atención presencial y virtual'}, {label: 'Contratar médicos rurales', description: 'Estímulo económico para médicos en zonas marginadas'}], phase: 'voting', deadline: 5, minQuorum: 15, flairs: ['||#SaludPublica', '|#AtencionPrimaria']},
    {creator: 'mariana', title: 'Fiscalía Especial Anticorrupción', description: 'Creación de una fiscalía autónoma con facultades de investigación, persecución y recuperación de activos. Presupuesto independiente del Ejecutivo y designación por concurso público.', communityIdx: 5, options: [{label: 'Crear fiscalía autónoma', description: 'Presupuesto constitucionalmente protegido'}, {label: 'Fortalecer fiscalía existente', description: 'Más recursos y autonomía operativa'}, {label: 'Crear comisión ciudadana de vigilancia', description: 'Órgano paralelo de denuncia y seguimiento'}], phase: 'voting', deadline: 10, minQuorum: 20, flairs: ['||#Anticorrupcion', '|#Justicia']},
    {creator: 'nicolas', title: 'Tren Eléctrico Metropolitano', description: 'Construcción de línea de tren eléctrico de 32 km con 18 estaciones, conectando el aeropuerto con zonas industriales y centros comerciales. Estimulo: reducción 40% de emisiones de transporte.', communityIdx: 1, options: [{label: 'Construir línea completa', description: '32 km, 18 estaciones, 5 años, $15,000M MXN'}, {label: 'Fase 1: Aeropuerto-Centro', description: '18 km, 10 estaciones, 3 años'}, {label: 'Mejorar transporte existente', description: 'Ampliar metrobús y trolebús con electrificación'}], phase: 'voting', deadline: 12, minQuorum: 30, flairs: ['||#TransportePublico', '|#MovilidadSostenible']},
    {creator: 'olivia', title: 'Muros Urbanos de Arte Comunitario', description: 'Programa de 50 murales monumentales en muros de infraestructura urbana (viaductos, muros de contención, edificios públicos) realizados por colectivos de artistas locales con participación vecinal.', communityIdx: 0, options: [{label: '50 murales en 12 meses', description: 'Presupuesto $25M MXN, concurso abierto'}, {label: '25 murales + galerías al aire libre', description: 'Espacios temporales de arte itinerante'}, {label: 'Programa de residencias artísticas', description: 'Artistas nacionales e internacionales por 6 meses'}], phase: 'voting', deadline: 8, minQuorum: 8, flairs: ['||#Cultura', '|#ArteUrbano']},
    {creator: 'pablo', title: 'Transporte Estudiantil Gratuito', description: 'Implementación de transporte público gratuito para estudiantes de nivel medio superior y superior en toda la ciudad. Incluye metro, metrobús, tren ligero y rutas alimentadoras.', communityIdx: 2, options: [{label: 'Transporte gratuito universal', description: 'Todos los estudiantes, todos los medios'}, {label: 'Descuento 80% para estudiantes', description: 'Subsidio parcial con validación escolar'}, {label: 'Rutas escolares directas', description: 'Camiones exclusivos escuela-casa'}], phase: 'voting', deadline: 6, minQuorum: 12, flairs: ['||#Educacion', '|#TransportePublico']},

    // RESOLVED (3)
    {creator: 'alice', title: 'Energía Solar en Edificios Públicos', description: 'Instalación de paneles solares en 50 edificios gubernamentales. Ya aprobado y en fase de licitación. Resultado de consulta ciudadana con 12,400 participantes.', communityIdx: 0, options: [{label: 'Licitación pública nacional', description: 'Proveedor único, 36 meses'}, {label: 'Licitación modular por lotes', description: '5 lotes, 18 meses'}], phase: 'resolved', deadline: -7, minQuorum: 8, flairs: ['||#EnergiaSolar', '|#RespetoAmbiental']},
    {creator: 'rodrigo', title: 'Tarifa Diferenciada para Taxistas', description: 'Propuesta de tarifa diferenciada en gasolina para taxistas organizados y operadores de transporte público. Incluye programa de conversión a vehículos híbridos con subsidio.', communityIdx: 1, options: [{label: 'Subsidio gasolina + créditos híbridos', description: '$2/litro de descuento + créditos vehiculares'}, {label: 'Solo créditos para conversión', description: 'Sin subsidio a combustible, incentivo a tecnología limpia'}, {label: 'Mantenimiento de tarifa actual', description: 'No intervención en mercado de combustibles'}], phase: 'resolved', deadline: -14, minQuorum: 10, flairs: ['||#TransportePublico', '|#Movilidad']},
    {creator: 'sofia', title: 'Mercados de Productores Locales', description: 'Red de 20 mercados semanales de productores locales en plazas públicas. Exclusivo para agricultura familiar, artesanías y gastronomía tradicional. Ya aprobado por consejo ciudadano.', communityIdx: 0, options: [{label: '20 mercados semanales fijos', description: 'Permanencia en plazas públicas'}, {label: 'Mercados itinerantes rotativos', description: '40 puntos, cada uno 1 vez por semana'}, {label: 'Ferias mensuales + plataforma digital', description: 'Eventos mensuales + app de compra directa'}], phase: 'resolved', deadline: -21, minQuorum: 6, flairs: ['||#SoberaniaAlimentaria', '|#EconomiaLocal']},
  ]

  const cabildeos: any[] = []
  for (const c of cabildeoDefs) {
    const creator = users.find(u => u.short === c.creator)!
    const deadline = new Date(Date.now() + c.deadline * 24 * 60 * 60 * 1000).toISOString()
    const res = await creator.agent.com.atproto.repo.createRecord({
      repo: creator.did,
      collection: 'com.para.civic.cabildeo',
      record: {
        $type: 'com.para.civic.cabildeo',
        title: c.title,
        description: c.description,
        community: communities[c.communityIdx].uri,
        options: c.options,
        phase: c.phase,
        phaseDeadline: deadline,
        minQuorum: c.minQuorum,
        flairs: c.flairs,
        createdAt: createdAt(),
      },
    })
    cabildeos.push({uri: res.data.uri, cid: res.data.cid, title: c.title, phase: c.phase, options: c.options.length, creator: c.creator})
  }

  await sc.network.processAll()


  // ═══════════════════════════════════════════════════════════════════════
  //  POSITIONS  (60+ rich stances across cabildeos)
  // ═══════════════════════════════════════════════════════════════════════

  const positionDefs = [
    // Cabildeo 0: Centro Cultural (draft)
    {user: 'alice', cabIdx: 0, stance: 'for', optionIdx: 0, text: 'La autogestión es el único camino para que el espacio realmente sirva a la comunidad. Hemos visto cómo los convenios burocráticos terminan abandonados.'},
    {user: 'olivia', cabIdx: 0, stance: 'for', optionIdx: 0, text: 'Como artista, necesitamos espacios sin censura ni intermediarios. La autogestión garantiza libertad creativa y acceso abierto.'},
    {user: 'hector', cabIdx: 0, stance: 'amendment', optionIdx: 1, text: 'Apoyo el convenio público-privado pero con cláusula de reversión: si el espacio no se usa culturalmente en 3 años, vuelve a la comunidad.'},
    {user: 'bob', cabIdx: 0, stance: 'against', optionIdx: 2, text: 'El edificio está en una zona de alta plusvalía. La venta podría financiar 3 centros culturales en zonas que realmente los necesitan.'},

    // Cabildeo 1: Impuesto Carbono (draft)
    {user: 'dan', cabIdx: 1, stance: 'for', optionIdx: 0, text: 'El impuesto al carbono con devolución a hogares es la política más justa. Quienes contaminan más pagan, quienes ganan menos reciben.'},
    {user: 'jorge', cabIdx: 1, stance: 'amendment', optionIdx: 1, text: 'Concuerdo con el impuesto pero sugiero iniciar solo en cemento y acero. Son los sectores con mayor margen de absorción de costos.'},
    {user: 'fernando', cabIdx: 1, stance: 'against', optionIdx: 2, text: 'Los subsidios verdes directos generan más empleo e innovación que un impuesto que puede terminar siendo regresivo en la cadena de suministro.'},

    // Cabildeo 2: Ciclovía (open)
    {user: 'nicolas', cabIdx: 2, stance: 'for', optionIdx: 0, text: 'La red completa es necesaria. Los tramos piloto siempre quedan inconexos y terminan abandonados por falta de continuidad.'},
    {user: 'eva', cabIdx: 2, stance: 'for', optionIdx: 0, text: 'Miles de trabajadores dependen de la bicicleta. Una red completa reduce tiempos de traslado y mejora calidad de vida.'},
    {user: 'rodrigo', cabIdx: 2, stance: 'amendment', optionIdx: 1, text: 'Apoyo el tramo piloto en zona universitaria, pero debe incluir conexión con terminal de transporte público para intermodalidad.'},
    {user: 'bob', cabIdx: 2, stance: 'against', optionIdx: 2, text: 'Ampliar ciclovías sin protección es inseguro. Preferiría invertir en transporte público de alta capacidad antes que en infraestructura ciclista deficiente.'},

    // Cabildeo 3: Becas (open)
    {user: 'karla', cabIdx: 3, stance: 'for', optionIdx: 0, text: 'En Chiapas conozco niñas que caminan 2 horas para llegar a la escuela. Las becas no son gasto, son inversión en libertad.'},
    {user: 'pablo', cabIdx: 3, stance: 'for', optionIdx: 1, text: 'Como estudiante, prefiero la fase escalonada. Así el sistema tiene tiempo de ajustarse y no colapsa con la demanda.'},
    {user: 'carla', cabIdx: 3, stance: 'against', optionIdx: 2, text: 'Mantener cobertura actual es aceptar la desigualdad. Tenemos recursos; lo que falta es voluntad política.'},

    // Cabildeo 4: Reforestación (open)
    {user: 'dan', cabIdx: 4, stance: 'for', optionIdx: 0, text: '100,000 árboles en 18 meses es ambicioso pero factible. He coordinado plantaciones masivas; la clave es la logística de transporte de plantones.'},
    {user: 'luis', cabIdx: 4, stance: 'amendment', optionIdx: 1, text: 'Priorizar zonas críticas de calor es inteligente, pero incluyamos zonas con peor calidad del aire. La salud pública debe ser criterio de priorización.'},
    {user: 'tomas', cabIdx: 4, stance: 'for', optionIdx: 2, text: 'A mi edad, participar en la plantación me ha dado propósito. La adopción vecinal genera comunidad y cuidado real de los árboles.'},

    // Cabildeo 5: Refugios mujeres (open)
    {user: 'isabel', cabIdx: 5, stance: 'for', optionIdx: 0, text: '15 refugios con atención 24/7 es el mínimo. Actualmente hay 3 para 5 millones de mujeres. La violencia no espera presupuestos.'},
    {user: 'mariana', cabIdx: 5, stance: 'for', optionIdx: 0, text: 'He litigado casos donde la falta de refugio seguro terminó en feminicidio. La inversión en prevención es infinitamente menor que el costo de la impunidad.'},
    {user: 'gabriela', cabIdx: 5, stance: 'amendment', optionIdx: 1, text: 'Las unidades móviles son esenciales para zonas rurales donde las mujeres no pueden llegar a centros urbanos. Debe ser complemento, no sustituto.'},
    {user: 'alice', cabIdx: 5, stance: 'against', optionIdx: 2, text: 'Fortalecer refugios privados perpetúa la privatización de la justicia. El Estado tiene obligación constitucional de proteger a las mujeres.'},

    // Cabildeo 6: Salario mínimo (deliberating)
    {user: 'eva', cabIdx: 6, stance: 'for', optionIdx: 0, text: 'Ninguna persona que trabaja 48 horas semanales debería ganar menos de lo necesario para vivir dignamente. $12,000 es el piso, no el techo.'},
    {user: 'rodrigo', cabIdx: 6, stance: 'for', optionIdx: 0, text: 'Como taxista, trabajo 60 horas semanales y barely llego. El aumento inmediato es justicia, no caridad.'},
    {user: 'fernando', cabIdx: 6, stance: 'amendment', optionIdx: 1, text: 'Las PYMEs necesitan tiempo de adaptación. Sugiero escalón progresivo con subsidio transitorio a microempresas.'},
    {user: 'jorge', cabIdx: 6, stance: 'against', optionIdx: 2, text: 'En tecnología pagamos salarios competitivos. Un aumento forzado del mínimo podría desincentivar contratación de junior developers.'},

    // Cabildeo 7: Contratos abiertos (deliberating)
    {user: 'mariana', cabIdx: 7, stance: 'for', optionIdx: 0, text: 'La corrupción vive en la opacidad. Contratos abiertos con alertas automáticas son la mejor vacuna contra el sobreprecio.'},
    {user: 'gabriela', cabIdx: 7, stance: 'for', optionIdx: 0, text: 'Como periodista, he destapado contratos opacos por años. La transparencia en tiempo real cambia las reglas del juego.'},
    {user: 'fernando', cabIdx: 7, stance: 'for', optionIdx: 1, text: 'Concuerdo en empezar por contratos federales. Son los de mayor monto y mayor riesgo. Escalar después es natural.'},
    {user: 'carla', cabIdx: 7, stance: 'against', optionIdx: 2, text: 'Tres firmas de auditoría internacional es gasto sin garantía. La tecnología de contratos abiertos es más barata y más efectiva.'},

    // Cabildeo 8: Policía proximidad (deliberating)
    {user: 'isabel', cabIdx: 8, stance: 'for', optionIdx: 0, text: 'La seguridad ciudadana no puede basarse en la fuerza. Policías de proximidad con formación en DDHH han reducido delitos 30% en Jalisco.'},
    {user: 'bob', cabIdx: 8, stance: 'amendment', optionIdx: 1, text: 'El piloto por alcaldías permite evaluar antes de escalar. Pero necesitamos métricas claras: no solo delitos, sino confianza ciudadana.'},
    {user: 'gabriela', cabIdx: 8, stance: 'for', optionIdx: 2, text: 'Sin ministerios públicos capacitados, no importa cuántos policías tengamos. La impunidad es el problema, no la ausencia de uniformados.'},

    // Cabildeo 9: Identidad digital (deliberating)
    {user: 'jorge', cabIdx: 9, stance: 'for', optionIdx: 0, text: 'La credencial blockchain con datos soberanos es el futuro. Estonia lo hace desde 2012. No reinventemos, adaptemos.'},
    {user: 'hector', cabIdx: 9, stance: 'amendment', optionIdx: 1, text: 'Federar identidades existentes es más pragmático. No necesitamos una credencial nueva, necesitamos que las actuales hablen entre sí de forma segura.'},
    {user: 'mariana', cabIdx: 9, stance: 'against', optionIdx: 2, text: 'Fortalecer sistemas actuales es aceptar que el gobierno siga controlando nuestros datos. La soberanía digital requiere cambio estructural, no parches.'},

    // Cabildeo 10: Escuelas bilingües (deliberating)
    {user: 'karla', cabIdx: 10, stance: 'for', optionIdx: 0, text: 'Las niñas tsotsiles de mi comunidad aprenden español como segunda lengua. La educación bilingüe digna revierte siglos de exclusión.'},
    {user: 'quetzali', cabIdx: 10, stance: 'for', optionIdx: 0, text: 'Soy zapoteca y hablé zapoteco antes que español. Las escuelas bilingües salvaron mi identidad. Todas las niñas merecen lo mismo.'},
    {user: 'pablo', cabIdx: 10, stance: 'amendment', optionIdx: 1, text: '200 escuelas piloto permiten ajustar el modelo. Pero el plazo de evaluación debe ser 1 año, no 3. La niñez no espera.'},
    {user: 'alice', cabIdx: 10, stance: 'against', optionIdx: 2, text: 'Maestros visitantes son excelentes complemento, pero no sustituyen escuelas bilingües estables. Necesitamos infraestructura, no voluntarios.'},

    // Cabildeo 11: Parques (voting)
    {user: 'alice', cabIdx: 11, stance: 'for', optionIdx: 0, text: 'Los parques son el corazón de la ciudad. La inversión completa generará empleo verde y mejora de calidad de vida.'},
    {user: 'olivia', cabIdx: 11, stance: 'for', optionIdx: 0, text: 'Cada parque renovado es un lienzo para muralistas, músicos y comunidad. El presupuesto completo es inversión cultural.'},
    {user: 'hector', cabIdx: 11, stance: 'amendment', optionIdx: 1, text: 'El piloto permite evaluar el modelo antes de escalar. Pero 4 parques no son representativos; sugiero 6.'},
    {user: 'bob', cabIdx: 11, stance: 'against', optionIdx: 2, text: 'El dictamen ambiental es obligatorio por ley. Aprobar sin él es riesgo legal y ambiental que podría paralizar todo el proyecto.'},

    // Cabildeo 12: Clínicas móviles (voting)
    {user: 'luis', cabIdx: 12, stance: 'for', optionIdx: 0, text: 'He atendido comunidades donde la clínica más cercana está a 3 horas. Las unidades móviles salvan vidas, no son lujo.'},
    {user: 'tomas', cabIdx: 12, stance: 'for', optionIdx: 0, text: 'A mi edad, el transporte es barrera para chequeos. Unidades móviles me permitirían acceder a detección temprana sin viajar.'},
    {user: 'karla', cabIdx: 12, stance: 'amendment', optionIdx: 1, text: 'Telemedicina es excelente para seguimiento, pero diagnóstico inicial requiere contacto físico. Propongo 20 móviles + telemedicina.'},
    {user: 'jorge', cabIdx: 12, stance: 'against', optionIdx: 2, text: 'Contratar médicos rurales con estímulo económico genera empleo local y continuidad de atención. Las unidades móviles son intermitentes.'},

    // Cabildeo 13: Fiscalía anticorrupción (voting)
    {user: 'mariana', cabIdx: 13, stance: 'for', optionIdx: 0, text: 'Sin fiscalía autónoma, el que roba nunca paga. La autonomía presupuestal y designación por concurso son no negociables.'},
    {user: 'fernando', cabIdx: 13, stance: 'for', optionIdx: 0, text: 'He auditado contratos donde la misma empresa gana 8 veces seguidas. Solo una fiscalía independiente puede romper esos círculos.'},
    {user: 'gabriela', cabIdx: 13, stance: 'amendment', optionIdx: 1, text: 'Fortalecer la fiscalía existente es más rápido. Pero necesitamos protección de denunciantes y acceso a información bancaria.'},
    {user: 'carla', cabIdx: 13, stance: 'against', optionIdx: 2, text: 'Comisiones ciudadanas sin poder de persecución son inútiles. Necesitamos fiscalías con dientes, no observadores.'},

    // Cabildeo 14: Tren eléctrico (voting)
    {user: 'nicolas', cabIdx: 14, stance: 'for', optionIdx: 0, text: 'Ingeniería y sostenibilidad en un solo proyecto. El tren eléctrico reduce emisiones 40% y conecta la ciudad de forma eficiente.'},
    {user: 'jorge', cabIdx: 14, stance: 'for', optionIdx: 1, text: 'La fase 1 es pragmática. Aeropuerto-centro es el corredor de mayor demanda. Escalar después con datos reales.'},
    {user: 'rodrigo', cabIdx: 14, stance: 'against', optionIdx: 2, text: 'El tren cuesta $15,000M MXN. Por esa mitad podríamos electrificar toda la flota de transporte público existente con impacto inmediato.'},
    {user: 'eva', cabIdx: 14, stance: 'against', optionIdx: 2, text: 'El metrobús electrificado beneficia a más trabajadores hoy. El tren lleva 5 años; la contaminación no espera.'},

    // Cabildeo 15: Murales (voting)
    {user: 'olivia', cabIdx: 15, stance: 'for', optionIdx: 0, text: '50 murales transforman la percepción de la ciudad. El arte público reduce vandalismo, genera turismo y dignifica el espacio.'},
    {user: 'alice', cabIdx: 15, stance: 'for', optionIdx: 1, text: 'Las galerías al aire libre permiten rotar artistas y barrios. Es más inclusivo que murales fijos.'},
    {user: 'pablo', cabIdx: 15, stance: 'against', optionIdx: 2, text: 'Las residencias artísticas generan intercambio internacional y visibilidad global. Un mural local es hermoso; una residencia transforma carreras.'},

    // Cabildeo 16: Transporte estudiantil (voting)
    {user: 'pablo', cabIdx: 16, stance: 'for', optionIdx: 0, text: 'Gasto $400 semanales solo en transporte. Eso es 20% de mi presupuesto. Transporte gratuito es inversión en permanencia escolar.'},
    {user: 'karla', cabIdx: 16, stance: 'for', optionIdx: 0, text: 'Mis alumnas caminan 45 minutos bajo sol o lluvia. El transporte gratuito reduce deserción escolar, especialmente de niñas.'},
    {user: 'fernando', cabIdx: 16, stance: 'amendment', optionIdx: 1, text: 'Descuento 80% con validación escolar es sostenible fiscalmente y cubre la necesidad inmediata.'},
    {user: 'jorge', cabIdx: 16, stance: 'against', optionIdx: 2, text: 'Rutas escolares directas son más eficientes que subsidio general. Van de puerta a puerta sin intermediar con rutas existentes.'},

    // Cabildeo 17: Energía solar (resolved)
    {user: 'alice', cabIdx: 17, stance: 'for', optionIdx: 0, text: 'El resultado de la consulta fue claro: 68% aprobó licitación pública nacional. La transparencia del proceso fue ejemplar.'},
    {user: 'dan', cabIdx: 17, stance: 'for', optionIdx: 0, text: '50 edificios con paneles solares reducirán emisiones 2,300 toneladas CO2 anuales. Es un hito para la ciudad.'},
    {user: 'fernando', cabIdx: 17, stance: 'against', optionIdx: 1, text: 'La licitación modular hubiera sido más rápida. 5 lotes en paralelo vs un solo proveedor. Pero respeto el resultado democrático.'},

    // Cabildeo 18: Tarifa taxistas (resolved)
    {user: 'rodrigo', cabIdx: 18, stance: 'for', optionIdx: 0, text: 'Ganamos la consulta. El subsidio + créditos híbridos es justo. Llevamos 15 años pagando gasolina sin apoyo.'},
    {user: 'eva', cabIdx: 18, stance: 'for', optionIdx: 0, text: 'Los taxistas organizados merecen reconocimiento. Son transporte público informal que moviliza millones diariamente.'},
    {user: 'jorge', cabIdx: 18, stance: 'against', optionIdx: 1, text: 'Hubiera preferido incentivar conversión directa sin subsidio a combustible. Pero entiendo la necesidad de transición justa.'},

    // Cabildeo 19: Mercados productores (resolved)
    {user: 'sofia', cabIdx: 19, stance: 'for', optionIdx: 0, text: 'Los mercados semanales fijos generan comunidad. La gente no solo compra, se encuentra, organiza, celebra.'},
    {user: 'quetzali', cabIdx: 19, stance: 'for', optionIdx: 0, text: 'Mis productos llegan directo al consumidor sin intermediarios. De $100 de venta, antes me quedaban $35. Ahora me quedo $85.'},
    {user: 'fernando', cabIdx: 19, stance: 'amendment', optionIdx: 2, text: 'La app de compra directa complementaría perfecto los mercados físicos. Pero el resultado es positivo de cualquier forma.'},
  ]

  for (const p of positionDefs) {
    const user = users.find(u => u.short === p.user)!
    const cab = cabildeos[p.cabIdx]
    try {
      await user.agent.com.atproto.repo.createRecord({
        repo: user.did,
        collection: 'com.para.civic.position',
        record: {
          $type: 'com.para.civic.position',
          cabildeo: cab.uri,
          stance: p.stance,
          optionIndex: p.optionIdx,
          text: p.text,
          createdAt: createdAt(),
        },
      })
    } catch (e) {/* ignore duplicates */}
  }

  await sc.network.processAll()
