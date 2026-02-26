import { User, Documento, Log, ViolenceType } from './types';

export interface UserWithPassword extends User {
  senha?: string;
}

export const INITIAL_USERS: UserWithPassword[] = [
  { id: 'admin_lud', nome: 'LUDIMILA', perfil: 'ADMIN', cargo: 'ADM GERAL', senha: '123456' },
  { id: 'admin1', nome: 'EDSON', perfil: 'ADMIN', cargo: 'ADM', senha: '123456' },
  { id: 'admin2', nome: 'LUIZ', perfil: 'ADMIN', cargo: 'ADM', senha: '123456' },
  { id: 'admin3', nome: 'FATIMA', perfil: 'ADMIN', cargo: 'ADM', senha: '123456' },
  { id: 'cons1', nome: 'LEANDRO', perfil: 'CONSELHEIRO', cargo: 'Conselheiro', senha: '123456' },
  { id: 'cons2', nome: 'LUIZA', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456' },
  { id: 'cons3', nome: 'MILENA', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456' },
  { id: 'cons5', nome: 'MIRIAN', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456' },
  { id: 'cons4', nome: 'SANDRA', perfil: 'CONSELHEIRO', cargo: 'Conselheira', senha: '123456' },
  { id: 'suplente1', nome: 'ROSILDA', perfil: 'SUPLENTE', cargo: 'Conselheira Suplente', senha: '123456', status: 'INATIVO' },
];

export const CONSELHEIROS_ALFABETICO = ['LEANDRO', 'LUIZA', 'MILENA', 'MIRIAN', 'SANDRA'];

export const ORIGENS_HIERARQUICAS = [
  {
    label: 'ASSISTÊNCIA SOCIAL',
    options: [
      'CRAS AMANDA', 'CRAS BRASIL', 'CRAS CENTRAL', 'CRAS NOVO ANGULO', 
      'CRAS PRIMAVERA', 'CRAS SANTA IZABEL', 'CREAS CENTRAL', 
      'DAS (DEPTO ASSISTÊNCIA SOCIAL)', 'INSTITUIÇÕES DE ACOLHIMENTO',
      'CENTRO POP', 'NAD (NÚCLEO DE ATENDIMENTO À DIFERENÇAS)'
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
      'EMEF AMANDA', 'EMEF JD. BRASIL', 'EMEF MARLECIENE PEREIRA', 'EMEF RENATO COSTA LIMA', 
      'EMEF TARSILA DO AMARAL', 'EMEI ALVORADA', 'EMEI PRIMAVERA', 'EMEI ROSOLÉM', 
      'EMEI SANTA IZABEL', 'EMEF ARMELINDA ESPURIO', 'EMEF CLAUDIO MARQUES',
      'EMEF DAYLA AMORIM', 'EMEF SAMUEL MENDONÇA', 'EMEI ANGELITA BIDUTTI',
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
      'UBS AMANDA', 'UBS BRASIL', 'UBS CENTRAL', 'UBS NOVO ANGULO', 'UPA ROSOLÉM',
      'UPA NOVA HORTOLÂNDIA', 'UPA AMANDA'
    ].sort()
  },
  {
    label: 'SEGURANÇA',
    options: ['CONSELHO COMUNITÁRIO', 'GUARDA MUNICIPAL', 'POLÍCIA CIVIL', 'POLÍCIA MILITAR', 'PATRULHA MARIA DA PENHA'].sort()
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

export const getEffectiveEscala = (dateStr: string, timeStr: string = "08:00"): string[] => {
  const [hours] = timeStr.split(':').map(Number);
  let dt = new Date(`${dateStr}T12:00:00`);
  if (hours < 8) dt.setDate(dt.getDate() - 1);
  
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1; // 1-indexed
  const day = dt.getDate();

  if (year === 2026) {
    if (month === 2) {
      // Fevereiro 2026: Inicia com Milena (01/Dom)
      const sequence = ['MILENA', 'SANDRA', 'LEANDRO', 'LUIZA', 'MIRIAN'];
      const index = (day - 1) % 5;
      // Regra 47 diz que termina com Sandra no dia 28. 
      // Vamos simplificar seguindo a lógica de rodízio de 5.
      // Mas a regra 47 dá pontos fixos.
      const febScale: Record<number, string[]> = {
        17: ['MILENA', 'SANDRA', 'LEANDRO'],
        18: ['LUIZA', 'SANDRA', 'MIRIAN']
      };
      return febScale[day] || [sequence[index], sequence[(index + 1) % 5], sequence[(index + 2) % 5]];
    }
    if (month === 3) {
      // Março 2026: Inicia com Sandra (01/Dom)
      const sequence = ['SANDRA', 'LEANDRO', 'LUIZA', 'MIRIAN', 'MILENA'];
      const index = (day - 1) % 5;
      return [sequence[index], sequence[(index + 1) % 5], sequence[(index + 2) % 5]];
    }
  }

  return ['LEANDRO', 'MIRIAN', 'LUIZA'];
};

export const BAIRROS = [
  "JARDIM ADELAIDE", "JARDIM AMANDA", "CENTRO", "JARDIM ROSOLÉM", "NOVO ÂNGULO", "SANTA IZABEL",
  "JARDIM BRASIL", "PARQUE HORTOLÂNDIA", "VILA REAL", "JARDIM PRIMAVERA", "JARDIM SÃO BENTO",
  "JARDIM SÃO SEBASTIÃO", "JARDIM N. SRA. AUXILIADORA", "JARDIM N. SRA. DE FÁTIMA"
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
  "ASSISTÊNCIA SOCIAL": ["CRAS Primavera", "CRAS Jd. Brasil", "CRAS Amanda", "CRAS Central", "CRAS Novo Angulo", "CRAS Santa Izabel", "CREAS", "DAS", "NAD", "Centro Pop"],
  "SAÚDE": ["Hospital Municipal (MÁRIO COVAS)", "UPA Nova Hortolândia", "UPA Rosolém", "UPA Amanda", "CAPS Infantil", "CAPS Adulto", "UBSs"],
  "EDUCAÇÃO": ["Secretaria de Educação", "EMEFs", "EMEIs", "Setor de Vagas"],
  "PREVIDÊNCIA": ["INSS / BPC", "Auxílio-Doença", "Pensão por Morte"],
  "TRABALHO": ["Jovem Aprendiz", "PETI", "Qualificação Profissional"],
  "SEGURANÇA": ["Patrulha Maria da Penha", "Policiamento Comunitário", "Delegacia de Polícia"]
};
