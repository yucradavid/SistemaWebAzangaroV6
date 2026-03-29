import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  canonicalUrl?: string;
  jsonLd?: object;
}

export function SEOHead({
  title,
  description,
  keywords,
  ogType = 'website',
  ogImage = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=630&fit=crop',
  canonicalUrl,
  jsonLd
}: SEOHeadProps) {
  const fullTitle = `${title} | Cermat School - Azángaro, Perú`;
  const baseUrl = 'https://cermatschool.edu.pe'; // TODO: Replace with actual domain
  const url = canonicalUrl ? `${baseUrl}${canonicalUrl}` : baseUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Cermat School" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="utf-8" />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={url} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Cermat School" />
      <meta property="og:locale" content="es_PE" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Spanish" />
      <meta name="revisit-after" content="7 days" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

      {/* Geo Tags for Azángaro, Puno */}
      <meta name="geo.region" content="PE-PUN" />
      <meta name="geo.placename" content="Azángaro" />
      <meta name="geo.position" content="-14.91278;-70.19487" />
      <meta name="ICBM" content="-14.91278, -70.19487" />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
