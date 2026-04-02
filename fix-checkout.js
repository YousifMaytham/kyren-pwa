const fs = require('fs');

let content = fs.readFileSync('src/App.js', 'utf8');

// Replace static checkout link with dynamic Shopify checkout
content = content.replace(
  `import { getProducts } from "./shopify-api";`,
  `import { getProducts, createCheckout } from "./shopify-api";`
);

// Replace the checkout button in CartDrawer
content = content.replace(
  `<a href="https://kyren.store/checkout" target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",background:C.dark,color:"#FFF",borderRadius:8,padding:"14px 0",fontSize:15,fontWeight:700,fontFamily:FONT,textDecoration:"none",marginTop:12}}>Ø¥ØªÙ…Ø§Ù… Ø§Ù„Ø·Ù„Ø¨</a>`,
  `<CheckoutBtn cart={cart} />`
);

// Add CheckoutBtn component before CartDrawer
const checkoutBtn = `
const CheckoutBtn = ({cart}) => {
  const [loading, setLoading] = React.useState(false);
  const handleCheckout = async () => {
    setLoading(true);
    try {
      const lineItems = cart.map(item => ({
        variantId: item.variants?.[0]?.id || item.id,
        quantity: item.qty,
      }));
      const checkout = await createCheckout(lineItems);
      window.open(checkout.webUrl, '_blank');
    } catch(e) {
      console.error(e);
      window.open('https://kyren.store', '_blank');
    }
    setLoading(false);
  };
  return (
    <button onClick={handleCheckout} disabled={loading} style={{display:"block",width:"100%",textAlign:"center",background:C.dark,color:"#FFF",borderRadius:8,padding:"14px 0",fontSize:15,fontWeight:700,fontFamily:FONT,cursor:"pointer",border:"none",marginTop:12,opacity:loading?0.7:1}}>
      {loading ? "جاري التحضير..." : "إتمام الطلب"}
    </button>
  );
};
`;

content = content.replace(
  '/* ─── Cart Drawer ─── */',
  checkoutBtn + '\n/* ─── Cart Drawer ─── */'
);

// Also fix the "اشتري الحين" button in ProductDetail
content = content.replace(
  `<a href="https://kyren.store" target="_blank" rel="noopener noreferrer" style={{background:C.accent,color:"#FFF",border:"none",borderRadius:8,padding:"13px 20px",fontSize:14,fontWeight:700,fontFamily:FONT,cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center"}}>Ø§Ø´ØªØ±ÙŠ Ø§Ù„Ø­ÙŠÙ†</a>`,
  `<a href={\`https://2c5d77-c4.myshopify.com/products/\${p.handle}\`} target="_blank" rel="noopener noreferrer" style={{background:C.accent,color:"#FFF",border:"none",borderRadius:8,padding:"13px 20px",fontSize:14,fontWeight:700,fontFamily:FONT,cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center"}}>اشتري الحين</a>`
);

fs.writeFileSync('src/App.js', content, 'utf8');
console.log('Done!');
