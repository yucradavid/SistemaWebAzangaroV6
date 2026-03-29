import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, ArrowLeft, Share2, User } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Footer } from '../../components/layout/Footer';

interface NewsDetail {
  id: number;
  title: string;
  date: string;
  category: string;
  author: string;
  image: string;
  content: string[];
}

export function NewsDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Mock data - estructura lista para integración futura con BD
  const newsData: Record<string, NewsDetail> = {
    '1': {
      id: 1,
      title: 'Inicio del Año Escolar 2025',
      date: '2025-01-15',
      category: 'Institucional',
      author: 'Dirección General',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=600&fit=crop',
      content: [
        'Damos la bienvenida a todos nuestros estudiantes y familias para un nuevo año lleno de aprendizaje y crecimiento. El año escolar 2025 inicia con renovadas energías y proyectos innovadores que buscan fortalecer la calidad educativa de nuestra institución.',
        'Este año académico trae consigo importantes mejoras en infraestructura, incluyendo la renovación de laboratorios de ciencias y cómputo, así como la implementación de nuevos espacios recreativos para nuestros estudiantes.',
        'Nuestro equipo directivo ha diseñado un plan de trabajo enfocado en tres pilares fundamentales: excelencia académica, formación en valores y desarrollo de competencias para el siglo XXI.',
        'Invitamos a todas las familias a participar activamente en las actividades programadas para este año. La educación es una responsabilidad compartida entre escuela y hogar, y juntos lograremos que nuestros estudiantes alcancen su máximo potencial.',
        'Las clases iniciaron con total normalidad el 1 de marzo, con una ceremonia de bienvenida que contó con la participación de autoridades locales, padres de familia y toda la comunidad educativa.',
        'Agradecemos la confianza depositada en nuestra institución y reafirmamos nuestro compromiso con la formación integral de cada uno de nuestros estudiantes.'
      ]
    },
    '2': {
      id: 2,
      title: 'Talleres de Robótica 2025',
      date: '2025-02-01',
      category: 'Tecnología',
      author: 'Área de Innovación',
      image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&h=600&fit=crop',
      content: [
        'Con gran entusiasmo inauguramos nuestros nuevos talleres de robótica educativa para estudiantes de primaria y secundaria. Esta iniciativa forma parte de nuestro compromiso con la innovación pedagógica y el desarrollo de habilidades tecnológicas desde edades tempranas.',
        'Los talleres están equipados con kits de robótica LEGO Education, Arduino y materiales de programación adaptados a cada nivel educativo. Los estudiantes aprenderán conceptos fundamentales de programación, diseño, construcción y solución de problemas.',
        'Para primaria, el enfoque será lúdico y experimental, utilizando robots educativos que permitirán a los niños comprender la lógica de la programación mientras se divierten. En secundaria, los estudiantes trabajarán con proyectos más complejos que incluyen sensores, motores y programación avanzada.',
        'El taller será dirigido por el profesor Miguel Vargas, ingeniero de sistemas con certificación en robótica educativa, quien cuenta con 6 años de experiencia en enseñanza tecnológica.',
        'Los horarios serán: Primaria (4° a 6°) los miércoles de 3:00 a 4:30 PM, y Secundaria (1° a 5°) los viernes de 3:00 a 4:30 PM. Las inscripciones están abiertas y los cupos son limitados.',
        'Esta iniciativa no solo busca enseñar tecnología, sino también fomentar el pensamiento crítico, la creatividad, el trabajo en equipo y la perseverancia ante los desafíos.'
      ]
    },
    '3': {
      id: 3,
      title: 'Proceso de Admisión Abierto',
      date: '2025-02-10',
      category: 'Admisiones',
      author: 'Secretaría Académica',
      image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&h=600&fit=crop',
      content: [
        'Las inscripciones para el proceso de admisión 2026 están oficialmente abiertas. Invitamos a todas las familias interesadas en formar parte de nuestra comunidad educativa a conocer nuestro proceso, requisitos y fechas importantes.',
        'El proceso de admisión consta de cuatro etapas: inscripción (hasta el 28 de febrero), evaluación de ingreso (3-10 de marzo), entrevista personal (11-15 de marzo) y publicación de resultados (20 de marzo). La matrícula se realizará del 25 de marzo al 5 de abril.',
        'Ofrecemos becas parciales por rendimiento académico de hasta 30% de descuento en la pensión mensual. También contamos con descuentos por hermanos del 15% desde el segundo hijo y becas sociales para casos especiales, sujetas a evaluación socioeconómica.',
        'Los requisitos incluyen: partida de nacimiento, DNI del estudiante y padres, certificado de estudios del año anterior, constancia de no adeudo, ficha de matrícula, 4 fotos carnet, certificado de salud y certificado de vacunación (para inicial y primaria).',
        'Para mayor información, pueden comunicarse con nuestra secretaría al teléfono +51 951 234 567, escribir al correo admisiones@cermatschool.edu.pe, o visitar nuestras instalaciones de lunes a viernes de 9:00 AM a 5:00 PM.',
        'También ofrecemos tours guiados para que las familias puedan conocer nuestras instalaciones, conversar con docentes y resolver todas sus dudas. Los tours se realizan con previa cita.',
        '¡Los esperamos! Ser parte de Cermat School es iniciar un camino de excelencia educativa, valores y oportunidades para el futuro de sus hijos.'
      ]
    }
  };

  const news = newsData[id || '1'] || newsData['1'];

  const relatedNews = [
    { id: 2, title: 'Talleres de Robótica 2025', category: 'Tecnología' },
    { id: 4, title: 'Día del Logro - Exposición de Proyectos', category: 'Eventos' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Back Button */}
      <section className="pt-32 pb-8 px-6 bg-blue-50/30">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/noticias')}
            className="flex items-center gap-2 text-cermat-blue-dark hover:underline font-medium hover:text-cermat-blue-light transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a noticias
          </button>
        </div>
      </section>

      {/* Article Header */}
      <section className="pb-12 px-6 bg-blue-50/30">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-cermat-blue-dark text-white text-sm font-bold rounded-full shadow-md">
              {news.category}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-cermat-blue-dark mb-6 leading-tight">
            {news.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-600 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cermat-blue-light" />
              {new Date(news.date).toLocaleDateString('es-PE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-cermat-blue-light" />
              {news.author}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="hover:bg-blue-50">
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="pb-12 px-6 bg-blue-50/30">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-xl ring-4 ring-white">
            <img
              src={news.image}
              alt={news.title}
              className="w-full h-96 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-lg max-w-none prose-headings:text-cermat-blue-dark prose-a:text-cermat-blue-light">
            {news.content.map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-6 block">
                {paragraph}
              </p>
            ))}
          </article>
        </div>
      </section>

      {/* Related News */}
      <section className="py-20 px-6 bg-blue-50/20 border-t border-blue-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-cermat-blue-dark mb-8">Noticias Relacionadas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {relatedNews.map((item) => (
              <Card
                key={item.id}
                className="p-6 hover:shadow-xl transition-shadow cursor-pointer border border-blue-100 group"
                onClick={() => navigate(`/noticias/${item.id}`)}
              >
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-50 text-cermat-blue-dark text-xs font-bold rounded-full">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-cermat-blue-dark mb-3 group-hover:text-cermat-red transition-colors">{item.title}</h3>
                <button className="text-cermat-blue-light font-medium group-hover:underline flex items-center gap-1">
                  Leer más
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button onClick={() => navigate('/noticias')} variant="outline" size="lg" className="border-cermat-blue-dark text-cermat-blue-dark hover:bg-blue-50">
              Ver todas las noticias
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-cermat-blue-dark to-cermat-red text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/10 p-4 rounded-full inline-block mb-6 backdrop-blur-sm">
            <Calendar className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-6">¿Interesado en formar parte de nuestra comunidad?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Conoce nuestro proceso de admisión y agenda una visita
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
              Contactar
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
