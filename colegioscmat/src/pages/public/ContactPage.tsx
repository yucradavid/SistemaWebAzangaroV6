import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Footer } from '../../components/layout/Footer';
import { SEOHead } from '../../components/seo/SEOHead';

// Clave pública de hCaptcha (demo - reemplazar con la tuya en producción)
const HCAPTCHA_SITE_KEY = '10000000-ffff-ffff-ffff-000000000001';

interface ContactFormData {
  nombre: string;
  email: string;
  telefono: string;
  asunto: string;
  mensaje: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  telefono?: string;
  asunto?: string;
  mensaje?: string;
}

export function ContactPage() {
  const navigate = useNavigate();
  const captchaRef = useRef<HCaptcha>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.telefono.trim()) {
      errors.telefono = 'El teléfono es requerido';
    }

    if (!formData.asunto.trim()) {
      errors.asunto = 'El asunto es requerido';
    }

    if (!formData.mensaje.trim()) {
      errors.mensaje = 'El mensaje es requerido';
    } else if (formData.mensaje.trim().length < 10) {
      errors.mensaje = 'El mensaje debe tener al menos 10 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!captchaToken) {
      setFormErrors(prev => ({ ...prev, mensaje: 'Por favor, completa la verificación de seguridad' }));
      return;
    }

    // TODO: Integrar con backend o servicio de email
    console.log('Formulario de contacto enviado:', formData, 'captcha:', captchaToken);

    setIsSubmitted(true);
    setCaptchaToken(null);
    captchaRef.current?.resetCaptcha();

    setTimeout(() => {
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        asunto: '',
        mensaje: ''
      });
      setIsSubmitted(false);
    }, 5000);
  };

  const onCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const onCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Contacto - Ubicación y Horarios"
        description="Contacta con Cermat School en Azángaro, Puno. Dirección: Jr. Educación 123. Teléfono: +51 951 234 567. Email: contacto@cermatschool.edu.pe. Horario: Lun-Vie 8AM-6PM."
        keywords="contacto cermat school, dirección colegio azángaro, teléfono colegio, ubicación cermat, horarios atención"
        canonicalUrl="/contacto"
      />

      <PublicNavbar />

      {/* Hero */}
      {/* Hero - Full Screen, Centered, Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/contacto-fondo.jpg"
            alt="Fachada del colegio Cermat"
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
              Contáctanos
            </h1>
            <p className="text-lg md:text-2xl text-blue-50 mb-8 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
              Estamos aquí para responder tus preguntas y ayudarte a conocer más sobre nuestra institución
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20 px-6 bg-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card className="p-6 text-center hover:shadow-xl transition-shadow border-t-4 border-cermat-blue-dark">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-cermat-blue-dark" />
              </div>
              <h3 className="font-bold text-cermat-blue-dark mb-2">Dirección</h3>
              <p className="text-gray-600 text-sm">
                Jr. Educación 123<br />
                Azángaro, Puno<br />
                Perú
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-xl transition-shadow border-t-4 border-cermat-blue-light">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-cermat-blue-light" />
              </div>
              <h3 className="font-bold text-cermat-blue-dark mb-2">Teléfono</h3>
              <p className="text-gray-600 text-sm">
                +51 951 234 567<br />
                WhatsApp disponible<br />
                Lun - Vie: 8AM - 6PM
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-xl transition-shadow border-t-4 border-cermat-red">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-cermat-red" />
              </div>
              <h3 className="font-bold text-cermat-blue-dark mb-2">Email</h3>
              <p className="text-gray-600 text-sm">
                contacto@cermatschool.edu.pe<br />
                admisiones@cermatschool.edu.pe<br />
                Respuesta en 24h
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-xl transition-shadow border-t-4 border-amber-500">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-cermat-blue-dark mb-2">Horarios</h3>
              <p className="text-gray-600 text-sm">
                Lunes - Viernes<br />
                8:00 AM - 6:00 PM<br />
                Sábados: 9AM - 1PM
              </p>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-cermat-blue-dark mb-6">Envíanos un mensaje</h2>
              <p className="text-gray-600 mb-8">
                Completa el formulario y nos pondremos en contacto contigo lo antes posible
              </p>

              {isSubmitted ? (
                <Card className="p-8 text-center bg-green-50 border-green-200">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-900 mb-3">¡Mensaje Enviado!</h3>
                  <p className="text-green-800 mb-6">
                    Gracias por contactarnos. Nos comunicaremos contigo pronto.
                  </p>
                  <Button onClick={() => navigate('/')} variant="primary">
                    Volver al inicio
                  </Button>
                </Card>
              ) : (
                <Card className="p-8 border border-blue-100 shadow-md">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-cermat-blue-dark mb-2">
                        Nombre completo *
                      </label>
                      <Input
                        value={formData.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                        placeholder="Tu nombre"
                        className={`bg-white ${formErrors.nombre ? 'border-red-500' : ''}`}
                      />
                      {formErrors.nombre && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.nombre}</p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-cermat-blue-dark mb-2">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="tu@email.com"
                          className={`bg-white ${formErrors.email ? 'border-red-500' : ''}`}
                        />
                        {formErrors.email && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-cermat-blue-dark mb-2">
                          Teléfono *
                        </label>
                        <Input
                          value={formData.telefono}
                          onChange={(e) => handleChange('telefono', e.target.value)}
                          placeholder="+51 987 654 321"
                          className={`bg-white ${formErrors.telefono ? 'border-red-500' : ''}`}
                        />
                        {formErrors.telefono && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.telefono}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cermat-blue-dark mb-2">
                        Asunto *
                      </label>
                      <Input
                        value={formData.asunto}
                        onChange={(e) => handleChange('asunto', e.target.value)}
                        placeholder="¿Sobre qué quieres consultarnos?"
                        className={`bg-white ${formErrors.asunto ? 'border-red-500' : ''}`}
                      />
                      {formErrors.asunto && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.asunto}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-cermat-blue-dark mb-2">
                        Mensaje *
                      </label>
                      <textarea
                        value={formData.mensaje}
                        onChange={(e) => handleChange('mensaje', e.target.value)}
                        rows={5}
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cermat-blue-light focus:border-transparent ${formErrors.mensaje ? 'border-red-500' : 'border-gray-200'
                          }`}
                      />
                      {formErrors.mensaje && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.mensaje}</p>
                      )}
                    </div>

                    {/* hCaptcha */}
                    <div className="flex justify-center">
                      <HCaptcha
                        ref={captchaRef}
                        sitekey={HCAPTCHA_SITE_KEY}
                        onVerify={onCaptchaVerify}
                        onExpire={onCaptchaExpire}
                      />
                    </div>

                    <Button type="submit" className="w-full bg-cermat-blue-dark hover:bg-cermat-blue-light" size="lg" disabled={!captchaToken}>
                      <Send className="w-5 h-5 mr-2" />
                      Enviar Mensaje
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Al enviar este formulario, aceptas nuestra{' '}
                      <button onClick={() => navigate('/privacidad')} className="text-cermat-blue-light hover:underline">
                        política de privacidad
                      </button>
                    </p>
                  </form>
                </Card>
              )}
            </div>

            {/* Map */}
            <div>
              <h2 className="text-3xl font-bold text-cermat-blue-dark mb-6">Nuestra ubicación</h2>
              <p className="text-gray-600 mb-8">
                Visítanos en nuestras instalaciones. Ofrecemos tours guiados con previa cita.
              </p>
              <Card className="overflow-hidden border border-blue-100 shadow-md">
                <div className="relative h-96 ring-4 ring-blue-50">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3931.2662739874387!2d-70.19487!3d-14.91278!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDU0JzQ2LjAiUyA3MMKwMTEnNDEuNSJX!5e0!3m2!1ses!2spe!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación de Cermat School en Azángaro, Puno"
                  ></iframe>
                </div>
                <div className="p-6 bg-blue-50/50">
                  <h3 className="font-bold text-cermat-blue-dark mb-2">Cómo llegar</h3>
                  <p className="text-gray-600 text-sm">
                    Ubicados en el centro de Azángaro, a 3 cuadras de la Plaza de Armas.
                    Cerca a la Municipalidad Provincial y la Iglesia Matriz.
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-blue-50/50 border-cermat-blue-light/20 mt-6">
                <h3 className="font-bold text-cermat-blue-dark mb-3">Tours Guiados</h3>
                <p className="text-blue-900 text-sm mb-4">
                  Agenda una visita guiada para conocer nuestras instalaciones, conversar con docentes
                  y resolver todas tus dudas sobre nuestra propuesta educativa.
                </p>
                <Button onClick={() => navigate('/admisiones')} variant="primary" size="sm" className="bg-cermat-blue-dark">
                  Agendar Visita
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-cermat-blue-dark mb-6">¿Tienes preguntas?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Visita nuestra sección de preguntas frecuentes o solicita información sobre admisiones
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={() => navigate('/admisiones')} variant="primary" size="lg">
              Preguntas Frecuentes
            </Button>
            <Button
              onClick={() => navigate('/niveles')}
              variant="outline"
              size="lg"
              className="text-cermat-blue-dark border-cermat-blue-dark hover:bg-blue-50"
            >
              Conocer Niveles
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}