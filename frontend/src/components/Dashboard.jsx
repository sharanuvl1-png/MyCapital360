import React, { useEffect, useMemo, useState } from "react";
import AllocationCard from "./AllocationCard.jsx";

const CATEGORIES = ["All","Stocks","Mutual Funds","Bonds","REIT/INVIT","ETF","SGB","NPS","Others"];

export default function Dashboard({ importedItems=[], setImportedItems=()=>{} }){
  // load baseline items from localStorage (keeps previous sample)
  const [items, setItems] = useState(()=>{
    try{ const raw = localStorage.getItem("mc360:items"); return raw? JSON.parse(raw): []; }catch{ return [] }
  });
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(()=> localStorage.setItem("mc360:items", JSON.stringify(items)), [items]);

  // merge items imported via CAS
  useEffect(()=>{
    if(importedItems && importedItems.length){
      setItems(s => [...importedItems, ...s]);
      setImportedItems([]);
    }
  },[importedItems]);

  // totals
  const totals = useMemo(()=>{
    return items.reduce((acc,it)=>{ acc.current += Number(it.current||0); acc.invested += Number(it.invested||0); return acc }, { invested:0,current:0 })
  },[items]);

  const profit = totals.current - totals.invested;
  const profitPerc = totals.invested? (profit/totals.invested)*100 : 0;

  // filter by tab and search
  const filtered = items.filter(it=>{
    const q = query.trim().toLowerCase();
    const matchesTab = activeTab === "All" || (it.category||"Others") === activeTab;
    const matchesQ = !q || (it.name||"").toLowerCase().includes(q) || (it.category||"").toLowerCase().includes(q);
    return matchesTab && matchesQ;
  });

  function addManual(){ // small demo add
    const id = Math.floor(Math.random()*1e9);
    setItems(s=> [{ id, name: "MF", category: "Mutual Funds", invested: 1418026, current: 1565541 }, ...s]);
  }

  function removeItem(id){ if(!confirm("Delete?")) return; setItems(s=>s.filter(i=>i.id!==id)); }

  // aggregation for allocation card
  const allocation = useMemo(()=>{
    const map = {};
    items.forEach(it=>{
      const cat = it.category || "Others";
      map[cat] = (map[cat] || 0) + (Number(it.current || it.invested || 0));
    });
    return Object.keys(map).map(k=>({ name:k, value: map[k]}));
  },[items]);

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="logo" />
            <div>
              <div className="title">MyCapital360</div>
              <div className="subtitle">Portfolio · CAS import · Neon Glass UI</div>
            </div>
          </div>
          <div className="small-muted">sharanuvl1-png</div>
        </div>
      </div>

      <div className="page">
        <div>
          <div className="card" style={{marginBottom:12}}>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div className="row">
                <div className="stat">
                  <div className="small-muted">Total Invested</div>
                  <strong>₹{Number(totals.invested).toLocaleString()}</strong>
                </div>
                <div className="stat">
                  <div className="small-muted">Current Value</div>
                  <strong>₹{Number(totals.current).toLocaleString()}</strong>
                </div>
                <div className="stat">
                  <div className="small-muted">Profit / Loss</div>
                  <strong style={{color: profit>=0? "var(--success)" : "var(--danger)"}}>₹{Number(profit).toLocaleString()} ({profitPerc.toFixed(1)}%)</strong>
                </div>
              </div>

              <div style={{display:"flex",gap:10}}>
                <button className="btn" onClick={()=> addManual()}>Add Investment</button>
                <button className="btn-ghost" onClick={()=> { const blob = new Blob([JSON.stringify(items,null,2)],{type:"application/json"}); navigator.clipboard.writeText(JSON.stringify(items,null,2)); alert("Copied JSON")}}>Export JSON</button>
              </div>
            </div>
          </div>

          <div className="card" style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div className="tabs">
                  {CATEGORIES.map(c=> <button key={c} className={`tab ${c===activeTab? "active":""}`} onClick={()=>setActiveTab(c)}>{c}</button>)}
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input placeholder="Search name or category" value={query} onChange={e=>setQuery(e.target.value)} style={{width:300}}/>
                <div className="small-muted">Items: {filtered.length}</div>
              </div>
            </div>

            <div style={{overflowX:"auto"}}>
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Category</th><th>Invested</th><th>Current</th><th>Return %</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(it=>{
                    const r = Number(it.current||0) - Number(it.invested||0);
                    const rp = it.invested? ((r/it.invested)*100).toFixed(1): "0.0";
                    return (
                      <tr key={it.id}>
                        <td>{it.name}</td>
                        <td>{it.category}</td>
                        <td>₹{Number(it.invested||0).toLocaleString()}</td>
                        <td>₹{Number(it.current||0).toLocaleString()}</td>
                        <td style={{color: r>=0? "var(--success)":"var(--danger)"}}>{rp}%</td>
                        <td>
                          <button className="btn-small btn-ghost" onClick={()=>{ const v=prompt("Rename",it.name); if(v) { setImportedItems(prev=> prev.map(p=> p.id===it.id? {...p, name:v}:p)); setImportedItems([]); } }}>Rename</button>
                          <button className="btn-small btn-ghost" onClick={()=>{ const nv=prompt("Update current (INR)", String(it.current||0)); if(nv!==null) setImportedItems(prev=> prev.map(p=> p.id===it.id? {...p, current:Number(nv)}:p)); }}>Update</button>
                          <button className="btn-small" style={{background:"transparent",color:"var(--danger)",border:"1px solid rgba(255,255,255,0.03)",marginLeft:8}} onClick={()=>removeItem(it.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length===0 && <tr><td colSpan={6} style={{padding:20,textAlign:"center",color:"var(--muted)"}}>No investments yet — import CAS or add manually.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside>
          <div className="card" style={{marginBottom:12}}>
            <h4>Allocation</h4>
            <div className="allocation">
              <AllocationCard data={allocation} />
            </div>
            <div style={{marginTop:10}} className="small-muted">Click Import CAS to automatically add items.</div>
          </div>

          <div className="card quick">
            <h4>Quick Actions</h4>
            <div style={{marginTop:8}}>
              <button className="btn-ghost" onClick={()=>{ if(!confirm("Clear all?")) return; localStorage.removeItem("mc360:items"); window.location.reload(); }}>Clear Portfolio</button>
              <button className="btn-ghost" onClick={()=>{ alert("Coming soon: Analytics"); }}>Analytics</button>
              <button className="btn-ghost" onClick={()=>{ alert("Coming soon: Sync with broker"); }}>Sync Broker</button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
