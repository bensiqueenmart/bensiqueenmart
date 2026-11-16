import React from 'react';
import { ALL_PRODUCTS } from '../data/products';
import { STORE_CONFIG } from '../config/storeConfig';

export const StructuredData: React.FC = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'GroceryStore',
        '@id': 'https://bensiqueen.com/#store',
        'name': 'Bensi Queen',
        'description':
          'Quality pulses, lentils, spices, cooking oils, nuts, dry fruits and grocery provisions in Chitlapakkam, Chennai.',
        'image': 'https://bensiqueen.com/images/bensi-queen-logo.jpg',
        'logo': 'https://bensiqueen.com/images/bensi-queen-logo.jpg',
        'url': 'https://bensiqueen.com/',
        'telephone': '+916369448863',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': 'No 3, Jothi Nagar, 5th Street, Sankara Apartment, Chitlapakkam',
          'addressLocality': 'Chennai',
          'postalCode': '600064',
          'addressRegion': 'Tamil Nadu',
          'addressCountry': 'IN',
        },
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': 12.9373,
          'longitude': 80.1415,
        },
        'openingHoursSpecification': [
          {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            'opens': '07:00',
            'closes': '21:30',
          },
        ],
        'currenciesAccepted': 'INR',
        'paymentAccepted': 'Cash, UPI, WhatsApp Pay upon Delivery',
        'areaServed': [
          'Chitlapakkam',
          'Tambaram Sanatorium',
          'Chromepet',
          'Hasthinapuram',
          'Selaiyur',
          'Chennai',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://bensiqueen.com/#website',
        'url': 'https://bensiqueen.com/',
        'name': 'Bensi Queen',
        'description': 'Quality Pulses, Spices, Nuts & Everyday Grocery Essentials',
        'publisher': {
          '@id': 'https://bensiqueen.com/#store',
        },
        'inLanguage': ['en-IN', 'ta-IN'],
      },
      {
        '@type': 'ItemList',
        '@id': 'https://bensiqueen.com/#catalog',
        'name': 'Bensi Queen Grocery Catalogue',
        'numberOfItems': ALL_PRODUCTS.length,
        'itemListElement': ALL_PRODUCTS.map((prod, index) => ({
          '@type': 'ListItem',
          'position': index + 1,
          'item': {
            '@type': 'Product',
            'name': `${prod.englishName} (${prod.tamilName})`,
            'description': prod.description,
            'image': prod.image,
            'category': prod.categoryName,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

