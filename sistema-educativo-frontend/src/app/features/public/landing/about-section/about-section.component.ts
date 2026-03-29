import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-about-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-section.component.html',
  styleUrl: './about-section.component.css'
})
export class AboutSectionComponent {
 readonly galleryImages = [
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=400&fit=crop'
  ];
}
