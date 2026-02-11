export interface PDFField {
  id: string;
  type: 'text' | 'checkbox' | 'signature' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  value: string | boolean | string[];
  page: number;
  rotation?: number;
  fontSize?: number;
  color?: string;
}

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
  imageData?: string;
}

export interface PDFDocumentState {
  id: string;
  name: string;
  originalFile?: ArrayBuffer;
  fields: PDFField[];
  currentPage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryState {
  past: PDFDocumentState[];
  present: PDFDocumentState | null;
  future: PDFDocumentState[];
}