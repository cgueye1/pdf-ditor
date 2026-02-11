import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts, Color } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { PDFField } from '../models/pdf.model';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private pdfDoc: PDFDocument | null = null;
  private originalPdfBytes: ArrayBuffer | null = null;

  /** Charger un PDF */
  async loadPdf(pdfBytes: ArrayBuffer): Promise<PDFDocument> {
    this.originalPdfBytes = pdfBytes;
    this.pdfDoc = await PDFDocument.load(pdfBytes);
    return this.pdfDoc;
  }

  /** Convertit un hex ou nom de couleur en rgb (0-1) pour pdf-lib */
  private hexToRgb(hex: string): Color {
    if (!hex) return rgb(0, 0, 0);

    // noms simples
    const colors: Record<string, string> = {
      black: '#000000',
      white: '#ffffff',
      red: '#ff0000',
      green: '#00ff00',
      blue: '#0000ff',
    };
    if (colors[hex.toLowerCase()]) hex = colors[hex.toLowerCase()];

    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const bigint = parseInt(hex, 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return rgb(r, g, b);
  }

  /** Ajouter un texte */
  async addTextField(
    text: string,
    x: number,
    y: number,
    pageIndex: number,
    options?: { fontSize?: number; color?: string },
  ): Promise<PDFField> {
    if (!this.pdfDoc) throw new Error('PDF non chargé');
    const pages = this.pdfDoc.getPages();
    if (!pages[pageIndex]) throw new Error('Page inexistante');

    const page = pages[pageIndex];
    const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSize = options?.fontSize || 12;
    const pdfColor = this.hexToRgb(options?.color || '#000000');

    // drawText (y = distance depuis le bas)
    page.drawText(text, {
      x,
      y: page.getHeight() - y - fontSize,
      size: fontSize,
      font,
      color: pdfColor,
    });

    return {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      x,
      y,
      width: text.length * fontSize * 0.6,
      height: fontSize * 1.2,
      value: text,
      page: pageIndex,
      fontSize,
      color: options?.color || '#000000',
    };
  }

  /** Ajouter une checkbox */
  async addCheckbox(
    checked: boolean,
    x: number,
    y: number,
    pageIndex: number,
    size: number = 12,
  ): Promise<PDFField> {
    if (!this.pdfDoc) throw new Error('PDF non chargé');
    const page = this.pdfDoc.getPages()[pageIndex];

    page.drawRectangle({
      x,
      y: page.getHeight() - y - size,
      width: size,
      height: size,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    if (checked) {
      const offset = 3;
      page.drawLine({
        start: { x: x + offset, y: page.getHeight() - y - size + offset },
        end: { x: x + size - offset, y: page.getHeight() - y - offset },
        color: rgb(0, 0, 0),
        thickness: 2,
      });
      page.drawLine({
        start: { x: x + offset, y: page.getHeight() - y - offset },
        end: { x: x + size - offset, y: page.getHeight() - y - size + offset },
        color: rgb(0, 0, 0),
        thickness: 2,
      });
    }

    return {
      id: `checkbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'checkbox',
      x,
      y,
      width: size,
      height: size,
      value: checked,
      page: pageIndex,
    };
  }

  /** Ajouter une signature */
  async addSignature(
    signatureDataUrl: string,
    x: number,
    y: number,
    pageIndex: number,
    width: number = 200,
    height: number = 80,
  ): Promise<PDFField> {
    if (!this.pdfDoc) throw new Error('PDF non chargé');
    const page = this.pdfDoc.getPages()[pageIndex];

    const imageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());

    let signatureImage;
    if (signatureDataUrl.startsWith('data:image/png')) {
      signatureImage = await this.pdfDoc.embedPng(imageBytes);
    } else if (signatureDataUrl.startsWith('data:image/jpeg')) {
      signatureImage = await this.pdfDoc.embedJpg(imageBytes);
    } else {
      throw new Error('Format d\'image non supporté');
    }

    page.drawImage(signatureImage, {
      x,
      y: page.getHeight() - y - height,
      width,
      height,
    });

    return {
      id: `signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'signature',
      x,
      y,
      width,
      height,
      value: signatureDataUrl,
      page: pageIndex,
    };
  }

  /** Exporter PDF */

async exportPdf(fields: PDFField[], filename: string = 'document-edite.pdf'): Promise<void> {
  if (!this.pdfDoc) throw new Error('PDF non chargé');

  // Tous les champs sont déjà appliqués, on sauvegarde simplement
  const pdfBytes = await this.pdfDoc.save(); // Uint8Array ou ArrayBufferLike

  // Création d'un ArrayBuffer pur pour Blob (évite SharedArrayBuffer)
  const arrayBuffer = new Uint8Array(pdfBytes).buffer;

  // Créer le Blob et sauvegarder
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  saveAs(blob, filename);
}
  /** Obtenir nombre de pages */
  async getPageCount(): Promise<number> {
    return this.pdfDoc ? this.pdfDoc.getPageCount() : 0;
  }

  /** Dimensions d'une page */
  async getPageDimensions(pageIndex: number): Promise<{ width: number; height: number }> {
    if (!this.pdfDoc) throw new Error('PDF non chargé');
    const page = this.pdfDoc.getPages()[pageIndex];
    return { width: page.getWidth(), height: page.getHeight() };
  }

  /** Réinitialiser le service */
  clear(): void {
    this.pdfDoc = null;
    this.originalPdfBytes = null;
  }

  /** Obtenir les bytes PDF */
  async getPdfBytes(): Promise<Uint8Array> {
    if (!this.pdfDoc) throw new Error('PDF non chargé');
    return await this.pdfDoc.save();
  }
}
