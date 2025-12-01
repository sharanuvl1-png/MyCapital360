import React, { useRef, useState } from "react";

/**
 * CASFloatingPanel - futuristic glass slide panel
 * - client-side preview (mock) and backend upload (if REACT_APP_CAS_API configured)
 * - onImport(items) adds parsed items to tracker (items array)
 */
export default function CASFloatingPanel({ onImport = ()=>{} }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  async function parseClientSide(f){
    // lightweight mock parse to give immediate UX; real parser runs on backend
    return new Promise((res)=> {
      setTimeout(()=> res([
        { scheme: "HDFC Midcap Opportunities", folio: "1234567", current_value: 125000 },
        { scheme: "SBI Bluechip Fund", folio: "7654321", current_value: 86000 }
      ]), 700);
    });
  }

  async function handleSelect(f){
    setFile(f);
    setLoading(true);
    try {
      const p = await parseClientSide(f);
      setPreview(p);
    } catch(e){
      alert("Preview failed: "+e.message);
    } finally { setLoading(false) }
  }

  async function uploadToBackend(){
    if(!file) return alert("Select a CAS PDF first");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if(password) fd.append("password", password);
      const api = (process.env.REACT_APP_CAS_API||"") + "/parse_cas";
      if(!process.env.REACT_APP_CAS_API) {
        // no backend configured — fallback to client preview add
        const mapped = preview.map(p=>({ id: Math.floor(Math.random()*1e9), name: p.scheme, category: "Mutual Funds", invested: 0, current: p.current_value }));
        onImport(mapped);
        setOpen(false);
        setFile(null);
        setPreview([]);
        return;
      }
      const res = await fetch(api, { method: "POST", body: fd });
      const data = await res.json();
      if(data.status === "ok"){
        const mapped = (data.data||[]).map(d=>({ id: Math.floor(Math.random()*1e9), name: d.scheme||"Unknown", category: "Mutual Funds", invested:0, current: d.current_value || 0 }));
        onImport(mapped);
        setOpen(false);
        setFile(null);
        setPreview([]);
      } else {
        alert("Parsing failed: "+(data.message||JSON.stringify(data)));
      }
    } catch(e){
      alert("Upload error: "+e.message);
    } finally { setLoading(false) }
  }

  return (
    <>
      <button className="fab" onClick={()=>setOpen(true)} aria-label="Import CAS">Import CAS</button>

      <div style={{ position:"fixed", top:0, right:0, height:"100%", width:520, transform: open ? "translateX(0)" : "translateX(100%)", transition:"transform .35s", zIndex:80 }}>
        <div style={{ height:"100%", padding:20, background:"rgba(2,6,23,0.6)", backdropFilter:"blur(12px)" }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <h3 style={{margin:0}}>Import CAS — Smart Upload</h3>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>Drag & drop CAS PDF — preview then import</div>
            </div>
            <div><button style={{background:"transparent",border:"none",color:"white",fontSize:18}} onClick={()=>setOpen(false)}>✕</button></div>
          </div>

          <div style={{marginTop:18}}>
            <div onClick={()=> inputRef.current && inputRef.current.click()} style={{padding:14,borderRadius:10,border:"1px dashed rgba(255,255,255,0.06)",cursor:"pointer"}}>
              <input ref={inputRef} type="file" accept="application/pdf" style={{display:"none"}} onChange={e=> handleSelect(e.target.files[0])} />
              <div style={{fontWeight:600}}>Click or drag PDF to select</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",marginTop:6}}>Supports password-protected CAS (enter password if required)</div>
            </div>

            <div style={{marginTop:12,display:"flex",gap:8}}>
              <input placeholder="PDF password (if any)" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{flex:1,padding:8,borderRadius:8,border:"1px solid rgba(255,255,255,0.04)",background:"transparent"}} />
              <button className="btn-ghost" onClick={()=> file && handleSelect(file)} disabled={!file}>{loading? "Parsing..." : "Preview"}</button>
              <button className="btn" onClick={uploadToBackend} disabled={loading || !file}>{loading? "Importing..." : "Upload & Import"}</button>
            </div>

            <div style={{marginTop:16}}>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.7)",marginBottom:8}}>Preview</div>
              <div style={{maxHeight:260,overflow:"auto"}}>
                {loading && <div>Parsing...</div>}
                {!loading && preview.length === 0 && <div style={{color:"rgba(255,255,255,0.5)"}}>No preview — choose a file & click Preview</div>}
                {!loading && preview.map((p,idx)=> (
                  <div key={idx} style={{padding:10, borderRadius:8, marginBottom:8, background:"rgba(255,255,255,0.02)"}}>
                    <div style={{fontWeight:700}}>{p.scheme}</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>Folio: {p.folio} • Current: ₹{Number(p.current_value).toLocaleString()}</div>
                    <div style={{marginTop:8}}>
                      <button className="btn-ghost" onClick={()=> onImport([{ id: Math.floor(Math.random()*1e9), name:p.scheme, category:"Mutual Funds", invested:0, current:p.current_value }])}>Add to portfolio</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{marginTop:12,fontSize:12,color:"rgba(255,255,255,0.6)"}}>Privacy: preview runs locally. If using backend upload, files are removed after parsing.</div>
          </div>
        </div>
      </div>
    </>
  );
}
