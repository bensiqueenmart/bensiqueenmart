import React from 'react';
import { useCatalog } from '../context/CatalogContext';
import { BUSINESS, DELIVERY } from '../config/siteContent';

export const StructuredData: React.FC = () => {
  const { products } = useCatalog();

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'GroceryStore',
        '@id': `${BUSINESS.websiteUrl}/#store`,
        'name': BUSINESS.storeName,
        'description':
          `Quality pulses, lentils, spices, cooking oils, nuts, dry fruits and grocery provisions in ${BUSINESS.city}.`,
        'image': `${BUSINESS.websiteUrl}${BUSINESS.logoUrl}`,
        'logo': `${BUSINESS.websiteUrl}${BUSINESS.logoUrl}`,
        'url': `${BUSINESS.websiteUrl}/`,
        'telephone': `+${BUSINESS.ownerWhatsappNumber}`,
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': BUSINESS.streetAddress,
          'addressLocality': BUSINESS.city,
          'postalCode': BUSINESS.pincode,
          'addressRegion': BUSINESS.state,
          'addressCountry': 'IN',
        },
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': BUSINESS.geo.lat,
          'longitude': BUSINESS.geo.lng,
        },
        'openingHoursSpecification': [
          {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            'opens': BUSINESS.openTime,
            'closes': BUSINESS.closeTime,
          },
        ],
        'currenciesAccepted': 'INR',
        'paymentAccepted': 'Cash, UPI, WhatsApp Pay upon Delivery',
        'areaServed': DELIVERY.areas,
      },
      {
        '@type': 'WebSite',
        '@id': `${BUSINESS.websiteUrl}/#website`,
        'url': `${BUSINESS.websiteUrl}/`,
        'name': BUSINESS.storeName,
        'description': 'Quality Pulses, Spices, Nuts & Everyday Grocery Essentials',
        'publisher': { '@id': `${BUSINESS.websiteUrl}/#store` },
        'inLanguage': ['en-IN', 'ta-IN'],
      },
      ...(products.length > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${BUSINESS.websiteUrl}/#catalog`,
              'name': 'Bensi Queen Grocery Catalogue',
              'numberOfItems': products.length,
              'itemListElement': products.map((prod, index) => ({
                '@type': 'ListItem',
                'position': index + 1,
                'item': {
                  '@type': 'Product',
                  'name': `${prod.name}${prod.tamilName ? ` (${prod.tamilName})` : ''}`,
                  'description': prod.description,
                  'image': prod.image,
                  'category': prod.category,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
