import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LucideAngularModule, MapPin, Phone, Mail, Clock } from 'lucide-angular';
import { SeoService } from '@core/services/seo/seo.service';
import { DataService } from '@core/services/data_general/data.service';
import { PageHeroComponent } from '@shared/components/public/page-hero/page-hero.component';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, PageHeroComponent],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.css'
})
export class ContactoComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly dataService = inject(DataService);
  private readonly fb = inject(FormBuilder);
  private readonly sanitizer = inject(DomSanitizer);

  readonly schoolInfo = this.dataService.schoolInfo;
  readonly isSubmitting = signal(false);
  readonly submitSuccess = signal(false);
  readonly submitError = signal('');

  /** URL del mapa ya saneada para uso en iframe */
  mapUrl!: SafeResourceUrl;

  readonly MapPinIcon = MapPin;
  readonly PhoneIcon = Phone;
  readonly MailIcon = Mail;
  readonly ClockIcon = Clock;

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
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.buildMapEmbedUrl());
  }

  /** URL del mapa construida desde la dirección real del colegio */
  private buildMapEmbedUrl(): string {
    const address = this.schoolInfo().address || 'Azángaro, Puno, Perú';
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
  }

  isInvalid(fieldName: string): boolean {
    const control = this.contactForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');
    this.dataService.submitContactForm(this.contactForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        this.contactForm.reset();
        setTimeout(() => this.submitSuccess.set(false), 5000);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.submitError.set('No se pudo enviar el mensaje. Inténtalo nuevamente o escríbenos por correo.');
      }
    });
  }
}
