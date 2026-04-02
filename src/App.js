import { useState, useEffect, useCallback } from "react";
import { getProducts, createCheckout } from "./shopify-api";


const C = {
  white:"#FFFFFF", bg:"#F5F5F5", dark:"#1A1A1A", text:"#333", textSec:"#777", textLight:"#999",
  accent:"#C8697B", accentDark:"#A8506A", accentLight:"#FFF0F3",
  sale:"#E53935", gold:"#D4A24E", goldBg:"#FFF8EA", green:"#43A047",
  border:"#EEEEEE", borderDark:"#DDDDDD", badge:"#FF4757", overlay:"rgba(0,0,0,0.45)"
};
const FONT = "'Tajawal', sans-serif";
const CATS = [
  {id:"all",label:"الكل",emoji:"🛍️"},{id:"new",label:"وصل حديثاً",emoji:"✨"},
  {id:"y2k",label:"Y2K",emoji:"💿"},{id:"coquette",label:"Coquette",emoji:"🎀"},
  {id:"street",label:"Streetwear",emoji:"🔥"},{id:"kfashion",label:"K-Fashion",emoji:"🌸"},
  {id:"clean",label:"Clean Girl",emoji:"🤍"},{id:"sale",label:"تخفيضات",emoji:"🏷️"},
];
const FLASH = [
  {id:101,name:"توب بيبي ساتان",price:12000,old:24000,left:14},
  {id:102,name:"سكيرت تول ميني",price:15000,old:30000,left:8},
  {id:103,name:"كروب هودي بناتي",price:19000,old:35000,left:5},
  {id:104,name:"حذاء بلاتفورم",price:28000,old:48000,left:3},
];
const fmt = p => new Intl.NumberFormat("ar-IQ").format(p);

const Stars = ({r,count}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
    <span style={{color:"#FFC107",fontSize:11,letterSpacing:0.5}}>{"★".repeat(Math.floor(r))}{"☆".repeat(5-Math.floor(r))}</span>
    {count > 0 && <span style={{fontSize:11,color:C.textLight,fontFamily:FONT}}>({count})</span>}
  </span>
);

const PBadge = ({type}) => {
  if(!type) return null;
  const m = {sale:{bg:C.sale,t:"SALE"},new:{bg:C.accent,t:"NEW"},best:{bg:C.gold,t:"BEST"},out:{bg:"#999",t:"نفذ"}};
  const b = m[type];
  return <span style={{position:"absolute",top:8,right:8,zIndex:2,background:b.bg,color:"#FFF",fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:3,letterSpacing:.5,fontFamily:"system-ui"}}>{b.t}</span>;
};

const DiscBadge = ({old,price}) => {
  if(!old) return null;
  return <span style={{position:"absolute",top:8,left:8,zIndex:2,background:"rgba(229,57,53,0.9)",color:"#FFF",fontSize:10,fontWeight:800,padding:"2px 6px",borderRadius:3,fontFamily:"system-ui"}}>-{Math.round((1-price/old)*100)}%</span>;
};

const PImg = ({src,alt,style:s}) => {
  if(src) return <img src={src} alt={alt||""} style={{...s,objectFit:"cover",display:"block"}} />;
  const cols = ["#F0E6E8","#E8EAF0","#E6F0E8","#F0EDE6","#EDE6F0","#E6ECF0"];
  const emojis = ["👗","👚","👖","👕","🧥","👜","👠","🧣","💃","👒","🩱","🧤"];
  const bg = cols[(alt||"").length % cols.length];
  const em = emojis[(alt||"").length % emojis.length];
  return (
    <div style={{...s,background:`linear-gradient(145deg, ${bg} 0%, #F8F5F5 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,overflow:"hidden"}}>
      <span style={{fontSize: s.height > 300 ? 72 : s.height > 180 ? 48 : 32,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.1))"}}>{em}</span>
      <span style={{fontSize:s.height > 200 ? 11 : 9,color:C.textLight,fontFamily:FONT,textAlign:"center",padding:"0 6px",lineHeight:1.3,maxWidth:"90%",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{alt}</span>
    </div>
  );
};

const CountdownTimer = () => {
  const [t,setT]=useState({h:5,m:42,s:18});
  useEffect(()=>{const iv=setInterval(()=>{setT(p=>{let{h,m,s}=p;s--;if(s<0){s=59;m--}if(m<0){m=59;h--}if(h<0){h=23;m=59;s=59}return{h,m,s}})},1000);return()=>clearInterval(iv)},[]);
  const pad=n=>String(n).padStart(2,"0");
  return (
    <div style={{display:"flex",gap:3,alignItems:"center"}}>
      {[pad(t.h),pad(t.m),pad(t.s)].map((v,i)=>(
        <span key={i} style={{display:"flex",alignItems:"center",gap:3}}>
          <span style={{background:C.dark,color:"#FFF",fontSize:12,fontWeight:800,padding:"2px 5px",borderRadius:3,fontFamily:"monospace",minWidth:24,textAlign:"center"}}>{v}</span>
          {i<2 && <span style={{color:C.dark,fontWeight:800,fontSize:12}}>:</span>}
        </span>
      ))}
    </div>
  );
};

/* ─── Search Overlay ─── */
const SearchOverlay = ({open,onClose,onSelect,products=[]}) => {
  const [q,setQ]=useState("");
  const res = q.length>0 ? products.filter(p=>p.name.includes(q)||p.brand.includes(q)) : [];
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:C.white,direction:"rtl"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",background:C.bg,borderRadius:8,padding:"0 12px",border:`1.5px solid ${C.borderDark}`}}>
          <span style={{fontSize:15,color:C.textLight,marginLeft:6}}>⌕</span>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحثي عن منتج، براند، ستايل..."
            style={{flex:1,border:"none",background:"none",padding:"10px 8px",fontSize:14,fontFamily:FONT,color:C.text,outline:"none",direction:"rtl"}} />
          {q && <button onClick={()=>setQ("")} style={{background:"none",border:"none",fontSize:14,color:C.textLight,cursor:"pointer"}}>✕</button>}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:13,color:C.accent,fontWeight:700,fontFamily:FONT,cursor:"pointer"}}>إلغاء</button>
      </div>
      {q.length===0 ? (
        <div style={{padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:FONT,marginBottom:12}}>عمليات بحث رائجة</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {["كروب توب","فستان صيفي","كارقو","Y2K","كوكيت","بلوزة ساتان","هودي","سكيرت"].map(t=>(
              <button key={t} onClick={()=>setQ(t)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:20,padding:"6px 14px",fontSize:12,fontFamily:FONT,color:C.text,cursor:"pointer"}}>{t}</button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{padding:"10px 14px",maxHeight:"calc(100vh - 56px)",overflow:"auto"}}>
          {res.length===0 ? (
            <div style={{textAlign:"center",padding:40,color:C.textLight,fontFamily:FONT,fontSize:14}}>لا توجد نتائج لـ "{q}"</div>
          ) : res.map(p=>(
            <div key={p.id} onClick={()=>{onSelect(p);onClose()}} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer",alignItems:"center"}}>
              <PImg src={p.mainImage} alt={p.name} style={{width:50,height:50,borderRadius:6}} />
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.textLight,fontFamily:FONT}}>{p.brand}</div>
                <div style={{fontSize:13,color:C.text,fontFamily:FONT,fontWeight:600}}>{p.name}</div>
                <div style={{fontSize:13,color:C.accent,fontFamily:FONT,fontWeight:700}}>{fmt(p.price)} د.ع</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Product Detail ─── */
const ProductDetail = ({product:p,onClose,onAddCart,wishlist,onToggleWish}) => {
  const [sc,setSc]=useState(0);
  const [ss,setSs]=useState(0);
  const [qty,setQty]=useState(1);
  const [dtab,setDtab]=useState("desc");
  if(!p) return null;
  const isW = wishlist.includes(p.id);
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:C.white,overflow:"auto",direction:"rtl"}}>
      <div style={{position:"sticky",top:0,zIndex:2,display:"flex",justifyContent:"space-between",padding:"12px 14px",background:"rgba(255,255,255,0.95)",backdropFilter:"blur(10px)"}}>
        <button onClick={onClose} style={{background:C.bg,border:"none",borderRadius:"50%",width:36,height:36,fontSize:18,cursor:"pointer",color:C.dark}}>→</button>
        <button onClick={()=>onToggleWish(p.id)} style={{background:C.bg,border:"none",borderRadius:"50%",width:36,height:36,fontSize:18,cursor:"pointer"}}>{isW?"❤️":"♡"}</button>
      </div>
      <div style={{position:"relative"}}><PImg src={p.mainImage} alt={p.name} style={{width:"100%",height:400}} /><PBadge type={p.available ? p.badge : 'out'}/><DiscBadge old={p.old} price={p.price}/></div>
      <div style={{padding:"16px 16px 120px"}}>
        <div style={{fontSize:12,color:C.accent,fontWeight:600,fontFamily:FONT,marginBottom:4}}>{p.brand}</div>
        <h2 style={{fontSize:18,fontWeight:700,color:C.dark,fontFamily:FONT,margin:"0 0 8px",lineHeight:1.4}}>{p.name}</h2>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Stars r={p.rating} count={p.reviews}/><span style={{fontSize:11,color:C.textLight,fontFamily:FONT}}>| بيعت {p.sold} مرة</span></div>
        <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:16}}>
          <span style={{fontSize:24,fontWeight:900,color:C.accent,fontFamily:FONT}}>{fmt(p.price)} <span style={{fontSize:13}}>د.ع</span></span>
          {p.old && <span style={{fontSize:15,color:C.textLight,textDecoration:"line-through",fontFamily:FONT}}>{fmt(p.old)}</span>}
          {p.old && <span style={{fontSize:12,color:C.sale,fontWeight:700,fontFamily:FONT}}>وفّري {fmt(p.old-p.price)}</span>}
        </div>
        <div style={{background:C.goldBg,borderRadius:8,padding:"10px 12px",display:"flex",alignItems:"center",gap:8,marginBottom:16,border:`1px solid ${C.gold}33`}}>
          <span style={{fontSize:18}}>⭐</span>
          <span style={{fontSize:12,color:C.text,fontFamily:FONT}}>اكسبي <strong style={{color:C.gold}}>{Math.floor(p.price/1000)} نقطة</strong> مع Kyren Rewards</span>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:FONT,marginBottom:8}}>اللون</div>
          <div style={{display:"flex",gap:8}}>{p.colors.map((c,i)=>(<button key={i} onClick={()=>setSc(i)} style={{width:30,height:30,borderRadius:"50%",background:c,border:sc===i?`2.5px solid ${C.accent}`:"2px solid #DDD",cursor:"pointer",boxShadow:sc===i?`0 0 0 2px #FFF, 0 0 0 4px ${C.accent}`:"none"}}/>))}</div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:FONT}}>المقاس</span>
            <span style={{fontSize:11,color:C.accent,fontFamily:FONT,cursor:"pointer"}}>دليل المقاسات ↗</span>
          </div>
          <div style={{display:"flex",gap:8}}>{p.sizes.map((s,i)=>(<button key={s} onClick={()=>setSs(i)} style={{minWidth:42,height:36,borderRadius:6,background:ss===i?C.dark:C.white,color:ss===i?"#FFF":C.text,border:ss===i?"none":`1px solid ${C.borderDark}`,fontSize:13,fontWeight:600,fontFamily:"system-ui",cursor:"pointer"}}>{s}</button>))}</div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:FONT,marginBottom:8}}>الكمية</div>
          <div style={{display:"inline-flex",alignItems:"center",border:`1px solid ${C.borderDark}`,borderRadius:6,overflow:"hidden"}}>
            <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:36,height:34,border:"none",background:C.bg,fontSize:16,cursor:"pointer",color:C.dark}}>−</button>
            <span style={{width:44,textAlign:"center",fontSize:14,fontWeight:700,fontFamily:FONT,background:C.white}}>{qty}</span>
            <button onClick={()=>setQty(q=>q+1)} style={{width:36,height:34,border:"none",background:C.bg,fontSize:16,cursor:"pointer",color:C.dark}}>+</button>
          </div>
        </div>
        <div style={{display:"flex",borderBottom:`2px solid ${C.border}`,marginBottom:14}}>
          {[{id:"desc",l:"التفاصيل"},{id:"ship",l:"الشحن"},{id:"rev",l:`التقييمات (${p.reviews})`}].map(t=>(
            <button key={t.id} onClick={()=>setDtab(t.id)} style={{flex:1,background:"none",border:"none",padding:"10px 0",fontSize:12,fontWeight:dtab===t.id?700:400,fontFamily:FONT,cursor:"pointer",color:dtab===t.id?C.accent:C.textLight,borderBottom:dtab===t.id?`2px solid ${C.accent}`:"none",marginBottom:-2}}>{t.l}</button>
          ))}
        </div>
        {dtab==="desc" && <div style={{fontSize:13,color:C.textSec,fontFamily:FONT,lineHeight:1.8}}>قطعة أنيقة من كولكشن {p.brand} بخامة عالية الجودة وتصميم عصري. متوفرة بعدة ألوان ومقاسات. القماش مريح ومناسب لجو العراق.<br/><br/>• خامة: قطن مخلوط عالي الجودة<br/>• القصة: {p.cat==="street"?"اوفرسايز مريحة":"عادية تناسب الجسم"}<br/>• الغسيل: يدوي أو حرارة منخفضة<br/>• الموديل: ربيع/صيف 2026</div>}
        {dtab==="ship" && <div style={{fontSize:13,color:C.textSec,fontFamily:FONT,lineHeight:1.8}}>🚚 <strong>بغداد:</strong> توصيل 1-2 يوم<br/>📦 <strong>المحافظات:</strong> 3-5 أيام<br/>💰 <strong>الدفع:</strong> كاش عند الاستلام<br/>🔄 <strong>الاستبدال:</strong> خلال 3 أيام<br/><br/><span style={{color:C.green}}>✓ شحن مجاني فوق 75,000 د.ع</span></div>}
        {dtab==="rev" && [
          {name:"زهراء م.",r:5,text:"قطعة روعة والخامة ممتازة! وصلتني بيومين",date:"قبل 3 أيام"},
          {name:"نور ع.",r:4,text:"حلوة كلش بس المقاس شوية صغير، انصح مقاس أكبر",date:"قبل أسبوع"},
          {name:"مريم ك.",r:5,text:"ثاني مرة أطلب من كايرن والجودة دائماً عالية 💕",date:"قبل 2 أسبوع"},
        ].map((rev,i)=>(
          <div key={i} style={{padding:"12px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:FONT}}>{rev.name}</span><span style={{fontSize:11,color:C.textLight,fontFamily:FONT}}>{rev.date}</span></div>
            <Stars r={rev.r} count={0}/><div style={{fontSize:12,color:C.textSec,fontFamily:FONT,lineHeight:1.6,marginTop:4}}>{rev.text}</div>
          </div>
        ))}
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:10,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(10px)",borderTop:`1px solid ${C.border}`,padding:"10px 16px",direction:"rtl",display:"flex",gap:10}}>
        <button onClick={()=>{onAddCart(p,qty);onClose()}} style={{flex:1,background:C.dark,color:"#FFF",border:"none",borderRadius:8,padding:"13px 0",fontSize:14,fontWeight:700,fontFamily:FONT,cursor:"pointer"}}>أضيفي للسلة — {fmt(p.price*qty)} د.ع</button>
        <a href="https://kyren.store" target="_blank" rel="noopener noreferrer" style={{background:C.accent,color:"#FFF",border:"none",borderRadius:8,padding:"13px 20px",fontSize:14,fontWeight:700,fontFamily:FONT,cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center"}}>اشتري الحين</a>
      </div>
    </div>
  );
};


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

/* ─── Cart Drawer ─── */
const CartDrawer = ({open,onClose,cart,onQty,onRemove}) => {
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  return (
    <div style={{position:"fixed",inset:0,zIndex:400,background:C.overlay,opacity:open?1:0,pointerEvents:open?"auto":"none",transition:"opacity .3s"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:0,bottom:0,right:0,width:"90%",maxWidth:380,background:C.white,direction:"rtl",overflow:"auto",transform:open?"translateX(0)":"translateX(100%)",transition:"transform .35s cubic-bezier(.16,1,.3,1)"}}>
        <div style={{padding:"16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{fontFamily:FONT,fontSize:16,fontWeight:700,color:C.dark,margin:0}}>سلة التسوق ({cart.length})</h3>
          <button onClick={onClose} style={{background:C.bg,border:"none",borderRadius:"50%",width:32,height:32,fontSize:14,cursor:"pointer"}}>✕</button>
        </div>
        {cart.length===0 ? (
          <div style={{textAlign:"center",padding:50,color:C.textLight}}><div style={{fontSize:48,marginBottom:12}}>🛒</div><div style={{fontFamily:FONT,fontSize:14}}>سلتك فارغة</div></div>
        ) : (
          <>
            {cart.map(item=>(
              <div key={item.id} style={{display:"flex",gap:12,padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
                <PImg src={item.mainImage} alt={item.name} style={{width:64,height:64,borderRadius:6,flexShrink:0}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:C.textLight,fontFamily:FONT}}>{item.brand}</div>
                  <div style={{fontSize:13,fontWeight:600,color:C.dark,fontFamily:FONT}}>{item.name}</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.accent,fontFamily:FONT,marginTop:4}}>{fmt(item.price)} د.ع</div>
                  <div style={{display:"inline-flex",alignItems:"center",border:`1px solid ${C.border}`,borderRadius:4,marginTop:6,overflow:"hidden"}}>
                    <button onClick={()=>onQty(item,item.qty-1)} style={{width:28,height:26,border:"none",background:C.bg,fontSize:13,cursor:"pointer"}}>−</button>
                    <span style={{width:28,textAlign:"center",fontSize:12,fontWeight:700,fontFamily:FONT}}>{item.qty}</span>
                    <button onClick={()=>onQty(item,item.qty+1)} style={{width:28,height:26,border:"none",background:C.bg,fontSize:13,cursor:"pointer"}}>+</button>
                  </div>
                </div>
                <button onClick={()=>onRemove(item)} style={{background:"none",border:"none",fontSize:16,color:C.textLight,cursor:"pointer",alignSelf:"flex-start"}}>🗑</button>
              </div>
            ))}
            <div style={{padding:16}}>
              <div style={{background:C.goldBg,borderRadius:8,padding:"10px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:8,border:`1px solid ${C.gold}33`}}>
                <span>⭐</span><span style={{fontSize:12,fontFamily:FONT,color:C.text}}>ستكسبين <strong style={{color:C.gold}}>{Math.floor(total/1000)} نقطة</strong> من هذا الطلب</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderTop:`1px solid ${C.border}`}}>
                <span style={{fontFamily:FONT,fontSize:16,fontWeight:800,color:C.dark}}>الإجمالي</span>
                <span style={{fontFamily:FONT,fontSize:16,fontWeight:800,color:C.accent}}>{fmt(total)} د.ع</span>
              </div>
              <a href="https://kyren.store/checkout" target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",background:C.dark,color:"#FFF",borderRadius:8,padding:"14px 0",fontSize:15,fontWeight:700,fontFamily:FONT,textDecoration:"none",marginTop:12}}>إتمام الطلب</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ═══ MAIN APP ═══ */
export default function KyrenApp() {
  const [PRODUCTS, setProducts] = useState([]);
  useEffect(() => { getProducts({ first: 50 }).then(d => setProducts(d.products)).catch(e => console.error(e)); }, []);
      const [tab,setTab]=useState("home");
  const [cat,setCat]=useState("all");
  const [cart,setCart]=useState([]);
  const [wish,setWish]=useState([]);
  const [pts,setPts]=useState(350);
  const [searchOpen,setSearchOpen]=useState(false);
  const [cartOpen,setCartOpen]=useState(false);
  const [detail,setDetail]=useState(null);
  const [toast,setToast]=useState(null);
  const [bIdx,setBIdx]=useState(0);
  
  const banners = [
    {title:"كولكشن الربيع 🌸",sub:"خصم لغاية 30% على القطع الجديدة",bg:`linear-gradient(135deg, ${C.accent} 0%, #E8899A 50%, #F5B0BE 100%)`},
    {title:"Y2K Collection 💿",sub:"ارجعي للـ 2000s بأحلى ستايل",bg:"linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #DFE6E9 100%)"},
    {title:"شحن مجاني 🚚",sub:"على كل الطلبات فوق 75,000 د.ع",bg:`linear-gradient(135deg, ${C.dark} 0%, #444 100%)`},
  ];
  useEffect(()=>{const iv=setInterval(()=>setBIdx(i=>(i+1)%banners.length),4000);return()=>clearInterval(iv)},[banners.length]);
  const showToast = useCallback(msg=>{setToast(msg);setTimeout(()=>setToast(null),2200)},[]);
  const addCart = (p,qty=1)=>{
    setCart(prev=>{const ex=prev.find(i=>i.id===p.id);if(ex) return prev.map(i=>i.id===p.id?{...i,qty:i.qty+qty}:i);return[...prev,{...p,qty}]});
    const earned=Math.floor((p.price*qty)/1000);setPts(pr=>pr+earned);showToast(`تمت الإضافة ✓  +${earned} نقطة`);
  };
  const toggleWish = id=>setWish(prev=>prev.includes(id)?prev.filter(i=>i!==id):[...prev,id]);
  const filtered = PRODUCTS.filter(p=>{if(cat==="all")return true;if(cat==="new")return p.badge==="new";if(cat==="sale")return!!p.old;return p.cat===cat});
  const totalCart = cart.reduce((s,i)=>s+i.qty,0);

  return (
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:C.bg,position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
        body{background:${C.bg};margin:0}
        ::-webkit-scrollbar{display:none}
        input::placeholder{color:${C.textLight}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {toast && <div style={{position:"fixed",top:56,left:"50%",transform:"translateX(-50%)",zIndex:999,background:C.dark,color:"#FFF",padding:"10px 20px",borderRadius:8,fontSize:13,fontWeight:600,fontFamily:FONT,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",animation:"fadeIn .25s ease"}}>{toast}</div>}

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",direction:"rtl",maxWidth:430,margin:"0 auto"}}>
          {tab!=="home" ? (
            <button onClick={()=>setTab("home")} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.dark,padding:4}}>→</button>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:30,height:30,borderRadius:7,background:`linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontSize:11,fontWeight:900,fontFamily:"system-ui",letterSpacing:1}}>K</div>
              <div><div style={{fontSize:14,fontWeight:900,color:C.dark,fontFamily:FONT,letterSpacing:1.5,lineHeight:1}}>KYREN</div><div style={{fontSize:7,color:C.textLight,letterSpacing:2,fontFamily:"system-ui"}}>FASHION STORE</div></div>
            </div>
          )}
          {tab!=="home" && <div style={{fontSize:16,fontWeight:700,color:C.dark,fontFamily:FONT,flex:1,textAlign:"center"}}>{tab==="wish"?"المفضلة":tab==="rewards"?"Kyren Rewards":"حسابي"}</div>}
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={()=>setSearchOpen(true)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",padding:4,color:C.dark}}>⌕</button>
            <button onClick={()=>setCartOpen(true)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",padding:4,position:"relative",color:C.dark}}>
              🛒{totalCart>0 && <span style={{position:"absolute",top:-2,right:-4,background:C.badge,color:"#FFF",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #FFF"}}>{totalCart}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ HOME ═══ */}
      {tab==="home" && (
        <div style={{direction:"rtl"}}>
          {/* Banner */}
          <div style={{padding:"12px 14px 0"}}>
            <div style={{borderRadius:12,padding:"26px 20px",position:"relative",overflow:"hidden",background:banners[bIdx].bg,transition:"background .6s ease",minHeight:130}}>
              <div key={bIdx} style={{animation:"fadeIn .5s ease"}}>
                <div style={{color:"#FFF",fontSize:19,fontWeight:900,fontFamily:FONT,marginBottom:4,lineHeight:1.3}}>{banners[bIdx].title}</div>
                <div style={{color:"rgba(255,255,255,0.85)",fontSize:13,fontFamily:FONT,marginBottom:14}}>{banners[bIdx].sub}</div>
                <a href="https://kyren.store" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",background:"#FFF",color:C.dark,padding:"8px 20px",borderRadius:6,fontSize:12,fontWeight:800,fontFamily:FONT,textDecoration:"none"}}>تسوّقي الحين</a>
              </div>
              <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6}}>
                {banners.map((_,i)=>(<span key={i} style={{width:bIdx===i?18:6,height:6,borderRadius:3,background:bIdx===i?"#FFF":"rgba(255,255,255,0.4)",transition:"all .3s"}}/>))}
              </div>
            </div>
          </div>

          {/* Rewards Strip */}
          <div onClick={()=>setTab("rewards")} style={{margin:"12px 14px 0",background:C.white,borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>⭐</span><div><div style={{fontSize:11,color:C.textLight,fontFamily:FONT}}>Kyren Rewards</div><div style={{fontSize:15,fontWeight:800,color:C.gold,fontFamily:FONT}}>{pts} نقطة</div></div></div>
            <span style={{fontSize:11,color:C.accent,fontFamily:FONT,fontWeight:600}}>التفاصيل ←</span>
          </div>

          {/* Flash Deals */}
          <div style={{margin:"16px 0 0"}}>
            <div style={{padding:"0 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:15}}>⚡</span><span style={{fontSize:14,fontWeight:800,color:C.dark,fontFamily:FONT}}>عروض فلاش</span></div>
              <CountdownTimer/>
            </div>
            <div style={{display:"flex",gap:10,padding:"0 14px",overflowX:"auto",scrollbarWidth:"none"}}>
              {FLASH.map(f=>(
                <div key={f.id} style={{minWidth:125,background:C.white,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`,flexShrink:0}}>
                  <div style={{position:"relative"}}>
                    <PImg alt={f.name} style={{width:125,height:150}} />
                    <span style={{position:"absolute",bottom:6,right:6,background:"rgba(229,57,53,0.9)",color:"#FFF",fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:3}}>-{Math.round((1-f.price/f.old)*100)}%</span>
                  </div>
                  <div style={{padding:"8px 8px 10px"}}>
                    <div style={{fontSize:11,color:C.text,fontFamily:FONT,fontWeight:600,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</div>
                    <div style={{fontSize:13,color:C.sale,fontWeight:800,fontFamily:FONT}}>{fmt(f.price)} <span style={{fontSize:10}}>د.ع</span></div>
                    <div style={{fontSize:10,color:C.textLight,textDecoration:"line-through",fontFamily:FONT}}>{fmt(f.old)}</div>
                    <div style={{fontSize:10,color:C.sale,fontFamily:FONT,marginTop:3}}>باقي {f.left} فقط!</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div style={{margin:"18px 0 0"}}>
            <div style={{padding:"0 14px",marginBottom:10}}><span style={{fontSize:14,fontWeight:800,color:C.dark,fontFamily:FONT}}>التصنيفات</span></div>
            <div style={{display:"flex",gap:6,padding:"0 14px",overflowX:"auto",scrollbarWidth:"none"}}>
              {CATS.map(c=>(
                <button key={c.id} onClick={()=>setCat(c.id)} style={{display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",flexShrink:0,padding:"7px 14px",borderRadius:20,fontSize:12,fontWeight:600,fontFamily:FONT,cursor:"pointer",transition:"all .15s",background:cat===c.id?C.dark:C.white,color:cat===c.id?"#FFF":C.text,border:cat===c.id?`1px solid ${C.dark}`:`1px solid ${C.borderDark}`}}>
                  <span style={{fontSize:13}}>{c.emoji}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products */}
          <div style={{padding:"14px 14px 90px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:12,color:C.textLight,fontFamily:FONT}}>{filtered.length} منتج</span>
              <span style={{fontSize:12,color:C.textSec,fontFamily:FONT}}>الأكثر مبيعاً ▾</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {filtered.map((p,i)=>(
                <div key={p.id} onClick={()=>setDetail(p)} style={{background:C.white,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`,cursor:"pointer",animation:`fadeUp .35s ease ${i*0.04}s both`}}>
                  <div style={{position:"relative"}}>
                    <PImg src={p.mainImage} alt={p.name} style={{width:"100%",height:195}} />
                    <PBadge type={p.badge}/><DiscBadge old={p.old} price={p.price}/>
                    <button onClick={e=>{e.stopPropagation();toggleWish(p.id)}} style={{position:"absolute",bottom:8,left:8,background:"rgba(255,255,255,0.9)",border:"none",borderRadius:"50%",width:30,height:30,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{wish.includes(p.id)?"❤️":"♡"}</button>
                  </div>
                  <div style={{padding:"10px 10px 12px"}}>
                    <div style={{fontSize:10,color:C.textLight,fontFamily:FONT,marginBottom:2}}>{p.brand}</div>
                    <div style={{fontSize:12,fontWeight:600,color:C.dark,fontFamily:FONT,marginBottom:4,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",minHeight:34}}>{p.name}</div>
                    <Stars r={p.rating} count={p.reviews}/>
                    <div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:6}}>
                      <span style={{fontSize:14,fontWeight:800,color:C.accent,fontFamily:FONT}}>{fmt(p.price)}</span>
                      <span style={{fontSize:10,color:C.textLight,fontFamily:FONT}}>د.ع</span>
                      {p.old && <span style={{fontSize:11,color:C.textLight,textDecoration:"line-through",fontFamily:FONT}}>{fmt(p.old)}</span>}
                    </div>
                    <div style={{display:"flex",gap:3,marginTop:6}}>{p.colors.map((c,i)=>(<span key={i} style={{width:12,height:12,borderRadius:"50%",background:c,border:"1.5px solid #EEE"}}/>))}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ WISHLIST ═══ */}
      {tab==="wish" && (
        <div style={{direction:"rtl",padding:"14px 14px 90px"}}>
          {wish.length===0 ? (
            <div style={{textAlign:"center",padding:50,color:C.textLight}}><div style={{fontSize:48,marginBottom:12}}>♡</div><div style={{fontFamily:FONT,fontSize:14}}>ما عندك عناصر محفوظة بعد</div><button onClick={()=>setTab("home")} style={{marginTop:16,background:C.dark,color:"#FFF",border:"none",borderRadius:6,padding:"10px 24px",fontSize:13,fontWeight:600,fontFamily:FONT,cursor:"pointer"}}>تصفّحي المنتجات</button></div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {PRODUCTS.filter(p=>wish.includes(p.id)).map(p=>(
                <div key={p.id} onClick={()=>setDetail(p)} style={{background:C.white,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`,cursor:"pointer"}}>
                  <div style={{position:"relative"}}><PImg src={p.mainImage} alt={p.name} style={{width:"100%",height:180}}/><button onClick={e=>{e.stopPropagation();toggleWish(p.id)}} style={{position:"absolute",top:8,left:8,background:"rgba(255,255,255,0.9)",border:"none",borderRadius:"50%",width:28,height:28,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>❤️</button></div>
                  <div style={{padding:"8px 10px 10px"}}><div style={{fontSize:10,color:C.textLight,fontFamily:FONT}}>{p.brand}</div><div style={{fontSize:12,fontWeight:600,color:C.dark,fontFamily:FONT,marginBottom:4}}>{p.name}</div><div style={{fontSize:13,fontWeight:800,color:C.accent,fontFamily:FONT}}>{fmt(p.price)} د.ع</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ REWARDS ═══ */}
      {tab==="rewards" && (
        <div style={{direction:"rtl",padding:"14px 14px 90px"}}>
          <div style={{background:`linear-gradient(135deg, ${C.dark} 0%, #333 100%)`,borderRadius:12,padding:24,color:"#FFF",marginBottom:16,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-20,left:-20,width:100,height:100,background:`radial-gradient(circle, rgba(200,105,123,0.3), transparent)`,borderRadius:"50%"}}/>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.6)",fontFamily:FONT,marginBottom:4}}>رصيد النقاط</div>
            <div style={{fontSize:36,fontWeight:900,fontFamily:FONT}}>{pts}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontFamily:FONT}}>نقطة متاحة</div>
            <div style={{marginTop:14,display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,background:"rgba(255,255,255,0.15)",borderRadius:10,height:6,overflow:"hidden"}}><div style={{height:"100%",borderRadius:10,width:`${Math.min((pts/500)*100,100)}%`,background:`linear-gradient(90deg, ${C.accent}, ${C.gold})`}}/></div>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.5)",fontFamily:FONT}}>{Math.max(500-pts,0)} للفضي</span>
            </div>
          </div>
          <div style={{fontSize:14,fontWeight:700,color:C.dark,fontFamily:FONT,marginBottom:10}}>استبدلي نقاطك</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            {[{pts:200,reward:"شحن مجاني",icon:"🚚"},{pts:500,reward:"خصم 10%",icon:"🏷️"},{pts:1000,reward:"قطعة هدية",icon:"🎁"},{pts:2000,reward:"خصم 25%",icon:"💎"}].map((r,i)=>(
              <div key={i} style={{background:C.white,borderRadius:8,padding:14,textAlign:"center",border:`1px solid ${pts>=r.pts?C.accent:C.border}`,opacity:pts>=r.pts?1:0.5}}>
                <div style={{fontSize:26,marginBottom:6}}>{r.icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:C.dark,fontFamily:FONT}}>{r.reward}</div>
                <div style={{fontSize:11,color:C.gold,fontFamily:FONT,marginTop:2}}>{r.pts} نقطة</div>
                {pts>=r.pts && <button style={{marginTop:8,background:C.accent,color:"#FFF",border:"none",borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:700,fontFamily:FONT,cursor:"pointer"}}>استبدال</button>}
              </div>
            ))}
          </div>
          <div style={{fontSize:14,fontWeight:700,color:C.dark,fontFamily:FONT,marginBottom:10}}>كيف تكسبين نقاط</div>
          <div style={{background:C.white,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            {[{act:"كل 1,000 د.ع مشتريات",pts:"+1 نقطة",ic:"🛍️"},{act:"أول طلب",pts:"+50 نقطة",ic:"🎉"},{act:"شاركي على انستقرام",pts:"+25 نقطة",ic:"📸"},{act:"إحالة صديقة",pts:"+100 نقطة",ic:"👯‍♀️"}].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
                <span style={{fontSize:20}}>{item.ic}</span><span style={{flex:1,fontSize:13,color:C.text,fontFamily:FONT}}>{item.act}</span><span style={{fontSize:12,fontWeight:700,color:C.green,fontFamily:FONT}}>{item.pts}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ACCOUNT ═══ */}
      {tab==="account" && (
        <div style={{direction:"rtl",padding:"14px 14px 90px"}}>
          <div style={{background:C.white,borderRadius:12,padding:20,textAlign:"center",border:`1px solid ${C.border}`,marginBottom:16}}>
            <div style={{width:64,height:64,borderRadius:"50%",margin:"0 auto 10px",background:`linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",fontSize:24,fontWeight:900,fontFamily:"system-ui"}}>K</div>
            <div style={{fontSize:16,fontWeight:700,color:C.dark,fontFamily:FONT}}>مرحباً بيك في Kyren</div>
            <div style={{fontSize:12,color:C.textLight,fontFamily:FONT,marginTop:2}}>⭐ {pts} نقطة | عضو برونزي</div>
          </div>
          <div style={{background:C.white,borderRadius:8,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            {[{icon:"📦",label:"طلباتي",sub:"تتبعي حالة طلباتك"},{icon:"📍",label:"عناوين التوصيل",sub:"بغداد والمحافظات"},{icon:"💳",label:"الدفع عند الاستلام",sub:"كاش عند التوصيل"},{icon:"🔔",label:"الإشعارات",sub:"العروض والتحديثات"},{icon:"📞",label:"تواصلي معنا",sub:"واتساب / انستقرام"},{icon:"⚙️",label:"الإعدادات",sub:"اللغة والتفضيلات"}].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 14px",borderBottom:i<5?`1px solid ${C.border}`:"none",cursor:"pointer"}}>
                <span style={{fontSize:20,width:28,textAlign:"center"}}>{item.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.dark,fontFamily:FONT}}>{item.label}</div><div style={{fontSize:11,color:C.textLight,fontFamily:FONT}}>{item.sub}</div></div><span style={{color:C.textLight,fontSize:14}}>‹</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,background:C.white,borderRadius:8,padding:16,textAlign:"center",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:12,color:C.textLight,fontFamily:FONT,marginBottom:10}}>تابعي Kyren</div>
            <div style={{display:"flex",justifyContent:"center",gap:20}}>
              {[{icon:"📸",label:"Instagram",url:"https://instagram.com/store.kyren"},{icon:"🎵",label:"TikTok",url:"https://tiktok.com/@kyren.store"},{icon:"📘",label:"Facebook"}].map((s,i)=>(
                <a key={i} href={s.url||"#"} target="_blank" rel="noopener noreferrer" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,textDecoration:"none"}}><span style={{fontSize:22}}>{s.icon}</span><span style={{fontSize:10,color:C.textLight,fontFamily:FONT}}>{s.label}</span></a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(14px)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"6px 0 10px",direction:"rtl",zIndex:90}}>
        {[{id:"home",icon:"🏠",label:"الرئيسية"},{id:"wish",icon:"♡",label:"المفضلة",badge:wish.length},{id:"rewards",icon:"⭐",label:"نقاطي"},{id:"account",icon:"👤",label:"حسابي"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative",padding:"4px 14px",minWidth:56}}>
            <span style={{fontSize:20,transition:"all .15s",filter:tab===t.id?"none":"grayscale(0.5) opacity(0.6)"}}>{t.icon}</span>
            {t.badge>0 && <span style={{position:"absolute",top:0,right:8,background:C.badge,color:"#FFF",borderRadius:"50%",width:15,height:15,fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #FFF"}}>{t.badge}</span>}
            <span style={{fontSize:10,fontFamily:FONT,color:tab===t.id?C.accent:C.textLight,fontWeight:tab===t.id?700:400}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Overlays */}
      <SearchOverlay open={searchOpen} onClose={()=>setSearchOpen(false)} onSelect={setDetail} products={PRODUCTS}/>
      <ProductDetail product={detail} onClose={()=>setDetail(null)} onAddCart={addCart} wishlist={wish} onToggleWish={toggleWish}/>
      <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} cart={cart} onQty={(item,q)=>{if(q<=0)setCart(prev=>prev.filter(i=>i.id!==item.id));else setCart(prev=>prev.map(i=>i.id===item.id?{...i,qty:q}:i))}} onRemove={item=>setCart(prev=>prev.filter(i=>i.id!==item.id))}/>
    </div>
  );
}




