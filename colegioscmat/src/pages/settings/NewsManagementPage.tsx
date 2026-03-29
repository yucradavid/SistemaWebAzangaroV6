//src/pages/settings/NewsManagementPage.tsx
import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Search,
  Newspaper, Calendar, User, Image, CheckCircle,
  Clock, Archive, Star, ExternalLink, X,
  FileText, Tag, Eye
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import type { PublicNewsStatus, PublicNewsCategory } from '../../lib/database.types';

interface PublicNews {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string;
  content: string | null;
  image_url: string | null;
  category: PublicNewsCategory;
  author: string;
  status: PublicNewsStatus;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES: { value: PublicNewsCategory; label: string; color: string }[] = [
  { value: 'institucional', label: 'Institucional', color: 'bg-blue-50 text-blue-700 border border-blue-100' },
  { value: 'academico', label: 'Académico', color: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
  { value: 'eventos', label: 'Eventos', color: 'bg-pink-50 text-pink-700 border border-pink-100' },
  { value: 'deportes', label: 'Deportes', color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  { value: 'tecnologia', label: 'Tecnología', color: 'bg-cyan-50 text-cyan-700 border border-cyan-100' },
  { value: 'admisiones', label: 'Admisiones', color: 'bg-orange-50 text-orange-700 border border-orange-100' },
  { value: 'logros', label: 'Logros', color: 'bg-yellow-50 text-yellow-700 border border-yellow-100' },
  { value: 'comunidad', label: 'Comunidad', color: 'bg-violet-50 text-violet-700 border border-violet-100' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-50 text-gray-700 border border-gray-100' },
];

const STATUS_OPTIONS: { value: PublicNewsStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'borrador', label: 'Borrador', icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-gray-100 text-gray-600 border border-gray-200' },
  { value: 'publicado', label: 'Publicado', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
  { value: 'archivado', label: 'Archivado', icon: <Archive className="w-3.5 h-3.5" />, color: 'bg-red-50 text-red-600 border border-red-200' },
];

export function NewsManagementPage() {
  const [news, setNews] = useState<PublicNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PublicNewsStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<PublicNewsCategory | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<PublicNews | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image_url: '',
    category: 'institucional' as PublicNewsCategory,
    author: 'Dirección General',
    status: 'borrador' as PublicNewsStatus,
    is_featured: false,
  });

  useEffect(() => { loadNews(); }, []);

  async function loadNews() {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('public_news') as any)
        .select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const newsData = {
        title: formData.title, excerpt: formData.excerpt,
        content: formData.content || null, image_url: formData.image_url || null,
        category: formData.category, author: formData.author,
        status: formData.status, is_featured: formData.is_featured,
        published_at: formData.status === 'publicado' ? new Date().toISOString() : null,
      };
      if (editingNews) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('public_news') as any).update(newsData).eq('id', editingNews.id);
        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from('public_news') as any).insert(newsData);
        if (error) throw error;
      }
      await loadNews();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving news:', error);
      alert('Error al guardar la noticia');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta noticia?')) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('public_news') as any).delete().eq('id', id);
      if (error) throw error;
      await loadNews();
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  }

  async function toggleFeatured(newsItem: PublicNews) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('public_news') as any)
        .update({ is_featured: !newsItem.is_featured }).eq('id', newsItem.id);
      if (error) throw error;
      await loadNews();
    } catch (error) {
      console.error('Error updating featured:', error);
    }
  }

  async function quickPublish(newsItem: PublicNews) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('public_news') as any)
        .update({ status: 'publicado', published_at: new Date().toISOString() }).eq('id', newsItem.id);
      if (error) throw error;
      await loadNews();
    } catch (error) {
      console.error('Error publishing:', error);
    }
  }

  function handleEdit(newsItem: PublicNews) {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title, excerpt: newsItem.excerpt,
      content: newsItem.content || '', image_url: newsItem.image_url || '',
      category: newsItem.category, author: newsItem.author,
      status: newsItem.status, is_featured: newsItem.is_featured,
    });
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingNews(null);
    setFormData({
      title: '', excerpt: '', content: '', image_url: '',
      category: 'institucional', author: 'Dirección General',
      status: 'borrador', is_featured: false,
    });
  }

  const filteredNews = news.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    let matchesDate = true;
    if (dateFilter) {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0];
      matchesDate = itemDate === dateFilter;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  const stats = {
    total: news.length,
    published: news.filter(n => n.status === 'publicado').length,
    drafts: news.filter(n => n.status === 'borrador').length,
    featured: news.filter(n => n.is_featured).length,
  };

  function getCategoryBadge(category: PublicNewsCategory) {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${cat.color}`}>{cat.label}</span>
    ) : null;
  }

  function getStatusBadge(status: PublicNewsStatus) {
    const stat = STATUS_OPTIONS.find(s => s.value === status);
    return stat ? (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${stat.color}`}>
        {stat.icon}{stat.label}
      </span>
    ) : null;
  }

  return (
    <div className="space-y-6">

      {/* 1. New Header Structure */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-6 pb-4 border-b border-gray-100">

        {/* Left: Compact Stats Cards (No textual header) */}
        <div className="flex flex-wrap gap-3 flex-1">
          {[
            { icon: Newspaper, value: stats.total, label: 'TOTAL' },
            { icon: CheckCircle, value: stats.published, label: 'PUBLICADAS' },
            { icon: Clock, value: stats.drafts, label: 'BORRADORES' },
            { icon: Star, value: stats.featured, label: 'DESTACADAS' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-100 shadow-sm min-w-[130px] flex-1">
              <div className="p-1.5 bg-gray-50 rounded-md">
                <stat.icon className="w-4 h-4 text-cermat-blue-dark" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 leading-none">{stat.value}</span>
                <span className="text-[10px] font-semibold text-gray-400 tracking-wider text-left">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 md:flex-initial md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-cermat-blue-dark/20 focus:border-cermat-blue-dark transition-all placeholder:text-gray-400"
            />
          </div>

          <Button onClick={() => setShowModal(true)} className="gap-2 bg-cermat-blue-dark text-white hover:bg-cermat-blue-dark/90 shadow-sm border border-transparent">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Noticia</span>
          </Button>
        </div>
      </div>

      {/* 2. Secondary Filters & Date Picker */}
      <div className="flex flex-wrap justify-end gap-3 items-center">

        {/* Date Filter Popover */}
        <div className="relative">
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`flex items-center gap-2 px-4 py-2 bg-white border rounded-full text-xs font-semibold transition-all shadow-sm hover:shadow-md ${dateFilter ? 'border-cermat-blue-dark text-cermat-blue-dark ring-1 ring-cermat-blue-dark/20' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {dateFilter ? new Date(dateFilter).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Filtrar por fecha'}
            {dateFilter && <X className="w-3 h-3 hover:bg-gray-100 rounded-full" onClick={(e) => { e.stopPropagation(); setDateFilter(''); }} />}
          </button>

          {showDateFilter && (
            <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in-up">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Seleccionar Periodo</h4>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setDateFilter(new Date().toISOString().split('T')[0]); setShowDateFilter(false); }} className="px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-cermat-blue-dark hover:text-white rounded-lg transition-colors text-left flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Hoy
                  </button>
                  <button onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() - 1);
                    setDateFilter(d.toISOString().split('T')[0]);
                    setShowDateFilter(false);
                  }} className="px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-cermat-blue-dark hover:text-white rounded-lg transition-colors text-left flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>Ayer
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-50">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha Específica</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setShowDateFilter(false); }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-cermat-blue-dark/20 focus:border-cermat-blue-dark outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button onClick={() => { setDateFilter(''); setShowDateFilter(false); }} className="text-xs text-gray-400 hover:text-red-500 font-medium">Limpiar filtro</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories (Styled Select) */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Tag className="w-3.5 h-3.5 text-gray-400 group-focus-within:text-cermat-blue-dark transition-colors" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as PublicNewsCategory | 'all')}
            className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 focus:ring-2 focus:ring-cermat-blue-dark/20 focus:border-cermat-blue-dark outline-none appearance-none cursor-pointer hover:border-gray-300 shadow-sm transition-all min-w-[160px]"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        {/* Status (Styled Select) */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className={`w-2 h-2 rounded-full ${statusFilter === 'all' ? 'bg-gray-300' : STATUS_OPTIONS.find(s => s.value === statusFilter)?.color.split(' ')[0].replace('bg-', 'bg-') || 'bg-gray-300'}`}></div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PublicNewsStatus | 'all')}
            className="pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 focus:ring-2 focus:ring-cermat-blue-dark/20 focus:border-cermat-blue-dark outline-none appearance-none cursor-pointer hover:border-gray-300 shadow-sm transition-all min-w-[150px]"
          >
            <option value="all">Todos los estados</option>
            {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* 3. News Grid with Staggered Animation */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-cermat-blue-dark border-t-transparent rounded-full"></div>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-gray-200">
          <Newspaper className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No se encontraron noticias</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item, index) => (
            <div
              key={item.id}
              className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              {/* Image Area - Clean, no gradient overlay unless hover */}
              <div className="relative h-48 overflow-hidden bg-gray-50">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Image className="w-12 h-12 opacity-20" />
                  </div>
                )}

                {/* Minimalist Top Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {item.is_featured && (
                    <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm text-yellow-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  {getStatusBadge(item.status)}
                </div>
              </div>

              {/* Content Area - High Contrast, Institutional Blue */}
              <div className="p-5 flex flex-col h-[calc(100%-12rem)]">
                <div className="mb-3">
                  {getCategoryBadge(item.category)}
                </div>

                <h3 className="text-lg font-bold text-cermat-blue-dark mb-2 leading-tight group-hover:text-cermat-blue-light transition-colors">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                  {item.excerpt}
                </p>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[80px]">{item.author}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  {/* Hover Actions - Slide in from right or fade in */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => toggleFeatured(item)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-yellow-500 transition-colors" title="Destacar"><Star className={`w-4 h-4 ${item.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} /></button>
                    <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-cermat-blue-dark transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clean Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-cermat-blue-dark">
                {editingNews ? 'Editar Noticia' : 'Nueva Noticia'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Form Layout */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:ring-2 focus:ring-cermat-blue-dark/10 focus:border-cermat-blue-dark transition-all font-medium"
                    placeholder="Escribe el título aquí..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categoría</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as PublicNewsCategory })}
                      className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-gray-700 focus:bg-white focus:ring-2 focus:ring-cermat-blue-dark/10 focus:border-cermat-blue-dark"
                    >
                      {CATEGORIES.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as PublicNewsStatus })}
                      className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-gray-700 focus:bg-white focus:ring-2 focus:ring-cermat-blue-dark/10 focus:border-cermat-blue-dark"
                    >
                      {STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Resumen</label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-gray-700 focus:bg-white focus:ring-2 focus:ring-cermat-blue-dark/10 focus:border-cermat-blue-dark resize-none"
                    placeholder="Una breve descripción..."
                  />
                </div>

                {/* Advanced Toggle */}
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-cermat-blue-light hover:text-cermat-blue-dark">
                    <span>Mostrar más opciones (Contenido, Imagen, Autor)</span>
                  </summary>
                  <div className="mt-4 space-y-4 pl-2 border-l-2 border-gray-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Contenido HTML</label>
                      <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={4} className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-gray-700 focus:bg-white focus:ring-2 focus:ring-cermat-blue-dark/10 focus:border-cermat-blue-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">URL Imagen</label>
                      <input type="url" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-gray-700 focus:bg-white focus:ring-2 focus:ring-cermat-blue-dark/10 focus:border-cermat-blue-dark" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Autor</label>
                      <input type="text" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-gray-700 focus:bg-white focus:ring-2 focus:ring-cermat-blue-dark/10 focus:border-cermat-blue-dark" />
                    </div>
                    <label className="flex items-center gap-2 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="rounded text-cermat-blue-dark focus:ring-cermat-blue-dark" />
                      <span className="text-sm font-medium text-gray-700">Destacar esta noticia</span>
                    </label>
                  </div>
                </details>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModal} className="text-gray-600 border-gray-300 hover:bg-white">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !formData.title} className="bg-cermat-blue-dark text-white hover:bg-cermat-blue-dark/90 shadow-sm">
                {saving ? 'Guardando...' : editingNews ? 'Actualizar Noticia' : 'Crear Noticia'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
