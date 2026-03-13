import { User, Documento, Log, ViolenceType } from './types';

export interface UserWithPassword extends User {
  senha?: string;
}

export const INITIAL_USERS: UserWithPassword[] = [
  // UNIDADE 1 - CT 1
  { id: 'admin_lud', nome: 'LUDIMILA', perfil: 'ADMIN', cargo: 'ADM GERAL', senha: '123456', unidade_id: 1 },
  { id: 'admin1', nome: 'EDSON', perfil: 'ADMIN', cargo: 'ADM', senha: '123456', unidade_id: 1 },
  { id: 'admin2', nome: 'LUIZ', perfil: 'ADMIN', cargo: 'ADM', senha: '123456', unidade_id: 1 },
  { id: 'admin3', nome: 'FATIMA', perfil: 'ADMIN', cargo: 'ADM', senha: '123456', unidade_id: 1 },
  { id: 'cons1', nome: 'LEANDRO', perfil: 'CONSELHEIRO', cargo: 'Conselheiro', senha: '123456', unidade_id: 1 },
  { id: 'cons2', nome: 'LUIZA', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456', unidade_id: 1 },
  { id: 'cons3', nome: 'MILENA', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456', unidade_id: 1 },
  { id: 'cons5', nome: 'MIRIAN', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456', unidade_id: 1 },
  { id: 'cons4', nome: 'SANDRA', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456', unidade_id: 1 },
  { id: 'suplente1', nome: 'ROSILDA', perfil: 'SUPLENTE', cargo: 'Conselheira Suplente', senha: '123456', status: 'INATIVO', unidade_id: 1 },

  // UNIDADE 2 - CT 2
  { id: 'ct2_admin1', nome: 'ISRAEL', perfil: 'ADMINISTRATIVO', cargo: 'ADM', senha: '123456', unidade_id: 2 },
  { id: 'ct2_admin2', nome: 'RAISSA', perfil: 'ADMINISTRATIVO', cargo: 'ADM', senha: '123456', unidade_id: 2 },
  { id: 'ct2_admin3', nome: 'THAINA', perfil: 'ADMINISTRATIVO', cargo: 'ADM', senha: '123456', unidade_id: 2 },
  { id: 'ct2_cons1', nome: 'ALINE', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456', unidade_id: 2 },
  { id: 'ct2_cons2', nome: 'EDSON LOPES', perfil: 'CONSELHEIRO', cargo: 'Conselheiro', senha: '123456', unidade_id: 2 },
  { id: 'ct2_cons3', nome: 'FABIO', perfil: 'CONSELHEIRO', cargo: 'Conselheiro', senha: '123456', unidade_id: 2 },
  { id: 'ct2_cons4', nome: 'MARCIA', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456', unidade_id: 2 },
  { id: 'ct2_cons5', nome: 'MATHEUS', perfil: 'CONSELHEIRO', cargo: 'Conselheiro', senha: '123456', unidade_id: 2 },
];

export const CONSELHEIROS_ALFABETICO_POR_UNIDADE: Record<number, string[]> = {
  1: ['LEANDRO', 'LUIZA', 'MILENA', 'MIRIAN', 'SANDRA'],
  2: ['ALINE', 'EDSON LOPES', 'FABIO', 'MARCIA', 'MATHEUS']
};

export const CONSELHEIROS_ALFABETICO = ['LEANDRO', 'LUIZA', 'MILENA', 'MIRIAN', 'SANDRA'];

export const ORIGENS_HIERARQUICAS = [
  {
    label: 'ASSISTÊNCIA SOCIAL',
    options: [
      'CRAS JARDIM AMANDA', 'CRAS JARDIM BRASIL', 'CRAS CENTRAL', 'CRAS JARDIM NOVO ÂNGULO', 
      'CRAS JARDIM PRIMAVERA', 'CRAS ROSOLÉM', 'CRAS JARDIM SANTA CLARA', 'CRAS VILA REAL',
      'CRAS SANTA IZABEL', 'CREAS CENTRAL', 'DAS (DEPTO ASSISTÊNCIA SOCIAL)', 
      'INSTITUIÇÕES DE ACOLHIMENTO', 'CENTRO POP', 'NAD (NÚCLEO DE ATENDIMENTO À DIFERENÇAS)',
      'CASA DE PASSAGEM / ABRIGO', 'RESIDÊNCIA INCLUSIVA', 'REPÚBLICA PARA JOVENS'
    ].sort()
  },
  {
    label: 'EDUCAÇÃO (ESTADUAL)',
    options: [
      'E.E. AGALVIRA PINTO MONTEIRO', 'E.E. HONORINO FABBRI', 'E.E. GUIDO ROSOLEN', 
      'E.E. JARDIM ALINE', 'E.E. SANTA CLARA DO LAGO', 'E.E. JONATAS DAVI VISEL',
      'E.E. MANOEL IGNÁCIO', 'E.E. MARISTELA MELLIN', 'E.E. PASTOR ROBERTO',
      'E.E. PAULO CAMILO', 'E.E. PRISCILA FERNANDES', 'E.E. ANTONIO ZANLUCHI',
      'E.E. ELISEO MARSON', 'E.E. EUZEBIO ANTONIO', 'E.E. JOSÉ CLARET',
      'E.E. WICKLEIN MACEDO', 'E.E. CONCEIÇÃO CARDINALES', 'E.E. CRISTIANE BRAGA',
      'E.E. HEDY BOCCHI', 'E.E. LIOMAR FREITAS', 'E.E. MARIA ANTONIETTA',
      'E.E. MARIA CRISTINA LOBO', 'E.E. MARIA ROBERTA', 'E.E. MARIA RITA ARAUJO',
      'E.E. PAULINA ROSA', 'E.E. PRISCILA DE FÁTIMA', 'E.E. RAQUEL SAES',
      'E.E. RECREIO ALVORADA', 'E.E. YASUO SASAKI'
    ].sort()
  },
  {
    label: 'EDUCAÇÃO (MUNICIPAL)',
    options: [
      'EMEF AMANDA', 'EMEF JD. BRASIL', 'EMEI ALVORADA', 'EMEI PRIMAVERA', 'EMEI ROSOLÉM', 
      'EMEI SANTA IZABEL', 'EMEI ANGELITA INOCENTE NUNES BIDUTTI', 'EMEI CARLOS VILELA', 
      'EMEI JARDIM AMANDA II', 'EMEI JARDIM NOVO CAMBUÍ', 'EMEI JARDIM SANTIAGO', 
      'EMEI JOSÉ NATALINO FONSECA', 'EMEI LENI PEREIRA PRATA', 'EMEI MIGUEL CAMILLO', 
      'EMEI OLINDA MARIA DE JESUS SOUZA', 'EMEI PROFª IZABEL SOSTENA DE SOUZA', 
      'EMEI PROFª ROSIMAR BERTÃO GOMES', 'EMEI RESIDENCIAL SÃO SEBASTIÃO II', 
      'EMEI NOVA EUROPA (EDUCAÇÃO INFANTIL)', 'EMEI NOVA ALVORADA', 
      'EMEF ARMELINDA ESPÚRIO DA SILVA', 'EMEF CAIO FERNANDO GOMES PEREIRA',
      'EMEF DAYLA CRISTINA SOUZA DE AMORIM', 'EMEF FERNANDA GRAZIELLE RESENDE COVRE',
      'EMEF HELENA FUTAVA TAKAHASHI', 'EMEF JANILDE FLORES GABY DO VALE',
      'EMEF JARDIM AMANDA I – CAIC', 'EMEF JARDIM BOA ESPERANÇA – JOSÉ ROQUE DE MOURA',
      'EMEF JARDIM NOVA EUROPA', 'EMEF JOÃO CALIXTO DA SILVA', 'EMEF MARIA CÉLIA CABRAL DO AMARAL',
      'EMEF NICOLAS THIAGO DOS SANTOS LOFRANI', 'EMEF PATRÍCIA MARIA CAPELLATO BASSO',
      'EMEF PROF. CLÁUDIO ROBERTO MARQUES', 'EMEF PROFª MARLECIENE PRISCILA PRESTA BONFIM',
      'EMEF PROFª SÔNIA M. DENADAI DE OLIVEIRA', 'EMEF RENATO COSTA LIMA',
      'EMEF SAMUEL DA SILVA MENDONÇA', 'EMEF TARSILA DO AMARAL', 'EMEF VILLAGIO GHIRALDELLI',
      'EMEF ZACHARIAS PEREIRA JÚNIOR', 'EMEIEF BAIRRO TRÊS CASAS', 'EMEIEF BAIRRO TAQUARA BRANCA',
      'EMEIEF JARDIM AMANDA III', 'EMEIEF JARDIM NOSSA SENHORA AUXILIADORA',
      'EMEIEF JARDIM SANTA AMÉLIA – HUMBERTO DE AMORIM LOPES', 'EMEIEF JARDIM SANTA CLARA DO LAGO I',
      'EMEIEF JARDIM SANTA ESMERALDA', 'EMEIEF JARDIM SÃO PEDRO', 'EMEIEF JOÃO CARLOS DO AMARAL SOARES',
      'EMEIEF JOSÉ TENÓRIO DA SILVA', 'EMEIEF LUIZA VITÓRIA DE OLIVEIRA CRUZ',
      'EMEIEF PROFª ZENAIDE F. DE LIRA SEORLIN', 'EMEIEF SEBASTIANA DAS DORES MOURA',
      'CIER ROMILDO PARDINI (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO)',
      'SECRETARIA DE EDUCAÇÃO', 'SETOR DE VAGAS'
    ].sort()
  },
  {
    label: 'FAMÍLIA',
    options: ['AVÓ', 'AVÔ', 'IRMÃO(A)', 'MADRASTA', 'MÃE', 'PADRASTO', 'PAI', 'TIA', 'TIO'].sort()
  },
  {
    label: 'SAÚDE',
    options: [
      'CAPS ADULTO', 'CAPS INFANTIL', 'HOSPITAL MUNICIPAL (MÁRIO COVAS)', 'SAMU', 
      'UPA ROSOLÉM', 'UPA NOVA HORTOLÂNDIA', 'UPA AMANDA',
      'UBS ADELAIDE', 'UBS AMANDA I', 'UBS AMANDA II', 'UBS BRASIL', 'UBS CENTRAL',
      'UBS CAMPOS VERDES', 'UBS FIGUEIRAS', 'UBS SÃO BENTO', 'UBS SÃO JORGE',
      'UBS NOVA EUROPA', 'UBS DOM BRUNO GAMBERINI (NOVA HORTOLÂNDIA)', 
      'UBS NOVO ÂNGULO', 'UBS PARQUE DO HORTO', 'UBS ROSOLÉM', 'UBS SANTA CLARA',
      'UBS SANTIAGO', 'UBS SANTA ESMERALDA', 'UBS TAQUARA BRANCA', 
      'UBS PARQUE ORESTES ONGARO',
      'CAPS – CENTRO DE ATENÇÃO PSICOSSOCIAL', 'CAPS AD – ÁLCOOL E DROGAS',
      'CENTRO DE ESPECIALIDADES MÉDICAS', 'CENTRO DE REABILITAÇÃO',
      'CENTRO DE ESPECIALIDADES ODONTOLÓGICAS (CEO)', 'POLICLÍNICA',
      'FARMÁCIA MUNICIPAL', 'FARMÁCIA DE ALTO CUSTO', 'VIGILÂNCIA SANITÁRIA',
      'VIGILÂNCIA EPIDEMIOLÓGICA', 'VIGILÂNCIA AMBIENTAL', 'CONTROLE DE ZOONOSES',
      'SECRETARIA MUNICIPAL DE SAÚDE DE HORTOLÂNDIA',
      'CENTRAL DE REGULAÇÃO DE CONSULTAS E EXAMES', 'OUTROS'
    ].sort()
  },
  {
    label: 'SEGURANÇA',
    options: ['CONSELHO COMUNITÁRIO', 'GUARDA MUNICIPAL', 'POLÍCIA CIVIL', 'POLÍCIA MILITAR', 'PATRULHA MARIA DA PENHA', 'DEFESA CIVIL', 'CORPO DE BOMBEIROS', 'DDM', 'CRAM'].sort()
  },
  {
    label: 'OUTROS',
    options: ['DENÚNCIA ESPONTÂNEA', 'DENÚNCIA TELEFÔNICA', 'JUDICIÁRIO', 'DISQUE 100', 'SIPIA', 'E-MAIL'].sort()
  }
];

export const CANAIS_COMUNICADO_LIST = [
  'ATENDIMENTO PRESENCIAL', 'ATENDIMENTO TELEFÔNICO', 
  'E-MAIL INSTITUCIONAL', 'RELATÓRIO', 'OFÍCIO', 'OFÍCIO MP', 'OFÍCIO JUDICIÁRIO', 'DISQUE 100', 'SIPIA'
].sort();

export const classifyTurno = (dateStr: string, timeStr: string): 'COMERCIAL' | 'PLANTAO' => {
  if (!dateStr || !timeStr) return 'COMERCIAL';
  const [hours] = timeStr.split(':').map(Number);
  const dt = new Date(`${dateStr}T12:00:00`);
  const day = dt.getDay();
  const isWeekend = day === 0 || day === 6;
  const isBusinessHours = hours >= 8 && hours < 17;
  return (isWeekend || !isBusinessHours) ? 'PLANTAO' : 'COMERCIAL';
};

export const getEffectiveEscala = (dateStr: string, timeStr: string = "08:00", unidade_id: number = 1): string[] => {
  const [hours] = timeStr.split(':').map(Number);
  let dt = new Date(`${dateStr}T12:00:00`);
  if (hours < 8) dt.setDate(dt.getDate() - 1);
  
  // Lógica de Escala para 2026 baseada no padrão de rodízio semanal/diário
  if (dt.getFullYear() === 2026) {
    const refDate = new Date('2026-03-02T12:00:00');
    const diffTime = dt.getTime() - refDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const weeks = Math.floor(diffDays / 7);
    const dayOfWeek = (dt.getDay() + 6) % 7; // 0=Seg, ..., 6=Dom
    
    if (unidade_id === 2) {
      const sequenceU2 = ['EDSON LOPES', 'FABIO', 'MATHEUS', 'MARCIA', 'ALINE'];
      const dayOfWeekRaw = (dt.getDay() + 6) % 7;
      const dayOfWeek = Math.min(dayOfWeekRaw, 4);
      
      const p = ((weeks + dayOfWeek) % 5 + 5) % 5;
      const b2 = ((weeks - 1) % 5 + 5) % 5;
      const offsets2 = [0, -1, 1, 2, 3];
      const s2 = (b2 + offsets2[dayOfWeek] + 5) % 5;
      
      const b3 = ((weeks + 2) % 5 + 5) % 5;
      const offsets3 = [0, 2, 1, 3, 4];
      const s3 = (b3 + offsets3[dayOfWeek] + 5) % 5;
      
      return [sequenceU2[p], sequenceU2[s2], sequenceU2[s3]];
    }
    
    if (unidade_id === 1) {
      const sequenceU1 = ['LUIZA', 'MIRIAN', 'LEANDRO', 'SANDRA', 'MILENA'];
      
      const refDate = new Date('2026-03-02T12:00:00');
      const diffTime = dt.getTime() - refDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const weeks = Math.floor(diffDays / 7);
      const dayOfWeekRaw = (dt.getDay() + 6) % 7; // 0=Seg, ..., 6=Dom
      const dayOfWeek = Math.min(dayOfWeekRaw, 4); // Regra de Sexta (repetir no FDS)
      
      // Plantonista (1º)
      const p = ((weeks + dayOfWeek) % 5 + 5) % 5;
      
      // 2º Conselheiro
      const b2 = ((weeks - 1) % 5 + 5) % 5;
      const offsets2 = [0, -1, 1, 2, 3];
      const s2 = (b2 + offsets2[dayOfWeek] + 5) % 5;
      
      // 3º Conselheiro
      const b3 = ((weeks + 2) % 5 + 5) % 5;
      const offsets3 = [0, 2, 1, 3, 4];
      const s3 = (b3 + offsets3[dayOfWeek] + 5) % 5;
      
      return [
        sequenceU1[p],
        sequenceU1[s2],
        sequenceU1[s3]
      ];
    }
  }

  const day = dt.getDate();
  const sequence = CONSELHEIROS_ALFABETICO_POR_UNIDADE[unidade_id] || CONSELHEIROS_ALFABETICO_POR_UNIDADE[1];
  const index = (day - 1) % 5;
  return [sequence[index], sequence[(index + 1) % 5], sequence[(index + 2) % 5]];
};

export const BAIRROS = [
  "CHÁCARA PLANALTO", "CHÁCARA RECREIO ALVORADA", "CHÁCARA REYMAR", "CHÁCARAS ACARAÍ", 
  "CHÁCARAS ASSAY", "CHÁCARAS DE RECREIO 2000", "CHÁCARAS FAZENDA COELHO", "CHÁCARAS HAVAÍ", 
  "CHÁCARAS LUZITANA", "CHÁCARAS NOVA BOA VISTA", "CHÁCARAS PANAINO", "CONDOMÍNIO CHÁCARA GROTA AZUL", 
  "CONJUNTO HABITACIONAL JARDIM PRIMAVERA", "JARDIM ADELAIDE", "JARDIM ALINE", "JARDIM AMANDA I", 
  "JARDIM AMANDA II", "JARDIM BOA ESPERANÇA", "JARDIM BOA VISTA", "JARDIM BRASIL", 
  "JARDIM CAMPOS VERDES", "JARDIM CARMEN CRISTINA", "JARDIM CONCEIÇÃO", "JARDIM DAS COLINAS", 
  "JARDIM DAS FIGUEIRAS I", "JARDIM DAS FIGUEIRAS II", "JARDIM DAS LARANJEIRAS", "JARDIM DAS PAINEIRAS", 
  "JARDIM DO BOSQUE", "JARDIM DO BRÁS", "JARDIM DO LAGO", "JARDIM ESTEFÂNIA", "JARDIM ESTRELA", 
  "JARDIM EVEREST", "JARDIM FLAMBOYANT", "JARDIM GIRASSOL", "JARDIM GOLDEN PARK RESIDENCE", 
  "JARDIM GREEN PARK RESIDENCE", "JARDIM INTERLAGOS", "JARDIM IPÊ", "JARDIM LÍRIO", "JARDIM MALTA", 
  "JARDIM MINDA", "JARDIM MIRANTE DE SUMARÉ", "JARDIM NOSSA SENHORA AUXILIADORA", 
  "JARDIM NOSSA SENHORA DA PENHA", "JARDIM NOSSA SENHORA DE FÁTIMA", "JARDIM NOSSA SENHORA DE LOURDES", 
  "JARDIM NOVA ALVORADA", "JARDIM NOVA AMÉRICA", "JARDIM NOVA BOA VISTA", "JARDIM NOVA EUROPA", 
  "JARDIM NOVA HORTOLÂNDIA I", "JARDIM NOVA HORTOLÂNDIA II", "JARDIM NOVO ÂNGULO", "JARDIM NOVO CAMBUÍ", 
  "JARDIM NOVO ESTRELA", "JARDIM NOVO HORIZONTE", "JARDIM PAULISTINHA", "JARDIM RESIDENCIAL FIRENZE", 
  "JARDIM RICARDO", "JARDIM ROSOLÉM", "JARDIM SANTA AMÉLIA", "JARDIM SANTA CÂNDIDA", 
  "JARDIM SANTA CLARA DO LAGO I", "JARDIM SANTA CLARA DO LAGO II", "JARDIM SANTA EMÍLIA", 
  "JARDIM SANTA ESMERALDA", "JARDIM SANTA FÉ", "JARDIM SANTA IZABEL", "JARDIM SANTA LUZIA", 
  "JARDIM SANTA RITA DE CÁSSIA", "JARDIM SANTANA", "JARDIM SANTIAGO", "JARDIM SANTO ANDRÉ", 
  "JARDIM SANTO ANTÔNIO", "JARDIM SÃO BENEDITO", "JARDIM SÃO BENTO", "JARDIM SÃO CAMILO", 
  "JARDIM SÃO JORGE", "JARDIM SÃO PEDRO", "JARDIM SÃO SEBASTIÃO", "JARDIM STELLA", 
  "JARDIM SUMAREZINHO", "JARDIM TERRAS DE SANTO ANTÔNIO", "JARDIM VIAGEM", "JARDIM VILLAGIO GHIRALDELLI", 
  "LOTEAMENTO ADVENTISTA CAMPINEIRO", "LOTEAMENTO RECANTO DO SOL", "LOTEAMENTO REMANSO CAMPINEIRO", 
  "NÚCLEO SANTA ISABEL", "PARAÍSO NOVO ÂNGULO", "PARQUE DO HORTO", "PARQUE DOS PINHEIROS", 
  "PARQUE GABRIEL", "PARQUE HORIZONTE", "PARQUE ODIMAR", "PARQUE ORESTES ÔNGARO", 
  "PARQUE ORTOLÂNDIA", "PARQUE PERÓN", "PARQUE RESIDENCIAL JOÃO LUIZ", 
  "PARQUE RESIDENCIAL MARIA DE LOURDES", "PARQUE SÃO MIGUEL", "PARQUE TERRAS DE SANTA MARIA", 
  "RESIDENCIAL ANAUÁ", "RESIDENCIAL JARDIM DE MÔNACO", "RESIDENCIAL JARDIM DO JATOBÁ", 
  "SÍTIO PANORAMA", "VILA AMÉRICA", "VILA CONQUISTA", "VILA GUEDES", "VILA INEMA", "VILA REAL", 
  "VILA REAL CONTINUAÇÃO", "VILA REAL SANTISTA", "VILA SÃO FRANCISCO", "VILA SÃO PEDRO", "VILLA FLORA"
].sort();

export const BAIRROS_UNIDADE_1 = [
  "CHÁCARA PARQUE ORTOLÂNDIA",
  "CHÁCARA RECREIO ALVORADA",
  "COLÉGIO ADVENTISTA CAMPINEIRO",
  "GOLDEN PARK",
  "JARDIM BOA ESPERANÇA",
  "JARDIM CAMPOS VERDES",
  "JARDIM CARMEN CRISTINA",
  "JARDIM DAS COLINAS",
  "JARDIM DAS FIGUEIRAS I",
  "JARDIM DAS FIGUEIRAS II",
  "JARDIM DAS LARANJEIRAS",
  "JARDIM DAS PAINEIRAS",
  "JARDIM DO BOSQUE",
  "JARDIM ESTEFÂNIA",
  "JARDIM ESTRELA",
  "JARDIM EVEREST",
  "JARDIM FLAMBOYANT",
  "JARDIM GREEN PARK",
  "JARDIM INTERLAGOS",
  "JARDIM MINDA",
  "JARDIM MIRANTE DE SUMARÉ",
  "JARDIM NOSSA SENHORA AUXILIADORA",
  "JARDIM NOVA ALVORADA",
  "JARDIM NOVA HORTOLÂNDIA",
  "JARDIM NOVO CAMBUÍ",
  "JARDIM PRIMAVERA",
  "JARDIM SANTA CLARA DO LAGO",
  "JARDIM SANTA CLARA DO LAGO CONTINUAÇÃO",
  "JARDIM SANTA FÉ",
  "JARDIM SANTA LUZIA",
  "JARDIM SANTA RITA DE CÁSSIA",
  "JARDIM SANTANA",
  "JARDIM SÃO BENTO",
  "JARDIM SÃO PEDRO",
  "JARDIM SÃO CAMILO",
  "JARDIM SÃO JORGE",
  "JARDIM SÃO SEBASTIÃO",
  "LOTEAMENTO RECANTO DO SOL",
  "PARQUE DO HORTO",
  "PARQUE DOS PINHEIROS",
  "PARQUE GABRIEL",
  "PARQUE HORIZONTE",
  "PARQUE ODIMAR",
  "PARQUE ORESTES ONGARO",
  "PARQUE ORTOLÂNDIA",
  "PARQUE RESIDENCIAL MARIA DE LOURDES",
  "PARQUE SANTO ANDRÉ",
  "PARQUE SÃO MIGUEL",
  "REMANSO CAMPINEIRO",
  "RESIDENCIAL FIRENZE",
  "RESIDENCIAL JOÃO LUIZ",
  "RESIDENCIAL VILLAGIO GHIRALDELLI",
  "VILA FLORA",
  "VILA REAL",
  "VILA REAL CONTINUAÇÃO",
  "VILA REAL SANTISTA",
  "VILA SÃO FRANCISCO",
  "VILA SÃO PEDRO"
].sort();

export const getBairrosByUnidade = (unidadeId: number): string[] => {
  if (unidadeId === 1) return BAIRROS_UNIDADE_1;
  if (unidadeId === 2) return BAIRROS_UNIDADE_2;
  return BAIRROS;
};

export const BAIRROS_UNIDADE_2 = [
  "CHÁCARA ACARAI",
  "CHÁCARA ASSAY",
  "CHÁCARA HAVAI",
  "CHÁCARA LUZITANA",
  "CHÁCARA PANAÍNO",
  "CHÁCARA PLANALTO",
  "CHÁCARA RECREIO 2000",
  "CHÁCARA REYMAR",
  "CHÁCARAS FAZENDA COELHO",
  "CHÁCARAS NOVA BOA VISTA",
  "CHÁCARAS RECREIO NOVO ÂNGULO",
  "GROTA AZUL",
  "JARDIM ADELAIDE",
  "JARDIM ALINE",
  "JARDIM AMANDA I E II",
  "JARDIM BOA VISTA",
  "JARDIM CONCEIÇÃO",
  "JARDIM DO BRAZ",
  "JARDIM DO LAGO",
  "JARDIM GIRASSOL",
  "JARDIM LÍRIO",
  "JARDIM MALTA",
  "JARDIM NOSSA SENHORA DA PENHA",
  "JARDIM NOSSA SENHORA DE FATIMA",
  "JARDIM NOSSA SENHORA DE LOURDES",
  "JARDIM NOVA AMÉRICA",
  "JARDIM NOVA EUROPA",
  "JARDIM NOVO ÂNGULO",
  "JARDIM NOVO HORIZONTE",
  "JARDIM PAULISTINHA",
  "JARDIM RICARDO",
  "JARDIM ROSOLEN",
  "JARDIM SANTA CÂNDIDA",
  "JARDIM SANTA EMÍLIA",
  "JARDIM SANTA ESMERALDA",
  "JARDIM SANTA IZABEL",
  "JARDIM SANTIAGO",
  "JARDIM SUMAREZINHO",
  "JARDIM SANTO ANTÔNIO",
  "JARDIM SÃO BENEDITO",
  "JARDIM STELLA",
  "JARDIM TERRAS DE SANTO ANTÔNIO",
  "JARDIM VIAGEM",
  "NÚCLEO SANTA IZABEL",
  "PARQUE PERON",
  "RESIDENCIAL DI MÔNACO",
  "VILA AMÉRICA",
  "VILA CONQUISTA",
  "VILA GUEDES",
  "VILA INEMA",
  "VILA YPE"
].sort();

export const STATUS_LABELS: Record<string, string> = {
  'NAO_LIDO': 'Não Lido',
  'AGUARDANDO_ANALISE': 'Aguardando Análise',
  'AGUARDANDO_VALIDACAO': 'Aguardando Validação do Colegiado',
  'CONCLUIDO': 'Concluído',
  'OFICIALIZADO': 'Medida Aplicada',
  'ARQUIVADO': 'Arquivado',
  'EM_PREENCHIMENTO': 'Em Preenchimento (Rascunho)',
  'MONITORAMENTO': 'Em Monitoramento',
  'MEDIDA_APLICADA': 'Medida Aplicada',
  'TIPIFICACAO_INCOMPLETA': 'Tipificação Incompleta',
  'AGENDAR_REUNIAO_REDE': 'Agendar Reunião de Rede',
  'AGUARDAR_RESPOSTA_EMAIL': 'Aguardar Resposta de E-mail',
  'EMAIL_RESPONDIDO': 'E-mail Respondido',
  'ENCAMINHAR_NOTICIA_FATO': 'Encaminhar Notícia de Fato',
  'NOTIFICAR': 'Notificar',
  'OFICIO_RESPONDIDO': 'Ofício Respondido',
  'RESPONDER_EMAIL': 'Responder E-mail',
  'SOLICITAR_REUNIAO_REDE': 'Solicitar Reunião de Rede',
  'NOTIFICACAO_LEANDRO': 'NOTIFICAÇÃO LEANDRO',
  'NOTIFICACAO_LUIZA': 'NOTIFICAÇÃO LUIZA',
  'NOTIFICACAO_MILENA': 'NOTIFICAÇÃO MILENA',
  'NOTIFICACAO_MIRIAN': 'NOTIFICAÇÃO MIRIAN',
  'NOTIFICACAO_SANDRA': 'NOTIFICAÇÃO SANDRA',
  'NOTIFICACAO_ROSILDA': 'NOTIFICAÇÃO ROSILDA',
  'DIREITO_NAO_VIOLADO': 'DIREITO NÃO VIOLADO',
  'NENHUMA': '',
  'AGUARDANDO_AVALIACAO': 'AGUARDANDO AVALIAÇÃO'
};

export const UNIFIED_GENDER_OPTIONS = [
  "Masculino (Cisgênero)", 
  "Feminino (Cisgênero)", 
  "Mulher Trans / Homem Trans", 
  "Não-binário / Gênero Fluido", 
  "Outro / Prefere não informar"
];

export const SIPIA_HIERARCHY: Record<string, Record<string, string[]>> = {
  "I. CONVIVÊNCIA FAMILIAR E COMUNITÁRIA": {
    "Privação ou dificuldade de convívio": [
      "Omissão dever familiar", "Pensão alimentícia", "Impedimento contato pais/familiares", 
      "Falta pais/parentes", "Subtração por familiares", "Falta/precariedade moradia", 
      "Tráfico", "Fuga", "Abandono"
    ],
    "Inadequação do convívio familiar": [
      "Falta de afeto/zelo/proteção", "Dificuldade estágio adoção", "Ambiente familiar violento", 
      "Favorecimento uso drogas", "Ambiente prejudicial desenvolvimento", "Alienação parental"
    ],
    "Violações à dignidade / negligência": [
      "Falta apoio emocional/psicológico", "Omissão educação escolar", "Omissão saúde/alimentação/higiene", 
      "Omissão proteção/segurança"
    ],
    "Ausência de programas (Estado)": [
      "Inexistência orientação sócio-familiar", "Falta vaga acolhimento", "Inexistência transferência renda", 
      "Falta acolhimento adultos c/ crianças", "Falta vaga abrigo"
    ],
    "Atos atentatórios": [
      "Desrespeito opinião criança (guarda/adoção)", "Negação filiação", "Indefinição paternidade", 
      "Impedimento contato pais presos", "Impedimento acesso família/comunidade"
    ]
  },
  "II. VIDA E SAÚDE": {
    "Não atendimento em saúde": [
      "Falta leitos", "Recusa aborto legal", "Falta atendimento especializado", "Não atendimento gestante", 
      "Não atendimento usuário drogas", "Falta vacinação", "Não atendimento emergencial"
    ],
    "Atendimento inadequado": [
      "Falta orientação diagnóstica/tratamento", "Cirurgia desnecessária", "Falta precedência", 
      "Extrações dentárias desnecessárias", "Danos procedimentos", "Negligência profissional"
    ],
    "Práticas irregulares": [
      "Falta prontuário", "Exigência presença pais para atender", "Falta alojamento conjunto nascimento", 
      "Falta notificação suspeita violência", "Proibição permanência acompanhante", "Não identificação recém-nascido", 
      "Retirada compulsória bebê"
    ],
    "Ausência de ações específicas": [
      "Falta prevenção drogas", "Falta tratamento agressor sexual", "Ausência info epidemias", 
      "Ausência saneamento ambiental/básico"
    ],
    "Prejuízo por ação/omissão": [
      "Falta notificação doença infecto-contagiosa", "Recusa atendimento (filosófico/religioso)", 
      "Omissão socorro", "Condições precárias abrigo/socioeducativo"
    ],
    "Atos atentatórios": [
      "Ameaça morte", "Uso droga como violência", "Tentativa homicídio", "Tentativa suicídio", 
      "Automutilação", "Extração ilícita órgãos"
    ]
  },
  "III. EDUCAÇÃO, CULTURA, ESPORTE E LAZER": {
    "Educação Infantil": ["Falta vaga pré-escola/creche", "Falta equipe especializada (0-3 e 3-6 anos)", "Distância casa/creche"],
    "Ensino Fundamental/Médio": ["Falta educação bilíngue", "Falta vaga ensino regular/noturno", "Inexistência escola completa"],
    "Impedimento permanência": [
      "Constrangimento", "Critérios discriminatórios", "Expulsão indevida", "Punições abusivas", 
      "Transferência compulsória", "Evasão/Infrequência (por violação)"
    ],
    "Falta condições educacionais": [
      "Ausência merenda", "Faltas professores", "Falta info frequência aos pais", "Falta material", 
      "Falta segurança", "Falta atendimento especializado (PCD/Altas habilidades)"
    ],
    "Cultura/Esporte/Lazer": ["Falta manutenção equipamentos", "Inexistência de espaços", "Falta programas públicos", "Impedimento de acesso"]
  },
  "IV. PROFISSIONALIZAÇÃO E PROTEÇÃO NO TRABALHO": {
    "Condições irregulares": [
      "Trabalho 14/15 anos", "Trabalho doméstico", "Escravidão", "Trabalho infantil", 
      "Desrespeito direitos trabalhistas", "Jornada ilegal", "Trabalho noturno", "Incompatibilidade escolar"
    ],
    "Remuneração/Relação laboral": ["Apropriação resultado trabalho", "Coação física/psicológica", "Trabalho sem remuneração", "Remuneração inadequada"],
    "Capacitação": ["Ausência encaminhamento programas", "Não acesso formação técnica (incluindo PCD e medidas proteção)"]
  },
  "V. LIBERDADE, RESPEITO E DIGNIDADE": {
    "Restrições ir e vir": ["Apreensão/Detenção/Confinamento ilegal", "Exílio forçado", "Sequestro", "Recolhimento compulsório", "Impedimento acesso logradouro"],
    "Discriminação": [
      "Histórico ato infracional", "Raça/etnia", "Gênero", "Características pessoais", "Política/Ideologia", 
      "Intolerância religiosa", "Orientação sexual/Identidade gênero", "Situação acolhimento/socioeducativo"
    ],
    "Negação Cidadania": [
      "Cerceamento crença", "Violação intimidade", "Exposição imagem", "Omissão registro queixa", 
      "Falta Registro Civil", "Omissão autoridade perante ameaça", "Violência patrimonial"
    ],
    "Violência Psicológica": ["Tortura", "Tratamento cruel", "Humilhação", "Agressão verbal", "Cyberbullying"],
    "Violência Física": ["Supressão alimentação", "Tortura", "Castigo corporal", "Espancamento", "Maus tratos", "Violência letal"],
    "Violência Sexual": ["Estupro", "Exibicionismo", "Assédio", "Abuso (círculo social ou custódia)", "Aliciamento", "Satisfação lascívia"],
    "Exploração Sexual": ["Prostituição", "Pornografia infantil", "Registro/Armazenamento/Divulgação cena sexo"],
    "Atos Ilícitos": ["Corrupção de menores", "Aliciamento tráfico/porte drogas", "Envolvimento grupos armados"]
  }
};

export const AGENTES_VIOLADORES_ESTRUTURA = {
  "FAMÍLIA": { options: ["Pai", "Mãe", "Padrasto", "Madrasta", "Tios", "Irmãos", "Outros Familiares"] },
  "ESTADO": { options: ["Educação", "Saúde", "Assistência Social", "Segurança Pública", "Judiciário", "Outros Órgãos"] },
  "SOCIEDADE": { options: ["Vizinhos", "Terceiros", "Grupos Armados", "Mídia/Internet", "Outros"] },
  "PRÓPRIA CONDCTA": { options: ["Uso de Drogas", "Automutilação", "Fuga", "Ato Infracional", "Outros"] }
};

export const MEDIDAS_101_ECA = [
  { id: 'I', label: 'I - Encaminhamento: aos pais ou responsável, mediante termo de responsabilidade.' },
  { id: 'II', label: 'II - Orientação: apoio e acompanhamento temporários.' },
  { id: 'III', label: 'III - Educação: matrícula e frequência obrigatórias em estabelecimento oficial de ensino fundamental.' },
  { id: 'IV', label: 'IV - Programas: inclusão em serviços e programas oficiais ou comunitários de proteção, apoio e promoção da família, da criança e do adolescente (Lei 13.257/2016).' },
  { id: 'V', label: 'V - Saúde: requisição de tratamento médico, psicológico ou psiquiátrico, em regime hospitalar ou ambulatorial, extensivo às famílias (Lei 15.280/2025).' },
  { id: 'VI', label: 'VI - Tratamento Específico: inclusão em programa oficial ou comunitário de auxílio, orientação e tratamento a alcoólatras e toxicômanos.' },
  { id: 'VII', label: 'VII - Acolhimento: acolhimento institucional (Lei 12.010/2009).' }
];

export const MEDIDAS_129_ECA = [
  { id: 'I', label: 'I - Apoio à Família: encaminhamento a serviços e programas oficiais ou comunitários de proteção, apoio e promoção da família (Lei 13.257/2016).' },
  { id: 'II', label: 'II - Tratamento de Adicções: inclusão em programa oficial ou comunitário de auxílio, orientação e tratamento a alcoólatras e toxicômanos.' },
  { id: 'III', label: 'III - Saúde Mental: encaminhamento a tratamento psicológico ou psiquiátrico.' },
  { id: 'IV', label: 'IV - Cursos de Orientação: encaminhamento a cursos ou programas de orientação.' },
  { id: 'V', label: 'V - Obrigação Escolar: obrigação de matricular o filho ou pupilo e acompanhar sua frequência e aproveitamento escolar.' },
  { id: 'VI', label: 'VI - Tratamento Especializado: obrigação de encaminhar a criança ou adolescente a tratamento especializado.' },
  { id: 'VII', label: 'VII - Advertência: advertência formal (registrada em termo).' }
];

export const ATRIBUICOES_136_ECA = [
  { id: 'I', label: 'I - Atender Crianças/Adolescentes: (Arts. 98 e 105).' },
  { id: 'II', label: 'II - Atender/Aconselhar Pais: (Art. 129).' },
  { id: 'III-a', label: 'III-a) Requisitar serviços de saúde, educação, assistência social (Lei 15.268/2025), previdência, trabalho e segurança;' },
  { id: 'III-b', label: 'III-b) Representar por descumprimento.' },
  { id: 'IV', label: 'IV - Encaminhar notícia de fato ao MP.' },
  { id: 'V', label: 'V - Encaminhar casos à autoridade judiciária.' },
  { id: 'VII', label: 'VII - Expedir notificações oficiais.' },
  { id: 'VIII', label: 'VIII - Requisitar certidões de nascimento/óbito.' },
  { id: 'XI', label: 'XI - Representar ao MP para perda/suspensão do poder familiar.' },
  { id: 'XIII-XX', label: 'XIII a XX - Lei Henry Borel (14.344/22): Ações contra violência doméstica.' }
];

export const REDE_HORTOLANDIA = {
  "ASSISTÊNCIA SOCIAL": [
    'CRAS JARDIM AMANDA', 'CRAS JARDIM BRASIL', 'CRAS CENTRAL', 'CRAS JARDIM NOVO ÂNGULO', 
    'CRAS JARDIM PRIMAVERA', 'CRAS ROSOLÉM', 'CRAS JARDIM SANTA CLARA', 'CRAS VILA REAL',
    'CRAS SANTA IZABEL', 'CREAS CENTRAL', 'DAS (DEPTO ASSISTÊNCIA SOCIAL)', 
    'INSTITUIÇÕES DE ACOLHIMENTO', 'CENTRO POP', 'NAD (NÚCLEO DE ATENDIMENTO À DIFERENÇAS)',
    'CASA DE PASSAGEM / ABRIGO', 'RESIDÊNCIA INCLUSIVA', 'REPÚBLICA PARA JOVENS'
  ].sort(),
  "SAÚDE": [
    'CAPS ADULTO', 'CAPS INFANTIL', 'HOSPITAL MUNICIPAL (MÁRIO COVAS)', 'SAMU', 
    'UPA ROSOLÉM', 'UPA NOVA HORTOLÂNDIA', 'UPA AMANDA',
    'UBS ADELAIDE', 'UBS AMANDA I', 'UBS AMANDA II', 'UBS BRASIL', 'UBS CENTRAL',
    'UBS CAMPOS VERDES', 'UBS FIGUEIRAS', 'UBS SÃO BENTO', 'UBS SÃO JORGE',
    'UBS NOVA EUROPA', 'UBS DOM BRUNO GAMBERINI (NOVA HORTOLÂNDIA)', 
    'UBS NOVO ÂNGULO', 'UBS PARQUE DO HORTO', 'UBS ROSOLÉM', 'UBS SANTA CLARA',
    'UBS SANTIAGO', 'UBS SANTA ESMERALDA', 'UBS TAQUARA BRANCA', 
    'UBS PARQUE ORESTES ONGARO',
    'CAPS – CENTRO DE ATENÇÃO PSICOSSOCIAL', 'CAPS AD – ÁLCOOL E DROGAS',
    'CENTRO DE ESPECIALIDADES MÉDICAS', 'CENTRO DE REABILITAÇÃO',
    'CENTRO DE ESPECIALIDADES ODONTOLÓGICAS (CEO)', 'POLICLÍNICA',
    'FARMÁCIA MUNICIPAL', 'FARMÁCIA DE ALTO CUSTO', 'VIGILÂNCIA SANITÁRIA',
    'VIGILÂNCIA EPIDEMIOLÓGICA', 'VIGILÂNCIA AMBIENTAL', 'CONTROLE DE ZOONOSES',
    'SECRETARIA MUNICIPAL DE SAÚDE DE HORTOLÂNDIA',
    'CENTRAL DE REGULAÇÃO DE CONSULTAS E EXAMES', 'OUTROS'
  ].sort(),
  "EDUCAÇÃO": [
    'E.E. AGALVIRA PINTO MONTEIRO', 'E.E. HONORINO FABBRI', 'E.E. GUIDO ROSOLEN', 
    'E.E. JARDIM ALINE', 'E.E. SANTA CLARA DO LAGO', 'E.E. JONATAS DAVI VISEL',
    'E.E. MANOEL IGNÁCIO', 'E.E. MARISTELA MELLIN', 'E.E. PASTOR ROBERTO',
    'E.E. PAULO CAMILO', 'E.E. PRISCILA FERNANDES', 'E.E. ANTONIO ZANLUCHI',
    'E.E. ELISEO MARSON', 'E.E. EUZEBIO ANTONIO', 'E.E. JOSÉ CLARET',
    'E.E. WICKLEIN MACEDO', 'E.E. CONCEIÇÃO CARDINALES', 'E.E. CRISTIANE BRAGA',
    'E.E. HEDY BOCCHI', 'E.E. LIOMAR FREITAS', 'E.E. MARIA ANTONIETTA',
    'E.E. MARIA CRISTINA LOBO', 'E.E. MARIA ROBERTA', 'E.E. MARIA RITA ARAUJO',
    'E.E. PAULINA ROSA', 'E.E. PRISCILA DE FÁTIMA', 'E.E. RAQUEL SAES',
    'E.E. RECREIO ALVORADA', 'E.E. YASUO SASAKI',
    'EMEF AMANDA', 'EMEF JD. BRASIL', 'EMEI ALVORADA', 'EMEI PRIMAVERA', 'EMEI ROSOLÉM', 
    'EMEI SANTA IZABEL', 'EMEI ANGELITA INOCENTE NUNES BIDUTTI', 'EMEI CARLOS VILELA', 
    'EMEI JARDIM AMANDA II', 'EMEI JARDIM NOVO CAMBUÍ', 'EMEI JARDIM SANTIAGO', 
    'EMEI JOSÉ NATALINO FONSECA', 'EMEI LENI PEREIRA PRATA', 'EMEI MIGUEL CAMILLO', 
    'EMEI OLINDA MARIA DE JESUS SOUZA', 'EMEI PROFª IZABEL SOSTENA DE SOUZA', 
    'EMEI PROFª ROSIMAR BERTÃO GOMES', 'EMEI RESIDENCIAL SÃO SEBASTIÃO II', 
    'EMEI NOVA EUROPA (EDUCAÇÃO INFANTIL)', 'EMEI NOVA ALVORADA', 
    'EMEF ARMELINDA ESPÚRIO DA SILVA', 'EMEF CAIO FERNANDO GOMES PEREIRA',
    'EMEF DAYLA CRISTINA SOUZA DE AMORIM', 'EMEF FERNANDA GRAZIELLE RESENDE COVRE',
    'EMEF HELENA FUTAVA TAKAHASHI', 'EMEF JANILDE FLORES GABY DO VALE',
    'EMEF JARDIM AMANDA I – CAIC', 'EMEF JARDIM BOA ESPERANÇA – JOSÉ ROQUE DE MOURA',
    'EMEF JARDIM NOVA EUROPA', 'EMEF JOÃO CALIXTO DA SILVA', 'EMEF MARIA CÉLIA CABRAL DO AMARAL',
    'EMEF NICOLAS THIAGO DOS SANTOS LOFRANI', 'EMEF PATRÍCIA MARIA CAPELLATO BASSO',
    'EMEF PROF. CLÁUDIO ROBERTO MARQUES', 'EMEF PROFª MARLECIENE PRISCILA PRESTA BONFIM',
    'EMEF PROFª SÔNIA M. DENADAI DE OLIVEIRA', 'EMEF RENATO COSTA LIMA',
    'EMEF SAMUEL DA SILVA MENDONÇA', 'EMEF TARSILA DO AMARAL', 'EMEF VILLAGIO GHIRALDELLI',
    'EMEF ZACHARIAS PEREIRA JÚNIOR', 'EMEIEF BAIRRO TRÊS CASAS', 'EMEIEF BAIRRO TAQUARA BRANCA',
    'EMEIEF JARDIM AMANDA III', 'EMEIEF JARDIM NOSSA SENHORA AUXILIADORA',
    'EMEIEF JARDIM SANTA AMÉLIA – HUMBERTO DE AMORIM LOPES', 'EMEIEF JARDIM SANTA CLARA DO LAGO I',
    'EMEIEF JARDIM SANTA ESMERALDA', 'EMEIEF JARDIM SÃO PEDRO', 'EMEIEF JOÃO CARLOS DO AMARAL SOARES',
    'EMEIEF JOSÉ TENÓRIO DA SILVA', 'EMEIEF LUIZA VITÓRIA DE OLIVEIRA CRUZ',
    'EMEIEF PROFª ZENAIDE F. DE LIRA SEORLIN', 'EMEIEF SEBASTIANA DAS DORES MOURA',
    'CIER ROMILDO PARDINI (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO)',
    'SECRETARIA DE EDUCAÇÃO', 'SETOR DE VAGAS'
  ].sort(),
  "PREVIDÊNCIA": ["INSS / BPC", "Auxílio-Doença", "Pensão por Morte"],
  "TRABALHO": ["Jovem Aprendiz", "PETI", "Qualificação Profissional"],
  "SEGURANÇA": [
    'CONSELHO COMUNITÁRIO', 'GUARDA MUNICIPAL', 'POLÍCIA CIVIL', 'POLÍCIA MILITAR', 
    'PATRULHA MARIA DA PENHA', 'DEFESA CIVIL', 'CORPO DE BOMBEIROS', 'DDM', 'CRAM'
  ].sort()
};

export const INITIAL_AGENDA: any[] = [
  {
    id: 'agenda-1',
    unidade_id: 1,
    conselheiro_id: 'cons1', // LEANDRO
    data: new Date().toISOString().split('T')[0],
    hora: '14:00',
    local: 'Sede do Conselho Tutelar',
    participantes: 'Família Silva e Rede de Proteção',
    genitores_responsavel: 'Maria Silva',
    descricao: 'Reunião de alinhamento e acompanhamento de medidas aplicadas.',
    tipo: 'REUNIAO',
    status: 'PENDENTE'
  }
];
