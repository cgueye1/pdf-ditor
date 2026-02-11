import { Injectable } from '@angular/core';
import { PDFDocumentState, HistoryState } from '../models/pdf.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly MAX_HISTORY = 50;
  private state: HistoryState = {
    past: [],
    present: null,
    future: []
  };

  saveState(state: PDFDocumentState): void {
    // Si c'est le premier état
    if (!this.state.present) {
      this.state.present = this.deepCopy(state);
      return;
    }

    // Vérifier si l'état a réellement changé
    if (this.hasStateChanged(this.state.present, state)) {
      // Ajouter l'état actuel au passé
      this.state.past.push(this.state.present);
      
      // Limiter la taille de l'historique
      if (this.state.past.length > this.MAX_HISTORY) {
        this.state.past.shift();
      }

      // Définir le nouvel état comme présent
      this.state.present = this.deepCopy(state);
      
      // Effacer le futur
      this.state.future = [];
      
      // Sauvegarder dans localStorage
      this.saveToLocalStorage();
    }
  }

  undo(): PDFDocumentState | null {
    if (this.state.past.length === 0) return null;

    // Ajouter l'état présent au futur
    if (this.state.present) {
      this.state.future.unshift(this.state.present);
    }

    // Récupérer le dernier état du passé
    const previousState = this.state.past.pop()!;
    this.state.present = previousState;

    this.saveToLocalStorage();
    return this.deepCopy(previousState);
  }

  redo(): PDFDocumentState | null {
    if (this.state.future.length === 0) return null;

    // Ajouter l'état présent au passé
    if (this.state.present) {
      this.state.past.push(this.state.present);
    }

    // Récupérer le premier état du futur
    const nextState = this.state.future.shift()!;
    this.state.present = nextState;

    this.saveToLocalStorage();
    return this.deepCopy(nextState);
  }

  canUndo(): boolean {
    return this.state.past.length > 0;
  }

  canRedo(): boolean {
    return this.state.future.length > 0;
  }

  clearHistory(): void {
    this.state = {
      past: [],
      present: null,
      future: []
    };
    localStorage.removeItem('pdfEditorHistory');
  }

  getHistory(): HistoryState {
    return this.deepCopy(this.state);
  }

  loadFromLocalStorage(): void {
    const saved = localStorage.getItem('pdfEditorHistory');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        // Convertir les dates
        if (this.state.present) {
          this.state.present.createdAt = new Date(this.state.present.createdAt);
          this.state.present.updatedAt = new Date(this.state.present.updatedAt);
        }
        this.state.past.forEach(state => {
          state.createdAt = new Date(state.createdAt);
          state.updatedAt = new Date(state.updatedAt);
        });
        this.state.future.forEach(state => {
          state.createdAt = new Date(state.createdAt);
          state.updatedAt = new Date(state.updatedAt);
        });
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        this.clearHistory();
      }
    }
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('pdfEditorHistory', JSON.stringify(this.state));
  }

  private hasStateChanged(oldState: PDFDocumentState, newState: PDFDocumentState): boolean {
    // Comparaison simple des IDs de champs
    const oldFields = JSON.stringify(oldState.fields);
    const newFields = JSON.stringify(newState.fields);
    
    return oldFields !== newFields || 
           oldState.currentPage !== newState.currentPage;
  }

  private deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}