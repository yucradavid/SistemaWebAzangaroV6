import { useNavigate } from 'react-router-dom';
import { GraduationCap, Cookie, Settings, Mail, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Footer } from '../../components/layout/Footer';

export function CookiesPolicyPage() {
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
                <p className="text-xs text-gray-600">Política de Cookies</p>
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
          <Cookie className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Política de Cookies</h1>
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
              <h2 className="text-3xl font-bold text-gray-900 mb-6">1. ¿Qué son las Cookies?</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (computadora, 
                tablet o teléfono móvil) cuando visita un sitio web. Las cookies permiten que el sitio web 
                reconozca su dispositivo y recuerde información sobre su visita, como sus preferencias y 
                configuraciones.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">2. ¿Cómo Usamos las Cookies?</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                El Portal de Cermat School utiliza cookies para mejorar la experiencia del usuario y 
                garantizar el correcto funcionamiento de la plataforma educativa.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">3. Tipos de Cookies que Utilizamos</h2>
              
              <div className="space-y-8 mb-8">
                <Card className="p-6 bg-blue-50 border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-3">🔐 Cookies Estrictamente Necesarias</h3>
                  <p className="text-blue-800 mb-3">
                    Estas cookies son esenciales para el funcionamiento del Portal y no se pueden desactivar.
                  </p>
                  <ul className="list-disc list-inside text-blue-800 space-y-2">
                    <li><strong>Autenticación:</strong> Mantienen su sesión activa después de iniciar sesión</li>
                    <li><strong>Seguridad:</strong> Protegen contra ataques y accesos no autorizados</li>
                    <li><strong>Navegación:</strong> Permiten moverse entre páginas sin perder su sesión</li>
                  </ul>
                  <p className="text-sm text-blue-700 mt-3 italic">
                    Duración: Sesión (se eliminan al cerrar el navegador) o hasta 30 días
                  </p>
                </Card>

                <Card className="p-6 bg-green-50 border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-3">⚙️ Cookies Funcionales</h3>
                  <p className="text-green-800 mb-3">
                    Estas cookies mejoran la funcionalidad y personalización del Portal.
                  </p>
                  <ul className="list-disc list-inside text-green-800 space-y-2">
                    <li><strong>Preferencias de usuario:</strong> Idioma, tamaño de fuente, tema (claro/oscuro)</li>
                    <li><strong>Configuración del portal:</strong> Vistas favoritas, filtros guardados</li>
                    <li><strong>Reproducción de video:</strong> Volumen, calidad de video</li>
                  </ul>
                  <p className="text-sm text-green-700 mt-3 italic">
                    Duración: Hasta 12 meses
                  </p>
                </Card>

                <Card className="p-6 bg-purple-50 border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-3">📊 Cookies Analíticas</h3>
                  <p className="text-purple-800 mb-3">
                    Estas cookies nos ayudan a entender cómo los usuarios interactúan con el Portal.
                  </p>
                  <ul className="list-disc list-inside text-purple-800 space-y-2">
                    <li><strong>Estadísticas de uso:</strong> Páginas más visitadas, tiempo de navegación</li>
                    <li><strong>Rendimiento:</strong> Velocidad de carga, errores técnicos</li>
                    <li><strong>Patrones de navegación:</strong> Flujo de usuarios, clics, interacciones</li>
                  </ul>
                  <p className="text-sm text-purple-700 mt-3 italic">
                    Duración: Hasta 24 meses. Proveedores: Google Analytics (anonimizado)
                  </p>
                </Card>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">4. Cookies de Terceros</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Algunos servicios externos pueden instalar cookies en su dispositivo:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li><strong>Google Maps:</strong> Para mostrar mapas de ubicación (página de contacto)</li>
                <li><strong>Plataformas de pago:</strong> Para procesar transacciones financieras de forma segura</li>
                <li><strong>Servicios de autenticación:</strong> Para iniciar sesión de forma segura</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                Estos terceros tienen sus propias políticas de privacidad. Recomendamos revisarlas.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">5. ¿Qué Datos Recopilan las Cookies?</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Las cookies pueden recopilar:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Dirección IP (parcialmente anonimizada)</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Páginas visitadas y tiempo de permanencia</li>
                <li>Fecha y hora de las visitas</li>
                <li>Preferencias de configuración</li>
                <li>Identificador de sesión</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-6">
                <strong>Importante:</strong> Las cookies NO recopilan información personal identificable 
                como nombre, email o contraseñas. Tampoco acceden a archivos en su dispositivo.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">6. Gestionar las Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Usted puede controlar y/o eliminar las cookies según su preferencia:
              </p>

              <div className="space-y-6 mb-8">
                <Card className="p-6 bg-gray-50 border-gray-300">
                  <div className="flex items-start gap-4">
                    <Settings className="w-6 h-6 text-gray-700 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Configuración del Navegador</h4>
                      <p className="text-gray-700 text-sm mb-3">
                        Todos los navegadores permiten administrar cookies. Acceda a la configuración de su navegador:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                        <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                        <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                        <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
                        <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-yellow-50 border-yellow-300">
                  <p className="text-yellow-900 font-semibold mb-2">⚠️ Advertencia</p>
                  <p className="text-yellow-800 text-sm">
                    Bloquear o eliminar cookies puede afectar la funcionalidad del Portal. 
                    Algunas características pueden no funcionar correctamente, y es posible que 
                    necesite iniciar sesión cada vez que visite el sitio.
                  </p>
                </Card>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">7. Cookies y Privacidad de Menores</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Las cookies utilizadas en cuentas de estudiantes menores de edad solo recopilan 
                datos necesarios para el funcionamiento del Portal educativo. No se utilizan cookies 
                publicitarias ni de seguimiento en cuentas de menores.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">8. Actualizaciones de esta Política</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Podemos actualizar esta Política de Cookies para reflejar cambios en la tecnología 
                o en las leyes aplicables. Le notificaremos sobre cambios significativos mediante 
                un aviso en el Portal.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">9. Consentimiento</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Al continuar navegando en el Portal después de ver el aviso de cookies, 
                usted consiente el uso de cookies según lo descrito en esta política.
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-12">10. Más Información y Contacto</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para preguntas sobre nuestra Política de Cookies:
              </p>
              <Card className="p-6 bg-blue-50 border-blue-200 mt-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-blue-900 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-blue-900 mb-2">Departamento de Privacidad</p>
                    <p className="text-blue-800 text-sm mb-1">Email: privacidad@cermatschool.edu.pe</p>
                    <p className="text-blue-800 text-sm mb-1">Teléfono: +51 951 234 567</p>
                    <p className="text-blue-800 text-sm">Dirección: Jr. Educación 123, Azángaro, Puno</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gray-100 border-gray-300 mt-8">
                <h4 className="font-bold text-gray-900 mb-3">Recursos Útiles</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
                  <li><a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">AboutCookies.org</a> - Información sobre cookies</li>
                  <li><a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">AllAboutCookies.org</a> - Cómo administrar cookies</li>
                  <li><a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline">YourOnlineChoices.eu</a> - Control de publicidad en línea</li>
                </ul>
              </Card>
            </article>
          </Card>

          {/* Navigation Links */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button onClick={() => navigate('/privacidad')} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Ver Política de Privacidad
            </Button>
            <Button onClick={() => navigate('/terminos')} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Ver Términos y Condiciones
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
