-- =====================================================
-- TABLA DE NOTICIAS PÚBLICAS DEL SITIO WEB
-- Para gestionar contenido visible en la página pública
-- =====================================================

-- Habilitar extensión unaccent para quitar acentos en slugs
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Crear tipo ENUM para el estado de la noticia
DO $$ BEGIN
  CREATE TYPE public_news_status AS ENUM ('borrador', 'publicado', 'archivado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Crear tipo ENUM para las categorías
DO $$ BEGIN
  CREATE TYPE public_news_category AS ENUM (
    'institucional', 
    'academico', 
    'eventos', 
    'deportes', 
    'tecnologia', 
    'admisiones', 
    'logros',
    'comunidad',
    'otro'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Crear tabla de noticias públicas
CREATE TABLE IF NOT EXISTS public_news (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text UNIQUE,
  excerpt text NOT NULL,
  content text,
  image_url text,
  category public_news_category NOT NULL DEFAULT 'institucional',
  author text DEFAULT 'Dirección General',
  status public_news_status NOT NULL DEFAULT 'borrador',
  is_featured boolean DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_public_news_status ON public_news(status);
CREATE INDEX IF NOT EXISTS idx_public_news_category ON public_news(category);
CREATE INDEX IF NOT EXISTS idx_public_news_published_at ON public_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_news_is_featured ON public_news(is_featured) WHERE is_featured = true;

-- Habilitar RLS
ALTER TABLE public_news ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Todos pueden leer noticias publicadas
CREATE POLICY "public_news_select_published" ON public_news
  FOR SELECT USING (status = 'publicado');

-- Admins, directores y web_editor pueden ver todas las noticias
CREATE POLICY "public_news_select_all_for_admin" ON public_news
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'director', 'web_editor')
    )
  );

-- Solo admin, director y web_editor pueden insertar
CREATE POLICY "public_news_insert" ON public_news
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'director', 'web_editor')
    )
  );

-- Solo admin, director y web_editor pueden actualizar
CREATE POLICY "public_news_update" ON public_news
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'director', 'web_editor')
    )
  );

-- Solo admin puede eliminar
CREATE POLICY "public_news_delete" ON public_news
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Función para generar slug automático
CREATE OR REPLACE FUNCTION generate_news_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Intentar usar unaccent si está disponible, sino usar el título directamente
    BEGIN
      base_slug := unaccent(NEW.title);
    EXCEPTION WHEN undefined_function THEN
      base_slug := NEW.title;
    END;
    
    -- Limpiar el slug: minúsculas, solo alfanuméricos y guiones
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          base_slug,
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    ) || '-' || substring(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para slug automático
DROP TRIGGER IF EXISTS trigger_generate_news_slug ON public_news;
CREATE TRIGGER trigger_generate_news_slug
  BEFORE INSERT ON public_news
  FOR EACH ROW
  EXECUTE FUNCTION generate_news_slug();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_public_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_public_news_updated_at ON public_news;
CREATE TRIGGER trigger_update_public_news_updated_at
  BEFORE UPDATE ON public_news
  FOR EACH ROW
  EXECUTE FUNCTION update_public_news_updated_at();

-- Insertar datos iniciales de ejemplo
INSERT INTO public_news (title, excerpt, content, image_url, category, author, status, is_featured, published_at)
VALUES 
  (
    'Inicio del Año Escolar 2025',
    'Damos la bienvenida a todos nuestros estudiantes y familias para un nuevo año lleno de aprendizaje y crecimiento.',
    'El año escolar 2025 inicia con renovadas energías y proyectos innovadores. Nuestro compromiso con la excelencia educativa se mantiene firme, ofreciendo a nuestros estudiantes las mejores oportunidades de desarrollo integral.',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
    'institucional',
    'Dirección General',
    'publicado',
    true,
    now() - interval '7 days'
  ),
  (
    'Talleres de Robótica 2025',
    'Inauguramos nuestros nuevos talleres de robótica educativa para primaria y secundaria.',
    'Los estudiantes podrán desarrollar habilidades en programación, diseño y construcción de robots. Este programa busca fomentar el pensamiento computacional y la creatividad en nuestros alumnos.',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop',
    'tecnologia',
    'Área de Innovación',
    'publicado',
    true,
    now() - interval '5 days'
  ),
  (
    'Proceso de Admisión Abierto',
    'Las inscripciones para el proceso de admisión 2026 están abiertas. Conoce los requisitos y fechas importantes.',
    'Ofrecemos becas por rendimiento académico y descuentos por hermanos. No pierdas la oportunidad de formar parte de nuestra comunidad educativa.',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=600&fit=crop',
    'admisiones',
    'Secretaría Académica',
    'publicado',
    true,
    now() - interval '3 days'
  );

SELECT 'Tabla public_news creada exitosamente ✅' as status;
