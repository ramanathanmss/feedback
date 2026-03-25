import { useState, useEffect, useRef } from "react";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

// ─── MASTER CREDENTIALS ───────────────────────────────────────────────────────
const MASTER_CREDS = { username: "admin", password: "master@123" };

// ─── IN-MEMORY DB (shared across components via reference) ────────────────────
const DB = {
  restaurants: [
    {
      id: "r1", name: "Bella Vista", cuisine: "Italian", owner: "Marco Rossi",
      username: "bellavista", password: "bella@123", logo: "🍕", color: "#166534",
      feedback: [
        { id: 1, name: "Rahul M.", phone: "9876543210", time: "2h ago", createdAt: new Date(Date.now()-2*60*60*1000).toISOString(), overallRating: 5, foodRating: 5, serviceRating: 5, ambianceRating: 4, dishMentioned: "Margherita Pizza", sentiment: "positive", complaints: [], compliments: ["amazing taste", "crispy crust"], summary: "Absolutely loved the pizza, best I've had!" },
        { id: 2, name: "Priya S.", phone: "9123456789", time: "3h ago", createdAt: new Date(Date.now()-3*60*60*1000).toISOString(), overallRating: 3, foodRating: 4, serviceRating: 2, ambianceRating: 3, dishMentioned: "Garlic Bread", sentiment: "neutral", complaints: ["waiting time", "slow service"], compliments: ["good food"], summary: "Food was good but waited 40 minutes." },
        { id: 3, name: "Arun K.", phone: "9988776655", time: "5h ago", createdAt: new Date(Date.now()-2*24*60*60*1000).toISOString(), overallRating: 2, foodRating: 2, serviceRating: 3, ambianceRating: 3, dishMentioned: "Farmhouse Pizza", sentiment: "negative", complaints: ["hard pizza crust", "too oily"], compliments: [], summary: "Crust was hard and pizza was very oily. Disappointed." },
      ]
    },
    {
      id: "r2", name: "Spice Garden", cuisine: "Indian", owner: "Anjali Sharma",
      username: "spicegarden", password: "spice@123", logo: "🍛", color: "#92400e",
      feedback: [
        { id: 1, name: "Kiran T.", phone: "9876501234", time: "1h ago", createdAt: new Date(Date.now()-1*60*60*1000).toISOString(), overallRating: 5, foodRating: 5, serviceRating: 4, ambianceRating: 5, dishMentioned: "Butter Chicken", sentiment: "positive", complaints: [], compliments: ["authentic taste", "great service"], summary: "Best butter chicken in town!" },
        { id: 2, name: "Suresh M.", phone: "9845612378", time: "4h ago", createdAt: new Date(Date.now()-8*24*60*60*1000).toISOString(), overallRating: 4, foodRating: 4, serviceRating: 4, ambianceRating: 3, dishMentioned: "Biryani", sentiment: "positive", complaints: ["noisy ambiance"], compliments: ["delicious biryani"], summary: "Food was great, a bit noisy though." },
      ]
    },
    {
      id: "r3", name: "The Burger Lab", cuisine: "American", owner: "Dev Patel",
      username: "burgerlab", password: "burger@123", logo: "🍔", color: "#1d4ed8",
      feedback: [
        { id: 1, name: "Ananya R.", phone: "9711223344", time: "30m ago", createdAt: new Date(Date.now()-30*60*1000).toISOString(), overallRating: 4, foodRating: 5, serviceRating: 3, ambianceRating: 4, dishMentioned: "Classic Smash Burger", sentiment: "positive", complaints: ["slow billing"], compliments: ["juicy burger", "crispy fries"], summary: "Burger was incredible, billing took too long." },
      ]
    },
  ]
};

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function StarRating({ rating, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= rating ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </span>
  );
}

function SentimentBadge({ s }) {
  const map = { positive: ["#dcfce7","#15803d","↑ Positive"], neutral: ["#fef9c3","#92400e","→ Neutral"], negative: ["#fee2e2","#dc2626","↓ Negative"] };
  const [bg, color, label] = map[s] || map.neutral;
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{label}</span>;
}

function Card({ children, style = {} }) {
  return <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", ...style }}>{children}</div>;
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 400, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        {children}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleLogin() {
    if (!username || !password) return;
    setError(""); setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (username === MASTER_CREDS.username && password === MASTER_CREDS.password) {
        return onLogin({ role: "master", username });
      }
      const r = DB.restaurants.find(r => r.username === username && r.password === password);
      if (r) return onLogin({ role: "restaurant", restaurantId: r.id, username });
      setError("Invalid username or password.");
    }, 600);
  }

  const inp = (val, set, type, ph) => (
    <div style={{ position: "relative" }}>
      <input value={val} onChange={e => set(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
        type={type} placeholder={ph}
        style={{ width: "100%", padding: type === "password" ? "12px 44px 12px 16px" : "12px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
      {type === "password" && (
        <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 15 }}>{showPass ? "🙈" : "👁️"}</button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #060a06 0%, #0f1a0f 60%, #0a0a14 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 68, height: 68, borderRadius: 22, background: "linear-gradient(135deg, #166534, #15803d)", fontSize: 32, marginBottom: 18, boxShadow: "0 8px 32px rgba(22,101,52,0.5)" }}>🍽️</div>
          <h1 style={{ color: "#fff", fontSize: 30, margin: "0 0 6px", fontWeight: 800, letterSpacing: -1 }}>ReviewPulse</h1>
          <p style={{ color: "#4b5563", fontSize: 14, margin: 0 }}>Restaurant Feedback Intelligence Platform</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 32, backdropFilter: "blur(10px)" }}>
          <h2 style={{ color: "#f9fafb", fontSize: 18, margin: "0 0 22px", fontWeight: 600 }}>Sign in to your account</h2>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#6b7280", fontSize: 11, marginBottom: 6, letterSpacing: 1, fontWeight: 600 }}>USERNAME</label>
            {inp(username, setUsername, "text", "Enter your username")}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#6b7280", fontSize: 11, marginBottom: 6, letterSpacing: 1, fontWeight: 600 }}>PASSWORD</label>
            {inp(password, setPassword, showPass ? "text" : "password", "Enter your password")}
          </div>

          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

          <button onClick={handleLogin} disabled={loading || !username || !password}
            style={{ width: "100%", padding: 14, background: username && password ? "linear-gradient(135deg, #166534, #15803d)" : "#1f2937", border: "none", borderRadius: 12, color: username && password ? "#fff" : "#4b5563", fontSize: 15, fontWeight: 700, cursor: username && password ? "pointer" : "default", fontFamily: "inherit" }}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>

          <div style={{ marginTop: 20, padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ color: "#4b5563", fontSize: 10, marginBottom: 8, letterSpacing: 1, fontWeight: 700 }}>DEMO CREDENTIALS</div>
            <div style={{ fontSize: 12, lineHeight: 2, color: "#6b7280" }}>
              <span style={{ color: "#4ade80", fontWeight: 600 }}>Master Admin:</span> admin / master@123<br />
              <span style={{ color: "#fb923c", fontWeight: 600 }}>Bella Vista:</span> bellavista / bella@123<br />
              <span style={{ color: "#60a5fa", fontWeight: 600 }}>Spice Garden:</span> spicegarden / spice@123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MASTER ADMIN ─────────────────────────────────────────────────────────────
function MasterAdmin({ onLogout }) {
  const [restaurants, setRestaurants] = useState([...DB.restaurants]);
  const [view, setView] = useState("list"); // list | add | edit
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const emptyForm = { name: "", cuisine: "", owner: "", username: "", password: "", logo: "🍽️", color: "#166534" };
  const [form, setForm] = useState(emptyForm);

  const LOGOS = ["🍕","🍛","🍔","🍣","🥗","🍜","🌮","🥩","🍱","🍝","🥘","🍲"];
  const COLORS = ["#166534","#92400e","#1d4ed8","#7c3aed","#be185d","#0f766e","#b45309","#dc2626","#0e7490"];

  function toast_(msg, type="ok") { setToast({msg,type}); setTimeout(()=>setToast(null),3000); }

  function syncAndSet(list) { DB.restaurants = list; setRestaurants([...list]); }

  function handleSave() {
    if (!form.name || !form.username || !form.password) return;
    if (editTarget) {
      syncAndSet(DB.restaurants.map(r => r.id === editTarget.id ? { ...r, ...form } : r));
      toast_("Restaurant updated!");
    } else {
      syncAndSet([...DB.restaurants, { ...form, id: "r" + Date.now(), feedback: [] }]);
      toast_(`"${form.name}" added!`);
    }
    setView("list"); setEditTarget(null); setForm(emptyForm);
  }

  function handleDelete(r) {
    syncAndSet(DB.restaurants.filter(x => x.id !== r.id));
    setDeleteTarget(null); toast_(`"${r.name}" deleted.`, "err");
  }

  const totalReviews = restaurants.reduce((s,r)=>s+r.feedback.length, 0);

  const Label = ({c}) => <label style={{ display:"block", color:"#6b7280", fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:5 }}>{c}</label>;
  const InputField = ({value, onChange, placeholder}) => (
    <input value={value} onChange={onChange} placeholder={placeholder}
      style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #e5e7eb", borderRadius:10, fontSize:14, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }} />
  );

  return (
    <div style={{ minHeight:"100vh", background:"#f3f4f6", fontFamily:"'Segoe UI', sans-serif" }}>
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:999, background: toast.type==="err"?"#fee2e2":"#dcfce7", color: toast.type==="err"?"#dc2626":"#166534", padding:"12px 20px", borderRadius:12, fontWeight:700, fontSize:14, boxShadow:"0 4px 20px rgba(0,0,0,0.12)", display:"flex", alignItems:"center", gap:8 }}>
          {toast.type==="err"?"🗑️":"✅"} {toast.msg}
        </div>
      )}

      {/* NAV */}
      <div style={{ background:"linear-gradient(135deg, #09090b, #18181b)", height:62, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:38, height:38, borderRadius:12, background:"linear-gradient(135deg,#166534,#15803d)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🍽️</div>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:16, letterSpacing:-0.5 }}>ReviewPulse</div>
            <div style={{ color:"#52525b", fontSize:10, letterSpacing:1.5 }}>MASTER ADMIN CONSOLE</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ background:"rgba(74,222,128,0.12)", color:"#4ade80", fontSize:12, padding:"5px 14px", borderRadius:20, border:"1px solid rgba(74,222,128,0.25)", fontWeight:600 }}>● Master Admin</span>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", color:"#a1a1aa", padding:"8px 16px", borderRadius:10, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>Sign Out</button>
        </div>
      </div>

      <div style={{ padding:"28px 32px", maxWidth:1100, margin:"0 auto" }}>
        {view !== "list" ? (
          <div style={{ maxWidth:580 }}>
            <button onClick={()=>{setView("list");setForm(emptyForm);setEditTarget(null);}} style={{ background:"none", border:"none", color:"#6b7280", cursor:"pointer", fontSize:14, marginBottom:20, display:"flex", alignItems:"center", gap:6, fontFamily:"inherit" }}>← Back</button>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#111", margin:"0 0 22px" }}>{editTarget ? "Edit Restaurant" : "Add New Restaurant"}</h2>
            <Card>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <Label c="RESTAURANT NAME" />
                  <InputField value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Bella Vista" />
                </div>
                <div><Label c="CUISINE TYPE" /><InputField value={form.cuisine} onChange={e=>setForm({...form,cuisine:e.target.value})} placeholder="e.g. Italian" /></div>
                <div><Label c="OWNER NAME" /><InputField value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} placeholder="e.g. Marco Rossi" /></div>
                <div><Label c="LOGIN USERNAME" /><InputField value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="e.g. bellavista" /></div>
                <div><Label c="LOGIN PASSWORD" /><InputField value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Set a password" /></div>
              </div>

              <div style={{ marginTop:20 }}>
                <Label c="RESTAURANT ICON" />
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
                  {LOGOS.map(e=>(
                    <button key={e} onClick={()=>setForm({...form,logo:e})} style={{ width:40,height:40,borderRadius:10,border:form.logo===e?"2.5px solid #166534":"1.5px solid #e5e7eb",background:form.logo===e?"#dcfce7":"#fff",fontSize:20,cursor:"pointer" }}>{e}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop:16 }}>
                <Label c="BRAND COLOUR" />
                <div style={{ display:"flex", gap:8, marginTop:6 }}>
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setForm({...form,color:c})} style={{ width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #111":"3px solid transparent",cursor:"pointer" }} />
                  ))}
                </div>
              </div>

              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <button onClick={()=>{setView("list");setForm(emptyForm);setEditTarget(null);}} style={{ flex:1,padding:12,border:"1.5px solid #e5e7eb",borderRadius:10,background:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:14 }}>Cancel</button>
                <button onClick={handleSave} disabled={!form.name||!form.username||!form.password}
                  style={{ flex:2,padding:12,border:"none",borderRadius:10,background:form.name&&form.username&&form.password?"linear-gradient(135deg,#166534,#15803d)":"#e5e7eb",color:form.name?"#fff":"#9ca3af",cursor:form.name?"pointer":"default",fontFamily:"inherit",fontWeight:700,fontSize:14 }}>
                  {editTarget ? "Save Changes ✓" : "Add Restaurant →"}
                </button>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
              <div>
                <h1 style={{ fontSize:26, fontWeight:800, color:"#111", margin:"0 0 4px", letterSpacing:-0.5 }}>Restaurant Accounts</h1>
                <p style={{ color:"#6b7280", fontSize:14, margin:0 }}>Manage logins and accounts for all your restaurant clients</p>
              </div>
              <button onClick={()=>{setForm(emptyForm);setView("add");}} style={{ background:"linear-gradient(135deg,#166534,#15803d)",border:"none",color:"#fff",padding:"12px 22px",borderRadius:12,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit",display:"flex",alignItems:"center",gap:8 }}>+ Add Restaurant</button>
            </div>

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
              {[
                {icon:"🏪",label:"Restaurants",value:restaurants.length},
                {icon:"💬",label:"Total Reviews",value:totalReviews},
                {icon:"📊",label:"Avg Reviews/Restaurant",value:restaurants.length?(totalReviews/restaurants.length).toFixed(1):0},
              ].map((s,i)=>(
                <Card key={i} style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <span style={{ fontSize:34 }}>{s.icon}</span>
                  <div><div style={{ fontSize:28,fontWeight:800,color:"#111" }}>{s.value}</div><div style={{ fontSize:12,color:"#6b7280" }}>{s.label}</div></div>
                </Card>
              ))}
            </div>

            {/* List */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {restaurants.map(r=>(
                <Card key={r.id} style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:52,height:52,borderRadius:14,background:r.color+"18",border:`2px solid ${r.color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0 }}>{r.logo}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:3 }}>
                      <span style={{ fontWeight:700,fontSize:16,color:"#111" }}>{r.name}</span>
                      <span style={{ background:r.color+"18",color:r.color,fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20 }}>{r.cuisine}</span>
                    </div>
                    <div style={{ fontSize:13,color:"#6b7280" }}>👤 {r.owner} · 💬 {r.feedback.length} review{r.feedback.length!==1?"s":""}</div>
                  </div>
                  {/* Credentials */}
                  <div style={{ background:"#f9fafb",borderRadius:10,padding:"8px 14px",border:"1px solid #f0f0f0",minWidth:190 }}>
                    <div style={{ fontSize:10,color:"#9ca3af",marginBottom:5,letterSpacing:1,fontWeight:700 }}>LOGIN CREDENTIALS</div>
                    <div style={{ fontSize:13,color:"#374151",marginBottom:2 }}>🔤 <b>{r.username}</b></div>
                    <div style={{ fontSize:13,color:"#374151" }}>🔑 {r.password}</div>
                  </div>
                  <div style={{ display:"flex",gap:8,flexShrink:0 }}>
                    <button onClick={()=>{setForm({name:r.name,cuisine:r.cuisine,owner:r.owner,username:r.username,password:r.password,logo:r.logo,color:r.color});setEditTarget(r);setView("edit");}}
                      style={{ padding:"9px 16px",border:"1.5px solid #e5e7eb",borderRadius:10,background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151",fontFamily:"inherit" }}>✏️ Edit</button>
                    <button onClick={()=>setDeleteTarget(r)}
                      style={{ padding:"9px 16px",border:"1.5px solid #fecaca",borderRadius:10,background:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,color:"#dc2626",fontFamily:"inherit" }}>🗑️ Delete</button>
                  </div>
                </Card>
              ))}
              {restaurants.length===0&&(
                <div style={{ textAlign:"center",padding:"60px 0",color:"#9ca3af" }}>
                  <div style={{ fontSize:52,marginBottom:12 }}>🏪</div>
                  <div style={{ fontSize:16,fontWeight:600,marginBottom:6 }}>No restaurants yet</div>
                  <div style={{ fontSize:14 }}>Click "Add Restaurant" to get started</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {deleteTarget && (
        <Modal>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:48,marginBottom:12 }}>{deleteTarget.logo}</div>
            <div style={{ fontSize:18,fontWeight:700,marginBottom:8 }}>Delete "{deleteTarget.name}"?</div>
            <p style={{ color:"#6b7280",fontSize:14,marginBottom:24 }}>This will permanently remove the account and all {deleteTarget.feedback.length} review(s). Cannot be undone.</p>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setDeleteTarget(null)} style={{ flex:1,padding:12,border:"1.5px solid #e5e7eb",borderRadius:12,background:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
              <button onClick={()=>handleDelete(deleteTarget)} style={{ flex:1,padding:12,border:"none",borderRadius:12,background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:700 }}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CHATBOT HELPERS ──────────────────────────────────────────────────────────
function extractFeedback(text) {
  const m = text.match(/<feedback_data>([\s\S]*?)<\/feedback_data>/);
  if (m) { try { return JSON.parse(m[1]); } catch { return null; } }
  return null;
}
const cleanMsg = t => t.replace(/<feedback_data>[\s\S]*?<\/feedback_data>/g,"").trim();

// ─── CHATBOT PAGE ─────────────────────────────────────────────────────────────
function ChatbotPage({ restaurant, onFeedbackCollected }) {
  const [step, setStep] = useState("intro"); // intro | details | chat
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  function validateAndStart() {
    const digits = customerPhone.replace(/\D/g,"");
    if (digits.length < 10) { setPhoneError("Please enter a valid 10-digit mobile number."); return; }
    setPhoneError("");
    setStep("chat");
    startChat();
  }

  const sys = `You are a warm AI feedback assistant for "${restaurant.name}" (${restaurant.cuisine} cuisine). The customer's name is ${customerName||"the customer"}. Collect feedback conversationally: overall experience → food & dishes → service → ambiance → complaints/suggestions → 1-5 star rating → thank them by name. End your final message with exactly:
<feedback_data>{"overallRating":4,"foodRating":4,"serviceRating":3,"ambianceRating":4,"dishMentioned":"dish","sentiment":"positive","complaints":["issue"],"compliments":["praise"],"summary":"one sentence summary"}</feedback_data>
Keep responses to 2-3 sentences. Be warm, empathetic, never robotic.`;

  async function call(history) {
    const res = await fetch(ANTHROPIC_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:history})});
    const d = await res.json();
    return d.content?.map(b=>b.text||"").join("")||"Sorry, something went wrong.";
  }

  async function startChat() {
    setLoading(true);
    const r = await call([{role:"user",content:`Hi, I'm ${customerName||"a customer"} and I just finished my meal.`}]);
    setMessages([{role:"assistant",content:cleanMsg(r),raw:r}]);
    setLoading(false);
  }

  async function send() {
    if (!input.trim()||loading||done) return;
    const nm = [...messages,{role:"user",content:input}];
    setMessages(nm); setInput(""); setLoading(true);
    const r = await call(nm.map(m=>({role:m.role,content:m.raw||m.content})));
    const fd = extractFeedback(r);
    setMessages(p=>[...p,{role:"assistant",content:cleanMsg(r),raw:r}]);
    setLoading(false);
    if (fd) setTimeout(()=>{ setDone(true); onFeedbackCollected({ ...fd, customerName: customerName||"Anonymous", customerPhone: customerPhone.replace(/\D/g,"") }); },1500);
  }

  const btnStyle = (active) => ({ background: active ? `linear-gradient(135deg,${restaurant.color},${restaurant.color}bb)` : "#e5e7eb", border:"none", borderRadius:50, padding:"12px 28px", fontSize:14, cursor: active?"pointer":"default", fontFamily:"inherit", fontWeight:700, color: active?"#fff":"#9ca3af" });

  return (
    <div style={{ flex:1, background:`linear-gradient(160deg,#050a05,${restaurant.color}28,#050a05)`, display:"flex", alignItems:"center", justifyContent:"center", padding:32, fontFamily:"'Segoe UI',sans-serif", minHeight:"calc(100vh - 62px)" }}>
      <div style={{ width:"100%", maxWidth:480 }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:50, padding:"7px 18px", marginBottom:14 }}>
            <span style={{ fontSize:20 }}>{restaurant.logo}</span>
            <span style={{ color:"#d1d5db", fontSize:13, fontWeight:600 }}>{restaurant.name}</span>
          </div>
          <h2 style={{ color:"#fff", fontSize:26, margin:"0 0 6px", fontWeight:700 }}>Share Your Experience</h2>
          <p style={{ color:"#4b5563", fontSize:13, margin:0 }}>Your feedback helps us serve you better</p>
        </div>

        <div style={{ background:"#fff", borderRadius:22, overflow:"hidden", boxShadow:"0 30px 80px rgba(0,0,0,0.5)" }}>
          {/* Chat header */}
          <div style={{ background:`linear-gradient(135deg,${restaurant.color},${restaurant.color}bb)`, padding:"14px 18px", display:"flex", alignItems:"center", gap:11 }}>
            <div style={{ width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17 }}>🤖</div>
            <div>
              <div style={{ color:"#fff",fontWeight:700,fontSize:14 }}>Feedback AI · {restaurant.name}</div>
              <div style={{ color:"rgba(255,255,255,0.65)",fontSize:11,display:"flex",alignItems:"center",gap:4 }}>
                <span style={{ width:5,height:5,borderRadius:"50%",background:"#4ade80",display:"inline-block" }}></span> Online
              </div>
            </div>
          </div>

          {/* STEP: Intro / Details collection */}
          {step !== "chat" && (
            <div style={{ padding:28, background:"#fafafa" }}>
              {step === "intro" && (
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16,textAlign:"center",paddingBottom:8 }}>
                  <span style={{ fontSize:48 }}>{restaurant.logo}</span>
                  <p style={{ color:"#4b5563",fontSize:14,maxWidth:280,lineHeight:1.7,margin:0 }}>
                    We'd love to hear about your visit! Before we begin, please share your name and mobile number so we can follow up if needed.
                  </p>
                  <button onClick={()=>setStep("details")} style={btnStyle(true)}>Get Started →</button>
                </div>
              )}
              {step === "details" && (
                <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                  <div style={{ textAlign:"center",marginBottom:4 }}>
                    <div style={{ fontSize:22,marginBottom:6 }}>👤</div>
                    <div style={{ fontWeight:700,fontSize:16,color:"#111" }}>Your Details</div>
                    <div style={{ fontSize:13,color:"#6b7280",marginTop:3 }}>We'll only use this to respond to your feedback</div>
                  </div>

                  <div>
                    <label style={{ display:"block",fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:1,marginBottom:6 }}>YOUR NAME <span style={{ color:"#9ca3af",fontWeight:400 }}>(optional)</span></label>
                    <input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="e.g. Rahul Mehta"
                      style={{ width:"100%",padding:"12px 16px",border:"1.5px solid #e5e7eb",borderRadius:12,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
                  </div>

                  <div>
                    <label style={{ display:"block",fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:1,marginBottom:6 }}>MOBILE NUMBER <span style={{ color:"#dc2626" }}>*</span></label>
                    <div style={{ display:"flex",gap:8 }}>
                      <div style={{ display:"flex",alignItems:"center",padding:"12px 14px",border:"1.5px solid #e5e7eb",borderRadius:12,background:"#f9fafb",fontSize:14,color:"#374151",fontWeight:600,flexShrink:0 }}>
                        📱 +91
                      </div>
                      <input value={customerPhone} onChange={e=>{ setCustomerPhone(e.target.value); setPhoneError(""); }}
                        onKeyDown={e=>e.key==="Enter"&&validateAndStart()}
                        placeholder="98765 43210" maxLength={15} type="tel"
                        style={{ flex:1,padding:"12px 16px",border:`1.5px solid ${phoneError?"#dc2626":"#e5e7eb"}`,borderRadius:12,fontSize:14,outline:"none",fontFamily:"inherit" }}/>
                    </div>
                    {phoneError && <div style={{ color:"#dc2626",fontSize:12,marginTop:5,display:"flex",alignItems:"center",gap:4 }}>⚠️ {phoneError}</div>}
                    <div style={{ fontSize:11,color:"#9ca3af",marginTop:5 }}>📞 We may contact you to address any concerns</div>
                  </div>

                  <div style={{ display:"flex",gap:10,marginTop:4 }}>
                    <button onClick={()=>setStep("intro")} style={{ flex:1,padding:12,border:"1.5px solid #e5e7eb",borderRadius:12,background:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:14,color:"#6b7280" }}>← Back</button>
                    <button onClick={validateAndStart} style={{ ...btnStyle(customerPhone.replace(/\D/g,"").length>=10), flex:2, borderRadius:12, padding:12 }}>
                      Start Feedback ✨
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP: Chat */}
          {step === "chat" && (
            <>
              <div style={{ height:360,overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:12,background:"#fafafa" }}>
                {messages.map((m,i)=>(
                  <div key={i} style={{ display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                    <div style={{ maxWidth:"78%",padding:"11px 15px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.role==="user"?`linear-gradient(135deg,${restaurant.color},${restaurant.color}bb)`:"#fff",color:m.role==="user"?"#fff":"#1f2937",fontSize:13.5,lineHeight:1.6,boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading&&<div style={{ display:"flex",gap:4,padding:"11px 15px",background:"#fff",borderRadius:"18px 18px 18px 4px",width:"fit-content",boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>{[0,1,2].map(i=><div key={i} style={{ width:7,height:7,borderRadius:"50%",background:restaurant.color,animation:"bounce 1s infinite",animationDelay:`${i*0.2}s` }}/>)}</div>}
                {done&&<div style={{ background:"#dcfce7",borderRadius:14,padding:18,textAlign:"center" }}><div style={{ fontSize:32,marginBottom:6 }}>🎉</div><div style={{ color:"#166534",fontWeight:700 }}>Thank you{customerName ? `, ${customerName}` : ""}!</div><div style={{ color:"#15803d",fontSize:13,marginTop:3 }}>Your feedback has been recorded. We may reach out on {customerPhone}.</div></div>}
                <div ref={endRef}/>
              </div>
              {!done&&(
                <div style={{ padding:"12px 14px",borderTop:"1px solid #f0f0f0",display:"flex",gap:8,background:"#fff" }}>
                  <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type your response…" disabled={loading} style={{ flex:1,border:"1.5px solid #e5e7eb",borderRadius:50,padding:"10px 16px",fontSize:13,outline:"none",fontFamily:"inherit" }}/>
                  <button onClick={send} disabled={loading||!input.trim()} style={{ width:40,height:40,borderRadius:"50%",background:input.trim()?`linear-gradient(135deg,${restaurant.color},${restaurant.color}bb)`:"#e5e7eb",border:"none",cursor:input.trim()?"pointer":"default",color:"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>➤</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}

// ─── RESTAURANT DASHBOARD ─────────────────────────────────────────────────────
function RestaurantDashboard({ restaurant, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [feedback, setFeedback] = useState([...restaurant.feedback]);
  const [confirmId, setConfirmId] = useState(null);

  // ── Date filter state ──
  const [datePreset, setDatePreset] = useState("last30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  function addFeedback(data) {
    const entry = { ...data, id: Date.now(), name: data.customerName || "Anonymous", phone: data.customerPhone || "", time: "just now", createdAt: new Date().toISOString() };
    const upd = [...feedback, entry];
    setFeedback(upd); restaurant.feedback = upd;
  }

  function removeFeedback(id) {
    const upd = feedback.filter(f => f.id !== id);
    setFeedback(upd); restaurant.feedback = upd; setConfirmId(null);
  }

  // ── Date range calculation ──
  function getDateRange(preset) {
    const now = new Date();
    const startOfDay = d => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
    const endOfDay   = d => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
    switch (preset) {
      case "today":     return { from: startOfDay(now), to: endOfDay(now) };
      case "yesterday": { const y = new Date(now); y.setDate(y.getDate()-1); return { from: startOfDay(y), to: endOfDay(y) }; }
      case "last7":     { const f = new Date(now); f.setDate(f.getDate()-6); return { from: startOfDay(f), to: endOfDay(now) }; }
      case "last30":    { const f = new Date(now); f.setDate(f.getDate()-29); return { from: startOfDay(f), to: endOfDay(now) }; }
      case "lastMonth": {
        const f = new Date(now.getFullYear(), now.getMonth()-1, 1);
        const t = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from: startOfDay(f), to: endOfDay(t) };
      }
      case "custom":
        return {
          from: customFrom ? startOfDay(new Date(customFrom)) : new Date(0),
          to:   customTo   ? endOfDay(new Date(customTo))     : endOfDay(now),
        };
      default: return { from: new Date(0), to: endOfDay(now) };
    }
  }

  const { from: rangeFrom, to: rangeTo } = getDateRange(datePreset);

  // ── Filter feedback by date ──
  const all = feedback.filter(f => {
    const d = f.createdAt ? new Date(f.createdAt) : null;
    if (!d) return false;
    return d >= rangeFrom && d <= rangeTo;
  });

  const total = all.length;
  const avg = k => total ? (all.reduce((s,f)=>s+(f[k]||0),0)/total).toFixed(1) : 0;
  const positiveP = total ? Math.round(all.filter(f=>f.sentiment==="positive").length/total*100) : 0;
  const negativeP = total ? Math.round(all.filter(f=>f.sentiment==="negative").length/total*100) : 0;
  const neutralP = 100-positiveP-negativeP;

  const complaintsMap = {};
  all.forEach(f=>f.complaints.forEach(c=>{complaintsMap[c]=(complaintsMap[c]||0)+1;}));
  const topComplaints = Object.entries(complaintsMap).sort((a,b)=>b[1]-a[1]).slice(0,4);

  const dishMap = {};
  all.forEach(f=>{if(f.dishMentioned) dishMap[f.dishMentioned]=(dishMap[f.dishMentioned]||0)+1;});
  const topDishes = Object.entries(dishMap).sort((a,b)=>b[1]-a[1]).slice(0,3);

  // ── Preset labels ──
  const PRESETS = [
    { key:"today",     label:"Today" },
    { key:"yesterday", label:"Yesterday" },
    { key:"last7",     label:"Last 7 Days" },
    { key:"last30",    label:"Last 30 Days" },
    { key:"lastMonth", label:"Last Month" },
    { key:"custom",    label:"Custom" },
  ];

  function fmtDate(d) {
    return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  }

  function handlePreset(key) {
    setDatePreset(key);
    setShowCustom(key === "custom");
  }

  function RatingBar({ val }) {
    const pct = (val/5)*100, color = val>=4?"#16a34a":val>=3?"#f59e0b":"#dc2626";
    return (
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ flex:1,height:8,background:"#f0f0f0",borderRadius:4,overflow:"hidden" }}>
          <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:4 }}/>
        </div>
        <span style={{ fontSize:13,fontWeight:700,color,minWidth:28 }}>{val}</span>
      </div>
    );
  }

  const ST = ({t}) => <div style={{ fontSize:11,fontWeight:700,color:"#374151",marginBottom:14,letterSpacing:1,textTransform:"uppercase" }}>{t}</div>;

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f1", fontFamily:"'Segoe UI',sans-serif" }}>
      {/* NAV */}
      <div style={{ background:`linear-gradient(135deg,${restaurant.color},${restaurant.color}bb)`,height:62,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ fontSize:26 }}>{restaurant.logo}</span>
          <div>
            <div style={{ color:"#fff",fontWeight:700,fontSize:16 }}>{restaurant.name}</div>
            <div style={{ color:"rgba(255,255,255,0.6)",fontSize:11 }}>{restaurant.cuisine} · Feedback Dashboard</div>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ background:"rgba(0,0,0,0.18)",borderRadius:50,padding:4,display:"flex",gap:2 }}>
            {[["dashboard","📊 Dashboard"],["chat","💬 Feedback Chat"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 16px",borderRadius:50,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",background:tab===t?"rgba(255,255,255,0.25)":"transparent",color:"#fff" }}>{l}</button>
            ))}
          </div>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"8px 16px",borderRadius:10,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600 }}>Sign Out</button>
        </div>
      </div>

      {tab==="chat" ? <ChatbotPage restaurant={restaurant} onFeedbackCollected={addFeedback}/> : (
        <div style={{ padding:"24px 28px",maxWidth:1300,margin:"0 auto" }}>

          {/* ── DATE FILTER BAR ── */}
          <div style={{ background:"#fff",borderRadius:16,padding:"16px 20px",marginBottom:20,boxShadow:"0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
              <div style={{ display:"flex",alignItems:"center",gap:6,color:"#374151",fontSize:13,fontWeight:700,flexShrink:0 }}>
                <span style={{ fontSize:16 }}>📅</span> Date Range:
              </div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",flex:1 }}>
                {PRESETS.map(p=>(
                  <button key={p.key} onClick={()=>handlePreset(p.key)}
                    style={{ padding:"7px 16px",borderRadius:50,border:`1.5px solid ${datePreset===p.key ? restaurant.color : "#e5e7eb"}`,background:datePreset===p.key ? restaurant.color+"18" : "#fff",color:datePreset===p.key ? restaurant.color : "#6b7280",fontWeight:datePreset===p.key?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Active range label */}
              {datePreset !== "custom" && (
                <div style={{ fontSize:12,color:"#9ca3af",flexShrink:0,fontStyle:"italic" }}>
                  {fmtDate(rangeFrom)} — {fmtDate(rangeTo)}
                </div>
              )}
            </div>

            {/* Custom date pickers */}
            {showCustom && (
              <div style={{ display:"flex",alignItems:"center",gap:12,marginTop:14,paddingTop:14,borderTop:"1px solid #f0f0f0",flexWrap:"wrap" }}>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <label style={{ fontSize:12,fontWeight:700,color:"#6b7280",letterSpacing:0.5 }}>FROM</label>
                  <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)}
                    style={{ padding:"8px 12px",border:"1.5px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",fontFamily:"inherit",color:"#374151" }}/>
                </div>
                <div style={{ color:"#9ca3af",fontSize:16 }}>→</div>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <label style={{ fontSize:12,fontWeight:700,color:"#6b7280",letterSpacing:0.5 }}>TO</label>
                  <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)}
                    style={{ padding:"8px 12px",border:"1.5px solid #e5e7eb",borderRadius:10,fontSize:13,outline:"none",fontFamily:"inherit",color:"#374151" }}/>
                </div>
                {customFrom && customTo && (
                  <div style={{ fontSize:12,color:"#9ca3af",fontStyle:"italic" }}>
                    {fmtDate(rangeFrom)} — {fmtDate(rangeTo)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RESULT LABEL ── */}
          <div style={{ marginBottom:16,display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:13,color:"#6b7280" }}>Showing</span>
            <span style={{ fontSize:13,fontWeight:700,color:restaurant.color }}>{total} review{total!==1?"s":""}</span>
            <span style={{ fontSize:13,color:"#6b7280" }}>for</span>
            <span style={{ fontSize:13,fontWeight:600,color:"#374151" }}>{PRESETS.find(p=>p.key===datePreset)?.label}</span>
            {total===0 && <span style={{ fontSize:12,color:"#9ca3af",marginLeft:8 }}>— try selecting a wider range</span>}
          </div>

          {/* KPIs */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20 }}>
            {[
              {icon:"💬",label:"Total Reviews",value:total,color:restaurant.color},
              {icon:"⭐",label:"Avg. Rating",value:total?avg("overallRating"):"—",color:"#f59e0b"},
              {icon:"👍",label:"Positive",value:`${positiveP}%`,color:"#16a34a"},
              {icon:"👎",label:"Negative",value:`${negativeP}%`,color:"#dc2626"},
            ].map((k,i)=>(
              <Card key={i} style={{ borderLeft:`4px solid ${k.color}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div><div style={{ fontSize:12,color:"#6b7280",marginBottom:4 }}>{k.label}</div><div style={{ fontSize:28,fontWeight:800,color:"#111" }}>{k.value}</div></div>
                  <span style={{ fontSize:26 }}>{k.icon}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Row 1 */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16 }}>
            <Card>
              <ST t="Customer Satisfaction"/>
              {total===0?<div style={{ color:"#9ca3af",textAlign:"center",padding:20,fontSize:13 }}>No data for this period</div>:(
                <div style={{ display:"flex",alignItems:"center",gap:20 }}>
                  <svg width={100} height={100} viewBox="0 0 110 110">
                    {(()=>{
                      const segs=[{pct:positiveP,color:"#16a34a"},{pct:neutralP,color:"#f59e0b"},{pct:negativeP,color:"#dc2626"}];
                      let offset=-25;
                      return segs.map((s,i)=>{
                        const r=42,cx=55,cy=55,circ=2*Math.PI*r,dash=(s.pct/100)*circ;
                        const el=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={14} strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-(offset/100)*circ}/>;
                        offset+=s.pct; return el;
                      });
                    })()}
                    <text x="55" y="51" textAnchor="middle" style={{ fontSize:18,fontWeight:700,fill:"#111" }}>{positiveP}%</text>
                    <text x="55" y="65" textAnchor="middle" style={{ fontSize:10,fill:"#6b7280" }}>positive</text>
                  </svg>
                  <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                    {[["#16a34a","Satisfied",positiveP],["#f59e0b","Neutral",neutralP],["#dc2626","Negative",negativeP]].map(([c,l,p])=>(
                      <div key={l} style={{ display:"flex",alignItems:"center",gap:7 }}>
                        <div style={{ width:9,height:9,borderRadius:"50%",background:c }}/>
                        <span style={{ fontSize:12,color:"#374151" }}>{l}</span>
                        <span style={{ fontSize:12,fontWeight:700,color:c,marginLeft:"auto" }}>{p}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <ST t="Category Ratings"/>
              {total===0?<div style={{ color:"#9ca3af",textAlign:"center",padding:20,fontSize:13 }}>No data for this period</div>:(
                <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  {[["Food Quality","foodRating"],["Service","serviceRating"],["Ambiance","ambianceRating"]].map(([l,k])=>(
                    <div key={l}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                        <span style={{ fontSize:13,color:"#374151" }}>{l}</span>
                        <StarRating rating={Math.round(parseFloat(avg(k)))}/>
                      </div>
                      <RatingBar val={parseFloat(avg(k))}/>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <ST t="Top Complaints"/>
              {topComplaints.length===0?<div style={{ color:"#6b7280",textAlign:"center",padding:20,fontSize:13 }}>{total===0?"No data for this period":"No complaints yet 🎉"}</div>
              :topComplaints.map(([c,count],i)=>(
                <div key={c} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
                  <span style={{ width:22,height:22,borderRadius:"50%",background:i===0?"#fee2e2":"#fef9c3",color:i===0?"#dc2626":"#b45309",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" }}>{i+1}</span>
                  <span style={{ flex:1,fontSize:13,color:"#1f2937",textTransform:"capitalize" }}>{c}</span>
                  <span style={{ fontSize:11,color:"#6b7280",background:"#f3f4f6",padding:"2px 8px",borderRadius:10 }}>{count}x</span>
                  <span>⚠️</span>
                </div>
              ))}
            </Card>
          </div>

          {/* Row 2 */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 2fr",gap:16 }}>
            <Card>
              <ST t="Top Dishes"/>
              {topDishes.length===0?<div style={{ color:"#9ca3af",fontSize:13,textAlign:"center",padding:"12px 0" }}>{total===0?"No data for this period":"No dish data yet"}</div>
              :topDishes.map(([d,count],i)=>(
                <div key={d} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
                  <span style={{ fontSize:20 }}>{["🥇","🥈","🥉"][i]}</span>
                  <span style={{ flex:1,fontSize:13,color:"#1f2937" }}>{d}</span>
                  <span style={{ background:"#dcfce7",color:"#166534",fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:20 }}>{count}</span>
                </div>
              ))}
            </Card>

            <Card>
              <ST t={`Reviews in Period (${total})`}/>
              {total===0?(
                <div style={{ textAlign:"center",padding:"32px 0",color:"#9ca3af" }}>
                  <div style={{ fontSize:40,marginBottom:8 }}>🗓️</div>
                  <div style={{ fontWeight:600,marginBottom:4 }}>No reviews in this period</div>
                  <div style={{ fontSize:13 }}>Try a wider date range or use the Feedback Chat to collect new responses</div>
                </div>
              ):(
                <div style={{ display:"flex",flexDirection:"column",gap:10,maxHeight:320,overflowY:"auto" }}>
                  {[...all].reverse().map((f,i)=>(
                    <div key={f.id||i} style={{ display:"flex",gap:12,alignItems:"flex-start",padding:12,background:"#fafafa",borderRadius:12 }}>
                      <div style={{ width:36,height:36,borderRadius:"50%",background:`hsl(${i*47},55%,85%)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0 }}>{(f.name||"?")[0]}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3 }}>
                          <div>
                            <span style={{ fontWeight:700,fontSize:13,color:"#111" }}>{f.name||"Anonymous"}</span>
                            {f.createdAt && <div style={{ fontSize:11,color:"#9ca3af",marginTop:1 }}>{new Date(f.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div>}
                            {f.phone && (
                              <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:3 }}>
                                <span style={{ fontSize:11,color:"#6b7280",fontFamily:"monospace" }}>📱 +91 {f.phone.replace(/(\d{5})(\d{5})/,"$1 $2")}</span>
                                <a href={`tel:+91${f.phone}`} title="Call customer" style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:6,background:"#dbeafe",color:"#1d4ed8",fontSize:11,textDecoration:"none",flexShrink:0 }}>📞</a>
                                <a href={`https://wa.me/91${f.phone}?text=Hi%20${encodeURIComponent(f.name||"there")}%2C%20thank%20you%20for%20your%20feedback%20at%20${encodeURIComponent(restaurant.name)}!`} target="_blank" rel="noreferrer" title="WhatsApp customer" style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:6,background:"#dcfce7",color:"#15803d",fontSize:11,textDecoration:"none",flexShrink:0 }}>💬</a>
                              </div>
                            )}
                          </div>
                          <div style={{ display:"flex",gap:6,alignItems:"center",flexShrink:0,marginLeft:8 }}>
                            <SentimentBadge s={f.sentiment}/>
                            <button onClick={()=>setConfirmId(f.id||i)} style={{ background:"#fee2e2",border:"none",borderRadius:7,width:26,height:26,cursor:"pointer",color:"#dc2626",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center" }}>🗑</button>
                          </div>
                        </div>
                        <StarRating rating={f.overallRating}/>
                        <p style={{ fontSize:12,color:"#6b7280",margin:"3px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {confirmId!==null&&(
        <Modal>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:44,marginBottom:12 }}>🗑️</div>
            <div style={{ fontSize:18,fontWeight:700,marginBottom:8 }}>Remove this review?</div>
            <p style={{ color:"#6b7280",fontSize:14,marginBottom:24 }}>This cannot be undone.</p>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setConfirmId(null)} style={{ flex:1,padding:12,border:"1.5px solid #e5e7eb",borderRadius:12,background:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
              <button onClick={()=>removeFeedback(confirmId)} style={{ flex:1,padding:12,border:"none",borderRadius:12,background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:700 }}>Remove</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  if (!session) return <LoginPage onLogin={setSession}/>;
  if (session.role==="master") return <MasterAdmin onLogout={()=>setSession(null)}/>;
  const restaurant = DB.restaurants.find(r=>r.id===session.restaurantId);
  if (!restaurant) return <LoginPage onLogin={setSession}/>;
  return <RestaurantDashboard restaurant={restaurant} onLogout={()=>setSession(null)}/>;
}
