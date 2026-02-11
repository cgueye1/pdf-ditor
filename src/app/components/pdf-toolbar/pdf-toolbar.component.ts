import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pdf-toolbar',
  standalone: true,          // <-- rendu standalone
  imports: [CommonModule, FormsModule], // <-- modules nécessaires pour ngIf, ngFor, ngModel
  templateUrl: './pdf-toolbar.component.html',
  styleUrls: ['./pdf-toolbar.component.scss']
})
export class PdfToolbarComponent {
  @Input() canUndo = false;
  @Input() canRedo = false;
  @Input() totalPages = 0;
  @Input() currentPage = 1;
  @Input() showTextProperties = false;
  @Input() textProperties = { fontSize: 12, color: '#000000' };

  @Output() toolSelected = new EventEmitter<string>();
  @Output() undo = new EventEmitter<void>();
  @Output() redo = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() load = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() textPropertiesChange = new EventEmitter<{ fontSize: number; color: string }>();

  activeTool: string | null = null;
  showSavedDocuments = false;

  selectTool(tool: string): void {
    this.activeTool = tool;
    this.toolSelected.emit(tool);
  }

  onUndo(): void { this.undo.emit(); }
  onRedo(): void { this.redo.emit(); }
  onExport(): void { this.export.emit(); }
  onSave(): void { this.save.emit(); }
  onLoad(): void { this.load.emit(); }
  onClear(): void { this.clear.emit(); }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onFontSizeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.textProperties.fontSize = parseInt(input.value, 10);
    this.textPropertiesChange.emit(this.textProperties);
  }

  onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.textProperties.color = input.value;
    this.textPropertiesChange.emit(this.textProperties);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.onPageChange(this.currentPage - 1);
    }
  }
}
