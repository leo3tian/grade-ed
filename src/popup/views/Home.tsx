import React, { useEffect, useRef, useState } from 'react';
import { View, Library } from '../types';
import LibraryItem from '../components/LibraryItem';
import LibraryModal from '../components/LibraryModal';
import {
  isLibrary,
  willOverwriteLibrary,
  loadLibraries,
  saveLibraries,
  importLibraries,
} from '../utils/libraryStorage';

type HomeProps = {
  navigate: (view: View) => void;
};

const Home: React.FC<HomeProps> = ({ navigate }) => {
  const [libraries, setLibraries] = useState<{ [name: string]: Library }>({});
  const [showModal, setShowModal] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<Partial<Library> | null>(null);
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

  const refreshLibraries = async () => {
    const libs = await loadLibraries();
    setLibraries(libs);
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
          await refreshLibraries();
          alert('✅ Libraries imported successfully.');
        }
      } catch {
        alert('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveLibrary = async (updates: Partial<Library>) => {
    if (!updates.name) return;

    const name = updates.name.trim();
    const currentLibraries = await loadLibraries();
    const updatedLibraries = { ...currentLibraries };

    if (editingLibrary?.name && editingLibrary.name !== name) {
      delete updatedLibraries[editingLibrary.name];
    }

    updatedLibraries[name] = {
      name,
      description: updates.description || '',
      enabled: updates.enabled ?? true,
      deductions: updates.deductions || [],
    };

    await saveLibraries(updatedLibraries);
    setLibraries(updatedLibraries);
  };

  return (
    <div className="library-home">
      <div className="button-row">
        <button
          className="primary-button"
          onClick={() => {
            setEditingLibrary({});
            setShowModal(true);
          }}
        >
          + New Library
        </button>
        <button className="secondary-button" onClick={() => importInputRef.current?.click()}>
          Import
        </button>
        <button className="secondary-button" onClick={handleExportLibraries}>
          Export
        </button>
        <input
          type="file"
          ref={importInputRef}
          style={{ display: 'none' }}
          onChange={handleImportLibraries}
        />
      </div>

      <div className="library-grid">
        {Object.entries(libraries).map(([key, lib]) => (
          <LibraryItem
            key={lib.name}
            library={lib}
            onClick={() => handleOpenLibrary(lib.name)}
            onEdit={(library) => {
              setEditingLibrary(library);
              setShowModal(true);
            }}
            onRefresh={refreshLibraries}
          />
        ))}
      </div>

      {Object.keys(libraries).length === 0 && (
        <div className="empty-state">
            <div className="empty-icon">📚</div>
            <div className="empty-title">No libraries yet</div>
            <div className="empty-subtitle">Click "+ New Library" to get started!</div>
        </div>
        )}  


      {showModal && editingLibrary && (
        <LibraryModal
          initialLibrary={editingLibrary}
          onSave={(updates) => {
            handleSaveLibrary(updates);
            setShowModal(false);
            setEditingLibrary(null);
          }}
          onCancel={() => {
            setShowModal(false);
            setEditingLibrary(null);
          }}
        />
      )}
    </div>
  );
};

export default Home;
