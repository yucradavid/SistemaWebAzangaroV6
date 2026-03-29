import { useNavigate } from 'react-router-dom';
import { BookOpen, Palette, Music, Beaker, Globe, Calculator, Users, GraduationCap } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Footer } from '../../components/layout/Footer';
import { SEOHead } from '../../components/seo/SEOHead';

export function LevelsPage() {
  const navigate = useNavigate();

  const levels = [
    {
      name: 'Educación Inicial',
      ageRange: '3 - 5 años',
      icon: Palette,
      color: 'from-pink-500 to-purple-500',
      bgColor: 'bg-pink-50',
      description: 'Estimulación temprana, desarrollo psicomotor y socialización a través del juego.',
      curriculum: [
        'Desarrollo de la psicomotricidad fina y gruesa',
        'Iniciación a la lectoescritura y matemáticas básicas',
        'Expresión artística: dibujo, pintura, música',
        'Valores y formación personal',
        'Inglés inicial mediante canciones y juegos',
        'Educación física y recreación'
      ],
      workshops: ['Música y movimiento', 'Arte y manualidades', 'Cuentacuentos', 'Juegos didácticos']
    },
    {
      name: 'Educación Primaria',
      ageRange: '6 - 11 años',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      description: 'Fortalecimiento de competencias básicas en comunicación, matemáticas, ciencias y formación ciudadana.',
      curriculum: [
        'Comunicación: comprensión lectora y producción de textos',
        'Matemáticas: operaciones, geometría, estadística',
        'Ciencia y Tecnología: método científico, experimentos',
        'Personal Social: historia, geografía, ciudadanía',
        'Inglés: niveles básico a intermedio',
        'Arte, Educación Física y Religión'
      ],
      workshops: ['Robótica educativa', 'Ajedrez', 'Danza folclórica', 'Teatro', 'Deportes']
    },
    {
      name: 'Educación Secundaria',
      ageRange: '12 - 16 años',
      icon: Globe,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      description: 'Preparación integral para la educación superior y desarrollo de competencias para el siglo XXI.',
      curriculum: [
        'Comunicación: análisis literario, argumentación',
        'Matemáticas: álgebra, geometría analítica, trigonometría',
        'Ciencias: Biología, Física, Química',
        'Ciencias Sociales: Historia del Perú y universal, Economía',
        'Inglés: nivel intermedio a avanzado',
        'Desarrollo Personal, Ciudadanía, Arte, Educación Física'
      ],
      workshops: ['Laboratorio de ciencias', 'Programación', 'Oratoria y debate', 'Liderazgo', 'Emprendimiento']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Niveles Educativos - Inicial, Primaria y Secundaria"
        description="Educación integral en Cermat School: Nivel Inicial (3-5 años), Primaria (6-11 años) y Secundaria (12-16 años). Malla curricular completa, talleres de robótica, inglés y más."
        keywords="educación inicial azángaro, primaria azángaro, secundaria puno, niveles educativos, talleres escolares, robótica educativa"
        canonicalUrl="/niveles"
      />

      <PublicNavbar />

      {/* Hero */}
      {/* Hero - Full Screen, Centered, Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/niveles-fondo.jpg"
            alt="Estudiantes aprendiendo en aulas modernas"
            className="w-full h-full object-cover animate-fade-in-scale"
          />
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-cermat-blue-dark/90 via-transparent to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <div className="max-w-4xl mx-auto text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
              Nuestros Niveles Educativos
            </h1>
            <p className="text-lg md:text-2xl text-blue-50 mb-8 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
              Formación integral desde la primera infancia hasta la preparación para la educación superior
            </p>
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="py-20 px-6 bg-blue-50/30">
        <div className="max-w-7xl mx-auto space-y-20">
          {levels.map((level, index) => {
            const Icon = level.icon;
            return (
              <div key={index} className="space-y-8">
                {/* Level Header */}
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${level.color} mb-6 shadow-lg shadow-current/20`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold text-cermat-blue-dark mb-3">{level.name}</h2>
                  <p className="text-xl text-cermat-blue-light mb-4">{level.ageRange}</p>
                  <p className="text-lg text-gray-700 max-w-3xl mx-auto">{level.description}</p>
                </div>

                {/* Content Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Curriculum */}
                  <Card className={`p-8 ${level.bgColor} border-2 border-transparent hover:border-cermat-blue-light/20 transition-all`}>
                    <div className="flex items-center gap-3 mb-6">
                      <Calculator className="w-8 h-8 text-cermat-blue-dark" />
                      <h3 className="text-2xl font-bold text-cermat-blue-dark">Malla Curricular</h3>
                    </div>
                    <ul className="space-y-3">
                      {level.curriculum.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-2 h-2 bg-cermat-blue-light rounded-full mt-2"></span>
                          <span className="text-gray-800">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>

                  {/* Workshops */}
                  <Card className="p-8 bg-white border border-blue-100 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-6">
                      <Beaker className="w-8 h-8 text-cermat-blue-dark" />
                      <h3 className="text-2xl font-bold text-cermat-blue-dark">Talleres Extracurriculares</h3>
                    </div>
                    <div className="space-y-4">
                      {level.workshops.map((workshop, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg group hover:bg-cermat-blue-dark hover:text-white transition-colors">
                          <Music className="w-5 h-5 text-cermat-blue-light group-hover:text-white transition-colors" />
                          <span className="font-medium text-gray-800 group-hover:text-white transition-colors">{workshop}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800 font-medium">
                        Los talleres están incluidos en la pensión mensual y son opcionales según el interés del estudiante.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-cermat-blue-dark mb-12 text-center">
            ¿Por qué elegir Cermat School?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-t-4 border-cermat-blue-dark">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-cermat-blue-dark" />
              </div>
              <h3 className="text-xl font-bold text-cermat-blue-dark mb-3">Grupos Reducidos</h3>
              <p className="text-gray-600">
                Máximo 25 estudiantes por aula para garantizar atención personalizada y seguimiento cercano.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-t-4 border-cermat-red">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-cermat-red" />
              </div>
              <h3 className="text-xl font-bold text-cermat-blue-dark mb-3">Inglés desde Inicial</h3>
              <p className="text-gray-600">
                Programa de inglés desde los 3 años con docentes especializados y metodología comunicativa.
              </p>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-shadow border-t-4 border-cermat-blue-light">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Beaker className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-cermat-blue-dark mb-3">Laboratorios Equipados</h3>
              <p className="text-gray-600">
                Laboratorios de ciencias, cómputo y robótica para aprendizaje práctico y experimental.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-cermat-blue-dark to-cermat-red text-white">
        <div className="max-w-4xl mx-auto text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-6 text-blue-200" />
          <h2 className="text-4xl font-bold mb-6">¿Listo para conocer más?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Agenda una visita guiada o inicia el proceso de admisión
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
              Agendar Visita
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
