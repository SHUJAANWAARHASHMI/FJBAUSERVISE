import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  type?: string;
  faq?: { q: string, a: string }[];
}

export default function SEO({ 
  title, 
  description, 
  canonical = 'https://www.fj-bauservice.com', 
  ogImage = 'https://www.fj-bauservice.com/favicon.png',
  type = 'website',
  faq
}: SEOProps) {
  const siteName = 'FJ BAUSERVICE';
  const fullTitle = `${title} | ${siteName}`;

  const schemaData: any = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "FJ BAUSERVICE",
      "image": "https://www.fj-bauservice.com/favicon.png",
      "@id": "https://www.fj-bauservice.com",
      "url": "https://www.fj-bauservice.com",
      "telephone": "+49 159 06142923",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Bahnhofstraße 9",
        "addressLocality": "Rosenheim",
        "postalCode": "83022",
        "addressRegion": "Bayern",
        "addressCountry": "DE"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 47.8564,
        "longitude": 12.1289
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      },
      "areaServed": [
        { "@type": "City", "name": "München" },
        { "@type": "City", "name": "Rosenheim" },
        { "@type": "State", "name": "Bayern" }
      ]
    }
  ];

  if (faq && faq.length > 0) {
    schemaData.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faq.map(item => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      }))
    });
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <html lang="de" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Robots and Indexing */}
      <meta name="robots" content="index, follow" />

      {/* Schema.org for Google */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}
