import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const DEFAULT_CATEGORIES = [
  "Mutual Funds","Fixed Deposits","LIC","ULIP","PPF","SSY","Gold","Bonds","Stocks","Real Estate","NPS","EPF","Others"
];

const COLORS = ["#4F46E5","#06B6D4","#10B981","#F59E0B","#EF4444","#8B5CF6","#F97316","#0EA5E9","#14B8A6","#F43F5E"];

function getId(){ return Math.floor(Math.random()*1e9) }

export default function InvestmentTracker({ importedItems = [], setImportedItems = ()=>{} }) {
  const SAMPLE_DATA = [
    { id: 1, name: "HDFC MF", category: "Mutual Funds", invested: 100000, current: 156600 },
    { id: 2, name: "Bank FD", category: "Fixed Deposits", invested: 200000, current: 222600 },
    { id: 3, name: "Gold ETF", category: "Gold", invested: 250000, current: 502100 },
  ];

  const [items, setItems] = useState(()=>{
    try {
      const raw = localStorage.getItem("mc360:items");
      return raw ? JSON.parse(raw) : SAMPLE_DATA;
    } catch { return SAMPLE_DATA }
  });

  // merge imported once (when importedItems changes)
  useEffect(()=>{
    if(importedItems && importedItems.length){
      setItems(s => [...importedItems, ...s]);
      setImportedItems([]);
    }
  },[importedItems]);

  useEffect(()=> localStorage.setItem("mc360:items", JSON.stringify(items)), [items]);

  // totals & categories
  const totals = items.reduce((acc,it)=>{ acc.invested += Number(it.invested)||0; acc.current += Number(it.current)||0; return acc }, {invested:0,current:0});
  const profit = totals.current - totals.invested;
  const profitPerc = totals.invested ? (profit / totals.invested) * 100 : 0;

  const byCategory = DEFAULT_CATEGORIES.map(cat=>{
    const catItems = items.filter(i=>i.category===cat);
    const invested = catItems.reduce((s,it)=>s + Number(it.invested||0),0);
    const current = catItems.reduce((s,it)=>s + Number(it.current||0),0);
    return { category:cat, invested, current };
  }).filter(c => c.invested>0 || c.current>0);

  const pieData = byCategory.map((b, i)=> ({ name: b.category, value: b.current || b.invested || 0, color: COLORS[i % COLORS.length] }));

  // form states
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", category:DEFAULT_CATEGORIES[0], invested:"", current:"" });
  const [query, setQuery] = useState("");

  function addItem(e){
    e.preventDefault();
    const newItem = { id: getId(), name: form.name||"Untitled", category: form.category, invested: Number(form.invested)||0, current: Number(form.current)||0 };
    setItems(s => [newItem, ...s]);
    setForm({ name:"", category: DEFAULT_CATEGORIES[0], invested:"", current:"" });
    setShowForm(false);
  }

  function updateItem(id,patch){ setItems(s => s.map(it => it.id === id ? { ...it, ...patch } : it)) }
  function removeItem(id){ if(!confirm("Delete this investment?")) return; setItems(s => s.filter(it => it.id !== id)) }
  function exportCSV(){
    const rows = ["id,name,category,invested,current"].concat(items.map(r => `${r.id},"${r.name}","${r.category}",${r.invested},${r.current}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "MyCapital360-portfolio.csv"; a.click();
    URL.revokeObjectURL(a.href);
  }

  const filtered = items.filter(it => it.name.toLowerCase().includes(query.toLowerCase()) || it.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mc-main-content container-grid">
      <div>
        <div className="card header-row" style={{marginBottom:12}}>
          <div>
            <div className="small-muted">Total Invested</div>
            <div style={{fontSize:20,fontWeight:700}}>₹{Number(totals.invested).toLocaleString()}</div>
          </div>
          <div>
            <div className="small-muted">Current Value</div>
            <div style={{fontSize:20,fontWeight:700}}>₹{Number(totals.current).toLocaleString()}</div>
          </div>
          <div>
            <div className="small-muted">Profit / Loss</div>
            <div style={{fontSize:20,fontWeight:700,color: profit >= 0 ? "var(--success)" : "var(--danger)"}}>₹{Number(profit).toLocaleString()} ({profitPerc.toFixed(1)}%)</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn" onClick={()=>setShowForm(s=>!s)}>Add Investment</button>
            <button className="btn-ghost" onClick={exportCSV}>Export CSV</button>
          </div>
        </div>

        {showForm && (
          <div className="card" style={{marginBottom:12}}>
            <form onSubmit={addItem}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input placeholder="Name" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{flex:2,padding:8,borderRadius:8,border:"1px solid rgba(255,255,255,0.04)"}}/>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{padding:8,borderRadius:8}}>
                  {DEFAULT_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Invested" type="number" value={form.invested} onChange={e=>setForm(f=>({...f,invested:e.target.value}))} style={{padding:8,width:140}}/>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <input placeholder="Current Value" type="number" value={form.current} onChange={e=>setForm(f=>({...f,current:e.target.value}))} style={{flex:1,padding:8}}/>
                <button className="btn" type="submit">Save</button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div style={{marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><input placeholder="Search name or category" value={query} onChange={e=>setQuery(e.target.value)} style={{padding:8,width:340}}/></div>
            <div className="small-muted">Items: {items.length}</div>
          </div>

          <div style={{overflowX:"auto"}}>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Category</th><th>Invested</th><th>Current</th><th>Return %</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(it=>{
                  const r = it.current - it.invested;
                  const rp = it.invested ? ((r / it.invested) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={it.id}>
                      <td>{it.name}</td>
                      <td>{it.category}</td>
                      <td>₹{Number(it.invested).toLocaleString()}</td>
                      <td>₹{Number(it.current).toLocaleString()}</td>
                      <td style={{color: r>=0? "var(--success)" : "var(--danger)"}}>{rp}%</td>
                      <td>
                        <button onClick={()=>{ const v=prompt("Rename", it.name); if(v) updateItem(it.id, { name: v })}}>Rename</button>
                        <button style={{marginLeft:8}} onClick={()=>{ const v=prompt("Update current value", String(it.current)); if(v!==null) updateItem(it.id, { current: Number(v) })}}>Update</button>
                        <button style={{marginLeft:8,color:"var(--danger)"}} onClick={()=>removeItem(it.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside>
        <div className="card">
          <h4>Allocation</h4>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={30}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{marginTop:12}}>
            {byCategory.map((b, idx) => (
              <div key={b.category} style={{display:"flex",justifyContent:"space-between",padding:"6px 0"}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:12,height:12,background:COLORS[idx%COLORS.length],borderRadius:3}}></div><div>{b.category}</div></div>
                <div>₹{Number(b.current || b.invested).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{marginTop:12}}>
          <h4>Quick Actions</h4>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={()=>{
              const templates = [
                { name: "LIC Policy", category: "LIC", invested: 60000, current: 77000 },
                { name: "Sukanya Samriddhi", category: "SSY", invested: 50000, current: 62000 }
              ];
              setItems(s=>[...templates.map(t=>({...t,id:getId()})), ...s]);
            }}>Add LIC / SSY samples</button>

            <button onClick={()=>{ if(!confirm("Clear portfolio?")) return; setItems([]); }}>Clear Portfolio</button>

            <button onClick={()=>{
              const p = JSON.stringify(items, null, 2);
              navigator.clipboard.writeText(p);
              alert("Portfolio copied to clipboard");
            }}>Copy JSON</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
