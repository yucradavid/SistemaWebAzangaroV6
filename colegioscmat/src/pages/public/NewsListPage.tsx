import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Tag, ArrowRight, Newspaper } from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Footer } from '../../components/layout/Footer';
import { supabase } from '../../lib/supabase';
import type { PublicNewsCategory } from '../../lib/database.types';

interface NewsItem {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string;
  image_url: string | null;
  category: PublicNewsCategory;
  author: string;
  published_at: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<PublicNewsCategory, string> = {
  institucional: 'Institucional',
  academico: 'Académico',
  eventos: 'Eventos',
  deportes: 'Deportes',
  tecnologia: 'Tecnología',
  admisiones: 'Admisiones',
  logros: 'Logros',
  comunidad: 'Comunidad',
  otro: 'Otro',
};

export function NewsListPage() {
  const navigate = useNavigate();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PublicNewsCategory | 'all'>('all');

  // Cargar noticias desde Supabase
  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('public_news') as any)
          .select('id, title, slug, excerpt, image_url, category, author, published_at, created_at')
          .eq('status', 'publicado')
          .order('published_at', { ascending: false });

        if (error) throw error;
        setNewsItems(data || []);
      } catch (error) {
        console.error('Error loading news:', error);
        setNewsItems([]);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

  // Filtrar por categoría
  const filteredNews = selectedCategory === 'all'
    ? newsItems
    : newsItems.filter(item => item.category === selectedCategory);

  // Obtener categorías únicas de las noticias disponibles
  const availableCategories = Array.from(new Set(newsItems.map(item => item.category)));

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      {/* Hero - Full Screen, Centered, Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/eventos-fondo.jpg"
            alt="Eventos y actividades escolares"
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
              Noticias y Eventos
            </h1>
            <p className="text-lg md:text-2xl text-blue-50 mb-8 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
              Mantente informado sobre las actividades, logros y eventos de nuestra comunidad educativa
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 px-6 bg-blue-50/30 border-b border-blue-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-5 h-5 text-cermat-blue-dark" />
            <span className="font-medium text-gray-700 mr-4">Categorías:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-cermat-blue-dark text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 hover:border-cermat-blue-light'
              }`}
            >
              Todas
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cermat-blue-dark text-white'
                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 hover:border-cermat-blue-light'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-20 px-6 bg-blue-50/10">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse border border-blue-100">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-6 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-16">
              <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay noticias disponibles</h3>
              <p className="text-gray-500">Vuelve pronto para ver las últimas novedades de nuestra institución.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredNews.map((news) => (
                <Card
                  key={news.id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group border border-blue-100"
                  onClick={() => navigate(`/noticias/${news.slug || news.id}`)}
                >
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    <img
                      src={news.image_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop'}
                      alt={news.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-cermat-blue-dark/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-sm">
                        {CATEGORY_LABELS[news.category]}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-cermat-blue-light mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(news.published_at || news.created_at).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-cermat-blue-dark mb-3 line-clamp-2 group-hover:text-cermat-red transition-colors">
                      {news.title}
                    </h3>
                    <p className="text-gray-600 line-clamp-3 mb-4">
                      {news.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">{news.author}</span>
                      <button className="text-cermat-blue-light font-medium group-hover:text-cermat-blue-dark transition-colors flex items-center gap-1">
                        Leer más
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-cermat-blue-dark mb-6">¿Quieres recibir nuestras noticias?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Síguenos en nuestras redes sociales o suscríbete a nuestro boletín informativo
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => navigate('/admisiones')}
              variant="primary"
              size="lg"
              className="shadow-lg shadow-cermat-red/20"
            >
              Solicitar Admisión
            </Button>
            <Button
              onClick={() => navigate('/contacto')}
              variant="outline"
              size="lg"
              className="text-cermat-blue-dark border-cermat-blue-dark hover:bg-blue-50"
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
