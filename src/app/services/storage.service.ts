import { Injectable } from '@angular/core';
import { PDFDocumentState } from '../models/pdf.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEY = 'pdfEditorDocuments';

  saveDocument(document: PDFDocumentState): void {
    const documents = this.getAllDocuments();
    
    // Vérifier si le document existe déjà
    const existingIndex = documents.findIndex(doc => doc.id === document.id);
    
    if (existingIndex !== -1) {
      documents[existingIndex] = document;
    } else {
      documents.push(document);
    }

    // Limiter à 10 documents sauvegardés
    if (documents.length > 10) {
      documents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      documents.splice(10);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
  }

  getAllDocuments(): PDFDocumentState[] {
    const documentsJson = localStorage.getItem(this.STORAGE_KEY);
    if (!documentsJson) return [];

    try {
      const documents = JSON.parse(documentsJson);
      
      // Convertir les dates
      return documents.map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt)
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      return [];
    }
  }

  getDocument(id: string): PDFDocumentState | null {
    const documents = this.getAllDocuments();
    return documents.find(doc => doc.id === id) || null;
  }

  deleteDocument(id: string): void {
    const documents = this.getAllDocuments();
    const filteredDocuments = documents.filter(doc => doc.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDocuments));
  }

  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}