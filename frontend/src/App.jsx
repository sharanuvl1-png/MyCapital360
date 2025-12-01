import React, { useState } from "react";
import InvestmentTracker from "./components/InvestmentTracker.jsx";
import CASFloatingPanel from "./components/CASFloatingPanel.jsx";

/**
 * App - root component
 * Provides a small topbar and mounts tracker + CAS panel
 */
export default function App() {
  const [importedItems, setImportedItems] = useState([]);

  return (
    <div>
      <header className="mc-topbar">
        <div className="mc-topbar-inner">
          <div className="mc-brand">
            <div className="mc-logo" />
            <div>
              <div className="mc-title">MyCapital360</div>
              <div className="mc-sub">Portfolio · CAS import · Neon Glass UI</div>
            </div>
          </div>
          <div className="mc-actions">
            <div className="mc-user">sharanuvl1-png</div>
          </div>
        </div>
      </header>

      <main className="mc-main">
        <InvestmentTracker
          importedItems={importedItems}
          setImportedItems={setImportedItems}
        />
        <CASFloatingPanel
          onImport={(items) => {
            // items is an array of { id, name, category, invested, current }
            setImportedItems((s) => [...items, ...s]);
            // small notification
            setTimeout(() => alert(`Imported ${items.length} items`), 50);
          }}
        />
      </main>
    </div>
  );
}
