const SHOPIFY_CONFIG = {
  storeDomain: '2c5d77-c4.myshopify.com',
  storefrontToken: '19795cd0e149d811454a93307d54418c',
  apiVersion: '2024-10',
};

const STOREFRONT_URL = 'https://' + SHOPIFY_CONFIG.storeDomain + '/api/' + SHOPIFY_CONFIG.apiVersion + '/graphql.json';

async function shopifyFetch(query, variables) {
  const res = await fetch(STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export async function getProducts({ first = 50 } = {}) {
  const query = '{products(first:' + first + ',sortKey:BEST_SELLING){edges{node{id title handle description priceRange{minVariantPrice{amount currencyCode}} compareAtPriceRange{minVariantPrice{amount}} images(first:4){edges{node{url altText}}} variants(first:10){edges{node{id title availableForSale price{amount} selectedOptions{name value}}}} availableForSale tags}}}}';
  const data = await shopifyFetch(query);
  return {
    products: data.products.edges.map(({ node }) => {
      const price = parseFloat(node.priceRange.minVariantPrice.amount) * 1000;
      const ca = node.compareAtPriceRange && node.compareAtPriceRange.minVariantPrice && node.compareAtPriceRange.minVariantPrice.amount
        ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount) * 1000
        : null;
      const images = node.images.edges.map(e => e.node.url);
      const variants = node.variants.edges.map(e => ({
        id: e.node.id,
        title: e.node.title,
        available: e.node.availableForSale,
        price: parseFloat(e.node.price.amount) * 1000,
        options: e.node.selectedOptions,
      }));
      const sizes = [...new Set(variants.flatMap(v => v.options.filter(o => o.name === 'Size').map(o => o.value)))];
      let badge = null;
      if (ca && ca > price) badge = 'sale';
      else if (node.tags && node.tags.includes('new')) badge = 'new';
      return {
        id: node.id,
        handle: node.handle,
        name: node.title,
        brand: 'KYREN',
        description: node.description || '',
        price,
        old: ca && ca > price ? ca : null,
        images,
        mainImage: images[0] || null,
        variants,
        sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L'],
        colors: ['#C8697B'],
        badge,
        cat: 'all',
        available: node.availableForSale,
        tags: node.tags || [],
        rating: 4.7,
        reviews: 50,
        sold: 100,
      };
    }),
  };
}


export async function createCheckout(lineItems) {
  const query = `mutation {
    checkoutCreate(input: {
      lineItems: [${lineItems.map(i => `{ variantId: "${i.variantId}", quantity: ${i.quantity} }`).join(',')}]
    }) {
      checkout { id webUrl }
      checkoutUserErrors { message }
    }
  }`;
  const data = await shopifyFetch(query);
  if (data.checkoutCreate.checkoutUserErrors.length > 0) {
    throw new Error(data.checkoutCreate.checkoutUserErrors[0].message);
  }
  return data.checkoutCreate.checkout;
}

export { SHOPIFY_CONFIG };
