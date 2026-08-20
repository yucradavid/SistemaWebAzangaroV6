# API Endpoints Públicos - Landing Page

## Contexto

El frontend de la landing page actualmente tiene toda la data hardcodeada en `DataService` (Angular signals).
Estos endpoints permitirán migrar a datos dinámicos desde el backend.

---

## Endpoints

### 1. GET /api/public/school-info

Datos generales del colegio.

**Response:**
```json
{
  "name": "CERMAT SCHOOL",
  "slogan": "Educación de Excelencia para el Futuro",
  "location": "Azángaro - Puno, Perú",
  "phone": "+51 999 888 777",
  "whatsapp": "51999888777",
  "email": "informes@cermatschool.edu.pe",
  "address": "Jr. Los Andes 456, Azángaro, Puno",
  "founded": 1999,
  "students": 500,
  "teachers": 45,
  "satisfaction": 98,
  "social_media": {
    "facebook": "https://facebook.com/cermatschool",
    "instagram": "https://instagram.com/cermatschool",
    "youtube": "https://youtube.com/@cermatschool"
  },
  "schedule": {
    "weekdays": "Lunes a Viernes: 8:00 AM - 5:00 PM",
    "saturday": "Sábados: 9:00 AM - 1:00 PM"
  }
}
```

---

### 2. GET /api/public/levels

Niveles educativos del colegio.

**Response:**
```json
{
  "data": [
    {
      "id": "inicial",
      "name": "Inicial",
      "ages": "3-5 años",
      "icon": "🎨",
      "description": "Desarrollo integral a través del juego y la exploración",
      "long_description": "...",
      "features": ["Estimulación temprana", "Inglés desde los 3 años", "..."],
      "workshops": ["Música y movimiento", "Arte y expresión", "..."],
      "image": "https://..."
    }
  ]
}
```

---

### 3. GET /api/public/news

Noticias y eventos. Acepta query params.

**Query params:**
- `featured` (boolean) — filtrar solo destacadas
- `limit` (integer) — cantidad máxima de resultados

**Ejemplo:** `GET /api/public/news?featured=true&limit=3`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Inauguración del nuevo laboratorio",
      "slug": "inauguracion-laboratorio-ciencias",
      "excerpt": "Contamos con equipamiento de última generación",
      "content": "...",
      "date": "2026-01-02",
      "category": "Infraestructura",
      "image": "https://...",
      "author": "Dirección Académica",
      "featured": true
    }
  ]
}
```

---

### 4. GET /api/public/testimonials

Testimonios de padres de familia y exalumnos.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "María González",
      "role": "Madre de familia",
      "level": "Primaria",
      "text": "El mejor colegio de la región...",
      "rating": 5,
      "image": "https://...",
      "date": "2025-12-01"
    }
  ]
}
```

---

### 5. GET /api/public/gallery

Imágenes de la galería escolar.

**Response:**
```json
{
  "data": [
    {
      "url": "https://...",
      "title": "Estudiantes en clase",
      "category": "Actividades Académicas"
    }
  ]
}
```

---

### 6. GET /api/public/stats

Estadísticas dinámicas para las tarjetas de la landing.

**Response:**
```json
{
  "students": 500,
  "teachers": 45,
  "satisfaction": 98,
  "founded": 1999
}
```

> `yearsOfExperience` se calcula en frontend: `new Date().getFullYear() - founded`

---

### 7. GET /api/public/transparency-docs

Documentos de transparencia pública.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Reglamento Interno",
      "description": "Normas y procedimientos institucionales",
      "category": "Reglamentos",
      "date": "2026-01-01",
      "file_url": "/storage/docs/reglamento.pdf",
      "file_size": "2.5 MB"
    }
  ]
}
```

---

## Migración en el DataService

Los `signal()` hardcodeados actuales se reemplazarán por llamadas HTTP.
Ejemplo de patrón a seguir:

```typescript
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Antes: signal hardcodeado
  // readonly schoolInfo = signal({...});

  // Después: signal desde API
  readonly schoolInfo = toSignal(
    this.http.get<SchoolInfo>(`${this.apiUrl}/public/school-info`),
    { initialValue: { name: 'CERMAT SCHOOL', ... } }
  );
}
```

**Imports necesarios:**
- `HttpClientModule` en `app.config.ts` (o `provideHttpClient()` en standalone)
- `toSignal` de `@angular/core/rxjs-interop`

---

## Archivos frontend a modificar para la migración

| Archivo | Cambio |
|---------|--------|
| `app.config.ts` | Agregar `provideHttpClient()` |
| `data.service.ts` | Reemplazar signals hardcodeados por `toSignal(http.get(...))` |
| `environment.ts` | Agregar `apiUrl: 'http://localhost:8000/api'` (ya existe) |
| `gallery-section.component.ts` | Eliminar `galleryImages` local, usar el de `DataService` |
