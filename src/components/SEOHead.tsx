import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

/**
 * SEOHead Component - Dynamic SEO meta tags for each page
 * 
 * Provides:
 * - Unique title and description per page
 * - Open Graph meta tags for social sharing
 * - Twitter Card meta tags
 * - Canonical URL
 * - Keywords meta tag
 */
export const SEOHead = ({
  title,
  description,
  keywords = [],
  image = '/icon-512.png',
  url,
  type = 'website',
  noindex = false
}: SEOHeadProps) => {
  const fullTitle = title.includes('Flowdux') ? title : `${title} | Flowdux`;
  const canonicalUrl = url || `https://app-spark-forge-69.lovable.app${window.location.pathname}`;
  const imageUrl = image.startsWith('http') ? image : `https://app-spark-forge-69.lovable.app${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Flowdux" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@Flowdux" />
    </Helmet>
  );
};
