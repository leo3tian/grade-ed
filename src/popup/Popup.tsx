import React, { useEffect, useState, useRef } from 'react';
import '../../public/popup.css';
import DeductionItem from './components/DeductionItem'

const Popup = () => {
  const [deductions, setDeductions] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.storage.local.get({ customDeductions: [] }, (data) => {
      setDeductions(data.customDeductions);
    });
  }, []);

  const handleAdd = () => {
    const newText = inputRef.current?.value.trim();
    if (!newText) return;

    const updated = [...deductions, newText];
    chrome.storage.local.set({ customDeductions: updated }, () => {
      setDeductions(updated);
      if (inputRef.current) inputRef.current.value = '';
    });
  };

  const handleRemove = (index: number) => {
    const updated = deductions.filter((_, i) => i !== index);
    chrome.storage.local.set({ customDeductions: updated }, () => {
      setDeductions(updated);
    });
  };

  const handleExport = () => {
    chrome.storage.local.get({ customDeductions: [] }, (data) => {
      const blob = new Blob([JSON.stringify(data.customDeductions, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'deductions.json';
      a.click();

      URL.revokeObjectURL(url);
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);
        if (Array.isArray(imported)) {
          chrome.storage.local.set({ customDeductions: imported }, () => {
            setDeductions(imported);
          });
        } else {
          alert('Invalid format. Expected an array of markdown strings.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
    <div className="header-container">
        <div className="header-bar">
          <div className="title"><span className="gray">grad</span>ed</div>
          <div className="button-group">
            <button onClick={handleExport}>Export</button>
            <button
              className="import-label"
              onClick={() => importInputRef.current?.click()}
            >
              Import
            </button>
            <input
              type="file"
              id="importInput"
              ref={importInputRef}
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            
          </div>
        </div>
        {/* <span className="info-text">Email tleo@cs for feedback and suggestions 🙂</span> */}
      </div>
    <div className="container">
    <div className="large">Add Deduction</div>
      <textarea ref={inputRef} placeholder="Enter markdown..." />
      <button className="add-btn" onClick={handleAdd}>Add Deduction</button>
      <div className="large">Loaded Deductions</div>
      <div className="deduction-list">
        {deductions.map((markdown, index) => {
          const headerText = markdown.split('\n')[0].replaceAll('**', '');
          const bodyText = markdown.split('\n').slice(1).join('\n');
          return <DeductionItem
            key={index}
            index={index}
            title={headerText}
            body={bodyText}
            onDelete={() => handleRemove(index)}
          />;
        })}
      </div>
    </div>
    </>
  );
};

export default Popup;
