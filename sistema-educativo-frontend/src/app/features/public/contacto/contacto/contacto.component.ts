import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService, NewsItem } from '@core/services/data_general/data.service';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.css'
})
export class ContactoComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);
  private readonly fb = inject(FormBuilder);
  readonly schoolInfo = this.dataService.schoolInfo;
  readonly isSubmitting = signal(false);
  readonly submitSuccess = signal(false);
  contactForm: FormGroup;

  constructor() {
    this.contactForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      nivel: ['', Validators.required],
      mensaje: ['']
    });
  }

  ngOnInit(): void {
    this.seoService.updateTitle('Contacto - CERMAT SCHOOL');
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting.set(true);
      this.dataService.submitContactForm(this.contactForm.value).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.submitSuccess.set(true);
          this.contactForm.reset();
          setTimeout(() => this.submitSuccess.set(false), 5000);
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }
}
