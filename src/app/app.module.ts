import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { PdfToolbarComponent } from './components/pdf-toolbar/pdf-toolbar.component';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { SignaturePadComponent } from './components/signature-pad/signature-pad.component';
import { SavedDocumentsComponent } from './components/saved-documents/saved-documents.component';
import { DraggableDirective } from './directives/draggable.directive';

@NgModule({
  declarations: [
    AppComponent,
    PdfToolbarComponent,
    PdfViewerComponent,
    SignaturePadComponent,
    SavedDocumentsComponent,
    DraggableDirective
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], // 🔹 permet de passer l'erreur

  providers: [],
    exports: [DraggableDirective] ,
  bootstrap: [AppComponent]
  
  
})
export class AppModule { }