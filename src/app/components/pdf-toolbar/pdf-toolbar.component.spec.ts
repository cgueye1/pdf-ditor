import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdfToolbarComponent } from './pdf-toolbar.component';

describe('PdfToolbarComponent', () => {
  let component: PdfToolbarComponent;
  let fixture: ComponentFixture<PdfToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfToolbarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PdfToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
