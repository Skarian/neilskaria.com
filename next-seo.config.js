const title = 'Neil Skaria – Technology, Strategy, Finance.';
const description =
  'Hi, my name is Neil Skaria. I write about emerging markets, technology trends, business strategy, finance, productivity, and much more!';

const SEO = {
  title,
  description,
  canonical: 'https://neilskaria.com',
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: 'https://neilskaria.com',
    title,
    description,
    images: [
      {
        url:
          'https://images.ctfassets.net/v9szi7zqf8b3/6zDwLXqcpMgvxBR8NdM9S4/e55a0b934a708c71b9b0f5b3399abf81/banner.png',
        alt: title,
        width: 1280,
        height: 720,
      },
    ],
  },
  twitter: {
    handle: '@neilskaria',
    site: '@neilskaria',
    cardType: 'summary_large_image',
  },
};

export default SEO;
