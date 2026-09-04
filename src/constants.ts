import { User, Documento, Log, ViolenceType, ScaleException } from './types';

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

export const ORIGENS_HIERARQUICAS_UNIDADE_1 = [
  {
    label: 'ASSISTÊNCIA SOCIAL',
    options: [
      'CRAS CENTRAL', 'CRAS JARDIM PRIMAVERA', 'CRAS JARDIM SANTA CLARA', 'CRAS VILA REAL',
      'CREAS CENTRAL', 'DAS (DEPTO ASSISTÊNCIA SOCIAL)', 
      'INSTITUIÇÕES DE ACOLHIMENTO', 'CENTRO POP', 'NAD (NÚCLEO DE ATENDIMENTO À DIFERENÇAS)',
      'CASA DE PASSAGEM / ABRIGO', 'RESIDÊNCIA INCLUSIVA', 'REPÚBLICA PARA JOVENS',
      'OUTROS'
    ].sort()
  },
  {
    label: 'EDUCAÇÃO (ESTADUAL)',
    options: [
      'E.E. AGALVIRA PINTO MONTEIRO', 'E.E. ANTONIO ZANLUCHI', 'E.E. CRISTIANE BRAGA',
      'E.E. ELISEO MARSON', 'E.E. HONORINO FABBRI', 'E.E. JONATAS DAVI VISEL',
      'E.E. JOSÉ CLARET', 'E.E. MANOEL IGNÁCIO', 'E.E. MARISTELA MELLIN',
      'E.E. PAULO CAMILO', 'E.E. PRISCILA DE FÁTIMA', 'E.E. RECREIO ALVORADA',
      'E.E. SANTA CLARA DO LAGO', 'OUTROS'
    ].sort()
  },
  {
    label: 'EDUCAÇÃO (MUNICIPAL)',
    options: [
      'CIER (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO "ROMILDO PARDINI")',
      'CIER ROMILDO PARDINI (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO)',
      'EMEF ARMELINDA ESPÚRIO DA SILVA', 'EMEF CAIO FERNANDO GOMES PEREIRA',
      'EMEF DAYLA CRISTINA SOUZA DE AMORIM', 'EMEF HELENA FUTAVA TAKAHASHI',
      'EMEF JANILDE FLORES GABY DO VALE', 'EMEF JARDIM BOA ESPERANÇA – JOSÉ ROQUE DE MOURA',
      'EMEF JOÃO CALIXTO DA SILVA', 'EMEF MARIA CÉLIA CABRAL DO AMARAL',
      'EMEF NICOLAS THIAGO DOS SANTOS LOFRANI', 'EMEF PATRÍCIA MARIA CAPELLATO BASSO',
      'EMEF PROF. CLÁUDIO ROBERTO MARQUES', 'EMEF PROFª SÔNIA M. DENADAI DE OLIVEIRA',
      'EMEF RENATO COSTA LIMA', 'EMEF SAMUEL DA SILVA MENDONÇA',
      'EMEF VILLAGIO GHIRALDELLI', 'EMEF ZACHARIAS PEREIRA JÚNIOR',
      'EMEI ALVORADA', 'EMEI ANGELITA INOCENTE NUNES BIDUTTI',
      'EMEI JARDIM NOVO CAMBUÍ', 'EMEI MIGUEL CAMILLO', 'EMEI NOVA ALVORADA',
      'EMEI OLINDA MARIA DE JESUS SOUZA', 'EMEI PRIMAVERA',
      'EMEI RESIDENCIAL SÃO SEBASTIÃO II', 'EMEIEF JARDIM NOSSA SENHORA AUXILIADORA',
      'EMEIEF JARDIM SANTA AMÉLIA – HUMBERTO DE AMORIM LOPES', 'EMEIEF JARDIM SANTA CLARA DO LAGO I',
      'EMEIEF JARDIM SÃO PEDRO', 'EMEIEF JOÃO CARLOS DO AMARAL SOARES',
      'EMEIEF JOSÉ TENÓRIO DA SILVA', 'EMEIEF LUIZA VITÓRIA DE OLIVEIRA CRUZ',
      'EMEIEF PROFª ZENAIDE F. DE LIRA SEORLIN', 'SECRETARIA DE EDUCAÇÃO', 'SETOR DE VAGAS',
      'OUTROS'
    ].sort()
  },
  {
    label: 'FAMÍLIA',
    options: ['AVÓ', 'AVÔ', 'IRMÃO(A)', 'MADRASTA', 'MÃE', 'PADRASTO', 'PAI', 'TIA', 'TIO', 'OUTROS'].sort()
  },
  {
    label: 'SAÚDE',
    options: [
      'CAPS ADULTO', 'CAPS INFANTIL', 'CAPS – CENTRO DE ATENÇÃO PSICOSSOCIAL', 'CAPS AD – ÁLCOOL E DROGAS',
      'HOSPITAL MUNICIPAL (MÁRIO COVAS)', 'SAMU', 'UPA NOVA HORTOLÂNDIA',
      'UBS CAMPOS VERDES', 'UBS DOM BRUNO GAMBERINI (NOVA HORTOLÂNDIA)', 
      'UBS FIGUEIRAS', 'UBS PARQUE DO HORTO', 'UBS PARQUE ORESTES ONGARO',
      'UBS SANTA CLARA', 'UBS SÃO BENTO', 'UBS SÃO JORGE',
      'CENTRO DE ESPECIALIDADES MÉDICAS', 'CENTRO DE REABILITAÇÃO',
      'CENTRO DE ESPECIALIDADES ODONTOLÓGICAS (CEO)', 'POLICLÍNICA',
      'FARMÁCIA MUNICIPAL', 'FARMÁCIA DE ALTO CUSTO', 'VIGILÂNCIA SANITÁRIA',
      'VIGILÂNCIA EPIDEMIOLÓGICA', 'VIGILÂNCIA AMBIENTAL', 'CONTROLE DE ZOONOSES',
      'SECRETARIA MUNICIPAL DE SAÚDE DE HORTOLÂNDIA',
      'CENTRAL DE REGULAÇÃO DE CONSULTAS E EXAMES',
      'CIER (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO "ROMILDO PARDINI")',
      'OUTROS'
    ].sort()
  },
  {
    label: 'SEGURANÇA',
    options: ['CONSELHO COMUNITÁRIO', 'GUARDA MUNICIPAL', 'POLÍCIA CIVIL', 'POLÍCIA MILITAR', 'PATRULHA MARIA DA PENHA', 'DEFESA CIVIL', 'CORPO DE BOMBEIROS', 'DDM', 'CRAM', 'OUTROS'].sort()
  },
  {
    label: 'SOCIEDADE',
    options: []
  },
  {
    label: 'OUTROS',
    options: ['DENÚNCIA ESPONTÂNEA', 'DENÚNCIA TELEFÔNICA', 'JUDICIÁRIO', 'MINISTÉRIO PÚBLICO (MP)', 'DISQUE 100', 'SIPIA', 'E-MAIL', 'OUTROS'].sort()
  }
];

export const ORIGENS_HIERARQUICAS_UNIDADE_2 = [
  {
    label: 'ASSISTÊNCIA SOCIAL',
    options: [
      'CRAS JARDIM AMANDA', 'CRAS JARDIM BRASIL', 'CRAS JARDIM NOVO ÂNGULO', 
      'CRAS ROSOLÉM', 'CRAS SANTA IZABEL', 'CREAS CENTRAL', 'DAS (DEPTO ASSISTÊNCIA SOCIAL)', 
      'INSTITUIÇÕES DE ACOLHIMENTO', 'CENTRO POP', 'NAD (NÚCLEO DE ATENDIMENTO À DIFERENÇAS)',
      'CASA DE PASSAGEM / ABRIGO', 'RESIDÊNCIA INCLUSIVA', 'REPÚBLICA PARA JOVENS',
      'OUTROS'
    ].sort()
  },
  {
    label: 'EDUCAÇÃO (ESTADUAL)',
    options: [
      'E.E. CONCEIÇÃO CARDINALES', 'E.E. EUZEBIO ANTONIO', 'E.E. GUIDO ROSOLEN', 
      'E.E. HEDY BOCCHI', 'E.E. JARDIM ALINE', 'E.E. LIOMAR FREITAS', 
      'E.E. MARIA ANTONIETTA', 'E.E. MARIA CRISTINA LOBO', 'E.E. MARIA RITA ARAUJO', 
      'E.E. MARIA ROBERTA', 'E.E. PASTOR ROBERTO', 'E.E. PAULINA ROSA', 
      'E.E. PRISCILA FERNANDES', 'E.E. RAQUEL SAES', 'E.E. WICKLEIN MACEDO', 
      'E.E. YASUO SASAKI', 'OUTROS'
    ].sort()
  },
  {
    label: 'EDUCAÇÃO (MUNICIPAL)',
    options: [
      'CIER (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO "ROMILDO PARDINI")',
      'CIER ROMILDO PARDINI (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO)',
      'EMEF AMANDA', 'EMEF FERNANDA GRAZIELLE RESENDE COVRE', 'EMEF JD. BRASIL', 
      'EMEF JARDIM AMANDA I – CAIC', 'EMEF JARDIM NOVA EUROPA', 
      'EMEF PROFª MARLECIENE PRISCILA PRESTA BONFIM',
      'EMEF PROFESSORA LILIAN CRISTIANE MARTINS DE ARAÚJO',
      'EMEF TARSILA DO AMARAL', 'EMEI CARLOS VILELA', 
      'EMEI JARDIM AMANDA II', 'EMEI JARDIM SANTIAGO', 
      'EMEI JOSÉ NATALINO FONSECA', 'EMEI LENI PEREIRA PRATA', 
      'EMEI NOVA EUROPA (EDUCAÇÃO INFANTIL)', 'EMEI PROFª IZABEL SOSTENA DE SOUZA', 
      'EMEI PROFª ROSIMAR BERTÃO GOMES', 'EMEI ROSOLÉM', 'EMEI SANTA IZABEL', 
      'EMEIEF BAIRRO TAQUARA BRANCA', 'EMEIEF BAIRRO TRÊS CASAS', 
      'EMEIEF JARDIM AMANDA III', 'EMEIEF JARDIM SANTA ESMERALDA', 
      'EMEIEF SEBASTIANA DAS DORES MOURA', 'SECRETARIA DE EDUCAÇÃO', 'SETOR DE VAGAS',
      'OUTROS'
    ].sort()
  },
  {
    label: 'FAMÍLIA',
    options: ['AVÓ', 'AVÔ', 'IRMÃO(A)', 'MADRASTA', 'MÃE', 'PADRASTO', 'PAI', 'TIA', 'TIO', 'OUTROS'].sort()
  },
  {
    label: 'SAÚDE',
    options: [
      'CAPS ADULTO', 'CAPS INFANTIL', 'CAPS – CENTRO DE ATENÇÃO PSICOSSOCIAL', 'CAPS AD – ÁLCOOL E DROGAS',
      'HOSPITAL MUNICIPAL (MÁRIO COVAS)', 'SAMU', 'UPA AMANDA', 'UPA ROSOLÉM',
      'UBS ADELAIDE', 'UBS AMANDA I', 'UBS AMANDA II', 'UBS BRASIL', 'UBS CENTRAL',
      'UBS NOVA EUROPA', 'UBS NOVO ÂNGULO', 'UBS ROSOLÉM',
      'UBS SANTA ESMERALDA', 'UBS SANTIAGO', 'UBS TAQUARA BRANCA', 
      'CENTRO DE ESPECIALIDADES MÉDICAS', 'CENTRO DE REABILITAÇÃO',
      'CENTRO DE ESPECIALIDADES ODONTOLÓGICAS (CEO)', 'POLICLÍNICA',
      'FARMÁCIA MUNICIPAL', 'FARMÁCIA DE ALTO CUSTO', 'VIGILÂNCIA SANITÁRIA',
      'VIGILÂNCIA EPIDEMIOLÓGICA', 'VIGILÂNCIA AMBIENTAL', 'CONTROLE DE ZOONOSES',
      'SECRETARIA MUNICIPAL DE SAÚDE DE HORTOLÂNDIA',
      'CENTRAL DE REGULAÇÃO DE CONSULTAS E EXAMES',
      'CIER (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO "ROMILDO PARDINI")',
      'OUTROS'
    ].sort()
  },
  {
    label: 'SEGURANÇA',
    options: ['CONSELHO COMUNITÁRIO', 'GUARDA MUNICIPAL', 'POLÍCIA CIVIL', 'POLÍCIA MILITAR', 'PATRULHA MARIA DA PENHA', 'DEFESA CIVIL', 'CORPO DE BOMBEIROS', 'DDM', 'CRAM', 'OUTROS'].sort()
  },
  {
    label: 'SOCIEDADE',
    options: []
  },
  {
    label: 'OUTROS',
    options: ['DENÚNCIA ESPONTÂNEA', 'DENÚNCIA TELEFÔNICA', 'JUDICIÁRIO', 'MINISTÉRIO PÚBLICO (MP)', 'DISQUE 100', 'SIPIA', 'E-MAIL', 'OUTROS'].sort()
  }
];

export const getOrigensHierarquicasByUnidade = (unidadeId?: number) => {
  if (unidadeId === 1) return ORIGENS_HIERARQUICAS_UNIDADE_1;
  if (unidadeId === 2) return ORIGENS_HIERARQUICAS_UNIDADE_2;
  return ORIGENS_HIERARQUICAS;
};

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
      'EMEF PROFª SÔNIA M. DENADAI DE OLIVEIRA', 'EMEF RENATO COSTA LIMA', 'EMEF PROFESSORA LILIAN CRISTIANE MARTINS DE ARAÚJO',
      'EMEF SAMUEL DA SILVA MENDONÇA', 'EMEF TARSILA DO AMARAL', 'EMEF VILLAGIO GHIRALDELLI',
      'EMEF ZACHARIAS PEREIRA JÚNIOR', 'EMEIEF BAIRRO TRÊS CASAS', 'EMEIEF BAIRRO TAQUARA BRANCA',
      'EMEIEF JARDIM AMANDA III', 'EMEIEF JARDIM NOSSA SENHORA AUXILIADORA',
      'EMEIEF JARDIM SANTA AMÉLIA – HUMBERTO DE AMORIM LOPES', 'EMEIEF JARDIM SANTA CLARA DO LAGO I',
      'EMEIEF JARDIM SANTA ESMERALDA', 'EMEIEF JARDIM SÃO PEDRO', 'EMEIEF JOÃO CARLOS DO AMARAL SOARES',
      'EMEIEF JOSÉ TENÓRIO DA SILVA', 'EMEIEF LUIZA VITÓRIA DE OLIVEIRA CRUZ',
      'EMEIEF PROFª ZENAIDE F. DE LIRA SEORLIN', 'EMEIEF SEBASTIANA DAS DORES MOURA',
      'CIER (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO "ROMILDO PARDINI")',
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
      'CENTRAL DE REGULAÇÃO DE CONSULTAS E EXAMES',
      'CIER (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO "ROMILDO PARDINI")',
      'OUTROS'
    ].sort()
  },
  {
    label: 'SEGURANÇA',
    options: ['CONSELHO COMUNITÁRIO', 'GUARDA MUNICIPAL', 'POLÍCIA CIVIL', 'POLÍCIA MILITAR', 'PATRULHA MARIA DA PENHA', 'DEFESA CIVIL', 'CORPO DE BOMBEIROS', 'DDM', 'CRAM'].sort()
  },
  {
    label: 'SOCIEDADE',
    options: []
  },
  {
    label: 'OUTROS',
    options: ['DENÚNCIA ESPONTÂNEA', 'DENÚNCIA TELEFÔNICA', 'JUDICIÁRIO', 'MINISTÉRIO PÚBLICO (MP)', 'DISQUE 100', 'SIPIA', 'E-MAIL'].sort()
  }
];

export const CANAIS_COMUNICADO_LIST = [
  'ATENDIMENTO PRESENCIAL', 'ATENDIMENTO TELEFÔNICO', 'TELEFONE DE PLANTÃO',
  'E-MAIL INSTITUCIONAL', 'RELATÓRIO', 'OFÍCIO', 'OFÍCIO MP', 'OFÍCIO JUDICIÁRIO', 'DISQUE 100', 'SIPIA'
].sort();

/**
 * Normaliza o nome do canal para fins de chave de rodízio e categorização institucional.
 * Mantém 'OFÍCIO', 'OFÍCIO MP' e 'OFÍCIO JUDICIÁRIO' como 3 canais estritamente separados.
 */
export const normalizeCanalName = (canal: string | undefined | null): string => {
  if (!canal) return 'OUTROS';
  const c = canal.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  if (c.includes('JUDICIARIO') || c.includes('JUDICIÁRIO')) return 'OFÍCIO JUDICIÁRIO';
  if (c.includes('MP') || c.includes('MINISTERIO PUBLICO') || c.includes('MINISTÉRIO PÚBLICO')) return 'OFÍCIO MP';
  if (c.includes('OFICIO') || c.includes('OFÍCIO')) return 'OFÍCIO';
  if (c.includes('PRESENCIAL')) return 'ATENDIMENTO PRESENCIAL';
  if (c.includes('PLANTAO') || c.includes('PLANTÃO')) return 'TELEFONE DE PLANTÃO';
  if (c.includes('TELEFONICO') || c.includes('TELEFÔNICO') || c.includes('TELEFONE')) return 'ATENDIMENTO TELEFÔNICO';
  if (c.includes('EMAIL') || c.includes('E-MAIL')) return 'E-MAIL INSTITUCIONAL';
  if (c.includes('RELATORIO') || c.includes('RELATÓRIO')) return 'RELATÓRIO';
  if (c.includes('DISQUE 100')) return 'DISQUE 100';
  if (c.includes('SIPIA')) return 'SIPIA';
  return canal.trim().toUpperCase();
};

/**
 * Identifica se um canal participa do rodízio sequencial de casos novos.
 * REGRA SIMCT: Todos os canais oficiais, incluindo 'TELEFONE DE PLANTÃO', participam dos ciclos de rodízio.
 */
export const isRotationChannel = (canal: string | undefined | null): boolean => {
  return true;
};

/**
 * Retorna os 5 conselheiros ativos para o ciclo de rodízio da unidade,
 * respeitando a ordem oficial de cadeiras e substituindo os conselheiros titulares
 * afastados pelos seus respectivos suplentes em substituição ativa.
 */
export const getActiveRotationCounselors = (
  unidadeId: number,
  allUsers: any[],
  nameMap?: Record<string, string>
): any[] => {
  const baseOrder = CONSELHEIROS_ALFABETICO_POR_UNIDADE[unidadeId] || [];

  // Encontra titulares ativos da unidade
  const titulares = allUsers.filter(u => 
    (u.unidade_id || 1) === unidadeId && 
    u.status === 'ATIVO' && 
    u.perfil === 'CONSELHEIRO'
  );

  // Encontra suplentes em substituição ativa vinculados a esta unidade ou a um titular desta unidade
  const suplentesAtivos = allUsers.filter(u => 
    u.status === 'ATIVO' && 
    u.perfil === 'SUPLENTE' && 
    (u.substituicao_ativa || u.is_suplente_active) && 
    ((u.unidade_id || 1) === unidadeId || (u.substituindo_id && allUsers.some(t => t.id === u.substituindo_id && (t.unidade_id || 1) === unidadeId)))
  );

  const result: any[] = [];

  // 1. Itera pela ordem das 5 cadeiras base da unidade
  baseOrder.forEach(baseName => {
    const baseUpper = baseName.toUpperCase();
    
    // Verifica se há titular com esse nome
    const titular = titulares.find(t => isSameCounselorName(t.nome, baseUpper));
    
    // Verifica se há suplente substituindo esse titular
    const suplente = suplentesAtivos.find(s => {
      if (s.substituindo_id && titular && s.substituindo_id === titular.id) return true;
      if (nameMap && titular && nameMap[titular.nome.toUpperCase()] === s.nome.toUpperCase()) return true;
      if (nameMap && nameMap[baseUpper] === s.nome.toUpperCase()) return true;
      return false;
    });

    if (suplente) {
      // O suplente entra exatamente no lugar da cadeira do titular que ele está substituindo
      result.push(suplente);
    } else if (titular && !titular.substituicao_ativa) {
      // O titular entra se não estiver sob substituição
      result.push(titular);
    }
  });

  // 2. Se houver algum titular ativo que não estava no baseOrder e não está sob substituição
  titulares.forEach(t => {
    if (!t.substituicao_ativa && !result.some(r => r.id === t.id)) {
      result.push(t);
    }
  });

  // 3. Se houver algum suplente ativo não alocado no loop base
  suplentesAtivos.forEach(s => {
    if (!result.some(r => r.id === s.id)) {
      result.push(s);
    }
  });

  // Fallback seguro se não encontrar ninguém pela ordem base
  if (result.length === 0) {
    return allUsers
      .filter(u => (u.unidade_id || 1) === unidadeId && u.status === 'ATIVO' && (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && (u.perfil !== 'CONSELHEIRO' || !u.substituicao_ativa))
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }

  return result;
};

/**
 * Obtém o próximo conselheiro na fila alfabética para um canal específico,
 * considerando apenas casos novos reais (sem histórico familiar prévio, sem notificação, sem override manual).
 */
export const getChannelNextCounselor = (
  unidadeId: number,
  canal: string | undefined | null,
  documents: any[],
  activeCounselors: any[],
  nameMap?: Record<string, string>
): {
  nextCounselor: any;
  lastAssignedName: string | null;
  totalNewInChannel: number;
  isRotation: boolean;
  channelName: string;
} => {
  const normCanal = normalizeCanalName(canal);
  const isRotation = isRotationChannel(canal);

  // Obtém os conselheiros ativos no rodízio (com suplentes assumindo as cadeiras dos titulares substituídos)
  const sortedCounselors = getActiveRotationCounselors(unidadeId, activeCounselors, nameMap);

  if (sortedCounselors.length === 0) {
    return {
      nextCounselor: activeCounselors[0] || null,
      lastAssignedName: null,
      totalNewInChannel: 0,
      isRotation,
      channelName: normCanal
    };
  }

  if (!isRotation) {
    return {
      nextCounselor: sortedCounselors[0],
      lastAssignedName: null,
      totalNewInChannel: 0,
      isRotation: false,
      channelName: normCanal
    };
  }

  // Filtra casos novos do mesmo canal e unidade
  // Exclui casos com vínculo de família prévio, notificação, manual override ou anulação de rodízio
  const channelDocs = documents
    .filter(d => {
      if ((d.unidade_id || 1) !== unidadeId) return false;
      if (normalizeCanalName(d.canal_comunicado) !== normCanal) return false;
      if (d.is_family_persistence) return false;
      if (d.is_manual_override || d.is_manual_reference) return false;
      if (d.notificacao) return false;
      if (d.anulado_rodizio) return false;
      if (d.distribuicao_automatica === false) return false;
      return Boolean(d.conselheiro_referencia_id);
    })
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  const totalNewInChannel = channelDocs.length;
  const lastDoc = channelDocs[0];

  let lastAssignedName: string | null = null;
  if (lastDoc) {
    const foundUser = activeCounselors.find(u => u.id === lastDoc.conselheiro_referencia_id);
    const rawName = foundUser?.nome?.toUpperCase() || lastDoc.conselheiro_referencia_nome?.toUpperCase() || '';
    lastAssignedName = (rawName && nameMap && nameMap[rawName]) ? nameMap[rawName] : rawName;
  }

  if (!lastAssignedName) {
    return {
      nextCounselor: sortedCounselors[0],
      lastAssignedName: null,
      totalNewInChannel,
      isRotation: true,
      channelName: normCanal
    };
  }

  const lastIndex = sortedCounselors.findIndex(c => isSameCounselorName(c.nome, lastAssignedName));
  const nextIndex = sortedCounselors.length > 0 ? (lastIndex + 1) % sortedCounselors.length : 0;
  const nextCounselor = sortedCounselors[nextIndex];

  return {
    nextCounselor,
    lastAssignedName,
    totalNewInChannel,
    isRotation: true,
    channelName: normCanal
  };
};

export const classifyTurno = (dateStr: string, timeStr: string): 'COMERCIAL' | 'PLANTAO' => {
  if (!dateStr || !timeStr) return 'COMERCIAL';
  const [hours] = timeStr.split(':').map(Number);
  const dt = new Date(`${dateStr}T12:00:00`);
  const day = dt.getDay();
  const isWeekend = day === 0 || day === 6;
  const isBusinessHours = hours >= 8 && hours < 17;
  return (isWeekend || !isBusinessHours) ? 'PLANTAO' : 'COMERCIAL';
};

export const formatUserRolePrefix = (
  userName: string | undefined | null,
  userId: string | undefined | null,
  users: Array<{ id: string; nome: string; perfil?: string; cargo?: string; unidade_id?: number }> = [],
  doc?: { conselheiro_providencia_id?: string; conselheiro_providencia_nome?: string; conselheiro_referencia_id?: string; conselheiro_referencia_nome?: string }
): string => {
  if (!userName && !userId) return 'O conselheiro de providência imediata';
  const cleanName = (userName || '').trim().toUpperCase();
  const foundUser = users.find(u => (userId && u.id === userId) || (u.nome && u.nome.trim().toUpperCase() === cleanName));

  // 1. Se for o próprio Conselheiro de Providência Imediata do documento
  if (
    doc &&
    ((userId && doc.conselheiro_providencia_id === userId) ||
     (doc.conselheiro_providencia_nome && isSameCounselorName(doc.conselheiro_providencia_nome, userName)))
  ) {
    return 'O conselheiro de providência imediata';
  }

  // 2. Se for o Conselheiro de Referência do documento
  if (
    doc &&
    ((userId && doc.conselheiro_referencia_id === userId) ||
     (doc.conselheiro_referencia_nome && isSameCounselorName(doc.conselheiro_referencia_nome, userName)))
  ) {
    return 'O conselheiro de referência';
  }

  // 3. Se for Conselheiro Titular ou Suplente
  if (foundUser?.perfil === 'CONSELHEIRO' || foundUser?.perfil === 'SUPLENTE' || cleanName.includes('LEANDRO')) {
    return 'O(A) conselheiro(a) tutelar';
  }

  // ADM não altera status: fallback sempre para conselheiro de providência imediata
  return 'O conselheiro de providência imediata';
};

export const sanitizeUserRoleAndIdentity = <T extends Partial<User>>(user: T): T => {
  if (!user) return user;
  const result = { ...user } as any;
  const cleanId = (result.id || '').trim();
  const cleanName = (result.nome || '').trim().toUpperCase();

  // UNIDADE 1 - Administrativos estritos (NUNCA conselheiros)
  if (cleanId === 'admin_lud' || cleanName === 'LUDIMILA') {
    result.id = 'admin_lud';
    result.nome = 'LUDIMILA';
    result.perfil = 'ADMIN';
    result.cargo = 'ADM GERAL';
    result.unidade_id = 1;
  } else if (cleanId === 'admin1' || (cleanName === 'EDSON' && (result.unidade_id === 1 || !result.unidade_id))) {
    result.id = 'admin1';
    result.nome = 'EDSON';
    result.perfil = 'ADMIN';
    result.cargo = 'ADM';
    result.unidade_id = 1;
  } else if (cleanId === 'admin2' || (cleanName === 'LUIZ' && (result.unidade_id === 1 || !result.unidade_id))) {
    result.id = 'admin2';
    result.nome = 'LUIZ';
    result.perfil = 'ADMIN';
    result.cargo = 'ADM';
    result.unidade_id = 1;
  } else if (cleanId === 'admin3' || (cleanName === 'FATIMA' && (result.unidade_id === 1 || !result.unidade_id))) {
    result.id = 'admin3';
    result.nome = 'FATIMA';
    result.perfil = 'ADMIN';
    result.cargo = 'ADM';
    result.unidade_id = 1;
  } 
  // UNIDADE 2 - Administrativos estritos (NUNCA conselheiros)
  else if (cleanId === 'ct2_admin1' || cleanName === 'ISRAEL') {
    result.id = 'ct2_admin1';
    result.nome = 'ISRAEL';
    result.perfil = 'ADMINISTRATIVO';
    result.cargo = 'ADM';
    result.unidade_id = 2;
  } else if (cleanId === 'ct2_admin2' || cleanName === 'RAISSA') {
    result.id = 'ct2_admin2';
    result.nome = 'RAISSA';
    result.perfil = 'ADMINISTRATIVO';
    result.cargo = 'ADM';
    result.unidade_id = 2;
  } else if (cleanId === 'ct2_admin3' || cleanName === 'THAINA') {
    result.id = 'ct2_admin3';
    result.nome = 'THAINA';
    result.perfil = 'ADMINISTRATIVO';
    result.cargo = 'ADM';
    result.unidade_id = 2;
  }
  // UNIDADE 1 - Conselheiros Titulares
  else if (cleanId === 'cons2' || (cleanName === 'LUIZA' && result.unidade_id === 1)) {
    result.id = 'cons2';
    result.nome = 'LUIZA';
    result.perfil = 'CONSELHEIRO';
    result.cargo = 'Conselheira';
    result.unidade_id = 1;
  }
  // UNIDADE 2 - Conselheiro Titular Edson Lopes
  else if (cleanId === 'ct2_cons2' || (cleanName === 'EDSON LOPES' && result.unidade_id === 2)) {
    result.id = 'ct2_cons2';
    result.nome = 'EDSON LOPES';
    result.perfil = 'CONSELHEIRO';
    result.cargo = 'Conselheiro';
    result.unidade_id = 2;
  }

  return result as T;
};

export const isSameCounselorName = (nameA: string | undefined | null, nameB: string | undefined | null): boolean => {
  if (!nameA || !nameB) return false;
  const cleanA = nameA.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanB = nameB.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (cleanA === cleanB) return true;

  // Proteção explícita contra falso-positivo entre LUIZ (ADM) e LUIZA (Conselheira)
  if ((cleanA === 'LUIZ' && cleanB === 'LUIZA') || (cleanA === 'LUIZA' && cleanB === 'LUIZ')) {
    return false;
  }

  // Proteção explícita contra falso-positivo entre EDSON (ADM CT1) e EDSON LOPES (Conselheiro CT2)
  if ((cleanA === 'EDSON' && cleanB.includes('LOPES')) || (cleanB === 'EDSON' && cleanA.includes('LOPES'))) {
    return false;
  }

  const partsA = cleanA.split(' ').filter(p => p.length > 0);
  const partsB = cleanB.split(' ').filter(p => p.length > 0);

  const firstA = partsA[0] || '';
  const firstB = partsB[0] || '';

  if (firstA === firstB && firstA.length >= 3) {
    if (partsA.length > 1 && partsB.length > 1) {
      return partsA.slice(1).join(' ') === partsB.slice(1).join(' ');
    }
    return true;
  }
  if (cleanA.startsWith(cleanB + ' ') || cleanB.startsWith(cleanA + ' ')) return true;

  return false;
};

export const parseSafeDateTime = (d?: string, t?: string): Date | null => {
  if (!d) return null;
  const cleanD = d.trim().split('T')[0];
  const cleanT = (t || '00:00').trim();
  const parts = cleanT.split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  const padH = String(isNaN(h) ? 0 : h).padStart(2, '0');
  const padM = String(isNaN(m) ? 0 : m).padStart(2, '0');
  const dt = new Date(`${cleanD}T${padH}:${padM}:00`);
  return isNaN(dt.getTime()) ? null : dt;
};

/**
 * Verifica se uma substituição/troca excepcional de escala está ativa em um determinado momento (ou agora).
 * Quando o prazo da troca vence, retorna false imediatamente, restaurando a escala original automaticamente.
 */
export const isScaleExceptionActive = (
  ex: ScaleException,
  dateStr?: string,
  timeStr?: string
): boolean => {
  if (!ex) return false;

  let queryDateTime: Date | null = null;
  if (dateStr) {
    queryDateTime = parseSafeDateTime(dateStr, timeStr || "08:00");
  } else {
    queryDateTime = new Date();
  }
  if (!queryDateTime || isNaN(queryDateTime.getTime())) {
    queryDateTime = new Date();
  }
  const queryMs = queryDateTime.getTime();

  // 1. Se possuir campos explícitos de início e término com data e hora
  if (ex.inicio_data && ex.fim_data) {
    const startDateTime = parseSafeDateTime(ex.inicio_data, ex.inicio_hora || "00:00");
    const endDateTime = parseSafeDateTime(ex.fim_data, ex.fim_hora || "23:59:59");
    if (startDateTime && endDateTime) {
      return queryMs >= startDateTime.getTime() && queryMs <= endDateTime.getTime();
    }
  }

  // 2. Se possuir fim_data
  if (ex.fim_data) {
    const endDateTime = parseSafeDateTime(ex.fim_data, ex.fim_hora || "23:59:59");
    const startDateTime = parseSafeDateTime(ex.inicio_data || ex.data, ex.inicio_hora || "00:00");
    if (startDateTime && endDateTime) {
      return queryMs >= startDateTime.getTime() && queryMs <= endDateTime.getTime();
    }
  }

  // 3. Se possuir apenas a data do plantão (ex.data ou ex.inicio_data) sem fim_data
  const dutyDate = ex.data || ex.inicio_data;
  if (dutyDate) {
    const startDuty = parseSafeDateTime(dutyDate, ex.inicio_hora || "08:00");
    let endDuty: Date | null = null;
    if (startDuty) {
      // Plantão de 24h a partir do início das 08h até 08h do dia seguinte
      endDuty = new Date(startDuty.getTime() + 24 * 60 * 60 * 1000);
    } else {
      endDuty = parseSafeDateTime(dutyDate, "23:59:59");
    }
    if (startDuty && endDuty) {
      return queryMs >= startDuty.getTime() && queryMs <= endDuty.getTime();
    }
  }

  return false;
};

/**
 * Verifica se o prazo de uma troca de escala já expirou em relação a uma data de referência (padrão: agora).
 */
export const isScaleExceptionExpired = (
  ex: ScaleException,
  referenceDate: Date = new Date()
): boolean => {
  if (!ex) return false;
  const refMs = referenceDate.getTime();

  if (ex.fim_data) {
    const endDateTime = parseSafeDateTime(ex.fim_data, ex.fim_hora || "23:59:59");
    if (endDateTime) {
      return refMs > endDateTime.getTime();
    }
  }

  const dutyDate = ex.data || ex.inicio_data;
  if (dutyDate) {
    const startDuty = parseSafeDateTime(dutyDate, ex.inicio_hora || "08:00");
    if (startDuty) {
      const endDuty = new Date(startDuty.getTime() + 24 * 60 * 60 * 1000);
      return refMs > endDuty.getTime();
    }
    const endOfDay = parseSafeDateTime(dutyDate, "23:59:59");
    if (endOfDay) {
      return refMs > endOfDay.getTime();
    }
  }

  return false;
};

export const getEffectiveEscala = (
  dateStr: string, 
  timeStr: string = "08:00", 
  unidade_id: number = 1, 
  nameMap?: Record<string, string>,
  scaleExceptions?: ScaleException[]
): string[] => {
  const safeTime = (timeStr && timeStr.trim().length >= 4) ? timeStr.trim() : "08:00";
  const [hours] = safeTime.split(':').map(Number);
  let dt = new Date(`${dateStr}T12:00:00`);
  if (!isNaN(hours) && hours < 8) dt.setDate(dt.getDate() - 1);
  
  const mapName = (name: string) => (nameMap && nameMap[name]) ? nameMap[name] : name;
  
  const dutyDayStr = dt.toISOString().split('T')[0];

  let rawTrio: string[] = [];

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
      
      rawTrio = [
        mapName(sequenceU2[p]), 
        mapName(sequenceU2[s2]), 
        mapName(sequenceU2[s3])
      ];
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
      
      rawTrio = [
        mapName(sequenceU1[p]),
        mapName(sequenceU1[s2]),
        mapName(sequenceU1[s3])
      ];
    }
  } else {
    const day = dt.getDate();
    const sequence = CONSELHEIROS_ALFABETICO_POR_UNIDADE[unidade_id] || CONSELHEIROS_ALFABETICO_POR_UNIDADE[1];
    const index = (day - 1) % 5;
    rawTrio = [
      mapName(sequence[index]), 
      mapName(sequence[(index + 1) % 5]), 
      mapName(sequence[(index + 2) % 5])
    ];
  }

  // Se houver exceções/trocas excepcionais ativas cadastradas (expira automaticamente após o período)
  if (scaleExceptions && scaleExceptions.length > 0) {
    const activeExceptions = scaleExceptions.filter(ex => {
      if (ex.unidade_id !== unidade_id) return false;
      return isScaleExceptionActive(ex, dateStr, safeTime);
    });

    activeExceptions.forEach(exception => {
      const originalName = exception.conselheiro_original_nome || '';
      const replacementName = exception.conselheiro_substituto_nome || '';
      const mappedReplacement = mapName(replacementName);

      rawTrio = rawTrio.map(name => {
        if (isSameCounselorName(name, originalName)) {
          return mappedReplacement;
        }
        return name;
      });
    });
  }

  return rawTrio;
};

/**
 * Verifica de forma definitiva se o conselheiro de referência está no trio do dia ou ativo por substituição/troca.
 */
export const isCounselorInTrioOrSubstitution = (
  counselorNameOrObj: string | User | { id?: string; nome?: string } | null | undefined,
  trioNames: string[],
  scaleExceptions?: ScaleException[],
  dateStr?: string,
  timeStr?: string,
  unidade_id?: number,
  nameMap?: Record<string, string>
): boolean => {
  if (!counselorNameOrObj) return false;
  const rawName = typeof counselorNameOrObj === 'string' 
    ? counselorNameOrObj 
    : (counselorNameOrObj.nome || '');
  if (!rawName) return false;

  const counselorId = typeof counselorNameOrObj === 'object' ? counselorNameOrObj.id : undefined;
  const mappedName = (nameMap && nameMap[rawName.toUpperCase()]) ? nameMap[rawName.toUpperCase()] : rawName;

  // 1. Está diretamente no trio efetivo (que já incorpora trocas/substituições da escala)
  if (trioNames && trioNames.length > 0) {
    const inTrio = trioNames.some(n => isSameCounselorName(n, mappedName) || isSameCounselorName(n, rawName));
    if (inTrio) return true;
  }

  // 2. Está presente e ativo como conselheiro substituto em alguma troca na data/horário
  if (scaleExceptions && scaleExceptions.length > 0 && dateStr) {
    const isSubActive = scaleExceptions.some(ex => {
      if (unidade_id && ex.unidade_id !== unidade_id) return false;
      const matchesSub = (counselorId && ex.conselheiro_substituto_id === counselorId) ||
                         isSameCounselorName(ex.conselheiro_substituto_nome, mappedName) ||
                         isSameCounselorName(ex.conselheiro_substituto_nome, rawName);
      if (!matchesSub) return false;

      return isScaleExceptionActive(ex, dateStr, timeStr);
    });

    if (isSubActive) return true;
  }

  return false;
};

/**
 * Retorna o conselheiro ativo na escala de hoje para o lugar de um determinado conselheiro de referência
 * (Ex: Se Sandra for referência mas Milena estiver substituindo Sandra no plantão de hoje, retorna Milena).
 */
export const getActiveSubstituteInTrio = (
  counselorNameOrObj: string | User | { id?: string; nome?: string } | null | undefined,
  trioNames: string[],
  allUsers: User[],
  scaleExceptions?: ScaleException[],
  dateStr?: string,
  timeStr?: string,
  unidade_id?: number,
  nameMap?: Record<string, string>
): User | null => {
  if (!counselorNameOrObj) return null;
  const rawName = typeof counselorNameOrObj === 'string' ? counselorNameOrObj : (counselorNameOrObj.nome || '');
  if (!rawName) return null;
  const counselorId = typeof counselorNameOrObj === 'object' ? counselorNameOrObj.id : undefined;
  const mappedName = (nameMap && nameMap[rawName.toUpperCase()]) ? nameMap[rawName.toUpperCase()] : rawName;

  // Se o próprio conselheiro (ou seu nome mapeado) já está no trio
  const directUser = allUsers.find(u => 
    u.status === 'ATIVO' && 
    (!unidade_id || (u.unidade_id || 1) === unidade_id) && 
    (isSameCounselorName(u.nome, mappedName) || isSameCounselorName(u.nome, rawName) || (counselorId && u.id === counselorId))
  );

  // Se houver uma troca ativa onde este conselheiro é o original (sendo substituído por outro no plantão de hoje)
  if (scaleExceptions && scaleExceptions.length > 0 && dateStr) {
    const activeException = scaleExceptions.find(ex => {
      if (unidade_id && ex.unidade_id !== unidade_id) return false;
      const isOriginal = (counselorId && ex.conselheiro_original_id === counselorId) ||
                         isSameCounselorName(ex.conselheiro_original_nome, mappedName) ||
                         isSameCounselorName(ex.conselheiro_original_nome, rawName);
      if (!isOriginal) return false;

      return isScaleExceptionActive(ex, dateStr, timeStr);
    });

    if (activeException) {
      const subUser = allUsers.find(u => 
        u.status === 'ATIVO' && 
        (!unidade_id || (u.unidade_id || 1) === unidade_id) && 
        (u.id === activeException.conselheiro_substituto_id || isSameCounselorName(u.nome, activeException.conselheiro_substituto_nome))
      );
      if (subUser) return subUser;
    }
  }

  return directUser || null;
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
  "JARDIM SANTO ANTÔNIO", "JARDIM SÃO BENEDITO", "JARDIM SÃO BENTO", "JARDIM SÃO CAMILO", "JARDIM SÃO FELIPE", 
  "JARDIM SÃO JORGE", "JARDIM SÃO PEDRO", "JARDIM SÃO SEBASTIÃO", "JARDIM STELLA", 
  "JARDIM SUMAREZINHO", "JARDIM TERRAS DE SANTO ANTÔNIO", "JARDIM VIAGEM", "JARDIM VILLAGIO GHIRALDELLI", 
  "LOTEAMENTO ADVENTISTA CAMPINEIRO", "LOTEAMENTO RECANTO DO SOL", "LOTEAMENTO REMANSO CAMPINEIRO", 
  "NÚCLEO SANTA ISABEL", "PARAÍSO NOVO ÂNGULO", "PARQUE BELLEVILLE", "PARQUE DO HORTO", "PARQUE DOS PINHEIROS", 
  "PARQUE GABRIEL", "PARQUE HORIZONTE", "PARQUE ODIMAR", "PARQUE ORESTES ÔNGARO", 
  "PARQUE ORTOLÂNDIA", "PARQUE PERÓN", "PARQUE RESIDENCIAL JOÃO LUIZ", 
  "PARQUE RESIDENCIAL MARIA DE LOURDES", "PARQUE SÃO MIGUEL", "PARQUE TERRAS DE SANTA MARIA", 
  "PARQUE VASCONCELLOS", "RESIDENCIAL ANAUÁ", "RESIDENCIAL JARDIM DE MÔNACO", "RESIDENCIAL JARDIM DO JATOBÁ", 
  "SÍTIO PANORAMA", "VILA AMÉRICA", "VILA CONQUISTA", "VILA GUEDES", "VILA INEMA", "VILA REAL", 
  "VILA REAL CONTINUAÇÃO", "VILA REAL SANTISTA", "VILA SÃO FRANCISCO", "VILA SÃO PEDRO", "VILLA FLORA",
  "JD STA AMÉLIA"
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
  "JARDIM DE MÔNACO",
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
  "JARDIM SÃO CAMILO",
  "JARDIM SÃO FELIPE",
  "JARDIM SÃO JORGE",
  "JARDIM SÃO PEDRO",
  "JARDIM SÃO SEBASTIÃO",
  "JD STA AMÉLIA",
  "LOTEAMENTO RECANTO DO SOL",
  "PARQUE BELLEVILLE",
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
  "PARQUE VASCONCELLOS",
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

export const getUnidadeByBairro = (bairroName: string | undefined | null): number => {
  if (!bairroName) return 1;
  const upperBairro = bairroName.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const matchBairro = (b: string) => b.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === upperBairro;
  
  if (BAIRROS_UNIDADE_1.some(matchBairro)) return 1;
  if (BAIRROS_UNIDADE_2.some(matchBairro)) return 2;
  return 1; // Default fallback if not found
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
  "JARDIM AMANDA I",
  "JARDIM AMANDA II",
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
  "JARDIM SANTO ANTÔNIO",
  "JARDIM SÃO BENEDITO",
  "JARDIM STELLA",
  "JARDIM SUMAREZINHO",
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
  'AGUARDANDO_DOCUMENTO': 'Aguardando Documento',
  'AGUARDANDO_VALIDACAO': 'Aguardando Validação do Colegiado',
  'CONCLUIDO': 'Concluído',
  'ENCERRADO': 'Encerrado',
  'NOTIFICADO': 'Notificado',
  'NOTIFICAR': 'Notificar',
  'AVALIAR_EM_COLEGIADO': 'Avaliar em Colegiado',
  'SOLICITAR_REUNIAO_REDE': 'Solicitar Reunião de Rede',
  'SOLICITAR_REUNIAO_DE_REDE': 'Solicitar Reunião de Rede',
  'OFICIALIZADO': 'Medida Pendente',
  'EM_PREENCHIMENTO': 'Em Preenchimento (Rascunho)',
  'MONITORAMENTO': 'Em Monitoramento',
  'MEDIDA_APLICADA': 'Medida Aplicada',
  'MEDIDA_PENDENTE': 'Medida Pendente',
  'TIPIFICACAO_INCOMPLETA': 'Tipificação Incompleta',
  'REUNIAO_REDE_AGENDADA': 'Reunião de Rede Agendada',
  'AGENDAR_REUNIAO_REDE': 'Reunião de Rede Agendada',
  'AGUARDAR_RESPOSTA_EMAIL': 'Aguardar Resposta de E-mail',
  'EMAIL_RESPONDIDO': 'E-mail Respondido',
  'ENCAMINHAR_NOTICIA_FATO': 'Encaminhar Notícia de Fato',
  'OFICIO_RESPONDIDO': 'Ofício Respondido',
  'RESPONDER_EMAIL': 'Responder E-mail',
  'RESPONDER_OFICIO_JUDICIARIO_MP': 'Responder Ofício do Judiciário/MP',
  'NOTIFICACAO_LEANDRO': 'NOTIFICAÇÃO LEANDRO',
  'NOTIFICACAO_LUIZA': 'NOTIFICAÇÃO LUIZA',
  'NOTIFICACAO_MILENA': 'NOTIFICAÇÃO MILENA',
  'NOTIFICACAO_MIRIAN': 'NOTIFICAÇÃO MIRIAN',
  'NOTIFICACAO_SANDRA': 'NOTIFICAÇÃO SANDRA',
  'NOTIFICACAO_ROSILDA': 'NOTIFICAÇÃO ROSILDA',
  'NOTIFICACAO_ALINE': 'NOTIFICAÇÃO ALINE',
  'NOTIFICACAO_EDSON LOPES': 'NOTIFICAÇÃO EDSON LOPES',
  'NOTIFICACAO_FABIO': 'NOTIFICAÇÃO FABIO',
  'NOTIFICACAO_MARCIA': 'NOTIFICAÇÃO MARCIA',
  'NOTIFICACAO_MATHEUS': 'NOTIFICAÇÃO MATHEUS',
  'TODAS_MEDIDAS_APLICADAS': 'Todas Medidas Aplicadas',
  'MARCAR_REUNIAO_REDE': 'Marcar Reunião em REDE',
  'DIREITO_NAO_VIOLADO': 'DIREITO NÃO VIOLADO / IMPROCEDENTE',
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

export const LOCAL_OCORRENCIA_OPTIONS = [
  "AMBIENTE VIRTUAL (INTERNET, REDES SOCIAIS, APLICATIVOS)",
  "CRECHE",
  "ESCOLA ESTADUAL",
  "ESCOLA MUNICIPAL",
  "ESCOLA PARTICULAR",
  "ESPAÇO PÚBLICO (RUA, PRAÇA, PARQUE ETC.)",
  "ESTABELECIMENTO PRIVADO (COMÉRCIO, EMPRESA, CLUBE ETC.)",
  "INSTITUIÇÃO DE ACOLHIMENTO",
  "OUTRO",
  "RESIDÊNCIA DA CRIANÇA/ADOLESCENTE",
  "RESIDÊNCIA DA FAMÍLIA EXTENSA (AVÓS, TIOS ETC.)",
  "RESIDÊNCIA DE UM DOS PAIS",
  "RESIDÊNCIA DE VIZINHO",
  "RESIDÊNCIA DO SUPOSTO AUTOR",
  "TRANSPORTE PÚBLICO",
  "UNIDADE DE SAÚDE",
  "VEÍCULO PARTICULAR"
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
    'CENTRAL DE REGULAÇÃO DE CONSULTAS E EXAMES',
    'CIER (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO "ROMILDO PARDINI")',
    'OUTROS'
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
    'EMEF PROFª SÔNIA M. DENADAI DE OLIVEIRA', 'EMEF RENATO COSTA LIMA', 'EMEF PROFESSORA LILIAN CRISTIANE MARTINS DE ARAÚJO',
    'EMEF SAMUEL DA SILVA MENDONÇA', 'EMEF TARSILA DO AMARAL', 'EMEF VILLAGIO GHIRALDELLI',
    'EMEF ZACHARIAS PEREIRA JÚNIOR', 'EMEIEF BAIRRO TRÊS CASAS', 'EMEIEF BAIRRO TAQUARA BRANCA',
    'EMEIEF JARDIM AMANDA III', 'EMEIEF JARDIM NOSSA SENHORA AUXILIADORA',
    'EMEIEF JARDIM SANTA AMÉLIA – HUMBERTO DE AMORIM LOPES', 'EMEIEF JARDIM SANTA CLARA DO LAGO I',
    'EMEIEF JARDIM SANTA ESMERALDA', 'EMEIEF JARDIM SÃO PEDRO', 'EMEIEF JOÃO CARLOS DO AMARAL SOARES',
    'EMEIEF JOSÉ TENÓRIO DA SILVA', 'EMEIEF LUIZA VITÓRIA DE OLIVEIRA CRUZ',
    'EMEIEF PROFª ZENAIDE F. DE LIRA SEORLIN', 'EMEIEF SEBASTIANA DAS DORES MOURA',
    'CIER (CENTRO INTEGRADO DE EDUCAÇÃO E REABILITAÇÃO "ROMILDO PARDINI")',
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

export const AGENDA_TIPOS = [
  {
    category: "ATENDIMENTOS",
    options: [
      "Atendimento no Conselho Tutelar",
      "Atendimento espontâneo",
      "Atendimento agendado",
      "Atendimento domiciliar",
      "Atendimento institucional"
    ]
  },
  {
    category: "VISITAS",
    options: [
      "Visita domiciliar",
      "Visita escolar",
      "Visita hospitalar",
      "Visita em instituição de acolhimento",
      "Visita em unidade socioeducativa",
      "Visita de fiscalização"
    ]
  },
  {
    category: "NOTIFICAÇÕES",
    options: [
      "1° Notificação",
      "2° Notificação",
      "3° Notificação"
    ]
  },
  {
    category: "REUNIÕES",
    options: [
      "Reunião com a escola",
      "Reunião com a OSC (Organização da Sociedade Civil)",
      "Reunião com a rede de proteção",
      "Reunião com CMDCA",
      "Reunião com CRAS",
      "Reunião com CREAS",
      "Reunião com Ministério Público",
      "Reunião com Poder Judiciário",
      "Reunião com Segurança Pública",
      "Reunião com uma Unidade de Saúde",
      "Reunião de equipe",
      "Reunião intersetorial"
    ]
  },
  {
    category: "AUDIÊNCIAS",
    options: [
      "Audiência judicial",
      "Audiência no Ministério Público",
      "Oitiva especializada",
      "Escuta protegida (quando houver participação do Conselho)"
    ]
  },
  {
    category: "DILIGÊNCIAS",
    options: [
      "Diligência externa",
      "Busca ativa",
      "Averiguação de denúncia",
      "Cumprimento de requisição",
      "Acompanhamento de medida protetiva"
    ]
  },
  {
    category: "CAPACITAÇÃO",
    options: [
      "Curso",
      "Treinamento",
      "Palestra",
      "Seminário",
      "Conferência",
      "Eventos",
      "Campanha educativa",
      "Ação comunitária",
      "Reunião escolar",
      "Evento institucional"
    ]
  },
  {
    category: "OUTROS",
    options: ["Outros"]
  }
];
