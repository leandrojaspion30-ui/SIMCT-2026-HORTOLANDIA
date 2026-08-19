import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  orderBy,
  limit,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface LegalDocument {
  id?: string;
  name: string;
  type: string; // ECA, Constituição, Lei, Resolução, etc.
  number?: string;
  year?: string;
  authority?: string; // Planalto, CONANDA, etc.
  publicationDate?: string;
  updateDate?: string;
  consultationDate?: string;
  status: 'VIGENTE' | 'ALTERADA' | 'REVOGADA' | 'NÃO VERIFICADA';
  sphere: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'OUTRO';
  state?: string;
  municipality?: string;
  source?: string;
  url?: string;
  summary?: string;
  subjects?: string[];
  keywords?: string[];
  content: string;
  relevantArticles?: string[];
  category: string;
  isPublic: boolean;
  confidentiality: 'PÚBLICO' | 'INSTITUCIONAL' | 'RESTRITO' | 'CONFIDENCIAL';
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'legal_library';
const LOCAL_STORAGE_KEY = 'simct_legal_library_cache';

export const BASE_LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'base-cf-88-art227',
    name: 'Constituição Federal de 1988 — Artigo 227 (Princípio da Prioridade Absoluta)',
    type: 'Constituição',
    number: 'CF/88',
    year: '1988',
    authority: 'Presidência da República / Planalto',
    publicationDate: '1988-10-05',
    status: 'VIGENTE',
    sphere: 'FEDERAL',
    source: 'Planalto',
    url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
    summary: 'É dever da família, da sociedade e do Estado assegurar à criança, ao adolescente e ao jovem, com absoluta prioridade, o direito à vida, à saúde, à alimentação, à educação, ao lazer, à profissionalização, à cultura, à dignidade, ao respeito, à liberdade e à convivência familiar e comunitária.',
    category: 'CONSTITUIÇÃO',
    subjects: ['Prioridade Absoluta', 'Direitos Fundamentais', 'Dever da Família e do Estado'],
    keywords: ['artigo 227', 'prioridade absoluta', 'constituição', 'criança', 'adolescente', 'família', 'estado'],
    content: `Art. 227. É dever da família, da sociedade e do Estado assegurar à criança, ao adolescente e ao jovem, com absoluta prioridade, o direito à vida, à saúde, à alimentação, à educação, ao lazer, à profissionalização, à cultura, à dignidade, ao respeito, à liberdade e à convivência familiar e comunitária, além de colocá-los a salvo de toda forma de negligência, discriminação, exploração, violência, crueldade e opressão.
§ 1º O Estado promoverá programas de assistência integral à saúde da criança, do adolescente e do jovem, admitida a participação de entidades não governamentais, mediante os seguintes preceitos:
I - aplicação de percentual dos recursos públicos destinados à saúde na assistência materno-infantil;
II - criação de programas de prevenção e atendimento especializado para as pessoas com deficiência física, sensorial ou mental, bem como de integração social do adolescente e do jovem com deficiência, mediante o treinamento para o trabalho e a convivência, e a facilitação do acesso aos bens e serviços comunitários, com a eliminação de obstáculos arquitetônicos e de todas as formas de discriminação.`,
    relevantArticles: ['Art. 227', 'Art. 208', 'Art. 229'],
    isPublic: true,
    confidentiality: 'PÚBLICO'
  },
  {
    id: 'base-eca-8069',
    name: 'Estatuto da Criança e do Adolescente — Lei Federal nº 8.069/1990',
    type: 'Lei Federal',
    number: '8.069',
    year: '1990',
    authority: 'Presidência da República / Planalto',
    publicationDate: '1990-07-13',
    status: 'VIGENTE',
    sphere: 'FEDERAL',
    source: 'Planalto',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8069.htm',
    summary: 'Dispõe sobre o Estatuto da Criança e do Adolescente e dá outras providências. Regulamenta os direitos fundamentais, medidas de proteção, atribuições do Conselho Tutelar e infrações administrativas.',
    category: 'ECA',
    subjects: ['Conselho Tutelar', 'Medidas de Proteção', 'Requisições de Serviços', 'Infrações Administrativas', 'Acolhimento'],
    keywords: ['eca', 'estatuto da criança e do adolescente', 'lei 8069', 'artigo 136', 'artigo 98', 'artigo 101', 'artigo 129', 'artigo 249', 'conselho tutelar', 'atribuições', 'requisição'],
    content: `Art. 136. São atribuições do Conselho Tutelar:
I - atender as crianças e adolescentes nas hipóteses previstas nos arts. 98 e 105, aplicando as medidas previstas no art. 101, I a VII;
II - atender e aconselhar os pais ou responsável, aplicando as medidas que constam do art. 129, I a VII;
III - promover a execução de suas decisões, podendo para tanto:
a) requisitar serviços públicos nas áreas de saúde, educação, serviço social, previdência, trabalho e segurança;
b) representar junto à autoridade judiciária nos casos de descumprimento injustificado de suas deliberações;
IV - encaminhar ao Ministério Público notícia de fato que constitua infração administrativa ou penal contra os direitos da criança ou adolescente;
V - encaminhar à autoridade judiciária os casos de sua competência;
VI - providenciar a medida estabelecida pela autoridade judiciária, dentre as previstas no art. 101, de I a VI, para o adolescente autor de ato infracional;
VII - expedir notificações;
VIII - requisitar certidões de nascimento e de óbito de criança ou adolescente quando necessário;
IX - assessorar o Poder Executivo local na elaboração da proposta orçamentária para planos e programas de atendimento dos direitos da criança e do adolescente;
X - representar, em nome da pessoa e da família, contra a violação dos direitos previstos no art. 220, § 3º, inciso II, da Constituição Federal;
XI - representar ao Ministério Público para efeito das ações de perda ou suspensão do poder familiar, após esgotadas as possibilidades de manutenção da criança ou do adolescente junto à família natural.`,
    relevantArticles: ['Art. 98', 'Art. 101', 'Art. 129', 'Art. 136', 'Art. 249'],
    isPublic: true,
    confidentiality: 'PÚBLICO'
  },
  {
    id: 'base-lei-henry-borel',
    name: 'Lei Henry Borel — Lei Federal nº 14.344/2022',
    type: 'Lei Federal',
    number: '14.344',
    year: '2022',
    authority: 'Presidência da República / Planalto',
    publicationDate: '2022-05-24',
    status: 'VIGENTE',
    sphere: 'FEDERAL',
    source: 'Planalto',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14344.htm',
    summary: 'Cria mecanismos para a prevenção e o enfrentamento da violência doméstica e familiar contra a criança e o adolescente, estabelecendo medidas protetivas de urgência e atribuições ao Conselho Tutelar e autoridades policiais e judiciais.',
    category: 'VIOLÊNCIA DOMÉSTICA',
    subjects: ['Violência Doméstica', 'Medidas Protetivas de Urgência', 'Afastamento do Agressor', 'Representação do CT'],
    keywords: ['henry borel', 'lei 14344', 'violência doméstica', 'medidas protetivas', 'afastamento', 'agressor', 'urgência'],
    content: `Art. 1º Esta Lei cria mecanismos para a prevenção e o enfrentamento da violência doméstica e familiar contra a criança e o adolescente...
Art. 14. Verificada a existência de risco atual ou iminente à vida ou à integridade física ou psicológica da criança ou do adolescente em situação de violência doméstica e familiar, ou de seus familiares, o agressor será imediatamente afastado do lar, do domicílio ou do local de convivência com a vítima:
I - pela autoridade judicial;
II - pelo delegado de polícia, quando o Município não for sede de comarca; ou
III - pelo policial, quando o Município não for sede de comarca e não houver delegado disponível no momento da denúncia.
§ 1º O Conselho Tutelar poderá representar às autoridades referidas nos incisos I, II e III do caput deste artigo para requerer o afastamento do agressor do lar, do domicílio ou do local de convivência com a vítima.
§ 2º Nas hipóteses dos incisos II e III do caput deste artigo, o juiz será comunicado no prazo máximo de 24 (vinte e quatro) horas e decidirá, em igual prazo, sobre a manutenção ou a revogação da medida aplicada, devendo dar ciência ao Ministério Público.
§ 3º Nos casos de risco à integridade física da vítima ou à efetividade da medida protetiva de urgência, o não afastamento do agressor importará na prisão preventiva do agressor.
Art. 15. Recebido o expediente com o requerimento de concessão de medidas protetivas de urgência, o juiz, no prazo de 24 (vinte e quatro) horas:
I - conhecerá do expediente e do pedido e decidirá sobre a concessão das medidas protetivas de urgência;
II - determinará a apreensão imediata de arma de fogo sob a posse do agressor;
III - comunicará ao Ministério Público para que adote as providências cabíveis.
Art. 16. As medidas protetivas de urgência serão concedidas pelo juiz, a requerimento do Ministério Público, da autoridade policial, do Conselho Tutelar ou a pedido da pessoa que atue em benefício da criança ou do adolescente.
§ 1º As medidas protetivas de urgência poderão ser concedidas de forma liminar, de ofício ou a requerimento do Ministério Público, da autoridade policial, do Conselho Tutelar ou a pedido da pessoa que atue em favor da criança ou do adolescente, independentemente de audiência das partes e de manifestação prévia do Ministério Público.
Art. 17. Em qualquer fase do inquérito policial ou da instrução criminal, caberá a prisão preventiva do agressor, decretada pelo juiz, de ofício, a requerimento do Ministério Público ou mediante representação da autoridade policial.
Art. 19. As medidas protetivas de urgência serão registradas em banco de dados mantido e regulamentado pelo Conselho Nacional de Justiça (CNJ), garantido o acesso do Ministério Público, da Defensoria Pública e do Conselho Tutelar.
Art. 20. Constatada a prática de violência doméstica e familiar contra a criança e o adolescente, nos termos desta Lei, o juiz poderá aplicar, de forma isolada ou cumulativa, ao agressor, entre outras, as seguintes medidas protetivas de urgência:
I - suspensão da posse ou restrição do porte de armas, com comunicação ao órgão competente;
II - afastamento do lar, do domicílio ou do local de convivência com a vítima;
III - proibição de aproximação da vítima, de seus familiares e das testemunhas, fixando o limite mínimo de distância;
IV - proibição de contato com a vítima, seus familiares e testemunhas por qualquer meio de comunicação;
V - proibição de frequentação de determinados lugares;
VI - restrição ou suspensão de visitas à vítima;
VII - prestação de alimentos provisionais ou provisórios;
VIII - comparecimento a programas de recuperação e reeducação;
IX - acompanhamento psicossocial, por meio de atendimento individual e/ou em grupo de apoio.
Art. 21. O juiz poderá determinar, liminarmente ou a requerimento do Ministério Público, da autoridade policial, do Conselho Tutelar ou de quem tenha legítimo interesse, as seguintes medidas protetivas de urgência para a proteção da criança ou do adolescente:
I - encaminhamento da vítima e de seus familiares a programa de proteção ou de atendimento familiar;
II - recondução da vítima e de seus familiares ao domicílio, após o afastamento do agressor;
III - determinação de acolhimento institucional, de caráter provisório e excepcional;
IV - inclusão em programa de acolhimento familiar.
§ 1º A autoridade policial poderá requisitar e o Conselho Tutelar poderá requerer ao Ministério Público a propositura de ação cautelar de antecipação de produção de prova em favor da criança ou do adolescente.`,
    relevantArticles: ['Art. 14', 'Art. 15', 'Art. 16', 'Art. 17', 'Art. 19', 'Art. 20', 'Art. 21'],
    isPublic: true,
    confidentiality: 'PÚBLICO'
  },
  {
    id: 'base-lei-escuta-especializada',
    name: 'Lei da Escuta Especializada e Depoimento Especial — Lei Federal nº 13.431/2017',
    type: 'Lei Federal',
    number: '13.431',
    year: '2017',
    authority: 'Presidência da República / Planalto',
    publicationDate: '2017-04-04',
    status: 'VIGENTE',
    sphere: 'FEDERAL',
    source: 'Planalto',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13431.htm',
    summary: 'Estabelece o sistema de garantia de direitos da criança e do adolescente vítima ou testemunha de violência e altera a Lei nº 8.069, de 13 de julho de 1990 (Estatuto da Criança e do Adolescente). Define a Escuta Especializada e o Depoimento Especial.',
    category: 'ESCUTA ESPECIALIZADA',
    subjects: ['Escuta Especializada', 'Depoimento Especial', 'Não Revitimização', 'Rede de Proteção'],
    keywords: ['escuta especializada', 'depoimento especial', 'lei 13431', 'não revitimização', 'violência sexual', 'testemunha'],
    content: `Art. 4º Entende-se por escuta especializada o procedimento de entrevista sobre situação de violência com criança ou adolescente perante órgão da rede de proteção, limitado o relato estritamente ao necessário para o cumprimento de sua finalidade.
Art. 5º Entende-se por depoimento especial o procedimento de oitiva de criança ou adolescente vítima ou testemunha de violência perante autoridade policial ou judiciária.
Art. 7º A escuta especializada e o depoimento especial serão realizados em local apropriado e acolhedor, com infraestrutura e espaço físico que garantam a privacidade da criança ou do adolescente vítima ou testemunha de violência.`,
    relevantArticles: ['Art. 4º', 'Art. 5º', 'Art. 7º', 'Art. 8º'],
    isPublic: true,
    confidentiality: 'PÚBLICO'
  },
  {
    id: 'base-codigo-civil-guarda',
    name: 'Código Civil Brasileiro — Arts. 1.583 e 1.634 (Guarda e Poder Familiar)',
    type: 'Códigos',
    number: '10.406',
    year: '2002',
    authority: 'Presidência da República / Planalto',
    publicationDate: '2002-01-10',
    status: 'VIGENTE',
    sphere: 'FEDERAL',
    source: 'Planalto',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
    summary: 'Regulamenta a guarda compartilhada e unilateral, os direitos de convivência e o exercício do poder familiar por ambos os genitores, estabelecendo que a alteração de guarda é matéria privativa do Poder Judiciário.',
    category: 'CÓDIGOS',
    subjects: ['Guarda Compartilhada', 'Guarda Unilateral', 'Poder Familiar', 'Convivência Familiar'],
    keywords: ['guarda unilateral', 'guarda compartilhada', 'artigo 1583', 'artigo 1634', 'código civil', 'poder familiar', 'visitas'],
    content: `Art. 1.583. A guarda será unilateral ou compartilhada.
§ 1º Compreende-se por guarda unilateral a atribuída a um só dos genitores ou a alguém que o substitua (art. 1.584, § 5º) e, por guarda compartilhada a responsabilização conjunta e o exercício de direitos e deveres do pai e da mãe que não vivam sob o mesmo teto, concernentes ao poder familiar dos filhos comuns.
§ 2º Na guarda compartilhada, o tempo de custódia física dos filhos deve ser dividido de forma equilibrada com a mãe e com o pai, sempre tendo em vista as condições fáticas e os interesses dos filhos.
§ 5º A guarda unilateral obriga o pai ou a mãe que não a detenha a supervisionar os interesses dos filhos, e, para possibilitar tal supervisão, qualquer dos genitores sempre será parte legítima para solicitar informações e/ou prestação de contas, objetivas ou subjetivas, em assuntos ou situações que direta ou indiretamente afetem a saúde física e psicológica e a educação de seus filhos.
Art. 1.634. Compete a ambos os pais, qualquer que seja a sua situação conjugal, o pleno exercício do poder familiar.`,
    relevantArticles: ['Art. 1.583', 'Art. 1.584', 'Art. 1.634'],
    isPublic: true,
    confidentiality: 'PÚBLICO'
  },
  {
    id: 'base-ldb-educacao',
    name: 'Lei de Diretrizes e Bases da Educação Nacional — Lei Federal nº 9.394/1996',
    type: 'Lei Federal',
    number: '9.394',
    year: '1996',
    authority: 'Presidência da República / Planalto',
    publicationDate: '1996-12-20',
    status: 'VIGENTE',
    sphere: 'FEDERAL',
    source: 'Planalto',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l9394.htm',
    summary: 'Estabelece as diretrizes e bases da educação nacional. Garante a obrigatoriedade da educação básica dos 4 aos 17 anos e a educação especial inclusiva.',
    category: 'LEGISLAÇÃO EDUCACIONAL',
    subjects: ['Educação Básica', 'Inclusão Escolar', 'Educação Especial', 'Matrícula Obrigatória', 'Frequência'],
    keywords: ['ldb', 'lei 9394', 'educação', 'escola', 'matrícula', 'autismo', 'inclusão', 'vaga escolar'],
    content: `Art. 4º O dever do Estado com educação escolar pública será efetivado mediante a garantia de:
I - educação básica obrigatória e gratuita dos 4 (quatro) aos 17 (dezessete) anos de idade;
III - atendimento educacional especializado gratuito aos educandos com deficiência, transtornos globais do desenvolvimento e altas habilidades ou superdotação, transversal a todos os níveis, etapas e modalidades, preferencialmente na rede regular de ensino;
Art. 12. Os estabelecimentos de ensino, respeitadas as normas comuns e as do seu sistema de ensino, terão a incumbência de:
VIII - notificar ao Conselho Tutelar do Município a relação dos alunos que apresentem quantidade de faltas acima de 30% (trinta por cento) do percentual permitido em lei.`,
    relevantArticles: ['Art. 4º', 'Art. 12, VIII', 'Art. 58', 'Art. 59'],
    isPublic: true,
    confidentiality: 'PÚBLICO'
  },
  {
    id: 'base-lei-autismo-12764',
    name: 'Lei Berenice Piana (Política Nacional de Proteção aos Direitos da Pessoa com TEA) — Lei Federal nº 12.764/2012',
    type: 'Lei Federal',
    number: '12.764',
    year: '2012',
    authority: 'Presidência da República / Planalto',
    publicationDate: '2012-12-27',
    status: 'VIGENTE',
    sphere: 'FEDERAL',
    source: 'Planalto',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12764.htm',
    summary: 'Institui a Política Nacional de Proteção dos Direitos da Pessoa com Transtorno do Espectro Autista. Garante acompanhante especializado em sala de aula e criminaliza a recusa de matrícula.',
    category: 'TEA',
    subjects: ['Autismo', 'TEA', 'Inclusão Escolar', 'Acompanhante Especializado', 'Recusa de Matrícula'],
    keywords: ['autismo', 'tea', 'lei 12764', 'berenice piana', 'mediador escolar', 'acompanhante especializado', 'recusa de matrícula'],
    content: `Art. 3º São direitos da pessoa com transtorno do espectro autista:
IV - o acesso:
a) à educação e ao ensino profissionalizante;
Parágrafo único. Em casos de comprovada necessidade, a pessoa com transtorno do espectro autista incluída nas classes comuns de ensino regular, nos termos do inciso IV do art. 2º, terá direito a acompanhante especializado.
Art. 7º O gestor escolar, ou autoridade competente, que recusar a matrícula de aluno com transtorno do espectro autista, ou qualquer outro tipo de deficiência, será punido com multa de 3 (três) a 20 (vinte) salários-mínimos.
§ 1º Em caso de reincidência, apurada por processo administrativo, assegurado o contraditório e a ampla defesa, haverá a perda do cargo.`,
    relevantArticles: ['Art. 3º', 'Art. 7º'],
    isPublic: true,
    confidentiality: 'PÚBLICO'
  }
];

function getCachedLocalDocuments(): LegalDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore local storage error
  }
  return BASE_LEGAL_DOCUMENTS;
}

function saveLocalDocumentsCache(docs: LegalDocument[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(docs));
  } catch (e) {
    // Ignore storage quota limits
  }
}

export const LegalLibraryService = {
  async addDocument(document: Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    const localId = 'local-' + Date.now();
    const docData: LegalDocument = {
      ...document,
      id: localId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save locally first
    const current = getCachedLocalDocuments();
    const updated = [docData, ...current.filter(d => d.id !== localId)];
    saveLocalDocumentsCache(updated);

    try {
      const firestoreData = {
        ...document,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      const docRef = await addDoc(collection(db, COLLECTION_NAME), firestoreData);
      docData.id = docRef.id;
      // Update cache with real Firestore id
      const synched = [docData, ...current.filter(d => d.id !== localId)];
      saveLocalDocumentsCache(synched);
      return { id: docRef.id, ...docData };
    } catch (e: any) {
      console.warn("Firestore offline/quota: Documento salvo localmente na Biblioteca:", e?.message);
      return docData;
    }
  },

  async updateDocument(id: string, updates: Partial<LegalDocument>) {
    const current = getCachedLocalDocuments();
    const updated = current.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
    saveLocalDocumentsCache(updated);

    try {
      if (!id.startsWith('base-') && !id.startsWith('local-')) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData = {
          ...updates,
          updatedAt: Timestamp.now()
        };
        await updateDoc(docRef, updateData);
      }
    } catch (e: any) {
      console.warn("Firestore offline/quota: Atualização salva em cache local:", e?.message);
    }
    return { id, ...updates };
  },

  async getDocument(id: string) {
    const local = getCachedLocalDocuments().find(d => d.id === id);
    if (local) return local;

    try {
      if (!id.startsWith('base-') && !id.startsWith('local-')) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as LegalDocument;
        }
      }
    } catch (e: any) {
      console.warn("Firestore offline/quota no getDocument:", e?.message);
    }
    return null;
  },

  async searchDocuments(criteria: {
    query?: string;
    category?: string;
    sphere?: string;
    status?: string;
    limit?: number;
  }): Promise<LegalDocument[]> {
    let firestoreDocs: LegalDocument[] = [];
    let firestoreSuccess = false;

    try {
      let q = query(collection(db, COLLECTION_NAME));

      if (criteria.category) {
        q = query(q, where('category', '==', criteria.category));
      }
      if (criteria.sphere) {
        q = query(q, where('sphere', '==', criteria.sphere));
      }
      if (criteria.status) {
        q = query(q, where('status', '==', criteria.status));
      }

      q = query(q, orderBy('updatedAt', 'desc'));
      
      if (criteria.limit) {
        q = query(q, limit(criteria.limit));
      }

      const querySnapshot = await getDocs(q);
      firestoreDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LegalDocument));
      firestoreSuccess = true;
    } catch (e: any) {
      // Quota exceeded or offline - seamlessly fallback to local dataset
      console.warn("Firestore search fallback to Statutory Base Cache:", e?.message);
    }

    // Merge base documents + local documents + firestore results
    const localDocs = getCachedLocalDocuments();
    const map = new Map<string, LegalDocument>();

    BASE_LEGAL_DOCUMENTS.forEach(d => map.set(d.id || d.name, d));
    localDocs.forEach(d => map.set(d.id || d.name, d));
    if (firestoreSuccess && firestoreDocs.length > 0) {
      firestoreDocs.forEach(d => map.set(d.id || d.name, d));
    }

    let allDocs = Array.from(map.values());

    // Apply category filter
    if (criteria.category) {
      allDocs = allDocs.filter(d => d.category?.toUpperCase() === criteria.category?.toUpperCase());
    }

    // Apply sphere filter
    if (criteria.sphere) {
      allDocs = allDocs.filter(d => d.sphere?.toUpperCase() === criteria.sphere?.toUpperCase());
    }

    // Apply status filter
    if (criteria.status) {
      allDocs = allDocs.filter(d => d.status?.toUpperCase() === criteria.status?.toUpperCase());
    }

    // Apply text search query filter
    if (criteria.query && criteria.query.trim()) {
      const searchLower = criteria.query.toLowerCase().trim();
      const terms = searchLower.split(/\s+/).filter(t => t.length > 2);

      allDocs = allDocs.filter(doc => {
        const docText = `${doc.name} ${doc.content} ${doc.summary || ''} ${doc.keywords?.join(' ') || ''} ${doc.subjects?.join(' ') || ''} ${doc.relevantArticles?.join(' ') || ''} ${doc.number || ''}`.toLowerCase();
        
        if (docText.includes(searchLower)) return true;
        // Check if any term matches
        return terms.some(t => docText.includes(t));
      });
    }

    if (criteria.limit && criteria.limit > 0) {
      allDocs = allDocs.slice(0, criteria.limit);
    }

    return allDocs;
  },

  async deleteDocument(id: string) {
    const current = getCachedLocalDocuments();
    const updated = current.filter(d => d.id !== id);
    saveLocalDocumentsCache(updated);

    try {
      if (!id.startsWith('base-') && !id.startsWith('local-')) {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      }
    } catch (e: any) {
      console.warn("Firestore delete offline/quota fallback:", e?.message);
    }
  }
};

