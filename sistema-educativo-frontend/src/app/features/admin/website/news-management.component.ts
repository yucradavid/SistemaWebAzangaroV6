//src/app/features/website/news-management/news-management.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '@shared/components/back-button/back-button.component';

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [CommonModule, BackButtonComponent],
  template: `
    <div class="min-h-[calc(100vh-80px)] p-6 sm:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-700">
      <app-back-button></app-back-button>

      <!-- Header Section with Stats -->
      <div class="flex flex-col xl:flex-row xl:items-center gap-6 pb-6 border-b border-slate-100">

        <!-- Stats Row -->
        <div class="flex flex-wrap gap-4 flex-1">
          <div *ngFor="let stat of stats" class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 min-w-[150px] flex-1 hover:border-blue-100 transition-all">
            <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#0E3A8A] shadow-sm">
              <span [innerHTML]="stat.icon"></span>
            </div>
            <div class="flex flex-col">
              <span class="text-2xl font-black text-[#0F172A] leading-none">{{ stat.value }}</span>
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-1">{{ stat.label }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 w-full xl:w-auto">
          <div class="relative flex-1 md:flex-initial md:w-64">
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input type="text" placeholder="Buscar noticia..." class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-[#0F172A] focus:ring-2 focus:ring-[#0E3A8A]/10 focus:border-[#0E3A8A] placeholder-slate-300 shadow-sm transition-all">
          </div>
          <button class="px-6 py-2.5 bg-gradient-to-r from-[#0E3A8A] to-[#C026D3] hover:opacity-90 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2 flex-shrink-0">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva Noticia
          </button>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="flex flex-wrap justify-end gap-3 items-center">
        <!-- Date Filter -->
        <button class="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-[#0E3A8A] hover:text-[#0E3A8A] transition-all shadow-sm group">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Filtrar por fecha
          <svg class="w-3.5 h-3.5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <!-- Category Select -->
        <div class="relative group">
          <select class="pl-10 pr-10 py-2.5 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-[#0E3A8A]/10 focus:border-[#0E3A8A] outline-none appearance-none cursor-pointer hover:border-slate-200 shadow-sm transition-all min-w-[180px] italic">
            <option>Todas las categorías</option>
            <option>Institucional</option>
            <option>Académico</option>
            <option>Eventos</option>
          </select>
          <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 7h10v10H7z"/><path d="M7 7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v2"/><path d="M7 17v2c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-2"/><path d="M3 7v10"/><path d="M21 7v10"/></svg>
          </div>
          <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        <!-- Status Select -->
        <div class="relative group">
          <select class="pl-10 pr-10 py-2.5 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-[#0E3A8A]/10 focus:border-[#0E3A8A] outline-none appearance-none cursor-pointer hover:border-slate-200 shadow-sm transition-all min-w-[160px] italic">
            <option>Todos los estados</option>
            <option>Publicado</option>
            <option>Borrador</option>
            <option>Archivado</option>
          </select>
          <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <div class="w-2 h-2 rounded-full bg-slate-400 group-focus-within:bg-[#0E3A8A]"></div>
          </div>
          <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>

      <!-- News Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div *ngFor="let item of news" class="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative">

          <!-- Image Area -->
          <div class="relative h-56 overflow-hidden bg-slate-50">
            <div *ngIf="item.imageUrl; else noImage" class="w-full h-full">
               <img [src]="item.imageUrl" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
            </div>
            <ng-template #noImage>
               <div class="w-full h-full flex items-center justify-center text-slate-200">
                  <svg class="w-16 h-16 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
               </div>
            </ng-template>

            <!-- Status Badge (Top Right) -->
            <div class="absolute top-5 right-5 z-20">
              <span [class]="'px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-lg ' + getStatusClass(item.status)">
                {{ item.status }}
              </span>
            </div>

            <!-- Featured Star (Top Left) -->
            <div *ngIf="item.isFeatured" class="absolute top-5 left-5 z-20 w-8 h-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-yellow-500 shadow-lg border border-white/20">
               <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          </div>

          <!-- Content Area -->
          <div class="p-8 flex flex-col flex-1">
            <div class="mb-4">
               <span [class]="'px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border ' + getCategoryClass(item.category)">
                  {{ item.category }}
               </span>
            </div>

            <h3 class="text-xl font-black text-[#0F172A] mb-3 leading-tight tracking-tighter uppercase italic group-hover:text-[#0E3A8A] transition-colors line-clamp-2">
              {{ item.title }}
            </h3>

            <p class="text-xs font-medium text-slate-500 line-clamp-3 mb-6 flex-1 leading-relaxed">
              {{ item.excerpt }}
            </p>

            <!-- Card Footer -->
            <div class="pt-6 border-t border-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-4">
                 <div class="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {{ item.author }}
                 </div>
                 <div class="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {{ item.createdAt }}
                 </div>
              </div>

              <!-- Hover Actions -->
              <div class="flex gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-2.5 bg-white text-[#0E3A8A] border-2 border-slate-50 hover:border-[#0E3A8A] rounded-xl transition-all shadow-sm active:scale-95 group/edit">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="p-2.5 bg-red-50 text-red-600 border-2 border-transparent hover:bg-red-600 hover:text-white rounded-xl transition-all active:scale-95">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class NewsManagementComponent {
  stats = [
    { label: 'Total Noticias', value: 12, icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>' },
    { label: 'Publicadas', value: 8, icon: '<svg class="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' },
    { label: 'Borradores', value: 3, icon: '<svg class="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
    { label: 'Destacadas', value: 2, icon: '<svg class="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
  ];

  news = [
    {
      title: 'Gran Inauguración del Año Académico 2025',
      excerpt: 'Celebramos con alegría el inicio de un nuevo ciclo lleno de retos y oportunidades para toda nuestra comunidad educativa.',
      imageUrl: 'https://images.unsplash.com/photo-1523050853063-8802a6359561?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      category: 'Institucional',
      status: 'Publicado',
      author: 'Dirección',
      createdAt: '10 Mar 2025',
      isFeatured: true
    },
    {
      title: 'Taller de Innovación Tecnológica en Primaria',
      excerpt: 'Nuestros estudiantes exploran el mundo de la robótica y la programación básica en una jornada llena de creatividad.',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      category: 'Académico',
      status: 'Publicado',
      author: 'Sistemas',
      createdAt: '08 Mar 2025',
      isFeatured: false
    },
    {
      title: 'Próximo Campeonato Interescolar de Deportes',
      excerpt: 'Preparamos a nuestros equipos para representar a la institución en las disciplinas de fútbol, voley y básquet.',
      imageUrl: null,
      category: 'Eventos',
      status: 'Borrador',
      author: 'Deportes',
      createdAt: '05 Mar 2025',
      isFeatured: false
    }
  ];

  getStatusClass(status: string) {
    const statuses: any = {
      'Publicado': 'bg-green-500/90 text-white border-green-400',
      'Borrador': 'bg-slate-500/90 text-white border-slate-400',
      'Archivado': 'bg-red-500/90 text-white border-red-400',
    };
    return statuses[status] || 'bg-slate-100 text-slate-500';
  }

  getCategoryClass(category: string) {
    const categories: any = {
      'Institucional': 'bg-blue-50 text-[#0E3A8A] border-blue-100',
      'Académico': 'bg-purple-50 text-purple-600 border-purple-100',
      'Eventos': 'bg-pink-50 text-pink-600 border-pink-100',
      'Deportes': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
    return categories[category] || 'bg-slate-50 text-slate-400 border-slate-100';
  }
}
