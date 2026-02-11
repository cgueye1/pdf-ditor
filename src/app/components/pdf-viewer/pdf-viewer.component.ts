import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PDFField } from '../../models/pdf.model';
import * as pdfjsLib from 'pdfjs-dist';
import { DraggableDirective } from '../../directives/draggable.directive';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,                 // <-- rend le composant autonome
  imports: [CommonModule, DraggableDirective],          // <-- pour *ngIf, *ngFor, etc.
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements AfterViewInit, OnChanges {
  @ViewChild('pdfContainer', { static: true }) pdfContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('pdfCanvas', { static: false }) pdfCanvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() pdfUrl: string = '';
  @Input() currentPage = 1;
  @Input() fields: PDFField[] = [];
  @Input() scale = 1.5;
  @Input() activeTool: string | null = null;

  @Output() pageClick = new EventEmitter<{ x: number; y: number; page: number }>();
  @Output() fieldAdded = new EventEmitter<PDFField>();
  @Output() fieldUpdated = new EventEmitter<PDFField>();
  @Output() fieldSelected = new EventEmitter<PDFField>();
  @Output() pageRendered = new EventEmitter<{ page: number; width: number; height: number }>();

  pdfDocument: any = null;
  pageWidth = 0;
  pageHeight = 0;
  selectedField: PDFField | null = null;
  isRendering = false;

  ngAfterViewInit(): void {
    if (this.pdfUrl) {
      this.loadPdf();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pdfUrl'] && this.pdfUrl) this.loadPdf();
    if ((changes['currentPage'] || changes['scale']) && this.pdfDocument) this.renderPage();
  }

  async loadPdf(): Promise<void> {
    try {
      this.isRendering = true;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
      this.pdfDocument = await loadingTask.promise;
      await this.renderPage();
    } catch (error) {
      console.error('Erreur lors du chargement du PDF:', error);
    } finally {
      this.isRendering = false;
    }
  }

  async renderPage(): Promise<void> {
    if (!this.pdfDocument || this.isRendering) return;
    try {
      this.isRendering = true;
      const page = await this.pdfDocument.getPage(this.currentPage);
      const viewport = page.getViewport({ scale: this.scale });
      const canvas = this.pdfCanvasRef?.nativeElement;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      context.clearRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;
      this.pageWidth = viewport.width;
      this.pageHeight = viewport.height;
      this.pageRendered.emit({ page: this.currentPage, width: this.pageWidth, height: this.pageHeight });
    } catch (error) {
      console.error('Erreur lors du rendu de la page:', error);
    } finally {
      this.isRendering = false;
    }
  }

  onCanvasClick(event: MouseEvent): void {
        
    if (!this.pdfCanvasRef) return;
    const canvas = this.pdfCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / this.scale;
    const y = (event.clientY - rect.top) / this.scale;
    const pdfY = this.pageHeight / this.scale - y;
    this.pageClick.emit({ x, y: pdfY, page: this.currentPage });
  }

  getFieldsForCurrentPage(): PDFField[] {
    return this.fields.filter(field => field.page === this.currentPage);
  }

  onFieldSelected(field: PDFField): void {
    this.selectedField = field;
    this.fieldSelected.emit(field);
  }

  onFieldDragEnd(event: { x: number; y: number; data: any }): void {

    if (!event.data) return;
    const field = event.data as PDFField;
    const pdfX = event.x / this.scale;
    const pdfY = (this.pageHeight - event.y) / this.scale;
    const updatedField: PDFField = { ...field, x: pdfX, y: pdfY };
    this.fieldUpdated.emit(updatedField);
  }

  getFieldStyle(field: PDFField): any {
    const x = field.x * this.scale;
    const y = this.pageHeight - field.y * this.scale - field.height * this.scale;
    return { left: `${x}px`, top: `${y}px`, width: `${field.width * this.scale}px`, height: `${field.height * this.scale}px`, zIndex: field === this.selectedField ? 100 : 10 };
  }
}
