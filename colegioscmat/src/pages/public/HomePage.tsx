//src/pages/public/HomePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar, MapPin, Phone, Mail, Target, Heart, Star, Quote } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Footer } from '../../components/layout/Footer';
import { SEOHead } from '../../components/seo/SEOHead';
import { supabase } from '../../lib/supabase';

interface PublicNews {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
}

export function HomePage() {
  const navigate = useNavigate();
  const [recentNews, setRecentNews] = useState<PublicNews[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // Cargar noticias desde Supabase
  useEffect(() => {
    async function loadNews() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('public_news') as any)
          .select('id, title, slug, excerpt, image_url, published_at, created_at')
          .eq('status', 'publicado')
          .order('published_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setRecentNews(data || []);
      } catch (error) {
        console.error('Error loading news:', error);
        // Fallback a datos estáticos si falla la carga
        setRecentNews([]);
      } finally {
        setLoadingNews(false);
      }
    }
    loadNews();
  }, []);

  // JSON-LD Structured Data for School
  const schoolJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Cermat School",
    "alternateName": "Colegio Cermat",
    "url": "https://cermatschool.edu.pe",
    "logo": "https://cermatschool.edu.pe/logo.png",
    "description": "Institución educativa comprometida con la excelencia académica y la formación integral de nuestros estudiantes en Azángaro, Puno, Perú",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Jr. Educación 123",
      "addressLocality": "Azángaro",
      "addressRegion": "Puno",
      "postalCode": "21531",
      "addressCountry": "PE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -14.91278,
      "longitude": -70.19487
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+51-951-234-567",
      "contactType": "customer service",
      "email": "contacto@cermatschool.edu.pe",
      "availableLanguage": "Spanish"
    },
    "sameAs": [
      "https://facebook.com/cermatschool",
      "https://instagram.com/cermatschool",
      "https://twitter.com/cermatschool"
    ]
  };

  const testimonials = [
    {
      id: 1,
      name: 'María González',
      role: 'Madre de familia',
      content: 'Cermat School ha sido un pilar fundamental en la educación de mis hijos. El compromiso de los docentes y la calidad educativa son excepcionales.',
      rating: 5
    },
    {
      id: 2,
      name: 'Carlos Pérez',
      role: 'Padre de familia',
      content: 'La plataforma digital facilita mucho el seguimiento académico y la comunicación con los profesores. Muy recomendado.',
      rating: 5
    },
    {
      id: 3,
      name: 'Ana Torres',
      role: 'Exalumna',
      content: 'Estudiar en Cermat School me preparó no solo académicamente, sino también en valores. Estoy agradecida por mi formación.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Inicio - Educación de Excelencia"
        description="Cermat School - Institución educativa en Azángaro, Puno. Formamos líderes con educación de excelencia, valores e innovación. Niveles: Inicial, Primaria y Secundaria."
        keywords="colegio azángaro, educación puno, colegio cermat, educación inicial, educación primaria, educación secundaria, mejor colegio azángaro"
        canonicalUrl="/"
        jsonLd={schoolJsonLd}
      />

      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2070&auto=format&fit=crop"
            alt="Estudiantes en clase"
            className="w-full h-full object-cover animate-fade-in-scale"
          />
          {/* Overlay gradient to ensure text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-cermat-blue-dark/90 via-transparent to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <div className="max-w-4xl mx-auto text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Formando líderes con educación de excelencia
            </h2>
            <p className="text-lg md:text-xl text-blue-50 mb-8 leading-relaxed max-w-2xl mx-auto">
              En Cermat School educamos con valores, innovación y compromiso.
              Únete a nuestra comunidad educativa y descubre el potencial de tus hijos.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => navigate('/niveles')}
                className="bg-[#0E3A8A] text-white hover:bg-[#1e3a8a] border-0 px-8 shadow-lg hover:shadow-xl transition-all"
              >
                Conocer Niveles
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate('/admisiones')}
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8"
              >
                Solicitar Admisión
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-6 bg-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-cermat-blue-dark mb-4">Nuestra Identidad</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Conoce los principios que guían nuestra labor educativa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 hover:shadow-xl transition-shadow border-t-4 border-cermat-blue-dark">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-full">
                  <Target className="w-8 h-8 text-cermat-blue-dark" />
                </div>
                <h3 className="text-2xl font-bold text-cermat-blue-dark">Misión</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Brindar una educación integral de calidad que forme estudiantes competentes,
                críticos y comprometidos con su comunidad. Promovemos el desarrollo de
                habilidades académicas, valores éticos y competencias para el siglo XXI,
                preparando ciudadanos responsables que contribuyan al desarrollo de nuestra región.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow border-t-4 border-cermat-red">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-red-50 rounded-full">
                  <Heart className="w-8 h-8 text-cermat-red" />
                </div>
                <h3 className="text-2xl font-bold text-cermat-blue-dark">Visión</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Ser reconocidos como una institución educativa líder en Azángaro y la región Puno,
                destacando por nuestra excelencia académica, innovación pedagógica y formación en
                valores. Aspiramos a formar generaciones de estudiantes que transformen positivamente
                su entorno y alcancen su máximo potencial.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent News */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Noticias Recientes</h2>
              <p className="text-lg text-gray-600">Mantente informado sobre nuestras actividades</p>
            </div>
            <Button onClick={() => navigate('/noticias')} variant="outline">
              Ver todas
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {loadingNews ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-6 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : recentNews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No hay noticias disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {recentNews.map((news) => (
                <Card
                  key={news.id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => navigate(`/noticias/${news.slug || news.id}`)}
                >
                  <img
                    src={news.image_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop'}
                    alt={news.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4" />
                      {new Date(news.published_at || news.created_at).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <h3 className="text-xl font-bold text-cermat-blue-dark mb-3 line-clamp-2">
                      {news.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-3 mb-4">
                      {news.excerpt}
                    </p>
                    <button className="text-cermat-blue-light font-medium hover:text-cermat-blue-dark hover:underline flex items-center gap-1 transition-colors">
                      Leer más
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-blue-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-cermat-blue-dark mb-4">Lo que dicen nuestras familias</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Testimonios de padres y exalumnos que confían en nuestra institución
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-8 relative border border-blue-100">
                <Quote className="absolute top-6 right-6 w-12 h-12 text-blue-100/50" />
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic relative z-10">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-bold text-cermat-blue-dark">{testimonial.name}</p>
                  <p className="text-sm text-cermat-blue-light">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-cermat-blue-dark mb-6">Visítanos</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <MapPin className="w-6 h-6 text-cermat-blue-dark" />
                  </div>
                  <div>
                    <p className="font-semibold text-cermat-blue-dark mb-1">Dirección</p>
                    <p className="text-gray-600">Jr. Educación 123, Azángaro, Puno, Perú</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Phone className="w-6 h-6 text-cermat-blue-dark" />
                  </div>
                  <div>
                    <p className="font-semibold text-cermat-blue-dark mb-1">Teléfono</p>
                    <p className="text-gray-600">+51 951 234 567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Mail className="w-6 h-6 text-cermat-blue-dark" />
                  </div>
                  <div>
                    <p className="font-semibold text-cermat-blue-dark mb-1">Email</p>
                    <p className="text-gray-600">contacto@cermatschool.edu.pe</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate('/contacto')} className="mt-8" size="lg">
                Enviar mensaje
              </Button>
            </div>
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl ring-4 ring-blue-50">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3931.2662739874387!2d-70.19487!3d-14.91278!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDU0JzQ2LjAiUyA3MMKwMTEnNDEuNSJX!5e0!3m2!1ses!2spe!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Cermat School"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-cermat-blue-dark to-cermat-red text-white">
        <div className="max-w-4xl mx-auto text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6 text-blue-200" />
          <h2 className="text-4xl font-bold mb-6">¿Listo para ser parte de nuestra familia educativa?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Inicia el proceso de admisión y asegura un cupo para el próximo año escolar
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => navigate('/admisiones')}
              variant="secondary"
              size="lg"
              className="bg-white text-cermat-blue-dark hover:bg-blue-50"
            >
              Solicitar Admisión
            </Button>
            <Button
              onClick={() => navigate('/contacto')}
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10"
            >
              Más información
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
