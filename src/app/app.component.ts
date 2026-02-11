import { Component, OnInit } from '@angular/core';
import { PDFField, PDFDocumentState } from './models/pdf.model';
import { PdfService } from './services/pdf.service';
import { HistoryService } from './services/history.service';
import { StorageService } from './services/storage.service';
import { CommonModule } from '@angular/common';
import { PdfToolbarComponent } from './components/pdf-toolbar/pdf-toolbar.component';
import { FormsModule } from '@angular/forms';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { SignaturePadComponent } from './components/signature-pad/signature-pad.component';
import { SavedDocumentsComponent } from './components/saved-documents/saved-documents.component';
import { DraggableDirective } from './directives/draggable.directive';
import saveAs from 'file-saver';

@Component({
  selector: 'app-root',

  standalone: true, // <-- rendre AppComponent standalone
  imports: [
    CommonModule,
    FormsModule,
    PdfToolbarComponent,

    PdfViewerComponent,
    SignaturePadComponent,
    SavedDocumentsComponent,
    DraggableDirective,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'PDF Editor Advanced';

  // État du document
  currentDocument: PDFDocumentState = {
    id: this.generateId(),
    name: 'Nouveau document',
    fields: [],
    currentPage: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Fichier PDF actuel
  pdfFile: File | null = null;
  pdfUrl: string = '';

  // Interface utilisateur
  activeTool: string | null = null;
  showSignaturePad = false;
  showSavedDocuments = false;
  textProperties = { fontSize: 12, color: '#000000' };

  // PDF info
  totalPages = 0;
  pageDimensions = { width: 0, height: 0 };
  scale = 1.5;

  // État de l'historique
  canUndo = false;
  canRedo = false;

  constructor(
    private pdfService: PdfService,
    public historyService: HistoryService,
    private storageService: StorageService,
  ) {}

  ngOnInit(): void {
    // Charger l'historique depuis localStorage
    this.historyService.loadFromLocalStorage();

    // Charger le dernier document sauvegardé si disponible
    const documents = this.storageService.getAllDocuments();
    if (documents.length > 0) {
      // Charger le dernier document modifié
      const lastDocument = documents.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )[0];

      if (confirm(`Voulez-vous charger le document "${lastDocument.name}" ?`)) {
        this.loadSavedDocument(lastDocument);
      }
    }
  }

  // Gestion des fichiers
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.pdfFile = input.files[0];
    await this.loadPdf();
  }

  async loadPdf(): Promise<void> {
    if (!this.pdfFile) return;

    try {
      // Créer un nouveau document
      this.currentDocument = {
        id: this.generateId(),
        name: this.pdfFile.name,
        fields: [],
        currentPage: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Charger le PDF
      const arrayBuffer = await this.pdfFile.arrayBuffer();
      await this.pdfService.loadPdf(arrayBuffer);

      // Créer l'URL pour le viewer
      this.pdfUrl = URL.createObjectURL(this.pdfFile);

      // Obtenir le nombre de pages
      this.totalPages = await this.pdfService.getPageCount();

      // Obtenir les dimensions de la première page
      const dimensions = await this.pdfService.getPageDimensions(0);
      this.pageDimensions = dimensions;

      // Sauvegarder l'état initial
      this.saveState();
    } catch (error) {
      console.error('Erreur lors du chargement du PDF:', error);
      alert('Erreur lors du chargement du PDF');
    }
  }

  // Gestion des outils
  onToolSelected(tool: string): void {
    this.activeTool = tool;
  }

  async onPageClick(event: {
    x: number;
    y: number;
    page: number;
  }): Promise<void> {
    if (!this.activeTool) return;

    try {
      let newField: PDFField;

      switch (this.activeTool) {
        case 'text':
          const text = prompt('Entrez le texte:', 'Texte');
          if (!text) return;

          newField = await this.pdfService.addTextField(
            text,
            event.x,
            event.y,
            event.page - 1,
            this.textProperties,
          );
          break;

        case 'checkbox':
          newField = await this.pdfService.addCheckbox(
            true,
            event.x,
            event.y,
            event.page - 1,
          );
          break;

        case 'signature':
          this.showSignaturePad = true;
          return;

        default:
          return;
      }

      // Ajouter le champ au document
      this.currentDocument.fields.push(newField);
      this.currentDocument.updatedAt = new Date();

      // Sauvegarder l'état
      this.saveState();
    } catch (error) {
      console.error("Erreur lors de l'ajout du champ:", error);
      alert("Erreur lors de l'ajout du champ");
    }
  }

  onSignatureSaved(signatureDataUrl: string): void {
    // Ajouter la signature à une position par défaut
    const signatureField: PDFField = {
      id: `signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'signature',
      x: 100,
      y: 100,
      width: 200,
      height: 80,
      value: signatureDataUrl,
      page: this.currentDocument.currentPage - 1,
    };

    this.currentDocument.fields.push(signatureField);
    this.currentDocument.updatedAt = new Date();
    this.saveState();
  }

  /*onFieldUpdated(updatedField: PDFField): void {
    const index = this.currentDocument.fields.findIndex(
      (f) => f.id === updatedField.id,
    );
    if (index !== -1) {
      this.currentDocument.fields[index] = updatedField;
      this.currentDocument.updatedAt = new Date();
      this.saveState();
    }
  }*/

  onFieldSelected(field: PDFField): void {
    console.log('Champ sélectionné:', field);
    // Vous pourriez afficher des propriétés modifiables ici
  }

  // Gestion de l'historique
  saveState(): void {
    this.currentDocument.updatedAt = new Date();
    this.historyService.saveState(this.currentDocument);
    this.updateHistoryButtons();

    // Sauvegarder dans le stockage local
    this.storageService.saveDocument(this.currentDocument);
  }

  onUndo(): void {
    const previousState = this.historyService.undo();
    if (previousState) {
      this.currentDocument = previousState;
      this.updateHistoryButtons();
    }
  }

  onRedo(): void {
    const nextState = this.historyService.redo();
    if (nextState) {
      this.currentDocument = nextState;
      this.updateHistoryButtons();
    }
  }

  updateHistoryButtons(): void {
    this.canUndo = this.historyService.canUndo();
    this.canRedo = this.historyService.canRedo();
  }

  // Gestion des pages
  onPageChange(page: number): void {
    this.currentDocument.currentPage = page;
    this.currentDocument.updatedAt = new Date();
    this.saveState();
  }

  onPageRendered(event: { page: number; width: number; height: number }): void {
    this.pageDimensions.width = event.width / this.scale;
    this.pageDimensions.height = event.height / this.scale;
  }

  // Sauvegarde/Chargement
  onSave(): void {
    const name = prompt('Nom du document:', this.currentDocument.name);
    if (name) {
      this.currentDocument.name = name;
      this.saveState();
      alert('Document sauvegardé avec succès!');
    }
  }

  onLoad(): void {
    this.showSavedDocuments = true;
  }

  loadSavedDocument(document: PDFDocumentState): void {
    this.currentDocument = document;
    this.updateHistoryButtons();

    // Si le document a un fichier original, le charger
    if (this.pdfFile) {
      this.loadPdf();
    }
  }

  // Exportation
  async onExport(): Promise<void> {
    if (this.currentDocument.fields.length === 0) {
      alert('Aucun champ à exporter');
      return;
    }

    try {
      await this.pdfService.exportPdf(
        this.currentDocument.fields,
        `${this.currentDocument.name}.pdf`,
      );
      alert('PDF exporté avec succès!');
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export du PDF");
    }
  }

  onClear(): void {
    if (confirm('Voulez-vous vraiment effacer tous les champs ?')) {
      this.currentDocument.fields = [];
      this.currentDocument.updatedAt = new Date();
      this.saveState();
      // this.pdfService.clear();
    }
  }

  // Utilitaires
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  onTextPropertiesChange(properties: {
    fontSize: number;
    color: string;
  }): void {
    this.textProperties = properties;
  }

  onCloseSignaturePad(): void {
    this.showSignaturePad = false;
  }

  onCloseSavedDocuments(): void {
    this.showSavedDocuments = false;
  }

  /* onFieldUpdated(updated: PDFField) {
    const index = this.currentDocument.fields.findIndex(f => f.id === updated.id);
    if (index !== -1) {
      this.currentDocument.fields[index] = updated;
      this.currentDocument.updatedAt = new Date();
      this.updateViewerPdf();
      this.saveState();
    }
  }*/

  /** Exporter le PDF final */

  onFieldUpdated(updated: PDFField) {
    const index = this.currentDocument.fields.findIndex(
      (f) => f.id === updated.id,
    );
    if (index !== -1) {
      this.currentDocument.fields[index] = updated;
      this.currentDocument.updatedAt = new Date();
      this.updateViewerPdf();
      this.saveState();
    }
  }

  
  private async updateViewerPdf() {
  const pdfBytes = await this.pdfService.getPdfBytes(); // Uint8Array

  // Copier dans un ArrayBuffer classique pour Blob
  const arrayBuffer = new Uint8Array(pdfBytes).buffer;

  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

  // Supprimer l’ancien URL pour éviter les fuites mémoire
  if (this.pdfUrl) URL.revokeObjectURL(this.pdfUrl);

  this.pdfUrl = URL.createObjectURL(blob);
}

}
