// ═══════════════════════════════════════════════════
// Kyren Store — Shopify Storefront API Connection
// ═══════════════════════════════════════════════════
//
// هذا الملف يربط التطبيق بمنتجاتك الحقيقية على Shopify
// 
// ── الخطوات المطلوبة قبل الاستخدام: ──
// 1. ادخل لوحة تحكم Shopify → Settings → Apps and sales channels
// 2. اضغط "Develop apps" → "Create an app"
// 3. سمّه "Kyren PWA"
// 4. اضغط "Configure Storefront API scopes"
// 5. فعّل: unauthenticated_read_products, unauthenticated_read_product_listings,
//          unauthenticated_read_product_tags, unauthenticated_read_checkouts,
//          unauthenticated_write_checkouts
// 6. اضغط "Install app"
// 7. انسخ "Storefront API access token"
// 8. ضعه بالأسفل في STOREFRONT_TOKEN
// ═══════════════════════════════════════════════════

// ─── Configuration ───
const SHOPIFY_CONFIG = {
  storeDomain: 'kyren.myshopify.com',       // دومين متجرك
  storefrontToken: '19795cd0e149d811454a93307d54418c', // ← ضع التوكن هنا
  apiVersion: '2024-10',
};

const STOREFRONT_URL = `https://${SHOPIFY_CONFIG.storeDomain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`;

// ─── GraphQL Helper ───
async function shopifyFetch(query, variables = {}) {
  const response = await fetch(STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors.map(e => e.message).join(', '));
  }
  return json.data;
}

// ─── Fetch All Products ───
export async function getProducts({ first = 20, after = null, collection = null } = {}) {
  const query = collection
    ? `query GetCollectionProducts($handle: String!, $first: Int!, $after: String) {
        collection(handle: $handle) {
          title
          products(first: $first, after: $after) {
            pageInfo { hasNextPage endCursor }
            edges {
              node {
                id
                title
                handle
                description
                tags
                priceRange {
                  minVariantPrice { amount currencyCode }
                  maxVariantPrice { amount currencyCode }
                }
                compareAtPriceRange {
                  minVariantPrice { amount }
                }
                images(first: 4) {
                  edges {
                    node { url altText width height }
                  }
                }
                variants(first: 10) {
                  edges {
                    node {
                      id
                      title
                      availableForSale
                      price { amount currencyCode }
                      compareAtPrice { amount }
                      selectedOptions { name value }
                      image { url altText }
                    }
                  }
                }
                availableForSale
                totalInventory
              }
            }
          }
        }
      }`
    : `query GetProducts($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: BEST_SELLING) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              title
              handle
              description
              tags
              priceRange {
                minVariantPrice { amount currencyCode }
                maxVariantPrice { amount currencyCode }
              }
              compareAtPriceRange {
                minVariantPrice { amount }
              }
              images(first: 4) {
                edges {
                  node { url altText width height }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    price { amount currencyCode }
                    compareAtPrice { amount }
                    selectedOptions { name value }
                    image { url altText }
                  }
                }
              }
              availableForSale
              totalInventory
            }
          }
        }
      }`;

  const variables = collection
    ? { handle: collection, first, after }
    : { first, after };

  const data = await shopifyFetch(query, variables);
  const productsData = collection ? data.collection.products : data.products;

  return {
    products: productsData.edges.map(({ node }) => transformProduct(node)),
    pageInfo: productsData.pageInfo,
  };
}

// ─── Fetch Single Product ───
export async function getProduct(handle) {
  const query = `query GetProduct($handle: String!) {
    product(handle: $handle) {
      id title handle description descriptionHtml tags
      priceRange {
        minVariantPrice { amount currencyCode }
      }
      compareAtPriceRange {
        minVariantPrice { amount }
      }
      images(first: 10) {
        edges { node { url altText width height } }
      }
      variants(first: 30) {
        edges {
          node {
            id title availableForSale quantityAvailable
            price { amount currencyCode }
            compareAtPrice { amount }
            selectedOptions { name value }
            image { url altText }
          }
        }
      }
      availableForSale totalInventory
      seo { title description }
    }
  }`;

  const data = await shopifyFetch(query, { handle });
  return transformProduct(data.product);
}

// ─── Fetch Collections ───
export async function getCollections() {
  const query = `query GetCollections {
    collections(first: 20, sortKey: RELEVANCE) {
      edges {
        node {
          id title handle description
          image { url altText }
          products(first: 1) { edges { node { id } } }
        }
      }
    }
  }`;

  const data = await shopifyFetch(query);
  return data.collections.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    description: node.description,
    image: node.image?.url || null,
    hasProducts: node.products.edges.length > 0,
  }));
}

// ─── Create Checkout ───
export async function createCheckout(lineItems) {
  const query = `mutation CreateCheckout($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        id
        webUrl
        totalPrice { amount currencyCode }
        lineItems(first: 20) {
          edges {
            node {
              title quantity
              variant { price { amount } image { url } }
            }
          }
        }
      }
      checkoutUserErrors { code field message }
    }
  }`;

  const input = {
    lineItems: lineItems.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity,
    })),
  };

  const data = await shopifyFetch(query, { input });

  if (data.checkoutCreate.checkoutUserErrors.length > 0) {
    throw new Error(data.checkoutCreate.checkoutUserErrors[0].message);
  }

  return data.checkoutCreate.checkout;
}

// ─── Search Products ───
export async function searchProducts(searchQuery, first = 10) {
  const query = `query SearchProducts($query: String!, $first: Int!) {
    products(first: $first, query: $query) {
      edges {
        node {
          id title handle
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { minVariantPrice { amount } }
          images(first: 1) { edges { node { url altText } } }
          variants(first: 1) { edges { node { id availableForSale } } }
        }
      }
    }
  }`;

  const data = await shopifyFetch(query, { query: searchQuery, first });
  return data.products.edges.map(({ node }) => transformProduct(node));
}

// ─── Transform Shopify Product to App Format ───
function transformProduct(node) {
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const compareAt = node.compareAtPriceRange?.minVariantPrice?.amount
    ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
    : null;
  const images = node.images?.edges?.map(e => e.node.url) || [];
  const variants = node.variants?.edges?.map(e => ({
    id: e.node.id,
    title: e.node.title,
    available: e.node.availableForSale,
    price: parseFloat(e.node.price.amount),
    options: e.node.selectedOptions,
    image: e.node.image?.url || images[0],
  })) || [];

  // Extract sizes and colors from variants
  const sizes = [...new Set(variants.flatMap(v =>
    v.options.filter(o => o.name === 'Size' || o.name === 'المقاس').map(o => o.value)
  ))];
  const colors = [...new Set(variants.flatMap(v =>
    v.options.filter(o => o.name === 'Color' || o.name === 'اللون').map(o => o.value)
  ))];

  // Determine badge
  let badge = null;
  if (compareAt && compareAt > price) badge = 'sale';
  else if (node.tags?.includes('new') || node.tags?.includes('جديد')) badge = 'new';
  else if (node.tags?.includes('best-seller') || node.tags?.includes('الأكثر_مبيعاً')) badge = 'best';

  // Map tags to category
  const catMap = {
    'y2k': 'y2k', 'coquette': 'coquette', 'كوكيت': 'coquette',
    'streetwear': 'street', 'ستريت': 'street',
    'k-fashion': 'kfashion', 'كوري': 'kfashion',
    'clean-girl': 'clean', 'كلين': 'clean',
  };
  const cat = node.tags?.find(t => catMap[t.toLowerCase()]);

  return {
    id: node.id,
    handle: node.handle,
    name: node.title,
    brand: 'KYREN',
    description: node.description || '',
    descriptionHtml: node.descriptionHtml || '',
    price: price * 1000, // Convert to IQD if needed
    old: compareAt ? compareAt * 1000 : null,
    images,
    mainImage: images[0] || null,
    variants,
    sizes,
    colors,
    badge,
    cat: cat ? catMap[cat.toLowerCase()] : 'all',
    available: node.availableForSale,
    totalInventory: node.totalInventory || 0,
    tags: node.tags || [],
    rating: 4.5 + Math.random() * 0.5, // placeholder until you add real reviews
    reviews: Math.floor(Math.random() * 200) + 20,
    sold: Math.floor(Math.random() * 500) + 50,
  };
}

// ─── Export config for components ───
export { SHOPIFY_CONFIG };
