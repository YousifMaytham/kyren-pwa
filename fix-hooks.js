const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Remove PRODUCTS state and useEffect from outside the component (top level)
content = content.replace(/^const \[PRODUCTS, setProducts\] = useState\(\[\]\);\n/m, '');
content = content.replace(/^useEffect\(\(\) => \{ getProducts\(\{ first: 50 \}\)\.then\(d => setProducts\(d\.products\)\)\.catch\(e => console\.error\(e\)\); \}, \[\]\);\n/m, '');

// Make sure they exist inside the component
if (!content.includes('const [PRODUCTS, setProducts]')) {
  content = content.replace(
    'export default function KyrenApp() {',
    `export default function KyrenApp() {
  const [PRODUCTS, setProducts] = useState([]);
  useEffect(() => { getProducts({ first: 50 }).then(d => setProducts(d.products)).catch(e => console.error(e)); }, []);`
  );
}

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('Done!');

// Check line numbers
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('PRODUCTS') && l.includes('useState')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
  if (l.includes('export default function KyrenApp')) {
    console.log(`Component starts at line ${i+1}`);
  }
});
