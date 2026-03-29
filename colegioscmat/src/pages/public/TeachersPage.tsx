import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, BookOpen } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Footer } from '../../components/layout/Footer';

interface Teacher {
  id: number;
  name: string;
  specialty: string;
  courses: string[];
  photo: string;
  email: string;
  description: string;
}

export function TeachersPage() {
  const navigate = useNavigate();

  // Mock data - estructura lista para integración futura con BD
  const teachers: Teacher[] = [
    {
      id: 1,
      name: 'María Elena Quispe',
      specialty: 'Educación Inicial',
      courses: ['Estimulación Temprana', 'Psicomotricidad', 'Inicial 4 años'],
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      email: 'mquispe@cermatschool.edu.pe',
      description: '15 años de experiencia en educación inicial. Especialista en metodología Montessori.'
    },
    {
      id: 2,
      name: 'Carlos Mendoza Torres',
      specialty: 'Matemáticas - Secundaria',
      courses: ['Álgebra', 'Geometría', 'Trigonometría'],
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      email: 'cmendoza@cermatschool.edu.pe',
      description: '12 años de experiencia. Ganador de reconocimiento regional por innovación pedagógica.'
    },
    {
      id: 3,
      name: 'Ana Lucía Flores',
      specialty: 'Comunicación - Primaria',
      courses: ['Comprensión Lectora', 'Producción de Textos', 'Literatura'],
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
      email: 'aflores@cermatschool.edu.pe',
      description: '10 años promoviendo el amor por la lectura. Magíster en Didáctica de la Lengua.'
    },
    {
      id: 4,
      name: 'José Luis Huamán',
      specialty: 'Ciencias Naturales',
      courses: ['Biología', 'Química', 'Ciencia y Tecnología'],
      photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
      email: 'jhuaman@cermatschool.edu.pe',
      description: 'Biólogo con 8 años en docencia. Coordinador del laboratorio de ciencias.'
    },
    {
      id: 5,
      name: 'Patricia Rojas Vega',
      specialty: 'Inglés - Todos los niveles',
      courses: ['English A1-B2', 'Cambridge Preparation'],
      photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop',
      email: 'projas@cermatschool.edu.pe',
      description: 'Certificación TESOL. 9 años enseñando inglés con enfoque comunicativo.'
    },
    {
      id: 6,
      name: 'Roberto Sánchez Luna',
      specialty: 'Historia y Geografía',
      courses: ['Historia del Perú', 'Historia Universal', 'Geografía'],
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
      email: 'rsanchez@cermatschool.edu.pe',
      description: 'Licenciado en Historia. 14 años formando consciencia ciudadana.'
    },
    {
      id: 7,
      name: 'Laura Gutiérrez Díaz',
      specialty: 'Educación Física',
      courses: ['Educación Física', 'Deportes', 'Recreación'],
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      email: 'lgutierrez@cermatschool.edu.pe',
      description: 'Entrenadora certificada. 7 años promoviendo hábitos saludables y trabajo en equipo.'
    },
    {
      id: 8,
      name: 'Miguel Vargas Castro',
      specialty: 'Tecnología y Robótica',
      courses: ['Computación', 'Robótica Educativa', 'Programación'],
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      email: 'mvargas@cermatschool.edu.pe',
      description: 'Ingeniero de Sistemas. 6 años acercando la tecnología a los estudiantes.'
    },
    {
      id: 9,
      name: 'Sandra Puma Quispe',
      specialty: 'Arte y Cultura',
      courses: ['Artes Plásticas', 'Música', 'Danza'],
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      email: 'spuma@cermatschool.edu.pe',
      description: 'Artista plástica. 11 años desarrollando la creatividad y expresión artística.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      {/* Hero - Full Screen, Centered, Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/docentes-fondo.jpg"
            alt="Equipo docente de Cermat School"
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
              Nuestro Equipo Docente
            </h1>
            <p className="text-lg md:text-2xl text-blue-50 mb-8 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
              Profesionales comprometidos con la excelencia educativa y el desarrollo integral de cada estudiante
            </p>
          </div>
        </div>
      </section>

      {/* Teachers Grid */}
      <section className="py-20 px-6 bg-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Contamos con un equipo multidisciplinario de {teachers.length} docentes titulados,
              con experiencia comprobada y en constante capacitación para brindar educación de calidad.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="overflow-hidden hover:shadow-xl transition-shadow border border-blue-100">
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden group">
                  <img
                    src={teacher.photo}
                    alt={`Foto de ${teacher.name}, docente de ${teacher.specialty}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cermat-blue-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <span className="text-white font-medium">Ver perfil completo</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-cermat-blue-dark mb-2">{teacher.name}</h3>
                  <p className="text-cermat-blue-light font-semibold mb-4">{teacher.specialty}</p>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                    {teacher.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span className="font-medium">Cursos:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {teacher.courses.map((course, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-cermat-blue-dark text-xs font-medium rounded-full border border-blue-100"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
                    <Mail className="w-4 h-4 text-cermat-blue-light" />
                    <a
                      href={`mailto:${teacher.email}`}
                      className="hover:text-cermat-blue-dark hover:underline transition-colors"
                    >
                      {teacher.email}
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-cermat-blue-dark mb-12 text-center">
            Nuestro Compromiso Docente
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-t-4 border-cermat-blue-dark">
              <div className="text-4xl font-bold text-cermat-blue-dark mb-2">100%</div>
              <p className="text-gray-600">Docentes titulados y colegiados</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-t-4 border-emerald-500">
              <div className="text-4xl font-bold text-emerald-600 mb-2">12+</div>
              <p className="text-gray-600">Años de experiencia promedio</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-t-4 border-purple-500">
              <div className="text-4xl font-bold text-purple-600 mb-2">25</div>
              <p className="text-gray-600">Estudiantes máximo por aula</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow border-t-4 border-cermat-red">
              <div className="text-4xl font-bold text-cermat-red mb-2">80h</div>
              <p className="text-gray-600">Capacitación anual por docente</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 px-6 bg-blue-50/50">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-blue-50 border-cermat-blue-light/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <GraduationCap className="w-64 h-64 text-cermat-blue-dark" />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-cermat-blue-dark mb-4">Proceso de Selección Riguroso</h3>
              <p className="text-blue-900 mb-4 leading-relaxed">
                Todos nuestros docentes pasan por un proceso de selección que evalúa no solo sus
                competencias académicas, sino también sus habilidades pedagógicas, compromiso con
                los valores institucionales y capacidad para conectar con los estudiantes.
              </p>
              <p className="text-blue-900 leading-relaxed">
                Además, participan en programas de capacitación continua, talleres de actualización
                pedagógica y reciben acompañamiento constante para garantizar la excelencia en el aula.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-cermat-blue-dark to-cermat-red text-white">
        <div className="max-w-4xl mx-auto text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-6 text-blue-200" />
          <h2 className="text-4xl font-bold mb-6">¿Quieres conocer a nuestro equipo?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Agenda una visita y conversa directamente con nuestros docentes
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
