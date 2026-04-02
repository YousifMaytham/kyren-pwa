const fs = require('fs');

let content = fs.readFileSync('src/shopify-api.js', 'utf8');

const checkoutFn = `
export async function createCheckout(lineItems) {
  const query = \`mutation {
    checkoutCreate(input: {
      lineItems: [\${lineItems.map(i => \`{ variantId: "\${i.variantId}", quantity: \${i.quantity} }\`).join(',')}]
    }) {
      checkout { id webUrl }
      checkoutUserErrors { message }
    }
  }\`;
  const data = await shopifyFetch(query);
  if (data.checkoutCreate.checkoutUserErrors.length > 0) {
    throw new Error(data.checkoutCreate.checkoutUserErrors[0].message);
  }
  return data.checkoutCreate.checkout;
}
`;

content = content.replace('export { SHOPIFY_CONFIG };', checkoutFn + '\nexport { SHOPIFY_CONFIG };');
fs.writeFileSync('src/shopify-api.js', content, 'utf8');
console.log('Done!');
