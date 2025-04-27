import React, { useEffect, useRef, useState } from 'react';
import { View } from '../types';

type HomeProps = {
  navigate: (view: View) => void;
};

const Home: React.FC<HomeProps> = ({ navigate }) => {


  const [libraries, setLibraries] = useState<{ [libraryName: string]: string[] }>({});
  const [newLibraryName, setNewLibraryName] = useState('');

  // Migration script
  useEffect(() => {
    // Step 1: Check if migration needed
    chrome.storage.local.get(['libraries', 'customDeductions'], (data) => {
      if (!data.libraries && data.customDeductions) {
        // Step 2: Perform migration
        const migrated = {
          "Default": data.customDeductions
        };
        chrome.storage.local.set({ libraries: migrated }, () => {
          // Step 3: Clean up old key (optional but cleaner)
          chrome.storage.local.remove('customDeductions', () => {
            setLibraries(migrated);
            console.log('✅ Migration complete: moved customDeductions into Default library.');
          });
        });
      } else {
        // Step 4: Normal load
        setLibraries(data.libraries || {});
      }
    });
  }, []);
  

//   useEffect(() => {
//     chrome.storage.local.get({ libraries: {} }, (data) => {
//       setLibraries(data.libraries);
//     });
//   }, []);

  const handleCreateLibrary = () => {
    const name = newLibraryName.trim();
    if (!name || libraries[name]) return;

    const updated = { ...libraries, [name]: [] };
    chrome.storage.local.set({ libraries: updated }, () => {
      setLibraries(updated);
      setNewLibraryName('');
    });
  };

  const handleOpenLibrary = (name: string) => {
    navigate({ name: 'library', libraryName: name });
  };

  const handleExportLibraries = () => {
    chrome.storage.local.get({ libraries: {} }, (data) => {
      const blob = new Blob([JSON.stringify(data.libraries, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement('a');
      a.href = url;
      a.download = 'libraries.json';
      a.click();
  
      URL.revokeObjectURL(url);
    });
  };

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportLibraries = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);
        if (typeof imported === 'object' && imported !== null) {
          chrome.storage.local.set({ libraries: imported }, () => {
            setLibraries(imported);
          });
        } else {
          alert('Invalid format. Expected an object.');
        }
      } catch {
        alert('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
  };
  
  

  return (
    <div className="library-home">

        <div className="button-group">
        <button onClick={handleExportLibraries}>Export Libraries</button>
        <button onClick={() => importInputRef.current?.click()}>Import Libraries</button>
        <input
            type="file"
            ref={importInputRef}
            style={{ display: 'none' }}
            onChange={handleImportLibraries}
        />
        </div>


      <div className="create-library">
        <input
          type="text"
          placeholder="New library name"
          value={newLibraryName}
          onChange={(e) => setNewLibraryName(e.target.value)}
        />
        <button onClick={handleCreateLibrary}>Create</button>
      </div>

      <div className="library-list">
        {Object.keys(libraries).map((libraryName) => (
          <div key={libraryName} className="library-item" onClick={() => handleOpenLibrary(libraryName)}>
            {libraryName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
