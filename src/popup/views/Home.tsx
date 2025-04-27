import React, { useEffect, useRef, useState } from 'react';
import { View, Library } from '../types';
import LibraryItem from '../components/LibraryItem';
import {
  isLibrary,
  willOverwriteLibrary,
  loadLibraries,
  saveLibraries,
  updateLibrary,
  importLibraries
} from '../utils/libraryStorage';

type HomeProps = {
  navigate: (view: View) => void;
};

const Home: React.FC<HomeProps> = ({ navigate }) => {
  const [libraries, setLibraries] = useState<{ [name: string]: Library }>({});
  const [newLibraryName, setNewLibraryName] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initializeLibraries = async () => {
      const libs = await loadLibraries();
      const cleaned: { [name: string]: Library } = {};
      let removed = 0;

      Object.entries(libs).forEach(([key, value]) => {
        if (isLibrary(value)) {
          cleaned[key] = value;
        } else {
          removed++;
        }
      });

      if (removed > 0) {
        console.log(`🧹 Removed ${removed} legacy/broken libraries.`);
        await saveLibraries(cleaned);
      }
      setLibraries(cleaned);
    };

    initializeLibraries();
  }, []);

  const handleCreateLibrary = async () => {
    const name = newLibraryName.trim();
    if (!name) return;

    if (willOverwriteLibrary(libraries, name)) {
      const confirmOverwrite = window.confirm(`A library named "${name}" already exists. Overwrite it?`);
      if (!confirmOverwrite) return;
    }

    const newLibrary: Library = {
      name,
      description: '',
      enabled: true,
      deductions: [],
    };

    const updated = { ...libraries, [name]: newLibrary };
    await saveLibraries(updated);
    setLibraries(updated);
    setNewLibraryName('');
  };

  const handleOpenLibrary = (name: string) => {
    navigate({ name: 'library', libraryName: name });
  };

  const handleExportLibraries = async () => {
    const libs = await loadLibraries();
    const blob = new Blob([JSON.stringify(libs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'libraries.json';
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleImportLibraries = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imported = JSON.parse(reader.result as string);

        if (typeof imported !== 'object' || imported === null) {
          alert('Invalid file format.');
          return;
        }

        const isValid = Object.values(imported).every((lib) => isLibrary(lib));

        if (!isValid) {
          alert('Invalid library structure.');
          return;
        }

        const { success } = await importLibraries(imported);
        if (success) {
          setLibraries(imported);
          alert('✅ Libraries imported successfully.');
        }
      } catch {
        alert('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateLibrary = async (libraryKey: string, updates: Partial<Library>) => {
    const updated = await updateLibrary(libraryKey, updates);
    setLibraries(updated);
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
          <LibraryItem
            key={libraryName}
            library={libraries[libraryName]}
            onClick={() => handleOpenLibrary(libraryName)}
            updateLibrary={handleUpdateLibrary}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
