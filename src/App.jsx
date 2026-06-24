import { useState, useEffect, useRef } from "react";

// ─── CONFIG SUPABASE ────────────────────────────────────────────────────────
const SUPABASE_URL = "https://bfmxxbpzkdtfzpdohicu.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbXh4YnB6a2R0ZnpwZG9oaWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMzU0ODAsImV4cCI6MjA5NzgxMTQ4MH0.waFyfp_sAq8ht-LvkWt6bX0YtSpiNQvsbc-dBlWNEYI";
const SUPABASE_SERVICE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbXh4YnB6a2R0ZnpwZG9oaWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIzNTQ4MCwiZXhwIjoyMDk3ODExNDgwfQ.EOrR10PMgSKnhtul8q2Y4kmI9EccTR5SYU30rBvrDQs";

const sbFetch = async (path, opts = {}, useService = false) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": useService ? SUPABASE_SERVICE : SUPABASE_ANON,
      "Authorization": `Bearer ${useService ? SUPABASE_SERVICE : SUPABASE_ANON}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const db = {
  getTxns: () => sbFetch("transactions?order=created_at.desc", {}, true),
  insertTxn: (t) => sbFetch("transactions", { method: "POST", body: JSON.stringify(t) }),
  updateTxnStatus: (ref, status) => sbFetch(`transactions?ref=eq.${ref}`, { method: "PATCH", body: JSON.stringify({ status }), prefer: "return=minimal" }, true),
  getRates: () => sbFetch("rates?order=product.asc", {}, true),
  upsertRate: (r) => sbFetch("rates", { method: "POST", body: JSON.stringify(r), headers: { "Prefer": "resolution=merge-duplicates,return=representation" } }, true),
  deleteRate: (id) => sbFetch(`rates?id=eq.${id}`, { method: "DELETE" }, true),
};

const ITUNES_COUNTRIES = [
  { code:"US", name:"États-Unis", flag:"🇺🇸", currency:"USD", symbol:"$", denominations:[10,15,25,50,100,200] },
  { code:"GB", name:"Royaume-Uni", flag:"🇬🇧", currency:"GBP", symbol:"£", denominations:[10,15,25,50,100] },
  { code:"EU", name:"Zone Euro", flag:"🇪🇺", currency:"EUR", symbol:"€", denominations:[10,15,25,50,100,150] },
  { code:"CA", name:"Canada", flag:"🇨🇦", currency:"CAD", symbol:"CA$", denominations:[10,15,25,50,100] },
  { code:"AU", name:"Australie", flag:"🇦🇺", currency:"AUD", symbol:"A$", denominations:[10,20,30,50,100] },
  { code:"JP", name:"Japon", flag:"🇯🇵", currency:"JPY", symbol:"¥", denominations:[1500,3000,5000,10000,15000] },
  { code:"FR", name:"France", flag:"🇫🇷", currency:"EUR", symbol:"€", denominations:[10,15,25,50,100] },
  { code:"DE", name:"Allemagne", flag:"🇩🇪", currency:"EUR", symbol:"€", denominations:[10,15,25,50,100] },
  { code:"IT", name:"Italie", flag:"🇮🇹", currency:"EUR", symbol:"€", denominations:[10,15,25,50,100] },
  { code:"ES", name:"Espagne", flag:"🇪🇸", currency:"EUR", symbol:"€", denominations:[10,15,25,50,100] },
  { code:"BR", name:"Brésil", flag:"🇧🇷", currency:"BRL", symbol:"R$", denominations:[15,25,50,100,150] },
  { code:"MX", name:"Mexique", flag:"🇲🇽", currency:"MXN", symbol:"MX$", denominations:[100,200,300,500,1000] },
  { code:"IN", name:"Inde", flag:"🇮🇳", currency:"INR", symbol:"₹", denominations:[400,800,1500,3000,6000] },
  { code:"SA", name:"Arabie Saoudite", flag:"🇸🇦", currency:"SAR", symbol:"SAR", denominations:[25,50,100,200] },
  { code:"AE", name:"Émirats Arabes", flag:"🇦🇪", currency:"AED", symbol:"AED", denominations:[25,50,100,200] },
  { code:"TR", name:"Turquie", flag:"🇹🇷", currency:"TRY", symbol:"₺", denominations:[25,50,100,250] },
  { code:"RU", name:"Russie", flag:"🇷🇺", currency:"RUB", symbol:"₽", denominations:[300,500,1000,1500,3000] },
  { code:"KR", name:"Corée du Sud", flag:"🇰🇷", currency:"KRW", symbol:"₩", denominations:[15000,30000,50000,100000] },
  { code:"HK", name:"Hong Kong", flag:"🇭🇰", currency:"HKD", symbol:"HK$", denominations:[100,150,250,500] },
  { code:"SG", name:"Singapour", flag:"🇸🇬", currency:"SGD", symbol:"S$", denominations:[15,30,50,100] },
  { code:"NZ", name:"Nouvelle-Zélande", flag:"🇳🇿", currency:"NZD", symbol:"NZ$", denominations:[15,25,50,100] },
  { code:"CH", name:"Suisse", flag:"🇨🇭", currency:"CHF", symbol:"CHF", denominations:[10,20,30,50,100] },
  { code:"SE", name:"Suède", flag:"🇸🇪", currency:"SEK", symbol:"kr", denominations:[100,150,250,500] },
  { code:"NO", name:"Norvège", flag:"🇳🇴", currency:"NOK", symbol:"kr", denominations:[100,150,250,500] },
  { code:"DK", name:"Danemark", flag:"🇩🇰", currency:"DKK", symbol:"kr", denominations:[75,100,150,300] },
  { code:"ZA", name:"Afrique du Sud", flag:"🇿🇦", currency:"ZAR", symbol:"R", denominations:[50,100,200,350] },
  { code:"NG", name:"Nigeria", flag:"🇳🇬", currency:"NGN", symbol:"₦", denominations:[1000,2000,5000,10000] },
  { code:"EG", name:"Égypte", flag:"🇪🇬", currency:"EGP", symbol:"EGP", denominations:[30,50,100,200] },
  { code:"PH", name:"Philippines", flag:"🇵🇭", currency:"PHP", symbol:"₱", denominations:[150,300,600,1500] },
  { code:"TH", name:"Thaïlande", flag:"🇹🇭", currency:"THB", symbol:"฿", denominations:[150,300,600,1200] },
  { code:"MY", name:"Malaisie", flag:"🇲🇾", currency:"MYR", symbol:"RM", denominations:[15,30,50,100] },
  { code:"ID", name:"Indonésie", flag:"🇮🇩", currency:"IDR", symbol:"Rp", denominations:[50000,100000,150000,300000] },
  { code:"PL", name:"Pologne", flag:"🇵🇱", currency:"PLN", symbol:"zł", denominations:[20,40,80,160] },
  { code:"NL", name:"Pays-Bas", flag:"🇳🇱", currency:"EUR", symbol:"€", denominations:[10,15,25,50,100] },
  { code:"BE", name:"Belgique", flag:"🇧🇪", currency:"EUR", symbol:"€", denominations:[10,15,25,50,100] },
  { code:"PT", name:"Portugal", flag:"🇵🇹", currency:"EUR", symbol:"€", denominations:[10,15,25,50,100] },
];

const STEAM_COUNTRIES = [
  { code:"US", name:"États-Unis", flag:"🇺🇸", currency:"USD", symbol:"$", denominations:[5,10,20,25,50,100] },
  { code:"EU", name:"Zone Euro", flag:"🇪🇺", currency:"EUR", symbol:"€", denominations:[5,10,20,25,50,100] },
  { code:"GB", name:"Royaume-Uni", flag:"🇬🇧", currency:"GBP", symbol:"£", denominations:[5,10,20,50,100] },
  { code:"BR", name:"Brésil", flag:"🇧🇷", currency:"BRL", symbol:"R$", denominations:[10,25,40,50,100,150] },
  { code:"TR", name:"Turquie", flag:"🇹🇷", currency:"TRY", symbol:"₺", denominations:[25,50,100,150,250] },
  { code:"CA", name:"Canada", flag:"🇨🇦", currency:"CAD", symbol:"CA$", denominations:[5,10,20,25,50,100] },
  { code:"AU", name:"Australie", flag:"🇦🇺", currency:"AUD", symbol:"A$", denominations:[5,10,20,50,100] },
  { code:"IN", name:"Inde", flag:"🇮🇳", currency:"INR", symbol:"₹", denominations:[100,250,500,1000] },
  { code:"AR", name:"Argentine", flag:"🇦🇷", currency:"ARS", symbol:"ARS$", denominations:[200,500,1000,2000] },
  { code:"MX", name:"Mexique", flag:"🇲🇽", currency:"MXN", symbol:"MX$", denominations:[50,100,200,300,500] },
  { code:"RU", name:"Russie", flag:"🇷🇺", currency:"RUB", symbol:"₽", denominations:[100,250,500,1000,2000] },
  { code:"JP", name:"Japon", flag:"🇯🇵", currency:"JPY", symbol:"¥", denominations:[1000,2000,3000,5000,10000] },
  { code:"KR", name:"Corée du Sud", flag:"🇰🇷", currency:"KRW", symbol:"₩", denominations:[10000,25000,50000] },
  { code:"HK", name:"Hong Kong", flag:"🇭🇰", currency:"HKD", symbol:"HK$", denominations:[50,100,150,300,500] },
  { code:"SG", name:"Singapour", flag:"🇸🇬", currency:"SGD", symbol:"S$", denominations:[10,20,30,50,100] },
  { code:"MY", name:"Malaisie", flag:"🇲🇾", currency:"MYR", symbol:"RM", denominations:[10,20,30,50,100] },
  { code:"TH", name:"Thaïlande", flag:"🇹🇭", currency:"THB", symbol:"฿", denominations:[100,200,300,500,1000] },
  { code:"ID", name:"Indonésie", flag:"🇮🇩", currency:"IDR", symbol:"Rp", denominations:[20000,50000,100000,200000] },
  { code:"PH", name:"Philippines", flag:"🇵🇭", currency:"PHP", symbol:"₱", denominations:[100,250,500,1000] },
  { code:"PL", name:"Pologne", flag:"🇵🇱", currency:"PLN", symbol:"zł", denominations:[10,25,50,100,200] },
  { code:"UA", name:"Ukraine", flag:"🇺🇦", currency:"UAH", symbol:"₴", denominations:[100,200,500,1000] },
  { code:"CL", name:"Chili", flag:"🇨🇱", currency:"CLP", symbol:"CLP$", denominations:[1000,2500,5000,10000] },
  { code:"CO", name:"Colombie", flag:"🇨🇴", currency:"COP", symbol:"COP$", denominations:[10000,20000,50000] },
  { code:"PE", name:"Pérou", flag:"🇵🇪", currency:"PEN", symbol:"S/", denominations:[10,25,50,100] },
  { code:"IL", name:"Israël", flag:"🇮🇱", currency:"ILS", symbol:"₪", denominations:[20,50,100,200] },
  { code:"ZA", name:"Afrique du Sud", flag:"🇿🇦", currency:"ZAR", symbol:"R", denominations:[50,100,200,500] },
  { code:"AE", name:"Émirats Arabes", flag:"🇦🇪", currency:"AED", symbol:"AED", denominations:[20,50,100,200] },
  { code:"SA", name:"Arabie Saoudite", flag:"🇸🇦", currency:"SAR", symbol:"SAR", denominations:[15,25,50,100] },
  { code:"NZ", name:"Nouvelle-Zélande", flag:"🇳🇿", currency:"NZD", symbol:"NZ$", denominations:[5,10,20,50,100] },
  { code:"CH", name:"Suisse", flag:"🇨🇭", currency:"CHF", symbol:"CHF", denominations:[5,10,20,50,100] },
];

const OTHER_PRODUCTS = [
  { id:"pcs", name:"PCS", icon:"💳", currency:"EUR", symbol:"€", denominations:[10,20,25,50,100,150,175,200,250] },
  { id:"transcash", name:"Transcash", icon:"💰", currency:"EUR", symbol:"€", denominations:[20,50,100,150,200,250,300] },
];

const DEFAULT_RATES = {
  itunes:{ US:540, GB:680, EU:620, CA:400, AU:350, JP:4.2, FR:620, DE:620, IT:620, ES:620, BR:90, MX:27, IN:6.2, SA:142, AE:148, TR:18, RU:5.8, KR:0.42, HK:79, SG:470, NZ:320, CH:700, SE:52, NO:52, DK:68, ZA:30, NG:0.35, EG:11, PH:9.2, TH:15, MY:130, ID:0.034, PL:135, NL:620, BE:620, PT:620 },
  steam:{ US:530, EU:610, GB:670, BR:88, TR:16, CA:390, AU:340, IN:6, AR:1.1, MX:25, RU:5.5, JP:4, KR:0.40, HK:78, SG:460, MY:125, TH:14, ID:0.032, PH:9, PL:132, UA:12, CL:0.55, CO:0.13, PE:160, IL:155, ZA:28, AE:145, SA:140, NZ:310, CH:690 },
  pcs:{ EUR:600 },
  transcash:{ EUR:590 },
  btc:98500,
  usdt:620,
};

const PAYMENT_METHODS = [
  { id:"orange", name:"Orange Money", icon:"🟠" },
  { id:"mtn", name:"MTN MoMo", icon:"🟡" },
  { id:"wave", name:"Wave", icon:"🌊" },
  { id:"moov", name:"Moov Money", icon:"🔵" },
  { id:"paypal", name:"PayPal", icon:"🅿️" },
];

const STEPS = ["Produit","Pays & Montant","Paiement","Confirmation"];
const fmt = (n) => Math.round(n).toLocaleString("fr-FR");
const genRef = () => "UKX-" + Math.random().toString(36).substring(2,10).toUpperCase();

export default function UKExchange() {
  const [view, setView] = useState("client");
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState({ btc: null });
  const [tickerOff, setTickerOff] = useState(0);
  const tickRef = useRef(null);

  useEffect(() => {
    db.getRates().then(rows => {
      if (!rows.length) { setRatesLoaded(true); return; }
      const r = JSON.parse(JSON.stringify(DEFAULT_RATES));
      rows.forEach(row => {
        if (row.product === "btc" || row.product === "usdt") r[row.product] = row.rate;
        else if (r[row.product]) r[row.product][row.country_code] = row.rate;
      });
      setRates(r);
      setRatesLoaded(true);
    }).catch(() => setRatesLoaded(true));
  }, []);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=xof");
        const d = await res.json();
        if (d?.bitcoin?.xof) setCryptoPrices({ btc: d.bitcoin.xof });
      } catch {}
    };
    fetch_();
    const iv = setInterval(fetch_, 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setTickerOff(p => {
        if (!tickRef.current) return p - 1;
        const w = tickRef.current.scrollWidth / 2;
        return p <= -w ? 0 : p - 1;
      });
    }, 22);
    return () => clearInterval(iv);
  }, []);

  const btcRate = cryptoPrices.btc || rates.btc;
  const usdtRate = rates.usdt;

  const tickerItems = [
    { label:"BTC/XOF", val:`${fmt(btcRate)} XOF`, live:!!cryptoPrices.btc },
    { label:"USDT/XOF", val:`${fmt(usdtRate)} XOF` },
    { label:"iTunes US $100", val:`${fmt((rates.itunes?.US||540)*100)} XOF` },
    { label:"iTunes EU €50", val:`${fmt((rates.itunes?.EU||620)*50)} XOF` },
    { label:"iTunes GB £50", val:`${fmt((rates.itunes?.GB||680)*50)} XOF` },
    { label:"Steam US $50", val:`${fmt((rates.steam?.US||530)*50)} XOF` },
    { label:"Steam EU €50", val:`${fmt((rates.steam?.EU||610)*50)} XOF` },
    { label:"PCS €100", val:`${fmt((rates.pcs?.EUR||600)*100)} XOF` },
    { label:"Transcash €100", val:`${fmt((rates.transcash?.EUR||590)*100)} XOF` },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#07070F",color:"#EDEAE4",fontFamily:"'Inter',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#07070F}::-webkit-scrollbar-thumb{background:#F5C842;border-radius:2px}
        .gold{color:#F5C842}.green{color:#00D26A}.muted{color:#666}.red{color:#FF4D6A}
        .sg{font-family:'Space Grotesk',sans-serif}
        .card{background:#0F0F1A;border:1px solid #1C1C2E;border-radius:12px}
        .btn{border:none;border-radius:8px;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-weight:600;transition:all .2s}
        .btn-gold{background:#F5C842;color:#07070F}.btn-gold:hover{background:#FFD700;transform:translateY(-1px)}
        .btn-gold:disabled{opacity:.35;cursor:not-allowed;transform:none}
        .btn-ghost{background:transparent;color:#EDEAE4;border:1px solid #2E2E50}.btn-ghost:hover{border-color:#F5C842;color:#F5C842}
        .btn-red{background:#FF4D6A22;color:#FF4D6A;border:1px solid #FF4D6A44}.btn-red:hover{background:#FF4D6A33}
        .input{width:100%;background:#07070F;border:1px solid #2E2E50;border-radius:8px;padding:11px 14px;color:#EDEAE4;font-size:15px;font-family:'Inter',sans-serif;outline:none;transition:border .2s}
        .input:focus{border-color:#F5C842}
        .chip{padding:8px 14px;border-radius:6px;border:1px solid #1C1C2E;background:transparent;color:#EDEAE4;cursor:pointer;font-size:13px;transition:all .2s;font-family:'Inter',sans-serif}
        .chip:hover{border-color:#F5C842}.chip.active{background:#F5C842;color:#07070F;border-color:#F5C842;font-weight:600}
        .pay-opt{background:#0F0F1A;border:1px solid #1C1C2E;border-radius:10px;padding:14px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:all .2s}
        .pay-opt:hover{border-color:#F5C842}.pay-opt.active{border-color:#F5C842;background:#15150A}
        .tab{padding:8px 18px;border-radius:6px;border:none;cursor:pointer;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;transition:all .2s}
        .sdot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
        .sline{flex:1;height:1px;background:#1C1C2E}.sline.done{background:#F5C842}
        .ctry{background:#0F0F1A;border:1px solid #1C1C2E;border-radius:8px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .2s;font-size:14px}
        .ctry:hover{border-color:#2E2E50}.ctry.active{border-color:#F5C842;background:#15150A}
        .summary-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1C1C2E}
        .summary-row:last-child{border-bottom:none}
        .pulse{animation:pulse 2s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .fade-in{animation:fadeIn .3s ease}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .badge{padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600}
        .country-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:8px}
        @media(max-width:600px){.country-grid{grid-template-columns:repeat(2,1fr)}}
        .rate-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#00D26A;color:#07070F;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;z-index:999;animation:fadeIn .3s ease}
      `}</style>

      <nav style={{padding:"16px 24px",borderBottom:"1px solid #1C1C2E",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#07070Fdd",backdropFilter:"blur(12px)",zIndex:100}}>
        <div className="sg" style={{fontWeight:700,fontSize:20}}>
          <span className="gold">UK</span><span>Exchange</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",gap:4,alignItems:"center",marginRight:8}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#00D26A"}} className="pulse"/>
            <span style={{fontSize:12}} className="muted">Live</span>
          </div>
          {view==="admin"
            ? <button className="btn btn-ghost" style={{padding:"7px 14px",fontSize:13}} onClick={()=>setView("client")}>← Client</button>
            : <div onDoubleClick={()=>setView("admin")} style={{width:36,height:36,cursor:"default"}}/>
          }
        </div>
      </nav>

      <div style={{overflow:"hidden",background:"#0B0B15",borderBottom:"1px solid #1C1C2E"}}>
        <div ref={tickRef} style={{display:"flex",whiteSpace:"nowrap",transform:`translateX(${tickerOff}px)`}}>
          {[...tickerItems,...tickerItems].map((item,i)=>(
            <div key={i} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"9px 28px",borderRight:"1px solid #1C1C2E",flexShrink:0}}>
              <span style={{fontSize:12}} className="muted">{item.label}</span>
              <span style={{fontSize:12,fontWeight:600}}>{item.val}</span>
              {item.live && <span style={{fontSize:10,padding:"1px 5px",background:"#00D26A22",color:"#00D26A",borderRadius:3}}>LIVE</span>}
            </div>
          ))}
        </div>
      </div>

      {!ratesLoaded ? (
        <div style={{textAlign:"center",padding:"80px 0",color:"#444"}}>Chargement des taux...</div>
      ) : view==="client" ? (
        <ClientView rates={rates} btcRate={btcRate} usdtRate={usdtRate} />
      ) : (
        <AdminView rates={rates} setRates={setRates} />
      )}
    </div>
  );
}

function ClientView({ rates, btcRate, usdtRate }) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("gift");
  const [product, setProduct] = useState(null);
  const [country, setCountry] = useState(null);
  const [denom, setDenom] = useState(null);
  const [cryptoAmt, setCryptoAmt] = useState("");
  const [payMethod, setPayMethod] = useState(null);
  const [contact, setContact] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [txnRef, setTxnRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const countries = product==="itunes" ? ITUNES_COUNTRIES : product==="steam" ? STEAM_COUNTRIES : [];
  const filtered = countries.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.currency.toLowerCase().includes(search.toLowerCase()));

  const getRate = () => {
    if (product==="btc") return btcRate;
    if (product==="usdt") return usdtRate;
    if (product==="pcs") return rates.pcs?.EUR||600;
    if (product==="transcash") return rates.transcash?.EUR||590;
    if (country) return rates[product]?.[country.code]||500;
    return 0;
  };

  const payout = () => {
    const r = getRate();
    if (["btc","usdt"].includes(product)) return Math.round(parseFloat(cryptoAmt||0)*r);
    return denom ? Math.round(denom*r) : 0;
  };

  const canNext = () => {
    if (step===0) return !!product;
    if (step===1) {
      if (["itunes","steam"].includes(product)) return !!country && !!denom;
      if (["pcs","transcash"].includes(product)) return !!denom;
      if (["btc","usdt"].includes(product)) return parseFloat(cryptoAmt)>0;
    }
    if (step===2) return !!payMethod && contact.length>=8 && (["btc","usdt"].includes(product)||cardCode.length>=6);
    return true;
  };

  const submit = async () => {
    setLoading(true); setError("");
    const ref = genRef();
    try {
      await db.insertTxn({
        ref, product,
        country: country?.name||null,
        denomination: denom||null,
        crypto_amount: ["btc","usdt"].includes(product) ? parseFloat(cryptoAmt) : null,
        payout: payout(),
        pay_method: payMethod.name,
        contact,
        card_code: cardCode||null,
        status: "en_attente",
      });
      setTxnRef(ref);
      setStep(3);
    } catch(e) {
      setError("Erreur lors de l'envoi. Réessayez.");
    }
    setLoading(false);
  };

  const reset = () => {
    setStep(0); setCategory("gift"); setProduct(null); setCountry(null);
    setDenom(null); setCryptoAmt(""); setPayMethod(null); setContact(""); setCardCode(""); setTxnRef(""); setError(""); setSearch("");
  };

  const sym = country?.symbol || OTHER_PRODUCTS.find(p=>p.id===product)?.symbol || "€";
  const denoms = country?.denominations || OTHER_PRODUCTS.find(p=>p.id===product)?.denominations || [];

  return (
    <div style={{maxWidth:680,margin:"0 auto",padding:"32px 16px 80px"}}>
      {step===0 && (
        <div style={{textAlign:"center",marginBottom:40}} className="fade-in">
          <div style={{fontSize:12,fontWeight:600,color:"#F5C842",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>Paiement immédiat · 24h/24</div>
          <h1 className="sg" style={{fontSize:"clamp(26px,5vw,46px)",fontWeight:700,lineHeight:1.1,marginBottom:12}}>
            Vendez vos cartes &<br/><span className="gold">cryptos</span> en XOF
          </h1>
          <p className="muted" style={{fontSize:15,maxWidth:420,margin:"0 auto"}}>iTunes, Steam, PCS, Transcash, BTC, USDT — reçu via Mobile Money ou PayPal en moins de 10 min.</p>
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",marginBottom:32}}>
        {STEPS.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div className="sdot" style={{background:i<step?"#F5C842":i===step?"#15150A":"#0F0F1A",border:i===step?"2px solid #F5C842":i<step?"none":"2px solid #1C1C2E",color:i<step?"#07070F":i===step?"#F5C842":"#555"}}>
                {i<step?"✓":i+1}
              </div>
              <span style={{fontSize:10,color:i<=step?"#F5C842":"#555",whiteSpace:"nowrap"}}>{s}</span>
            </div>
            {i<STEPS.length-1&&<div className={`sline${i<step?" done":""}`} style={{margin:"0 4px",marginBottom:18}}/>}
          </div>
        ))}
      </div>

      {step===0 && (
        <div className="fade-in">
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            {["gift","crypto"].map(t=>(
              <button key={t} className="tab" onClick={()=>{setCategory(t);setProduct(null)}} style={{background:category===t?"#F5C842":"#0F0F1A",color:category===t?"#07070F":"#888",border:category===t?"none":"1px solid #1C1C2E"}}>
                {t==="gift"?"🎁 Cartes Cadeaux":"₿ Cryptomonnaies"}
              </button>
            ))}
          </div>
          {category==="gift" && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
              {[
                {id:"itunes",name:"iTunes",logo:"https://raw.githubusercontent.com/ulrichromaric12-art/uk-exchange/main/IMG_2303.webp",desc:"36 pays",bg:"linear-gradient(135deg,#FC3C44,#FF6B6B)"},
                {id:"steam",name:"Steam",logo:"https://raw.githubusercontent.com/ulrichromaric12-art/uk-exchange/main/IMG_2298.webp",desc:"30 pays",bg:"linear-gradient(135deg,#1b2838,#2a475e)"},
                {id:"pcs",name:"PCS",logo:"https://raw.githubusercontent.com/ulrichromaric12-art/uk-exchange/main/IMG_2299.png",desc:"Euros",bg:"linear-gradient(135deg,#1a1a1a,#333)"},
                {id:"transcash",name:"Transcash",logo:"https://raw.githubusercontent.com/ulrichromaric12-art/uk-exchange/main/IMG_2300.webp",desc:"Euros",bg:"linear-gradient(135deg,#1a1a1a,#2a2a2a)"},
              ].map(p=>(
                <div key={p.id} onClick={()=>setProduct(p.id)} style={{cursor:"pointer",borderRadius:14,overflow:"hidden",border:product===p.id?"2px solid #F5C842":"2px solid #1C1C2E",boxShadow:product===p.id?"0 0 24px #F5C84230":"0 2px 12px #00000040",transition:"all .2s",background:"#0F0F1A"}}>
                  <div style={{height:100,background:p.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:12,overflow:"hidden"}}>
                    <img src={p.logo} alt={p.name} style={{maxWidth:"100%",maxHeight:"80px",width:"auto",height:"auto",objectFit:"contain",filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.5))"}} onError={e=>{e.target.style.display="none"}}/>
                  </div>
                  <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div className="sg" style={{fontWeight:700,fontSize:15}}>{p.name}</div>
                      <div style={{fontSize:11,color:"#F5C842",fontWeight:600,marginTop:2}}>{p.desc}</div>
                    </div>
                    {product===p.id && <div style={{width:8,height:8,borderRadius:"50%",background:"#F5C842"}}/>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {category==="crypto" && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
              {[
                {id:"btc",name:"Bitcoin",logo:"https://raw.githubusercontent.com/ulrichromaric12-art/uk-exchange/main/IMG_2301.png",rate:fmt(btcRate)+" XOF/USD",live:true,bg:"linear-gradient(135deg,#F7931A,#FFAD4A)"},
                {id:"usdt",name:"Tether USDT",logo:"https://raw.githubusercontent.com/ulrichromaric12-art/uk-exchange/main/IMG_2302.png",rate:fmt(usdtRate)+" XOF",live:false,bg:"linear-gradient(135deg,#26A17B,#1a7a5e)"},
              ].map(p=>(
                <div key={p.id} onClick={()=>setProduct(p.id)} style={{cursor:"pointer",borderRadius:14,overflow:"hidden",border:product===p.id?"2px solid #F5C842":"2px solid #1C1C2E",boxShadow:product===p.id?"0 0 24px #F5C84230":"0 2px 12px #00000040",transition:"all .2s",background:"#0F0F1A"}}>
                  <div style={{height:100,background:p.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:12,overflow:"hidden"}}>
                    <img src={p.logo} alt={p.name} style={{maxWidth:"100%",maxHeight:"80px",width:"auto",height:"auto",objectFit:"contain",filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.3))"}}/>
                  </div>
                  <div style={{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div className="sg" style={{fontWeight:700,fontSize:15}}>{p.name}</div>
                      <div style={{fontSize:11,color:"#F5C842",fontWeight:600,marginTop:2}}>{p.rate}</div>
                      {p.live&&<div style={{fontSize:10,color:"#00D26A",marginTop:2}}>● Temps réel</div>}
                    </div>
                    {product===p.id && <div style={{width:8,height:8,borderRadius:"50%",background:"#F5C842"}}/>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginTop:56,paddingTop:32,borderTop:"1px solid #1C1C2E",textAlign:"center"}}>
            {[["66+","Pays & devises"],["< 10 min","Délai moyen"],["98.7%","Satisfaction"]].map(([v,l])=>(
              <div key={l}><div className="sg gold" style={{fontSize:24,fontWeight:700}}>{v}</div><div style={{fontSize:12,marginTop:4}} className="muted">{l}</div></div>
            ))}
          </div>
        </div>
      )}

      {step===1 && (
        <div className="fade-in">
          <h2 className="sg" style={{fontSize:19,fontWeight:600,marginBottom:20}}>
            {product==="itunes"?"🎵 iTunes":product==="steam"?"🎮 Steam":product==="pcs"?"💳 PCS":product==="transcash"?"💰 Transcash":product==="btc"?"₿ Bitcoin":"💵 USDT"} — Montant
          </h2>
          {["itunes","steam"].includes(product) && (
            <div style={{marginBottom:24}}>
              <p className="muted" style={{fontSize:14,marginBottom:10}}>De quel pays est votre carte ?</p>
              <input className="input" placeholder="Rechercher pays ou devise..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:12}}/>
              <div className="country-grid" style={{maxHeight:260,overflowY:"auto",paddingRight:4}}>
                {filtered.map(c=>(
                  <div key={c.code} className={`ctry${country?.code===c.code?" active":""}`} onClick={()=>{setCountry(c);setDenom(null)}}>
                    <span style={{fontSize:18}}>{c.flag}</span>
                    <div><div style={{fontSize:13,fontWeight:500}}>{c.name}</div><div style={{fontSize:11}} className="muted">{c.currency}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(country||["pcs","transcash"].includes(product)) && (
            <div style={{marginBottom:20}}>
              <p className="muted" style={{fontSize:14,marginBottom:10}}>Valeur de la carte</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {denoms.map(d=>(
                  <button key={d} className={`chip${denom===d?" active":""}`} onClick={()=>setDenom(d)}>{sym}{d.toLocaleString()}</button>
                ))}
              </div>
            </div>
          )}
          {["btc","usdt"].includes(product) && (
            <div style={{marginBottom:20}}>
              <label style={{fontSize:14,display:"block",marginBottom:8}} className="muted">Montant en {product==="btc"?"USD":"USDT"}</label>
              <input className="input" type="number" placeholder="Ex: 100" value={cryptoAmt} onChange={e=>setCryptoAmt(e.target.value)}/>
            </div>
          )}
          {payout()>0 && (
            <div className="card" style={{padding:18,background:"#0A0A14",marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:13}} className="muted">Taux</span>
                <span style={{fontSize:13,fontWeight:600}}>{fmt(getRate())} XOF / {["btc","usdt"].includes(product)?(product==="btc"?"USD":"USDT"):`${sym}1`}</span>
              </div>
              <div style={{height:1,background:"#1C1C2E",margin:"12px 0"}}/>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:13}} className="muted">Vous recevez</span>
                <span className="sg gold" style={{fontSize:24,fontWeight:700}}>{fmt(payout())} XOF</span>
              </div>
            </div>
          )}
        </div>
      )}

      {step===2 && (
        <div className="fade-in">
          <h2 className="sg" style={{fontSize:19,fontWeight:600,marginBottom:20}}>Recevoir votre paiement</h2>
          <div style={{display:"grid",gap:10,marginBottom:22}}>
            {PAYMENT_METHODS.map(pm=>(
              <div key={pm.id} className={`pay-opt${payMethod?.id===pm.id?" active":""}`} onClick={()=>setPayMethod(pm)}>
                <span style={{fontSize:22}}>{pm.icon}</span>
                <span style={{fontWeight:500}}>{pm.name}</span>
                {payMethod?.id===pm.id&&<span style={{marginLeft:"auto",color:"#F5C842",fontSize:18}}>✓</span>}
              </div>
            ))}
          </div>
          {payMethod && (
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:13,display:"block",marginBottom:7}} className="muted">{payMethod.id==="paypal"?"Email PayPal":"Numéro de téléphone"}</label>
                <input className="input" placeholder={payMethod.id==="paypal"?"email@exemple.com":"+225 07 XX XX XX XX"} value={contact} onChange={e=>setContact(e.target.value)}/>
              </div>
              {!["btc","usdt"].includes(product) && (
                <div>
                  <label style={{fontSize:13,display:"block",marginBottom:7}} className="muted">Code de la carte</label>
                  <input className="input" placeholder="XXXX-XXXX-XXXX-XXXX" value={cardCode} onChange={e=>setCardCode(e.target.value)}/>
                  <p style={{fontSize:12,marginTop:6}} className="muted">Ne partagez ce code qu'ici uniquement.</p>
                </div>
              )}
              {["btc","usdt"].includes(product) && (
                <div style={{background:"#0A150A",border:"1px solid #00D26A22",borderRadius:8,padding:14}}>
                  <p style={{fontSize:13,color:"#00D26A"}}>📤 Après validation, vous recevrez l'adresse wallet pour envoyer vos cryptos.</p>
                </div>
              )}
              <div className="card" style={{padding:18,background:"#0A0A14"}}>
                <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14}} className="muted">Récapitulatif</div>
                {[["Produit",product?.toUpperCase()],["Pays",country?.name||"—"],["Montant",["btc","usdt"].includes(product)?`${cryptoAmt} ${product.toUpperCase()}`:`${sym}${denom}`],["Via",payMethod.name],["Vous recevez",`${fmt(payout())} XOF`]].map(([k,v],i)=>(
                  <div key={i} className="summary-row" style={i===4?{borderBottom:"none"}:{}}>
                    <span style={{fontSize:13}} className="muted">{k}</span>
                    <span style={{fontSize:i===4?16:13,fontWeight:i===4?700:500,color:i===4?"#F5C842":"#EDEAE4"}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <p style={{color:"#FF4D6A",fontSize:14,marginTop:12}}>{error}</p>}
        </div>
      )}

      {step===3 && (
        <div className="fade-in" style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:"#00D26A18",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",fontSize:36}}>✅</div>
          <h2 className="sg" style={{fontSize:24,fontWeight:700,marginBottom:10}}>Transaction envoyée !</h2>
          <p className="muted" style={{marginBottom:6}}>Votre demande est enregistrée et en cours de traitement.</p>
          <p className="muted" style={{fontSize:14,marginBottom:32}}>
            Vous recevrez <span className="gold" style={{fontWeight:600}}>{fmt(payout())} XOF</span> via {payMethod?.name} dans les prochaines minutes.
          </p>
          <div className="card" style={{padding:20,marginBottom:24,textAlign:"left"}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}} className="muted">Référence de transaction</div>
            <div className="sg gold" style={{fontSize:22,fontWeight:700,letterSpacing:"0.08em"}}>{txnRef}</div>
            <p style={{fontSize:12,marginTop:6}} className="muted">Gardez ce numéro pour le suivi de votre paiement.</p>
          </div>
          <div style={{background:"#0A150A",border:"1px solid #00D26A33",borderRadius:10,padding:16,marginBottom:28}}>
            <p style={{fontSize:14,color:"#00D26A"}}>💬 Support WhatsApp disponible 24h/24 pour toute question.</p>
          </div>
          <button className="btn btn-gold" style={{padding:"14px 32px",fontSize:15}} onClick={reset}>Nouvelle transaction</button>
        </div>
      )}

      {step<3 && (
        <div style={{display:"flex",justifyContent:"space-between",marginTop:32,gap:12}}>
          {step>0 ? <button className="btn btn-ghost" style={{padding:"12px 22px",fontSize:14}} onClick={()=>setStep(s=>s-1)}>← Retour</button> : <div/>}
          <button className="btn btn-gold" style={{padding:"12px 28px",fontSize:15,flex:step===0?1:"none"}} disabled={!canNext()||loading} onClick={()=>step===2?submit():setStep(s=>s+1)}>
            {loading?"Envoi...":step===2?"Confirmer →":"Continuer →"}
          </button>
        </div>
      )}
    </div>
  );
}

function AdminView({ rates, setRates }) {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState("");
  const [tab, setTab] = useState("txns");
  const [txns, setTxns] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [localRates, setLocalRates] = useState(rates);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTxn, setSearchTxn] = useState("");
  const [rateSearch, setRateSearch] = useState("");
  const [rateProduct, setRateProduct] = useState("itunes");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  useEffect(()=>{
    if (!auth) return;
    setLoadingTxns(true);
    db.getTxns().then(rows=>{ setTxns(rows); setLoadingTxns(false); }).catch(()=>setLoadingTxns(false));
  },[auth]);

  const saveRates = async () => {
    setSaving(true);
    try {
      const toUpsert = [];
      ["itunes","steam"].forEach(prod => {
        const countries = prod==="itunes" ? ITUNES_COUNTRIES : STEAM_COUNTRIES;
        countries.forEach(c => {
          const rate = localRates[prod]?.[c.code];
          if (rate) toUpsert.push({ product:prod, country_code:c.code, rate:parseFloat(rate) });
        });
      });
      ["pcs","transcash"].forEach(prod => {
        const rate = localRates[prod]?.EUR;
        if (rate) toUpsert.push({ product:prod, country_code:"EUR", rate:parseFloat(rate) });
      });
      ["btc","usdt"].forEach(prod => {
        const rate = localRates[prod];
        if (rate) toUpsert.push({ product:prod, country_code:null, rate:parseFloat(rate) });
      });
      for (const r of toUpsert) await db.upsertRate(r);
      setRates(localRates);
      showToast("✓ Taux sauvegardés !");
    } catch(e) { showToast("❌ Erreur de sauvegarde"); }
    setSaving(false);
  };

  const updateStatus = async (ref, status) => {
    try {
      await db.updateTxnStatus(ref, status);
      setTxns(t => t.map(x => x.ref===ref ? {...x,status} : x));
      showToast("Statut mis à jour !");
    } catch { showToast("Erreur mise à jour"); }
  };

  const updateRate = (product, key, val) => {
    const v = parseFloat(val);
    if (isNaN(v) && val !== "") return;
    setLocalRates(r => ({
      ...r,
      [product]: (product==="btc"||product==="usdt") ? (val===""?"":v) : { ...r[product], [key]: val===""?"":v }
    }));
  };

  if (!auth) return (
    <div style={{maxWidth:380,margin:"80px auto",padding:"0 16px",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:16}}>🔐</div>
      <h2 className="sg" style={{fontWeight:700,fontSize:22,marginBottom:8}}>Accès Admin</h2>
      <p className="muted" style={{fontSize:14,marginBottom:24}}>Entrez le mot de passe admin.</p>
      <input className="input" type="password" placeholder="Mot de passe" value={pass} onChange={e=>setPass(e.target.value)} style={{marginBottom:14}} onKeyDown={e=>e.key==="Enter"&&pass==="ukexchange2024"&&setAuth(true)}/>
      <button className="btn btn-gold" style={{width:"100%",padding:"12px",fontSize:15}} onClick={()=>pass==="ukexchange2024"&&setAuth(true)}>Connexion</button>
    </div>
  );

  const filteredTxns = txns.filter(t => {
    if (filter!=="all" && t.status!==filter) return false;
    if (searchTxn && !t.ref?.includes(searchTxn.toUpperCase()) && !t.contact?.includes(searchTxn)) return false;
    return true;
  });

  const totalVol = txns.reduce((a,t)=>a+(t.payout||0),0);
  const pending = txns.filter(t=>t.status==="en_attente").length;
  const done = txns.filter(t=>t.status==="validee").length;

  const rateCountries = rateProduct==="itunes" ? ITUNES_COUNTRIES : rateProduct==="steam" ? STEAM_COUNTRIES : [];
  const filteredRateCountries = rateCountries.filter(c=>c.name.toLowerCase().includes(rateSearch.toLowerCase())||c.currency.toLowerCase().includes(rateSearch.toLowerCase()));

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px 16px 60px"}}>
      {toast && <div className="toast">{toast}</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[["Total txns",txns.length,"#F5C842"],["En attente",pending,"#FF9500"],["Validées",done,"#00D26A"],["Volume",fmt(totalVol)+" XOF","#A78BFA"]].map(([l,v,c])=>(
          <div key={l} className="card" style={{padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:10,marginBottom:4}} className="muted">{l}</div>
            <div className="sg" style={{fontWeight:700,fontSize:16,color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        {[["txns","📋 Transactions"],["rates","📊 Taux"]].map(([t,l])=>(
          <button key={t} className="tab" onClick={()=>setTab(t)} style={{background:tab===t?"#F5C842":"#0F0F1A",color:tab===t?"#07070F":"#888",border:tab===t?"none":"1px solid #1C1C2E"}}>{l}</button>
        ))}
      </div>
      {tab==="txns" && (
        <div className="fade-in">
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            <input className="input" placeholder="Rechercher réf ou contact..." value={searchTxn} onChange={e=>setSearchTxn(e.target.value)} style={{maxWidth:280}}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["all","Toutes"],["en_attente","En attente"],["validee","Validées"],["annulee","Annulées"]].map(([f,l])=>(
                <button key={f} className="chip" style={filter===f?{background:"#F5C842",color:"#07070F",borderColor:"#F5C842"}:{}} onClick={()=>setFilter(f)}>{l}</button>
              ))}
            </div>
          </div>
          {loadingTxns ? <div style={{textAlign:"center",padding:"40px 0"}} className="muted">Chargement...</div> :
          filteredTxns.length===0 ? <div style={{textAlign:"center",padding:"40px 0"}} className="muted">Aucune transaction</div> :
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filteredTxns.map((t,i)=>{
              const sc = {en_attente:"#F5C842",validee:"#00D26A",annulee:"#FF4D6A"}[t.status]||"#666";
              const sl = {en_attente:"En attente",validee:"Validée",annulee:"Annulée"}[t.status]||t.status;
              return (
                <div key={i} className="card" style={{padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                        <span className="sg" style={{fontWeight:600,fontSize:14}}>{t.ref}</span>
                        <span className="badge" style={{background:sc+"22",color:sc}}>{sl}</span>
                      </div>
                      <div style={{fontSize:13,marginBottom:2}} className="muted">
                        {t.product?.toUpperCase()} {t.country?`· ${t.country}`:""} {t.denomination?`· ${t.denomination}`:""} {t.crypto_amount?`· ${t.crypto_amount} ${t.product?.toUpperCase()}`:""}
                      </div>
                      <div style={{fontSize:12}} className="muted">{t.pay_method} · {t.contact}</div>
                      {t.card_code && <div style={{fontSize:12,marginTop:4,fontFamily:"monospace",color:"#F5C842"}}>Code: {t.card_code}</div>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div className="sg gold" style={{fontWeight:700,fontSize:17,marginBottom:8}}>{fmt(t.payout)} XOF</div>
                      <div style={{display:"flex",gap:6,justifyContent:"flex-end",flexWrap:"wrap"}}>
                        {t.status==="en_attente" && <>
                          <button className="btn" style={{padding:"5px 10px",fontSize:12,background:"#00D26A22",color:"#00D26A",border:"1px solid #00D26A44"}} onClick={()=>updateStatus(t.ref,"validee")}>✓ Valider</button>
                          <button className="btn btn-red" style={{padding:"5px 10px",fontSize:12}} onClick={()=>updateStatus(t.ref,"annulee")}>✕ Annuler</button>
                        </>}
                        {t.status!=="en_attente" && <button className="btn btn-ghost" style={{padding:"5px 10px",fontSize:12}} onClick={()=>updateStatus(t.ref,"en_attente")}>↺ Rouvrir</button>}
                      </div>
                      <div style={{fontSize:11,marginTop:6}} className="muted">{t.created_at?new Date(t.created_at).toLocaleString("fr-FR"):""}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>
      )}
      {tab==="rates" && (
        <div className="fade-in">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
            <p className="muted" style={{fontSize:14}}>Taux en XOF par unité de devise</p>
            <button className="btn btn-gold" style={{padding:"9px 20px",fontSize:14}} onClick={saveRates} disabled={saving}>
              {saving?"Sauvegarde...":"💾 Sauvegarder tout"}
            </button>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {[["itunes","🎵 iTunes"],["steam","🎮 Steam"],["pcs","💳 PCS"],["transcash","💰 Transcash"],["crypto","₿ Crypto"]].map(([t,l])=>(
              <button key={t} className="chip" style={rateProduct===t?{background:"#F5C842",color:"#07070F",borderColor:"#F5C842"}:{}} onClick={()=>setRateProduct(t)}>{l}</button>
            ))}
          </div>
          {["itunes","steam"].includes(rateProduct) && (
            <div className="card" style={{padding:20}}>
              <div className="sg" style={{fontWeight:600,marginBottom:14}}>{rateProduct==="itunes"?"🎵 iTunes":"🎮 Steam"} — XOF / 1 unité devise</div>
              <input className="input" placeholder="Rechercher pays..." value={rateSearch} onChange={e=>setRateSearch(e.target.value)} style={{marginBottom:14}}/>
              <div className="rate-grid" style={{maxHeight:400,overflowY:"auto",paddingRight:4}}>
                {filteredRateCountries.map(c=>(
                  <div key={c.code} style={{background:"#07070F",borderRadius:8,padding:"10px 12px",border:"1px solid #1C1C2E"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                      <span style={{fontSize:16}}>{c.flag}</span>
                      <div><div style={{fontSize:13,fontWeight:500}}>{c.name}</div><div style={{fontSize:11}} className="muted">{c.currency}</div></div>
                    </div>
                    <input className="input" type="number" value={localRates[rateProduct]?.[c.code]??""} onChange={e=>updateRate(rateProduct,c.code,e.target.value)} style={{padding:"7px 10px",fontSize:13}}/>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(rateProduct==="pcs"||rateProduct==="transcash") && (
            <div className="card" style={{padding:20}}>
              <div className="sg" style={{fontWeight:600,marginBottom:16}}>{rateProduct==="pcs"?"💳 PCS":"💰 Transcash"} — XOF / €1</div>
              <input className="input" type="number" value={localRates[rateProduct]?.EUR??""} onChange={e=>updateRate(rateProduct,"EUR",e.target.value)} style={{maxWidth:250}}/>
            </div>
          )}
          {rateProduct==="crypto" && (
            <div className="card" style={{padding:20}}>
              <div className="sg" style={{fontWeight:600,marginBottom:16}}>₿ Cryptomonnaies — Taux de référence</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
                <div>
                  <label style={{fontSize:13,display:"block",marginBottom:8}} className="muted">Bitcoin (BTC) — XOF / USD</label>
                  <input className="input" type="number" value={localRates.btc??""} onChange={e=>updateRate("btc",null,e.target.value)}/>
                </div>
                <div>
                  <label style={{fontSize:13,display:"block",marginBottom:8}} className="muted">USDT — XOF / 1 USDT</label>
                  <input className="input" type="number" value={localRates.usdt??""} onChange={e=>updateRate("usdt",null,e.target.value)}/>
                </div>
              </div>
              <p style={{fontSize:12,marginTop:12}} className="muted">Le prix BTC est récupéré en temps réel depuis CoinGecko. Ces taux servent de secours si l'API est indisponible.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
