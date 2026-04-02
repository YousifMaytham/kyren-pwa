const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Remove all useState declarations for PRODUCTS (keep only one)
let count = 0;
content = content.replace(/const \[PRODUCTS, setProducts\] = useState\(\[\]\);\n/g, (match) => {
  count++;
  return count === 1 ? match : '';
});

// Remove all useEffect for getProducts (keep only one)
let count2 = 0;
content = content.replace(/useEffect\(\(\) => \{ getProducts\(\{ first: 50 \}\)\.then\(d => setProducts\(d\.products\)\)\.catch\(e => console\.error\(e\)\); \}, \[\]\);\n/g, (match) => {
  count2++;
  return count2 === 1 ? match : '';
});

// Also remove static PRODUCTS_STATIC if exists
content = content.replace(/const PRODUCTS_STATIC = \[\];\n/g, '');

// Remove old static PRODUCTS array if still exists
content = content.replace(/const PRODUCTS = \[[\s\S]*?\];\n/g, '');

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('Done!');

// Verify
const lines = content.split('\n');
const productLines = lines.filter(l => l.includes('PRODUCTS') && (l.includes('useState') || l.includes('const PRODUCTS')));
console.log('PRODUCTS declarations:', productLines.length);
productLines.forEach(l => console.log(' -', l.trim()));
