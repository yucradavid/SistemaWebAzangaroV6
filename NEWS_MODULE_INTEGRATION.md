# 📰 Módulo Noticias y Eventos - Guía de Integración

## ✅ Mejoras implementadas

### Backend (bakendcermat)

#### 1. **API Resource** (`app/Http/Resources/PublicNewsResource.php`)
- Transforma campos automáticamente:
  - `image_url` → `imageUrl`
  - `is_featured` → `featured`
  - `published_at` → `date`
- Alias para compatibilidad: `createdAt`, `updatedAt`, `publishedAt`, `publishedAt`
- Solo expone `createdBy`/`updatedBy` a usuarios autorizados

#### 2. **Endpoint público sin autenticación**
- `GET /api/public/news` - Lista noticias publicadas
  - Parámetros: `page`, `per_page`, `category`, `featured`, `q`
  - Ejemplo: `GET /api/public/news?category=eventos&featured=true&per_page=12`
- `GET /api/public/news/{slug}` - Noticia por slug

#### 3. **Controlador mejorado**
- Método `published()` para endpoint público
- Búsqueda full-text en titulo/excerpt/content
- Filtros por categoría, featured, status, búsqueda
- Paginación configurable

#### 4. **Rutas registradas**
```php
// Público (sin autenticación)
Route::get('/api/public/news', [PublicNewsController::class, 'published']);
Route::get('/api/public/news/{publicNews:slug}', [PublicNewsController::class, 'show']);

// Admin (con autenticación + role)
Route::apiResource('/api/public-news', PublicNewsController::class);
```

---

### Frontend (sistema-educativo-frontend)

#### 1. **Servicio centralizado** (`NewsService`)
```typescript
// Obtener noticias publicadas (público)
this.newsService.getPublishedNews({
  page: 1,
  per_page: 12,
  category: 'eventos',
  featured: true,
  q: 'olimpiada'
}).subscribe(response => {
  const news = response.data; // Array<NewsItem>
});

// Obtener noticia por slug
this.newsService.getNewsBySlug('olimpiada-matematicas-2025').subscribe(response => {
  const news = response.data;
});

// Admin: crear (con autenticación)
this.newsService.createNews({
  title: 'Nueva noticia',
  excerpt: 'Resumen',
  content: 'Contenido completo',
  category: 'eventos',
  status: 'publicado',
  is_featured: true
}).subscribe(...);

// Admin: actualizarl
this.newsService.updateNews(newsId, {
  status: 'publicado',
  is_featured: true
}).subscribe(...);

// Admin: eliminar
this.newsService.deleteNews(newsId).subscribe(...);
```

#### 2. **Interfaz fuerte (TypeScript)**
```typescript
interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string | null; // ← se mapea automático desde image_url
  category: 'institucional' | 'academico' | 'eventos' | 'comunicados';
  author: string;
  status: 'borrador' | 'publicado' | 'archivado';
  featured: boolean; // ← se mapea desde is_featured
  date: string; // ← se mapea desde published_at
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
```

---

## 🔧 Integración en componentes

### NoticiasListComponent (público, sin autenticación)
```typescript
import { NewsService } from '@core/services/news.service';

export class NoticiasListComponent implements OnInit {
  private newsService = inject(NewsService);
  news = signal<NewsItem[]>([]);
  
  ngOnInit() {
    this.newsService.getPublishedNews({ per_page: 20 }).subscribe({
      next: (response) => this.news.set(response.data),
      error: (err) => console.error('Error:', err)
    });
  }
  
  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
```

### NewsManagementComponent (admin, con autenticación)
```typescript
import { NewsService } from '@core/services/news.service';

export class NewsManagementComponent implements OnInit {
  private newsService = inject(NewsService);
  news = signal<NewsItem[]>([]);
  loading = signal(false);
  
  ngOnInit() {
    this.loadNews();
  }
  
  loadNews() {
    this.loading.set(true);
    this.newsService.getAllNews({ per_page: 15 }).subscribe({
      next: (response) => {
        this.news.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading.set(false);
      }
    });
  }
  
  createNews(title: string, excerpt: string) {
    this.newsService.createNews({
      title,
      excerpt,
      category: 'eventos',
      status: 'borrador'
    }).subscribe({
      next: () => {
        this.loadNews(); // Recarga lista
        Swal.fire('Éxito', 'Noticia creada', 'success');
      },
      error: (err) => Swal.fire('Error', err.error?.message, 'error')
    });
  }
  
  updateNewsStatus(id: string, status: string) {
    this.newsService.updateNews(id, { status }).subscribe({
      next: () => this.loadNews(),
      error: (err) => Swal.fire('Error', err.error?.message, 'error')
    });
  }
  
  deleteNews(id: string) {
    this.newsService.deleteNews(id).subscribe({
      next: () => this.loadNews(),
      error: (err) => Swal.fire('Error', err.error?.message, 'error')
    });
  }
}
```

---

## 🧪 Test rápido con Postman/Curl

### Público (sin token)
```bash
# Listar noticias publicadas
curl -X GET "http://localhost:8000/api/public/news?per_page=12&category=eventos"

# Obtener noticia por slug
curl -X GET "http://localhost:8000/api/public/news/olimpiada-matematicas-2025"
```

### Admin (con token Bearer)
```bash
# Crear noticia
curl -X POST "http://localhost:8000/api/public-news" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nueva noticia",
    "excerpt": "Resumen",
    "content": "Contenido",
    "category": "eventos",
    "status": "borrador"
  }'
```

---

## ✨ Beneficios

- ✅ **Sin problemas de mapeo de campos**: API Resource normaliza todo
- ✅ **Endpoint público seguro**: Solo noticias `publicado` + fecha válida
- ✅ **Caché inteligente**: Servicio invalida automáticamente al crear/editar
- ✅ **Tipado fuerte**: Interfaz `NewsItem` en TypeScript
- ✅ **Manejo de errores**: CatchError en cada método
- ✅ **Flexible**: Filtros, búsqueda, paginación
- ✅ **Compatible**: Nombres de campo esperados por UI (`imageUrl`, `featured`, `date`)

---

## 📝 Próximos pasos

1. ✅ Ejecutar: `php artisan migrate` (crear tabla `public_news`)
2. ✅ Inyectar `NewsService` en componentes
3. ✅ Reemplazar `DataService.news` mock por `NewsService`
4. ✅ Probar endpoints con Postman
5. ✅ Agregar tests unitarios backend/frontend si es necesario
