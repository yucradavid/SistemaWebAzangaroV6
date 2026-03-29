import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileText, Mail, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Footer } from '../../components/layout/Footer';

export function TermsConditionsPage() {
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
                <p className="text-xs text-gray-600">Términos y Condiciones</p>
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
          <FileText className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Términos y Condiciones</h1>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Aceptación de los Términos</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Al acceder y utilizar la plataforma educativa de Cermat School (el "Portal"), 
                usted acepta estar sujeto a estos Términos y Condiciones, nuestra Política de Privacidad 
                y todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos 
                términos, no debe usar este Portal.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">2. Descripción del Servicio</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                El Portal de Cermat School es una plataforma educativa digital que proporciona:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Gestión académica (notas, asistencia, evaluaciones, tareas)</li>
                <li>Comunicación entre docentes, estudiantes y familias</li>
                <li>Gestión financiera (estado de cuenta, pagos en línea)</li>
                <li>Información institucional y noticias</li>
                <li>Acceso a recursos educativos</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">3. Registro y Cuentas de Usuario</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Para acceder a ciertas funciones del Portal, debe crear una cuenta. Al crear una cuenta, 
                usted se compromete a:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Proporcionar información veraz, precisa y completa</li>
                <li>Mantener actualizada su información de contacto</li>
                <li>Mantener la confidencialidad de su contraseña</li>
                <li>No compartir su cuenta con terceros</li>
                <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                <li>Ser responsable de todas las actividades realizadas bajo su cuenta</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">4. Uso Aceptable del Portal</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Al usar el Portal, usted acepta:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li><strong>Permitido:</strong> Usar el Portal solo para fines educativos legítimos relacionados con las actividades de Cermat School</li>
                <li><strong>Prohibido:</strong> Usar el Portal para acosar, intimidar o dañar a otros miembros de la comunidad educativa</li>
                <li><strong>Prohibido:</strong> Intentar acceder a áreas restringidas o cuentas de otros usuarios</li>
                <li><strong>Prohibido:</strong> Subir contenido inapropiado, ofensivo, ilegal o que viole derechos de terceros</li>
                <li><strong>Prohibido:</strong> Interferir con el funcionamiento del Portal o su infraestructura</li>
                <li><strong>Prohibido:</strong> Realizar ingeniería inversa, descompilar o intentar extraer código fuente</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">5. Obligaciones Académicas</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Los estudiantes y padres de familia se comprometen a:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Revisar regularmente el Portal para actualizaciones, tareas y comunicados</li>
                <li>Cumplir con los plazos de entrega de tareas y trabajos</li>
                <li>Mantener comunicación activa con docentes y personal administrativo</li>
                <li>Reportar errores o discrepancias en información académica dentro de 5 días hábiles</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">6. Obligaciones Financieras</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Los padres/apoderados se comprometen a:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Pagar puntualmente la matrícula y pensiones según cronograma establecido</li>
                <li>Revisar mensualmente el estado de cuenta en el Portal</li>
                <li>Solicitar becas o descuentos formalmente y con anticipación</li>
                <li>Ponerse al día con pagos atrasados antes de fin de año escolar</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                El incumplimiento de obligaciones de pago puede resultar en:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Retención de certificados y constancias</li>
                <li>No renovación de matrícula para el siguiente año</li>
                <li>Intereses moratorios según normativa vigente</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">7. Propiedad Intelectual</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Todo el contenido del Portal, incluyendo textos, gráficos, logos, imágenes, videos, 
                materiales educativos y software, es propiedad de Cermat School o sus licenciantes y 
                está protegido por leyes de propiedad intelectual.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                Los usuarios pueden:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Descargar y usar materiales educativos solo para uso personal/académico</li>
                <li>Citar contenido con la debida atribución</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Los usuarios NO pueden:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Reproducir, distribuir o comercializar contenido del Portal</li>
                <li>Modificar o crear obras derivadas sin autorización</li>
                <li>Eliminar marcas de copyright o avisos de propiedad</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">8. Limitación de Responsabilidad</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Cermat School se esfuerza por mantener el Portal funcionando correctamente, pero no 
                garantiza que:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>El Portal estará disponible 24/7 sin interrupciones</li>
                <li>Toda la información esté libre de errores</li>
                <li>El Portal esté libre de virus o componentes dañinos</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Cermat School no será responsable por:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Daños indirectos, incidentales o consecuenciales</li>
                <li>Pérdida de datos debido a fallas técnicas</li>
                <li>Interrupciones de servicio por mantenimiento o causas fuera de nuestro control</li>
              </ul>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">9. Suspensión y Terminación</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Cermat School se reserva el derecho de:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Suspender o terminar cuentas que violen estos Términos</li>
                <li>Modificar, suspender o descontinuar cualquier parte del Portal</li>
                <li>Rechazar el servicio a cualquier usuario</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Al finalizar la relación educativa (graduación o retiro), el acceso al Portal puede ser 
                limitado o revocado, aunque se conservará acceso a certificados históricos.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">10. Modificaciones a los Términos</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Cermat School puede actualizar estos Términos y Condiciones en cualquier momento. 
                Los cambios significativos serán notificados a través del Portal y correo electrónico. 
                El uso continuado del Portal después de los cambios constituye aceptación de los nuevos términos.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">11. Ley Aplicable y Jurisdicción</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Estos Términos se rigen por las leyes de la República del Perú. 
                Cualquier disputa se resolverá en los tribunales de Azángaro, Puno, Perú.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">12. Contacto</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para preguntas sobre estos Términos y Condiciones:
              </p>
              <Card className="p-6 bg-blue-50 border-blue-200 mt-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-blue-900 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-blue-900 mb-2">Departamento Legal - Cermat School</p>
                    <p className="text-blue-800 text-sm mb-1">Email: legal@cermatschool.edu.pe</p>
                    <p className="text-blue-800 text-sm mb-1">Teléfono: +51 951 234 567</p>
                    <p className="text-blue-800 text-sm">Dirección: Jr. Educación 123, Azángaro, Puno</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-yellow-50 border-yellow-300 mt-8">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-yellow-900 mb-2">Importante</p>
                    <p className="text-yellow-800 text-sm">
                      Al utilizar el Portal de Cermat School, usted reconoce haber leído, entendido y 
                      aceptado estar sujeto a estos Términos y Condiciones en su totalidad.
                    </p>
                  </div>
                </div>
              </Card>
            </article>
          </Card>

          {/* Navigation Links */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button onClick={() => navigate('/privacidad')} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Ver Política de Privacidad
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
