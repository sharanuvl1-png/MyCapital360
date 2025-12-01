import React, { useRef, useState } from "react";

export default function CASFloatingPanel({ onImport = ()=>{} }){
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const inputRef = useRef();

  function parseMock(f){
    // fast mock preview for UX
    return new Promise(res => setTimeout(()=> res([
      { scheme: "HDFC Midcap Opportunities", folio: "12345", current_value: 125000, category: "Mutual Funds" },
      { scheme: "TCS", folio: "—", current_value: 560000, category: "Stocks" }
    ]), 500));
  }

  async function handleSelect(f){
    if(!f) return;
    setFile(f);
    setLoading(true);
    try {
      const p = await parseMock(f);
      setPreview(p);
    } catch(e){
      alert("Preview failed: "+e.message);
    } finally { setLoading(false) }
  }

  async function upload(){
    if(!file) return alert("Select PDF first");
    setLoading(true);
    try {
      if(!process.env.REACT_APP_CAS_API){
        // no backend configured, fallback: import preview
        const mapped = preview.map(p=> ({ id: Math.floor(Math.random()*1e9), name: p.scheme, category: p.category || "Mutual Funds", invested: 0, current: p.current_value || 0 }));
        onImport(mapped);
        alert(`Imported ${mapped.length} items (preview fallback)`);
        setOpen(false);
        setPreview([]); setFile(null);
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      if(password) fd.append("password", password);
      const api = (process.env.REACT_APP_CAS_API||"") + "/parse_cas";
      const res = await fetch(api, { method: "POST", body: fd });
      const json = await res.json();
      if(json.status === "ok"){
        const mapped = (json.data||[]).map(d => ({ id: Math.floor(Math.random()*1e9), name: d.name || d.scheme, category: d.category || "Mutual Funds", invested: d.invested || 0, current: d.current_value || d.current || 0, meta: { isin: d.isin, folio: d.folio } }));
        onImport(mapped);
        alert(`Imported ${mapped.length} items`);
        setOpen(false); setPreview([]); setFile(null);
      } else {
        alert("Parsing failed: "+ (json.message || JSON.stringify(json)));
      }
    } catch(e){
      alert("Upload error: "+ e.message);
    } finally { setLoading(false) }
  }

  return (
    <>
      <button className="import-fab" onClick={()=> setOpen(true)}>Import CAS</button>

      <div style={{position:"fixed",top:0,right:0,height:"100%",width:560,transform: open? "translateX(0)":"translateX(100%)",transition:"transform .32s",zIndex:200}}>
        <div style={{height:"100%",padding:20,background:"rgba(2,6,23,0.6)",backdropFilter:"blur(12px)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <h3 style={{margin:0}}>Smart CAS Import</h3>
              <div className="small-muted">Supports CAMS/KFin CAS. Preview then import.</div>
            </div>
            <div><button style={{background:"transparent",border:"none",color:"white",fontSize:20}} onClick={()=>setOpen(false)}>✕</button></div>
          </div>

          <div style={{marginTop:16}}>
            <div onClick={()=> inputRef.current && inputRef.current.click()} style={{padding:14,borderRadius:10,border:"1px dashed rgba(255,255,255,0.06)",cursor:"pointer"}}>
              <input ref={inputRef} type="file" accept="application/pdf" style={{display:"none"}} onChange={e=> handleSelect(e.target.files[0])} />
              <div style={{fontWeight:700}}>Click or drag to select your CAS PDF</div>
              <div className="small-muted" style={{marginTop:6}}>If your CAS is password protected, enter password then Upload.</div>
            </div>

            <div style={{display:"flex",gap:8,marginTop:12}}>
              <input placeholder="PDF password (optional)" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{flex:1}} />
              <button className="btn-ghost" onClick={()=> file && handleSelect(file)} disabled={!file}>{loading? "Parsing...":"Preview"}</button>
              <button className="btn" onClick={upload} disabled={loading || !file}>{loading? "Importing...":"Upload & Import"}</button>
            </div>

            <div style={{marginTop:18}}>
              <div className="small-muted" style={{marginBottom:8}}>Preview</div>
              <div style={{maxHeight:280,overflow:"auto"}}>
                {loading && <div>Parsing...</div>}
                {!loading && preview.length===0 && <div className="small-muted">No preview — choose file then click Preview (or import fallback if backend not set).</div>}
                {!loading && preview.map((p,i)=>(
                  <div key={i} style={{padding:10,borderRadius:8,marginBottom:8,background:"rgba(255,255,255,0.02)"}}>
                    <div style={{fontWeight:700}}>{p.scheme}</div>
                    <div className="small-muted">Folio: {p.folio} • Current: ₹{Number(p.current_value||0).toLocaleString()} • Category: {p.category || "Mutual Funds"}</div>
                    <div style={{marginTop:8}}><button className="btn-ghost" onClick={()=> onImport([{ id: Math.floor(Math.random()*1e9), name:p.scheme, category:p.category || "Mutual Funds", invested:0, current:p.current_value || 0 }])}>Add to portfolio</button></div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{marginTop:12,fontSize:12,color:"rgba(255,255,255,0.6)"}}>Privacy: Local preview does not leave your browser. Backend uploads are deleted after parsing.</div>
          </div>
        </div>
      </div>
    </>
  );
}
