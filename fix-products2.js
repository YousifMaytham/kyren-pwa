const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Remove ALL variants of PRODUCTS useState declaration
content = content.replace(/const \[PRODUCTS, setProducts\] = useState\(\[\]\);\n/g, '');
content = content.replace(/const \[PRODUCTS,setProducts\]=useState\(\[\]\);\n/g, '');
content = content.replace(/const \[loadingProducts, setLoadingProducts\] = useState\(true\);\n/g, '');

// Remove ALL variants of getProducts useEffect
content = content.replace(/useEffect\(\(\) => \{\n\s*getProducts[\s\S]*?\}, \[\]\);\n/g, '');
content = content.replace(/useEffect\(\(\) => \{ getProducts[\s\S]*?\}, \[\]\);\n/g, '');
content = content.replace(/useEffect\(\(\)=>\{getProducts[\s\S]*?\},\[\]\);\n/g, '');

// Remove old static PRODUCTS array
content = content.replace(/const PRODUCTS_STATIC = \[\];\n/g, '');
content = content.replace(/const PRODUCTS = \[[\s\S]*?\];\n/g, '');

// Now add ONE clean version inside the component
content = content.replace(
  'export default function KyrenApp() {',
  `export default function KyrenApp() {
  const [PRODUCTS, setProducts] = useState([]);
  useEffect(() => { getProducts({ first: 50 }).then(d => setProducts(d.products)).catch(e => console.error(e)); }, []);`
);

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('Done!');

const lines = content.split('\n').filter(l => l.includes('PRODUCTS') && l.includes('useState'));
console.log('PRODUCTS useState count:', lines.length);
lines.forEach(l => console.log(' -', l.trim()));
