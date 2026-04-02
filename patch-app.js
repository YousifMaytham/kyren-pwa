const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// 1. Add import at top
if (!content.includes('import { getProducts }')) {
  content = content.replace(
    'import { useState, useEffect, useCallback } from "react";',
    'import { useState, useEffect, useCallback } from "react";\nimport { getProducts } from "./shopify-api";'
  );
  console.log('✅ Added import');
} else {
  console.log('ℹ️ Import already exists');
}

// 2. Replace static PRODUCTS array with state
content = content.replace(
  /const PRODUCTS = \[[\s\S]*?\];/,
  'const PRODUCTS_STATIC = [];'
);

// 3. Add useState and useEffect for products inside the component
content = content.replace(
  'export default function KyrenApp() {',
  `export default function KyrenApp() {
  const [PRODUCTS, setProducts] = useState([]);
  useEffect(() => {
    getProducts({ first: 50 })
      .then(data => setProducts(data.products))
      .catch(err => console.error('Shopify error:', err));
  }, []);`
);

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('✅ App.js patched successfully!');

// Verify
const verify = fs.readFileSync('src/App.js', 'utf8');
if (verify.includes('getProducts')) {
  console.log('✅ Verified: getProducts found in App.js');
} else {
  console.log('❌ ERROR: getProducts not found');
}
