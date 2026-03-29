import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, Award, Calendar, MapPin, Mail, Phone, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePortalClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cermat-blue-dark rounded-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-cermat-blue-dark">Cermat School</h1>
                <p className="text-xs text-gray-500">Azángaro, Perú</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#nosotros" className="text-gray-600 hover:text-cermat-blue-dark transition-colors font-medium">Nosotros</a>
              <a href="#niveles" className="text-gray-600 hover:text-cermat-blue-dark transition-colors font-medium">Niveles</a>
              <a href="#admision" className="text-gray-600 hover:text-cermat-blue-dark transition-colors font-medium">Admisión</a>
              <a href="#contacto" className="text-gray-600 hover:text-cermat-blue-dark transition-colors font-medium">Contacto</a>
            </div>

            <Button onClick={handlePortalClick} size="sm" className="bg-cermat-blue-dark hover:bg-cermat-blue-light">
              {user ? 'Ir al Dashboard' : 'Ingresar al Portal'}
            </Button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-cermat-blue-dark via-cermat-blue-light to-cermat-red text-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Educación clara, gestión simple y pagos al día
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Plataforma escolar integral para la comunidad educativa de Cermat School.
              Conectamos estudiantes, familias y docentes en un solo lugar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handlePortalClick}
                variant="secondary"
                size="lg"
                icon={<ChevronRight />}
                className="bg-white text-cermat-blue-dark hover:bg-blue-50"
              >
                {user ? 'Acceder al Panel' : 'Acceder al Portal'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="!bg-transparent !text-white border-white hover:!bg-white/10"
              >
                Proceso de admisión
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="nosotros" className="py-20 px-6 bg-[#F1F5F9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-[#0F172A] mb-4">Nuestra institución</h3>
            <p className="text-lg text-[#334155] max-w-2xl mx-auto">
              Más de 30 años formando líderes con valores en Azángaro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0F172A] mb-3">Misión</h4>
              <p className="text-[#334155]">
                Formar estudiantes íntegros con excelencia académica, valores sólidos y
                compromiso social para el desarrollo de nuestra región.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1D4ED8] to-[#C81E1E] rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0F172A] mb-3">Visión</h4>
              <p className="text-[#334155]">
                Ser la institución educativa líder en Azángaro, reconocida por la calidad
                de nuestros egresados y nuestra innovación pedagógica.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-[#C81E1E] to-[#EF4444] rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0F172A] mb-3">Valores</h4>
              <p className="text-[#334155]">
                Respeto, responsabilidad, honestidad, solidaridad y perseverancia
                guían cada acción en nuestra comunidad educativa.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="niveles" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-[#0F172A] mb-4">Niveles educativos</h3>
            <p className="text-lg text-[#334155]">
              Ofrecemos educación de calidad en todos los niveles
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                level: 'Inicial',
                ages: '3 a 5 años',
                description: 'Desarrollo integral a través del juego y la exploración',
                color: 'from-blue-500 to-blue-600',
              },
              {
                level: 'Primaria',
                ages: '6 a 11 años',
                description: 'Formación de competencias básicas y valores fundamentales',
                color: 'from-[#1D4ED8] to-[#0E3A8A]',
              },
              {
                level: 'Secundaria',
                ages: '12 a 16 años',
                description: 'Preparación para la educación superior y la vida ciudadana',
                color: 'from-[#0E3A8A] to-[#C81E1E]',
              },
            ].map((level) => (
              <div key={level.level} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                <div className={`h-32 bg-gradient-to-br ${level.color} flex items-center justify-center`}>
                  <GraduationCap className="w-16 h-16 text-white" />
                </div>
                <div className="p-6">
                  <h4 className="text-2xl font-bold text-[#0F172A] mb-2">{level.level}</h4>
                  <p className="text-sm text-[#C81E1E] font-medium mb-3">{level.ages}</p>
                  <p className="text-[#334155]">{level.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="admision" className="py-20 px-6 bg-[#F1F5F9]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#0E3A8A] to-[#C81E1E] p-12 text-white text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-4">Admisión 2025</h3>
              <p className="text-xl text-blue-100">
                ¡Inscripciones abiertas! Forma parte de nuestra familia educativa
              </p>
            </div>
            <div className="p-12">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-[#0F172A] mb-2">Requisitos:</h4>
                  <ul className="list-disc list-inside text-[#334155] space-y-1">
                    <li>Partida de nacimiento original</li>
                    <li>DNI del estudiante y apoderados</li>
                    <li>Certificado de estudios (traslados)</li>
                    <li>Constancia de no adeudo (traslados)</li>
                    <li>3 fotos tamaño carné</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0F172A] mb-2">Proceso:</h4>
                  <ol className="list-decimal list-inside text-[#334155] space-y-1">
                    <li>Presentación de documentos</li>
                    <li>Entrevista con la familia</li>
                    <li>Evaluación del estudiante (primaria y secundaria)</li>
                    <li>Matrícula</li>
                  </ol>
                </div>
                <div className="pt-6">
                  <Button size="lg" fullWidth>
                    Iniciar proceso de admisión
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-[#0F172A] mb-4">Contáctanos</h3>
            <p className="text-lg text-[#334155]">
              Estamos aquí para responder tus consultas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#F1F5F9] rounded-xl">
                  <MapPin className="w-6 h-6 text-[#0E3A8A]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#0F172A] mb-1">Dirección</h4>
                  <p className="text-[#334155]">
                    Jr. Principal 123, Azángaro<br />
                    Puno, Perú
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#F1F5F9] rounded-xl">
                  <Phone className="w-6 h-6 text-[#0E3A8A]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#0F172A] mb-1">Teléfono</h4>
                  <p className="text-[#334155]">
                    +51 951 234 567<br />
                    +51 980 123 456
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#F1F5F9] rounded-xl">
                  <Mail className="w-6 h-6 text-[#0E3A8A]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#0F172A] mb-1">Email</h4>
                  <p className="text-[#334155]">
                    informes@cermatschool.edu.pe<br />
                    admision@cermatschool.edu.pe
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#F1F5F9] rounded-2xl p-8">
              <h4 className="text-xl font-bold text-[#0F172A] mb-6">Envíanos un mensaje</h4>
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#CBD5E1] focus:border-[#1D4ED8] focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#CBD5E1] focus:border-[#1D4ED8] focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#CBD5E1] focus:border-[#1D4ED8] focus:outline-none"
                />
                <textarea
                  placeholder="Mensaje"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#CBD5E1] focus:border-[#1D4ED8] focus:outline-none resize-none"
                />
                <Button size="lg" fullWidth>
                  Enviar mensaje
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#0F172A] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="w-8 h-8" />
            <span className="text-xl font-bold">Cermat School</span>
          </div>
          <p className="text-gray-400 mb-4">
            Educación de calidad para el futuro de Azángaro
          </p>
          <p className="text-sm text-gray-500">
            © 2025 Cermat School. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
