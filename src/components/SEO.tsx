import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  type?: string;
}

export default function SEO({ 
  title, 
  description, 
  canonical = 'https://fj-bauservice.de', 
  ogImage = 'https://fj-bauservice.de/og-image.jpg',
  type = 'website'
}: SEOProps) {
  const siteName = 'FJ BAUSERVICE';
  const fullTitle = `${title} | ${siteName}`;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "FJ BAUSERVICE",
    "image": "https://fj-bauservice.de/logo.png",
    "@id": "https://fj-bauservice.de",
    "url": "https://fj-bauservice.de",
    "telephone": "+49 176 12345678",
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
      "latitude": 47.8561,
      "longitude": 12.1289
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "07:00",
      "closes": "18:00"
    },
    "sameAs": [
      "https://www.facebook.com/fjbauservice",
      "https://www.instagram.com/fjbauservice"
    ],
    "areaServed": [
      {
        "@type": "City",
        "name": "München"
      },
      {
        "@type": "City",
        "name": "Rosenheim"
      },
      {
        "@type": "City",
        "name": "Miesbach"
      },
      {
        "@type": "City",
        "name": "Wasserburg"
      }
    ]
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

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
      <meta name="language" content="German" />
      <meta name="revisit-after" content="7 days" />

      {/* Schema.org for Google */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}
