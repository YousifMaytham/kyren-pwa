const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Replace CheckoutBtn with a simple cart URL approach
const oldCheckoutBtn = `// eslint-disable-next-line
const CheckoutBtn = ({cart}) => {
  const [loading, setLoading] = useState(false);
  const handleCheckout = () => { window.open("https://kyren.store", "_blank"); };
  return (
    <button onClick={handleCheckout} disabled={loading} style={{display:"block",width:"100%",textAlign:"center",background:C.dark,color:"#FFF",borderRadius:8,padding:"14px 0",fontSize:15,fontWeight:700,fontFamily:FONT,cursor:"pointer",border:"none",marginTop:12,opacity:loading?0.7:1}}>
      {loading ? "جاري التحضير..." : "إتمام الطلب"}
    </button>
  );
};`;

const newCheckoutBtn = `// eslint-disable-next-line
const CheckoutBtn = ({cart}) => {
  const handleCheckout = () => {
    // Build Shopify cart URL with all items
    const items = cart.map(item => {
      const variantId = item.variants?.[0]?.id || '';
      // Extract numeric ID from Shopify GID format
      const numericId = variantId.replace('gid://shopify/ProductVariant/', '');
      return numericId + ':' + item.qty;
    }).filter(i => i.includes(':'));
    
    if (items.length > 0) {
      const cartUrl = 'https://kyren.store/cart/' + items.join(',');
      window.open(cartUrl, '_blank');
    } else {
      window.open('https://kyren.store', '_blank');
    }
  };
  return (
    <button onClick={handleCheckout} style={{display:"block",width:"100%",textAlign:"center",background:C.dark,color:"#FFF",borderRadius:8,padding:"14px 0",fontSize:15,fontWeight:700,fontFamily:FONT,cursor:"pointer",border:"none",marginTop:12}}>
      إتمام الطلب
    </button>
  );
};`;

if (content.includes('const CheckoutBtn = ({cart}) => {')) {
  // Find and replace the whole CheckoutBtn
  content = content.replace(/\/\/ eslint-disable-next-line\nconst CheckoutBtn = \(\{cart\}\) => \{[\s\S]*?\};\n/, newCheckoutBtn + '\n');
  console.log('✅ CheckoutBtn replaced');
} else {
  console.log('❌ CheckoutBtn not found, adding...');
  content = content.replace(
    '/* ─── Cart Drawer ─── */',
    newCheckoutBtn + '\n/* ─── Cart Drawer ─── */'
  );
}

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('Done!');
