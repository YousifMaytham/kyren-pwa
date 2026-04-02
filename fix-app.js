const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Remove all getProducts useEffect duplicates, keep only the import
// Find the main component and clean it up

// Step 1: Remove the block added by patch-app.js (with useState and useEffect for products)
content = content.replace(
  /\n  const \[PRODUCTS, setProducts\] = useState\(\[\]\);\n  useEffect\(\(\) => \{\n    getProducts\(\{ first: 50 \}\)\n      \.then\(data => setProducts\(data\.products\)\)\n      \.catch\(err => console\.error\('Shopify error:', err\)\);\n  \}, \[\]\);/g,
  ''
);

// Step 2: Remove inline useEffect version
content = content.replace(
  /\n  useEffect\(\(\)=>\{getProducts\(\{first:50\}\)\.then\(d=>setProducts\(d\.products\)\)\.catch\(e=>console\.error\(e\)\)\},\[\]\);/g,
  ''
);

// Step 3: Remove old getProducts call with then/catch multiline
content = content.replace(
  /\n\s*getProducts\(\{ first: 50 \}\)\.then\(data => \{[\s\S]*?\}\)\.catch[\s\S]*?\}\);\n/g,
  '\n'
);

// Step 4: Make sure PRODUCTS state and single useEffect exist after KyrenApp opens
content = content.replace(
  'export default function KyrenApp() {',
  `export default function KyrenApp() {
  const [PRODUCTS, setProducts] = useState([]);
  useEffect(() => { getProducts({ first: 50 }).then(d => setProducts(d.products)).catch(e => console.error(e)); }, []);`
);

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('Done!');

// Verify
const lines = fs.readFileSync('src/App.js', 'utf8').split('\n').filter(l => l.includes('getProducts'));
console.log('getProducts lines:', lines.length);
lines.forEach(l => console.log(' -', l.trim()));
