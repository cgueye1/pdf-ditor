import { Component, ElementRef, ViewChild, Output, EventEmitter, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; // obligatoire pour *ngIf, *ngFor

import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-signature-pad',
  standalone: true,       // <-- rendu autonome
  imports: [CommonModule],
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.scss']
})
export class SignaturePadComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signatureSaved = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();
  
  signaturePad!: SignaturePad;
  signatureDataUrl: string | null = null;
  penColor = '#000000';
  penWidth = 2;

  ngAfterViewInit(): void {
    this.initSignaturePad();
  }

  initSignaturePad(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: this.penColor,
      minWidth: 0.5,
      maxWidth: this.penWidth
    });

    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.signaturePad) {
      const canvas = this.canvasRef.nativeElement;
      const data = this.signaturePad.toData();
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      this.signaturePad.clear();
      this.signaturePad.fromData(data);
    }
  }

  clear(): void {
    this.signaturePad.clear();
    this.signatureDataUrl = null;
  }

  changePenColor(color: string): void {
    this.penColor = color;
    this.signaturePad.penColor = color;
  }

  changePenWidth(width: number): void {
    this.penWidth = width;
    this.signaturePad.minWidth = width * 0.5;
    this.signaturePad.maxWidth = width;
  }

  undo(): void {
    const data = this.signaturePad.toData();
    if (data.length > 0) {
      data.pop();
      this.signaturePad.fromData(data);
    }
  }

  save(): void {
    if (this.signaturePad.isEmpty()) {
      alert('Veuillez signer d\'abord');
      return;
    }
    this.signatureDataUrl = this.signaturePad.toDataURL('image/png');
    this.signatureSaved.emit(this.signatureDataUrl);
    this.close();
  }

  close(): void {
    this.closed.emit();
  }
}
