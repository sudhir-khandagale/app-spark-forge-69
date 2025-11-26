import { Helmet } from 'react-helmet-async';

interface ProductStructuredDataProps {
  product: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    price: number;
    currency?: string;
    rating?: number;
    reviewCount?: number;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  };
  store: {
    name: string;
    url?: string;
  };
}

interface StoreStructuredDataProps {
  store: {
    id: string;
    name: string;
    description?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    rating?: number;
    reviewCount?: number;
    image?: string;
    hours?: any;
  };
}

/**
 * ProductStructuredData - Schema.org Product markup
 * Helps search engines understand product information for rich snippets
 */
export const ProductStructuredData = ({ product, store }: ProductStructuredDataProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} available at ${store.name}`,
    "image": product.image || '/icon-512.png',
    "offers": {
      "@type": "Offer",
      "url": `https://app-spark-forge-69.lovable.app/product/${product.id}`,
      "priceCurrency": product.currency || "INR",
      "price": product.price,
      "availability": `https://schema.org/${product.availability || 'InStock'}`,
      "seller": {
        "@type": "LocalBusiness",
        "name": store.name,
        "url": store.url || `https://app-spark-forge-69.lovable.app/store/${store.name}`
      }
    },
    ...(product.rating && product.reviewCount && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviewCount
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

/**
 * StoreStructuredData - Schema.org LocalBusiness markup
 * Helps search engines understand store information for local search
 */
export const StoreStructuredData = ({ store }: StoreStructuredDataProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://app-spark-forge-69.lovable.app/store/${store.id}`,
    "name": store.name,
    "description": store.description || `Local store offering products in your area`,
    "image": store.image || '/icon-512.png',
    "address": {
      "@type": "PostalAddress",
      "streetAddress": store.address
    },
    ...(store.latitude && store.longitude && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": store.latitude,
        "longitude": store.longitude
      }
    }),
    ...(store.phone && { "telephone": store.phone }),
    ...(store.email && { "email": store.email }),
    ...(store.rating && store.reviewCount && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": store.rating,
        "reviewCount": store.reviewCount
      }
    }),
    ...(store.hours && { "openingHours": store.hours })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

/**
 * WebsiteStructuredData - Schema.org WebSite markup for the homepage
 * Enables search box in search results
 */
export const WebsiteStructuredData = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Flowdux",
    "url": "https://app-spark-forge-69.lovable.app",
    "description": "Find products in local stores instantly. Search real-time inventory, compare prices, and navigate to retailers with items in stock.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://app-spark-forge-69.lovable.app/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

/**
 * BreadcrumbStructuredData - Schema.org BreadcrumbList markup
 * Helps search engines understand page hierarchy
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbStructuredDataProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbStructuredData = ({ items }: BreadcrumbStructuredDataProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
