import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#7c3aed","#06b6d4","#10b981","#f59e0b","#ef4444","#0ea5e9","#a78bfa","#f97316"];

export default function AllocationCard({ data=[] }){
  const pieData = data.map((d,i)=> ({ name:d.name, value: d.value || 0, color: COLORS[i%COLORS.length] }));
  if(pieData.length===0) return <div style={{color:"var(--muted)"}}>No allocation yet</div>;
  return (
    <div style={{width:"100%",height:220}}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
            {pieData.map((entry,i)=><Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={v => `₹${Number(v).toLocaleString()}`} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
        {pieData.map((p,i)=>(
          <div key={p.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{width:10,height:10,background:p.color,borderRadius:3}}/> <div style={{fontSize:13}}>{p.name}</div></div>
            <div style={{fontSize:13}}>₹{Number(p.value).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
