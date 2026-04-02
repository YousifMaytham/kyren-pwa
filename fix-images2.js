const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Fix PImg to accept src prop and show real images
content = content.replace(
  `const PImg = ({alt,style:s}) => {
  const cols = ["#F0E6E8","#E8EAF0","#E6F0E8","#F0EDE6","#EDE6F0","#E6ECF0"];`,
  `const PImg = ({src,alt,style:s}) => {
  if(src) return <img src={src} alt={alt||""} style={{...s,objectFit:"cover",display:"block"}} />;
  const cols = ["#F0E6E8","#E8EAF0","#E6F0E8","#F0EDE6","#EDE6F0","#E6ECF0"];`
);

// Fix availability - show out of stock badge
content = content.replace(
  `<PBadge type={p.badge}/>`,
  `<PBadge type={p.available ? p.badge : 'out'}/>`
);

// Add 'out' to PBadge
content = content.replace(
  `const m = {sale:{bg:C.sale,t:"SALE"},new:{bg:C.accent,t:"NEW"},best:{bg:C.gold,t:"BEST"}};`,
  `const m = {sale:{bg:C.sale,t:"SALE"},new:{bg:C.accent,t:"NEW"},best:{bg:C.gold,t:"BEST"},out:{bg:"#999",t:"نفذ"}};`
);

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('Done!');

// Verify
const lines = content.split('\n').filter(l => l.includes('PImg = ({'));
lines.forEach(l => console.log(l.trim()));
