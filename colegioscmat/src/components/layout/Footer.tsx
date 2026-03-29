import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-[#0E3A8A] to-[#C81E1E] rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Cermat School</h3>
                <p className="text-xs text-gray-400">Azángaro, Perú</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Institución educativa comprometida con la excelencia académica y la formación integral de nuestros estudiantes.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Visitar página de Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
                aria-label="Visitar página de Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors"
                aria-label="Visitar página de Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Visitar canal de YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h4 className="text-white font-bold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-white transition-colors"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/niveles')}
                  className="hover:text-white transition-colors"
                >
                  Niveles Educativos
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/docentes')}
                  className="hover:text-white transition-colors"
                >
                  Nuestro Equipo
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/noticias')}
                  className="hover:text-white transition-colors"
                >
                  Noticias y Eventos
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/admisiones')}
                  className="hover:text-white transition-colors"
                >
                  Admisiones
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/contacto')}
                  className="hover:text-white transition-colors"
                >
                  Contacto
                </button>
              </li>
            </ul>
          </div>

          {/* Portal */}
          <div>
            <h4 className="text-white font-bold mb-4">Portal Educativo</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/login')}
                  className="hover:text-white transition-colors"
                >
                  Acceso al Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/privacidad')}
                  className="hover:text-white transition-colors"
                >
                  Política de Privacidad
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/terminos')}
                  className="hover:text-white transition-colors"
                >
                  Términos y Condiciones
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/cookies')}
                  className="hover:text-white transition-colors"
                >
                  Política de Cookies
                </button>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-white font-bold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Jr. Educación 123, Azángaro, Puno, Perú</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href="tel:+51951234567" className="hover:text-white transition-colors">
                  +51 951 234 567
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:contacto@cermatschool.edu.pe" className="hover:text-white transition-colors">
                  contacto@cermatschool.edu.pe
                </a>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">
                <strong className="text-white">Horario:</strong><br />
                Lun - Vie: 8:00 AM - 6:00 PM<br />
                Sábados: 9:00 AM - 1:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} Cermat School. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <button
                onClick={() => navigate('/privacidad')}
                className="hover:text-white transition-colors"
              >
                Privacidad
              </button>
              <span>•</span>
              <button
                onClick={() => navigate('/terminos')}
                className="hover:text-white transition-colors"
              >
                Términos
              </button>
              <span>•</span>
              <button
                onClick={() => navigate('/cookies')}
                className="hover:text-white transition-colors"
              >
                Cookies
              </button>
              <span>•</span>
              <span>Hecho con ❤️ en Perú</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
