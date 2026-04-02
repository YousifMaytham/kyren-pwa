const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Replace PImg component to support real image URLs
const oldPImg = `const PImg = ({alt,style:s}) => {
  const cols = ["#F0E6E8","#E8EAF0","#E6F0E8","#F0EDE6","#EDE6F0","#E6ECF0"];
  const emojis = ["ðŸ'—","ðŸ'š","ðŸ'–","ðŸ'•","ðŸ§¥","ðŸ'œ","ðŸ' ","ðŸ§£","ðŸ'ƒ","ðŸ''","ðŸ©±","ðŸ§¤"];
  const bg = cols[(alt||"").length % cols.length];
  const em = emojis[(alt||"").length % emojis.length];
  return (
    <div style={{...s,background:\`linear-gradient(145deg, \${bg} 0%, #F8F5F5 100%)\`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,overflow:"hidden"}}>
      <span style={{fontSize: s.height > 300 ? 72 : s.height > 180 ? 48 : 32,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.1))"}}>{em}</span>
      <span style={{fontSize:s.height > 200 ? 11 : 9,color:C.textLight,fontFamily:FONT,textAlign:"center",padding:"0 6px",lineHeight:1.3,maxWidth:"90%",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{alt}</span>
    </div>
  );
};`;

const newPImg = `const PImg = ({src,alt,style:s}) => {
  const cols = ["#F0E6E8","#E8EAF0","#E6F0E8","#F0EDE6","#EDE6F0","#E6ECF0"];
  const emojis = ["👗","👚","👖","👕","🧥","👜","👠","🧣","💃","👑","🩱","🧤"];
  const bg = cols[(alt||"").length % cols.length];
  const em = emojis[(alt||"").length % emojis.length];
  if (src) {
    return <img src={src} alt={alt||""} style={{...s,objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}} />;
  }
  return (
    <div style={{...s,background:\`linear-gradient(145deg, \${bg} 0%, #F8F5F5 100%)\`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,overflow:"hidden"}}>
      <span style={{fontSize: s.height > 300 ? 72 : s.height > 180 ? 48 : 32,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.1))"}}>{em}</span>
      <span style={{fontSize:s.height > 200 ? 11 : 9,color:C.textLight,fontFamily:FONT,textAlign:"center",padding:"0 6px",lineHeight:1.3,maxWidth:"90%",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{alt}</span>
    </div>
  );
};`;

if (content.includes('const PImg = ({alt,style:s}) => {')) {
  content = content.replace(oldPImg, newPImg);
  console.log('✅ PImg component updated');
} else {
  // Try simpler replacement
  content = content.replace(
    'const PImg = ({alt,style:s}) => {',
    'const PImg = ({src,alt,style:s}) => {'
  );
  console.log('✅ PImg signature updated');
}

// Now update all PImg usages to pass src from product images
// In product grid
content = content.replace(
  /<PImg alt={p\.name} style={{width:"100%",height:195}}/g,
  '<PImg src={p.mainImage} alt={p.name} style={{width:"100%",height:195}}'
);

// In wishlist
content = content.replace(
  /<PImg alt={p\.name} style={{width:"100%",height:180}}/g,
  '<PImg src={p.mainImage} alt={p.name} style={{width:"100%",height:180}}'
);

// In product detail
content = content.replace(
  /<PImg alt={p\.name} style={{width:"100%",height:400}}/g,
  '<PImg src={p.mainImage} alt={p.name} style={{width:"100%",height:400}}'
);

// In cart
content = content.replace(
  /<PImg alt={item\.name} style={{width:64,height:64,borderRadius:6,flexShrink:0}}/g,
  '<PImg src={item.mainImage} alt={item.name} style={{width:64,height:64,borderRadius:6,flexShrink:0}}'
);

// In search
content = content.replace(
  /<PImg alt={p\.name} style={{width:50,height:50,borderRadius:6}}/g,
  '<PImg src={p.mainImage} alt={p.name} style={{width:50,height:50,borderRadius:6}}'
);

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('✅ Done! All PImg updated with src');
