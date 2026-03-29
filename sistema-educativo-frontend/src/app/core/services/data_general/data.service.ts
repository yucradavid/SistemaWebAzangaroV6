import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

/**
 * Servicio centralizado de datos con Angular Signals
 * Maneja toda la información del colegio de forma reactiva
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  
  // Información del colegio con signals
  readonly schoolInfo = signal({
    name: 'CERMAT SCHOOL',
    slogan: 'Educación de Excelencia para el Futuro',
    location: 'Azángaro - Puno, Perú',
    phone: '+51 999 888 777',
    whatsapp: '51999888777',
    email: 'informes@cermatschool.edu.pe',
    address: 'Jr. Los Andes 456, Azángaro, Puno',
    founded: 1999,
    students: 500,
    teachers: 45,
    satisfaction: 98,
    socialMedia: {
      facebook: 'https://facebook.com/cermatschool',
      instagram: 'https://instagram.com/cermatschool',
      youtube: 'https://youtube.com/@cermatschool'
    },
    schedule: {
      weekdays: 'Lunes a Viernes: 8:00 AM - 5:00 PM',
      saturday: 'Sábados: 9:00 AM - 1:00 PM'
    }
  });

  // Niveles educativos
  readonly levels = signal<EducationalLevel[]>([
    {
      id: 'inicial',
      name: 'Inicial',
      ages: '3-5 años',
      icon: '🎨',
      color: 'from-pink-500 to-rose-500',
      description: 'Desarrollo integral a través del juego y la exploración',
      longDescription: 'En el nivel inicial, fomentamos el desarrollo integral de los niños a través de metodologías activas y lúdicas. Nuestro enfoque se centra en la estimulación temprana, el desarrollo socioemocional y el aprendizaje del inglés desde temprana edad.',
      features: [
        'Estimulación temprana especializada',
        'Psicomotricidad y desarrollo motor',
        'Inglés desde los 3 años',
        'Arte y música',
        'Ambiente seguro y afectivo',
        'Educación personalizada'
      ],
      workshops: [
        'Música y movimiento',
        'Arte y expresión',
        'Cuentacuentos',
        'Juegos matemáticos'
      ],
      image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&h=800&fit=crop'
    },
    {
      id: 'primaria',
      name: 'Primaria',
      ages: '6-11 años',
      icon: '📚',
      color: 'from-blue-500 to-cyan-500',
      description: 'Formación académica sólida con valores y tecnología',
      longDescription: 'La educación primaria en CERMAT SCHOOL combina excelencia académica con formación en valores. Desarrollamos competencias fundamentales para el aprendizaje continuo, incluyendo pensamiento crítico, trabajo en equipo y uso responsable de la tecnología.',
      features: [
        'Educación bilingüe (Español - Inglés)',
        'Robótica educativa',
        'Matemática divertida',
        'Lectura comprensiva',
        'Deportes y recreación',
        'Talleres artísticos'
      ],
      workshops: [
        'Robótica y programación',
        'Ajedrez',
        'Danza',
        'Teatro',
        'Oratoria'
      ],
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=800&fit=crop'
    },
    {
      id: 'secundaria',
      name: 'Secundaria',
      ages: '12-16 años',
      icon: '🎓',
      color: 'from-purple-500 to-indigo-500',
      description: 'Preparación para la vida universitaria y profesional',
      longDescription: 'En secundaria preparamos a nuestros estudiantes para los retos universitarios y profesionales. Ofrecemos una formación académica rigurosa, complementada con laboratorios especializados, orientación vocacional y desarrollo de habilidades de liderazgo.',
      features: [
        'Preparación pre-universitaria',
        'Laboratorios de ciencias especializados',
        'Orientación vocacional',
        'Proyectos de investigación',
        'Liderazgo y emprendimiento',
        'Inglés avanzado (certificación)'
      ],
      workshops: [
        'Ciencias avanzadas',
        'Programación y tecnología',
        'Emprendimiento',
        'Debate y oratoria',
        'Proyectos sociales'
      ],
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=800&fit=crop'
    }
  ]);

  // Noticias y eventos
  readonly news = signal<NewsItem[]>([
    {
      id: 1,
      title: 'Inauguración del nuevo laboratorio de ciencias',
      slug: 'inauguracion-laboratorio-ciencias',
      excerpt: 'Contamos con equipamiento de última generación para el aprendizaje científico.',
      content: 'Estamos orgullosos de inaugurar nuestro nuevo laboratorio de ciencias, equipado con tecnología de última generación que permitirá a nuestros estudiantes realizar experimentos y desarrollar proyectos científicos de alto nivel.',
      date: '2026-01-02',
      category: 'Infraestructura',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=800&fit=crop',
      author: 'Dirección Académica',
      featured: true
    },
    {
      id: 2,
      title: 'Nuestros alumnos ganan olimpiada de matemáticas',
      slug: 'olimpiada-matematicas-2025',
      excerpt: 'Primer lugar en la olimpiada regional de matemáticas.',
      content: 'Con gran orgullo anunciamos que nuestros estudiantes obtuvieron el primer lugar en la Olimpiada Regional de Matemáticas 2025, demostrando el alto nivel académico de CERMAT SCHOOL.',
      date: '2025-12-20',
      category: 'Logros',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=800&fit=crop',
      author: 'Coordinación Académica',
      featured: true
    },
    {
      id: 3,
      title: 'Taller de robótica para padres e hijos',
      slug: 'taller-robotica-familias',
      excerpt: 'Una actividad para compartir en familia y aprender juntos.',
      content: 'Realizamos un exitoso taller de robótica donde padres e hijos trabajaron en equipo para construir y programar robots, fortaleciendo los lazos familiares mientras aprenden tecnología.',
      date: '2025-12-15',
      category: 'Eventos',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=800&fit=crop',
      author: 'Área de Robótica',
      featured: false
    },
    {
      id: 4,
      title: 'Ceremonia de graduación 2025',
      slug: 'graduacion-2025',
      excerpt: 'Despedimos con orgullo a nuestra promoción 2025.',
      content: 'Una emotiva ceremonia donde celebramos los logros de nuestros graduados, quienes inician una nueva etapa en sus vidas con las herramientas y valores que CERMAT SCHOOL les brindó.',
      date: '2025-12-10',
      category: 'Eventos',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=800&fit=crop',
      author: 'Dirección General',
      featured: false
    }
  ]);

  // Docentes
  readonly teachers = signal<Teacher[]>([
    {
      id: 1,
      name: 'María González Quispe',
      specialty: 'Educación Inicial',
      degree: 'Licenciada en Educación Inicial',
      experience: '12 años',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      description: 'Especialista en estimulación temprana y desarrollo infantil.'
    },
    {
      id: 2,
      name: 'Carlos Mamani Flores',
      specialty: 'Matemáticas',
      degree: 'Magíster en Educación Matemática',
      experience: '15 años',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      description: 'Experto en metodologías activas para el aprendizaje matemático.'
    },
    {
      id: 3,
      name: 'Rosa Huanca Condori',
      specialty: 'Comunicación',
      degree: 'Licenciada en Educación - Lengua y Literatura',
      experience: '10 años',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
      description: 'Promotora de la lectura y desarrollo de competencias comunicativas.'
    },
    {
      id: 4,
      name: 'Jorge Apaza Sánchez',
      specialty: 'Ciencias Naturales',
      degree: 'Biólogo - Magíster en Educación',
      experience: '14 años',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
      description: 'Especialista en investigación científica y metodología experimental.'
    },
    {
      id: 5,
      name: 'Ana Pari Ccallo',
      specialty: 'Inglés',
      degree: 'Licenciada en Idiomas - Certificación TESOL',
      experience: '9 años',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
      description: 'Experta en enseñanza bilingüe y preparación para certificaciones.'
    },
    {
      id: 6,
      name: 'Pedro Ccari Quispe',
      specialty: 'Robótica y Tecnología',
      degree: 'Ingeniero en Sistemas - Especialista en Robótica Educativa',
      experience: '8 años',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      description: 'Impulsor de la innovación tecnológica y el pensamiento computacional.'
    }
  ]);

  // Testimonios
  readonly testimonials = signal<Testimonial[]>([
    {
      id: 1,
      name: 'María González',
      role: 'Madre de familia',
      level: 'Primaria',
      text: 'El mejor colegio de la región. Mis hijos han desarrollado habilidades increíbles y los docentes son muy comprometidos. Cada día veo su progreso y estoy muy agradecida.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      date: '2025-12-01'
    },
    {
      id: 2,
      name: 'Carlos Mamani',
      role: 'Ex alumno',
      level: 'Graduado 2023',
      text: 'Gracias a CERMAT SCHOOL pude ingresar a la universidad que soñaba. La preparación académica es de primera y los valores que me inculcaron son para toda la vida.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
      date: '2025-11-15'
    },
    {
      id: 3,
      name: 'Rosa Quispe',
      role: 'Madre de familia',
      level: 'Inicial',
      text: 'La formación en valores y el ambiente familiar hacen la diferencia. Mi hija está feliz y aprende cada día. Recomiendo 100% este colegio.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
      date: '2025-11-20'
    },
    {
      id: 4,
      name: 'Juan Huanca',
      role: 'Padre de familia',
      level: 'Secundaria',
      text: 'Excelente preparación pre-universitaria. Los laboratorios y la tecnología son de primer nivel. Estoy muy satisfecho con la educación que reciben mis hijos.',
      rating: 5,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      date: '2025-10-30'
    }
  ]);

  // Documentos de transparencia
  readonly transparencyDocs = signal<TransparencyDocument[]>([
    {
      id: 1,
      title: 'Reglamento Interno',
      description: 'Normas y procedimientos institucionales',
      category: 'Reglamentos',
      date: '2026-01-01',
      fileUrl: '#',
      fileSize: '2.5 MB'
    },
    {
      id: 2,
      title: 'Proyecto Educativo Institucional (PEI)',
      description: 'Lineamientos pedagógicos y objetivos estratégicos',
      category: 'Documentos Institucionales',
      date: '2025-03-15',
      fileUrl: '#',
      fileSize: '3.8 MB'
    },
    {
      id: 3,
      title: 'Plan Anual de Trabajo 2026',
      description: 'Actividades y cronograma del año escolar',
      category: 'Planes',
      date: '2025-12-20',
      fileUrl: '#',
      fileSize: '1.9 MB'
    },
    {
      id: 4,
      title: 'Manual de Convivencia',
      description: 'Normas de conducta y convivencia escolar',
      category: 'Reglamentos',
      date: '2026-01-01',
      fileUrl: '#',
      fileSize: '1.2 MB'
    }
  ]);

  // Computed values
  readonly featuredNews = computed(() => 
    this.news().filter(n => n.featured)
  );

  readonly yearsOfExperience = computed(() => 
    new Date().getFullYear() - this.schoolInfo().founded
  );

  /**
   * Obtener nivel por ID
   */
  getLevelById(id: string): EducationalLevel | undefined {
    return this.levels().find(l => l.id === id);
  }

  /**
   * Obtener noticia por ID o slug
   */
  getNewsById(idOrSlug: string | number): NewsItem | undefined {
    return this.news().find(n => 
      n.id === Number(idOrSlug) || n.slug === idOrSlug
    );
  }

  /**
   * Obtener docente por ID
   */
  getTeacherById(id: number): Teacher | undefined {
    return this.teachers().find(t => t.id === id);
  }

  /**
   * Simular envío de formulario (en producción iría a un backend)
   */
  submitContactForm(data: ContactFormData): Observable<boolean> {
    console.log('Formulario enviado:', data);
    // Simular delay de red
    return of(true).pipe(delay(1000));
  }

  /**
   * Simular envío de formulario de admisión
   */
  submitAdmissionForm(data: AdmissionFormData): Observable<boolean> {
    console.log('Solicitud de admisión enviada:', data);
    return of(true).pipe(delay(1500));
  }
}

/**
 * Interfaces y tipos
 */
export interface EducationalLevel {
  id: string;
  name: string;
  ages: string;
  icon: string;
  color: string;
  description: string;
  longDescription: string;
  features: string[];
  workshops: string[];
  image: string;
}

export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  image: string;
  author: string;
  featured: boolean;
}

export interface Teacher {
  id: number;
  name: string;
  specialty: string;
  degree: string;
  experience: string;
  image: string;
  description: string;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  level: string;
  text: string;
  rating: number;
  image: string;
  date: string;
}

export interface TransparencyDocument {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  fileUrl: string;
  fileSize: string;
}

export interface ContactFormData {
  nombre: string;
  email: string;
  telefono: string;
  nivel: string;
  mensaje: string;
}

export interface AdmissionFormData extends ContactFormData {
  nombreEstudiante: string;
  edadEstudiante: number;
  gradoInteres: string;
  anioActual?: string;
  colegioActual?: string;
}