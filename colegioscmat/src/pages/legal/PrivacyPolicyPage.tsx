import { useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, Mail, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Footer } from '../../components/layout/Footer';

export function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="p-2 bg-gradient-to-r from-[#0E3A8A] to-[#C81E1E] rounded-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cermat School</h1>
                <p className="text-xs text-gray-600">Política de Privacidad</p>
              </div>
            </div>

            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              Volver al inicio
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-br from-[#0E3A8A] to-[#1D4ED8] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Política de Privacidad</h1>
          <p className="text-xl text-blue-100">
            Última actualización: Diciembre 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <article className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Introducción</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                En Cermat School, valoramos y respetamos la privacidad de nuestra comunidad educativa. 
                Esta Política de Privacidad describe cómo recopilamos, usamos, protegemos y compartimos 
                la información personal de estudiantes, padres de familia, docentes y visitantes de 
                nuestra plataforma educativa.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">2. Información que Recopilamos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Recopilamos diferentes tipos de información según el rol del usuario:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li><strong>Estudiantes:</strong> Nombre completo, DNI, fecha de nacimiento, dirección, fotografía, información académica (notas, asistencia, evaluaciones)</li>
                <li><strong>Padres/Apoderados:</strong> Nombre, DNI, correo electrónico, teléfono, dirección, relación con el estudiante</li>
                <li><strong>Docentes:</strong> Nombre, DNI, correo electrónico, teléfono, especialidad, cursos asignados</li>
                <li><strong>Visitantes del sitio web:</strong> Información de formularios de contacto, cookies, dirección IP, datos de navegación</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">3. Cómo Usamos la Información</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Gestionar el proceso educativo (matrícula, asistencia, evaluaciones, comunicados)</li>
                <li>Facilitar la comunicación entre docentes, estudiantes y familias</li>
                <li>Gestionar pagos y cobros de pensiones</li>
                <li>Mejorar nuestros servicios educativos y plataforma digital</li>
                <li>Cumplir con obligaciones legales (reporte a MINEDU, SUNAT)</li>
                <li>Enviar notificaciones importantes sobre actividades académicas</li>
                <li>Responder consultas y solicitudes de información</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">4. Protección de Datos de Menores</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Reconocemos la importancia de proteger la información de los menores de edad. 
                Los datos de estudiantes menores de 18 años solo pueden ser accedidos por:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Sus padres o apoderados legales</li>
                <li>Docentes asignados a sus cursos</li>
                <li>Personal administrativo autorizado</li>
                <li>Directivos institucionales</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                No compartimos información de menores con terceros sin el consentimiento explícito 
                de los padres o apoderados, salvo cuando sea requerido por ley.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">5. Compartir Información con Terceros</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Podemos compartir información en los siguientes casos:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li><strong>Entidades gubernamentales:</strong> MINEDU, SUNAT, cuando sea legalmente requerido</li>
                <li><strong>Proveedores de servicios:</strong> Plataformas de pago, servicios de hosting, bajo acuerdos de confidencialidad</li>
                <li><strong>Emergencias:</strong> Servicios médicos o autoridades en caso de emergencia que involucre a un estudiante</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                No vendemos ni alquilamos información personal a terceros.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">6. Seguridad de la Información</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Implementamos medidas de seguridad técnicas y organizativas para proteger la información:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Cifrado de datos sensibles (SSL/TLS)</li>
                <li>Control de acceso basado en roles (RLS - Row Level Security)</li>
                <li>Autenticación segura para acceso al portal</li>
                <li>Copias de seguridad periódicas</li>
                <li>Monitoreo de actividades sospechosas</li>
                <li>Capacitación del personal en protección de datos</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">7. Derechos de los Usuarios</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Los usuarios tienen derecho a:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li><strong>Acceso:</strong> Solicitar copia de su información personal</li>
                <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
                <li><strong>Cancelación:</strong> Solicitar la eliminación de datos (sujeto a obligaciones legales de conservación)</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento de datos en ciertos casos</li>
                <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Para ejercer estos derechos, contactar a: <strong>privacidad@cermatschool.edu.pe</strong>
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">8. Retención de Datos</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Conservamos los datos personales durante el tiempo necesario para cumplir los fines 
                para los que fueron recopilados:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Datos académicos: Durante la permanencia del estudiante + 7 años (requisito MINEDU)</li>
                <li>Datos financieros: 5 años (requisito SUNAT)</li>
                <li>Datos de contacto: Hasta que se solicite su eliminación</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">9. Cookies y Tecnologías Similares</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Utilizamos cookies para mejorar la experiencia del usuario. Consulta nuestra{' '}
                <button onClick={() => navigate('/cookies')} className="text-blue-900 hover:underline font-medium">
                  Política de Cookies
                </button>
                {' '}para más información.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">10. Cambios a esta Política</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Podemos actualizar esta Política de Privacidad periódicamente. Los cambios significativos 
                serán notificados a través del portal y correo electrónico. La fecha de última actualización 
                se indica al inicio de este documento.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">11. Contacto</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para preguntas, consultas o solicitudes relacionadas con esta Política de Privacidad:
              </p>
              <Card className="p-6 bg-blue-50 border-blue-200 mt-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-blue-900 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-blue-900 mb-2">Responsable de Protección de Datos</p>
                    <p className="text-blue-800 text-sm mb-1">Email: privacidad@cermatschool.edu.pe</p>
                    <p className="text-blue-800 text-sm mb-1">Teléfono: +51 951 234 567</p>
                    <p className="text-blue-800 text-sm">Dirección: Jr. Educación 123, Azángaro, Puno</p>
                  </div>
                </div>
              </Card>
            </article>
          </Card>

          {/* Navigation Links */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button onClick={() => navigate('/terminos')} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Ver Términos y Condiciones
            </Button>
            <Button onClick={() => navigate('/cookies')} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Ver Política de Cookies
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
