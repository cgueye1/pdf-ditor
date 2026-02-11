import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';

@Directive({
  selector: '[appDraggable]',
  standalone: true, // <-- rendre la directive standalone
})
export class DraggableDirective implements OnInit {
  @Input() appDraggable = true;
  @Input() dragData: any;
  @Input() constrainToParent = false;
  @Input() gridSize = 1;

  @Output() dragStart = new EventEmitter<any>();
  @Output() dragging = new EventEmitter<{ x: number; y: number }>();
  @Output() dragEnd = new EventEmitter<{ x: number; y: number; data: any }>();

  private isDragging = false;
  private initialX = 0;
  private initialY = 0;
  private currentX = 0;
  private currentY = 0;
  private parentRect?: DOMRect;
  private elementRect?: DOMRect;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.el.nativeElement.style.cursor = 'move';
    this.el.nativeElement.style.userSelect = 'none';
    this.el.nativeElement.style.position = 'absolute';
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (!this.appDraggable) return;
    event.preventDefault();
    this.startDrag(event.clientX, event.clientY);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (!this.appDraggable) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    this.drag(event.clientX, event.clientY);
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.drag(touch.clientX, touch.clientY);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (!this.isDragging) return;
    this.endDrag();
  }

  @HostListener('document:touchend')
  onTouchEnd(): void {
    if (!this.isDragging) return;
    this.endDrag();
  }

  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;

    // Récupérer les dimensions
    const element = this.el.nativeElement;
    this.elementRect = element.getBoundingClientRect();

    if (this.constrainToParent && element.parentElement) {
      this.parentRect = element.parentElement.getBoundingClientRect();
    }

    // Position initiale
    this.initialX = clientX - this.elementRect!.left;
    this.initialY = clientY - this.elementRect!.top;

    this.currentX = this.elementRect!.left;
    this.currentY = this.elementRect!.top;

    // Émettre l'événement de début
    this.dragStart.emit(this.dragData);

    // Styles pendant le drag
    element.style.zIndex = '1000';
    element.style.opacity = '0.8';
    element.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  }

  private drag(clientX: number, clientY: number): void {
    if (!this.elementRect) return;

    // Calculer la nouvelle position
    let newX = clientX - this.initialX;
    let newY = clientY - this.initialY;

    // Appliquer le grid snapping
    if (this.gridSize > 1) {
      newX = Math.round(newX / this.gridSize) * this.gridSize;
      newY = Math.round(newY / this.gridSize) * this.gridSize;
    }

    // Contraindre au parent si nécessaire
    if (this.constrainToParent && this.parentRect) {
      newX = Math.max(
        0,
        Math.min(newX, this.parentRect.width - this.elementRect.width),
      );
      newY = Math.max(
        0,
        Math.min(newY, this.parentRect.height - this.elementRect.height),
      );
    }

    // Appliquer la nouvelle position
    this.el.nativeElement.style.left = `${newX}px`;
    this.el.nativeElement.style.top = `${newY}px`;

    // Mettre à jour la position actuelle
    this.currentX = newX;
    this.currentY = newY;

    // Émettre l'événement de déplacement
    this.dragging.emit({ x: newX, y: newY });
  }

  private endDrag(): void {
    if (!this.isDragging) return;

    this.isDragging = false;

    // Réinitialiser les styles
    const element = this.el.nativeElement;
    element.style.zIndex = '';
    element.style.opacity = '';
    element.style.boxShadow = '';

    // Émettre l'événement de fin
    this.dragEnd.emit({
      x: this.currentX,
      y: this.currentY,
      data: this.dragData,
    });
  }
}
