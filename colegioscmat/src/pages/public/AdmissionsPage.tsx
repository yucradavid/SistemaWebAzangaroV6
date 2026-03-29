import { useState } from 'react';
import { Calendar, DollarSign, HelpCircle, Send, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { Card } from '../../components/ui/Card';
import { Footer } from '../../components/layout/Footer';
import { SEOHead } from '../../components/seo/SEOHead';
import { EnrollmentApplicationForm } from '../../components/admissions/EnrollmentApplicationForm';

export function AdmissionsPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const schedule = [
    { etapa: 'Inscripción', fechaInicio: '01 Feb 2025', fechaFin: '28 Feb 2025' },
    { etapa: 'Evaluación de ingreso', fechaInicio: '03 Mar 2025', fechaFin: '10 Mar 2025' },
    { etapa: 'Entrevista personal', fechaInicio: '11 Mar 2025', fechaFin: '15 Mar 2025' },
    { etapa: 'Publicación de resultados', fechaInicio: '20 Mar 2025', fechaFin: '20 Mar 2025' },
    { etapa: 'Matrícula', fechaInicio: '25 Mar 2025', fechaFin: '05 Abr 2025' }
  ];

  const requirements = [
    'Partida de nacimiento original (1 copia)',
    'DNI del estudiante y ambos padres (copias)',
    'Certificado de estudios del año anterior (original)',
    'Constancia de no adeudo de la institución anterior',
    'Ficha de matrícula (se entrega en secretaría)',
    '4 fotos tamaño carnet a color',
    'Certificado de salud actualizado',
    'Certificado de vacunación (para inicial y primaria)'
  ];

  const costs = [
    {
      nivel: 'Inicial',
      matricula: 'S/ 200',
      pension: 'S/ 350',
      anual: 'S/ 3,700'
    },
    {
      nivel: 'Primaria',
      matricula: 'S/ 250',
      pension: 'S/ 400',
      anual: 'S/ 4,250'
    },
    {
      nivel: 'Secundaria',
      matricula: 'S/ 300',
      pension: 'S/ 450',
      anual: 'S/ 4,800'
    }
  ];

  const faqs = [
    {
      question: '¿Cuál es la edad mínima para postular?',
      answer: 'Para Inicial (3 años): 3 años cumplidos al 31 de marzo. Para Primaria: 6 años cumplidos al 31 de marzo. Para Secundaria: seguir la edad correspondiente según grado.'
    },
    {
      question: '¿Hay becas o descuentos disponibles?',
      answer: 'Sí, ofrecemos becas parciales por rendimiento académico (hasta 30%) y descuentos por hermanos (15% desde el segundo hijo). También tenemos convenios con algunas instituciones.'
    },
    {
      question: '¿Cuál es el proceso de evaluación?',
      answer: 'La evaluación incluye una prueba de conocimientos acorde al nivel, una entrevista con el tutor y una entrevista familiar. Todo el proceso dura aproximadamente 2 horas.'
    },
    {
      question: '¿Puedo visitar el colegio antes de inscribirme?',
      answer: 'Por supuesto. Ofrecemos tours guiados de lunes a viernes de 9:00 a 11:00 AM y de 3:00 a 5:00 PM. Por favor, agenda tu visita llamando al +51 951 234 567.'
    },
    {
      question: '¿Qué incluye la pensión mensual?',
      answer: 'La pensión incluye: enseñanza académica, uso de laboratorios y biblioteca, plataforma digital, seguro escolar contra accidentes, y talleres extracurriculares básicos.'
    },
    {
      question: '¿Hay cupos limitados?',
      answer: 'Sí, manejamos grupos de máximo 25 estudiantes por aula para garantizar atención personalizada. Los cupos se asignan por orden de inscripción y aprobación del proceso.'
    }
  ];



  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Admisiones 2025 - Proceso de Inscripción"
        description="Proceso de admisión 2025 en Cermat School. Conoce requisitos, cronograma, costos, becas y FAQ. Solicita información para matricular a tu hijo en nuestro colegio en Azángaro."
        keywords="admisión cermat school, matrícula azángaro, inscripción colegio, becas educativas, costos matrícula puno"
        canonicalUrl="/admisiones"
      />

      <PublicNavbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/admision-fondo.jpg"
            alt="Proceso de Admisión Cermat School"
            className="w-full h-full object-cover animate-fade-in-scale"
          />
          {/* Overlay gradient to ensure text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-cermat-blue-dark/90 via-transparent to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">
          <div className="max-w-4xl mx-auto text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
              Proceso de Admisión 2025
            </h1>
            <p className="text-xl md:text-2xl text-blue-50 leading-relaxed font-medium drop-shadow-md">
              Únete a nuestra familia educativa. Conoce los requisitos, fechas y costos para el ingreso.
            </p>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 px-6 bg-blue-50/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-cermat-blue-dark mb-12 text-center">Requisitos de Admisión</h2>
          <Card className="p-8 border-t-4 border-cermat-blue-dark">
            <div className="grid md:grid-cols-2 gap-4">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-cermat-blue-light flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{req}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-cermat-blue-dark">
                <strong>Nota importante:</strong> Todos los documentos deben estar en buen estado y ser legibles.
                Para estudiantes que provienen de otras regiones, se requiere certificado de traslado.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-12">
            <Calendar className="w-10 h-10 text-cermat-blue-dark" />
            <h2 className="text-4xl font-bold text-cermat-blue-dark">Cronograma 2025</h2>
          </div>
          <Card className="p-8 border-t-4 border-cermat-red">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-cermat-blue-dark">Etapa</th>
                    <th className="text-left py-4 px-4 font-semibold text-cermat-blue-dark">Fecha Inicio</th>
                    <th className="text-left py-4 px-4 font-semibold text-cermat-blue-dark">Fecha Fin</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-blue-50/50">
                      <td className="py-4 px-4 font-medium text-gray-900">{item.etapa}</td>
                      <td className="py-4 px-4 text-gray-700">{item.fechaInicio}</td>
                      <td className="py-4 px-4 text-gray-700">{item.fechaFin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Costs */}
      <section className="py-20 px-6 bg-blue-50/30">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-12">
            <DollarSign className="w-10 h-10 text-cermat-red" />
            <h2 className="text-4xl font-bold text-cermat-blue-dark">Costos y Becas</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {costs.map((cost, index) => (
              <Card key={index} className={`p-6 hover:shadow-xl transition-shadow border-t-4 ${index === 0 ? 'border-cermat-blue-light' : index === 1 ? 'border-cermat-blue-dark' : 'border-cermat-red'
                }`}>
                <h3 className="text-2xl font-bold text-cermat-blue-dark mb-6 text-center">{cost.nivel}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Matrícula</span>
                    <span className="font-bold text-gray-900">{cost.matricula}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Pensión mensual</span>
                    <span className="font-bold text-gray-900">{cost.pension}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-900 font-semibold">Total anual</span>
                    <span className="font-bold text-cermat-blue-dark text-lg">{cost.anual}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-6 bg-blue-50 border-blue-100 shadow-sm">
            <h4 className="font-bold text-cermat-blue-dark mb-3">Becas y Descuentos Disponibles</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Beca por rendimiento académico:</strong> Hasta 30% de descuento en pensión</li>
              <li>• <strong>Descuento por hermanos:</strong> 15% desde el segundo hijo</li>
              <li>• <strong>Becas sociales:</strong> Evaluación de casos especiales (cupos limitados)</li>
              <li>• <strong>Pago anticipado:</strong> 10% de descuento por pago anual adelantado</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-12">
            <HelpCircle className="w-10 h-10 text-cermat-blue-light" />
            <h2 className="text-4xl font-bold text-cermat-blue-dark">Preguntas Frecuentes</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden border border-blue-100">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between hover:bg-blue-50 transition-colors"
                >
                  <h3 className="font-semibold text-cermat-blue-dark text-left">{faq.question}</h3>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-cermat-blue-light flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 bg-blue-50/30">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enrollment Application Form */}
      <section className="py-20 px-6 bg-blue-50/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
              <Send className="w-10 h-10 text-cermat-blue-dark" />
            </div>
            <h2 className="text-4xl font-bold text-cermat-blue-dark mb-4">Solicitud de Matrícula</h2>
            <p className="text-lg text-gray-600">
              Completa el formulario con los datos del estudiante y del apoderado. Te contactaremos en 24-48 horas.
            </p>
          </div>

          <EnrollmentApplicationForm />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
