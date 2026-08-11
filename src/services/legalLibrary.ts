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

export const LegalLibraryService = {
  async addDocument(document: Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    const docData = {
      ...document,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    return { id: docRef.id, ...docData };
  },

  async updateDocument(id: string, updates: Partial<LegalDocument>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  },

  async getDocument(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as LegalDocument;
    }
    return null;
  },

  async searchDocuments(criteria: {
    query?: string;
    category?: string;
    sphere?: string;
    status?: string;
    limit?: number;
  }) {
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
    let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LegalDocument));

    if (criteria.query) {
      const searchLower = criteria.query.toLowerCase();
      results = results.filter(doc => 
        doc.name.toLowerCase().includes(searchLower) ||
        doc.content.toLowerCase().includes(searchLower) ||
        doc.summary?.toLowerCase().includes(searchLower) ||
        doc.keywords?.some(k => k.toLowerCase().includes(searchLower)) ||
        doc.subjects?.some(s => s.toLowerCase().includes(searchLower)) ||
        doc.relevantArticles?.some(a => a.toLowerCase().includes(searchLower))
      );
    }

    return results;
  },

  async deleteDocument(id: string) {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  }
};
