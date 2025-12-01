import React, { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import CASFloatingPanel from "./components/CASFloatingPanel.jsx";

export default function App(){
  const [importedItems, setImportedItems] = useState([]);
  return (
    <>
      <Dashboard importedItems={importedItems} setImportedItems={setImportedItems} />
      <CASFloatingPanel onImport={(items)=> setImportedItems(s => [...items, ...s])} />
    </>
  );
}
