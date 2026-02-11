import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // nécessaire pour *ngIf, *ngFor, etc.
import { PDFDocumentState } from '../../models/pdf.model';
import { StorageService } from '../../services/storage.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-saved-documents',
  standalone: true,         // <-- rendu standalone
  imports: [CommonModule, FormsModule],  // <-- importe les modules nécessaires
  templateUrl: './saved-documents.component.html',
  styleUrls: ['./saved-documents.component.scss']
})
export class SavedDocumentsComponent implements OnInit {
  @Input() show = false;
  @Output() closed = new EventEmitter<void>();
  @Output() documentSelected = new EventEmitter<PDFDocumentState>();
  
  savedDocuments: PDFDocumentState[] = [];
  filteredDocuments: PDFDocumentState[] = [];
  searchQuery = '';

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.savedDocuments = this.storageService.getAllDocuments();
    this.filterDocuments();
  }

  filterDocuments(): void {
    if (!this.searchQuery.trim()) {
      this.filteredDocuments = [...this.savedDocuments];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredDocuments = this.savedDocuments.filter(doc =>
      doc.name.toLowerCase().includes(query) ||
      doc.id.toLowerCase().includes(query) ||
      doc.createdAt.toLocaleDateString().toLowerCase().includes(query)
    );
  }

  onSearch(): void {
    this.filterDocuments();
  }

  selectDocument(document: PDFDocumentState): void {
    this.documentSelected.emit(document);
    this.close();
  }

  deleteDocument(document: PDFDocumentState, event: Event): void {
    event.stopPropagation();
    
    if (confirm(`Voulez-vous vraiment supprimer "${document.name}" ?`)) {
      this.storageService.deleteDocument(document.id);
      this.loadDocuments();
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  close(): void {
    this.closed.emit();
  }

  clearAll(): void {
    if (confirm('Voulez-vous vraiment supprimer tous les documents sauvegardés ?')) {
      this.storageService.clearAll();
      this.loadDocuments();
    }
  }
}
