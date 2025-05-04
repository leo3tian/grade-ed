import React, { useEffect, useState, useRef } from 'react';
import { Library } from '../types';
import DeductionItem from '../components/DeductionItem';
import { loadLibraries, updateLibrary } from '../utils/libraryStorage';

const LibraryDetail: React.FC<{ libraryName: string; goBack: () => void }> = ({ libraryName, goBack }) => {
  const [library, setLibrary] = useState<Library | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      const libs = await loadLibraries();
      setLibrary(libs[libraryName] || null);
    };
    fetchLibrary();
  }, [libraryName]);

  const handleAdd = async () => {
    const newText = inputRef.current?.value.trim();
    if (!newText || !library) return;
    const updated = { ...library, deductions: [...library.deductions, newText] };
    const updatedLibraries = await updateLibrary(libraryName, updated);
    setLibrary(updatedLibraries[updated.name]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = async (index: number) => {
    if (!library) return;
    const updated = {
      ...library,
      deductions: library.deductions.filter((_, i) => i !== index),
    };
    const updatedLibraries = await updateLibrary(libraryName, updated);
    setLibrary(updatedLibraries[updated.name]);
  };

  const filteredDeductions = library?.deductions.filter(text =>
    text.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!library) return <div>Loading...</div>;

  return (
    <>
      <div className="details-header-bar">
        <div className="header-title" title={library.name}>
          Editing {library.name}
        </div>
        <button className="secondary-button" onClick={goBack}>Back</button>
      </div>


      <div className="editor-toolbar">
        <textarea ref={inputRef} className="library-textarea" placeholder="Enter markdown..." />
        <button className="primary-button" onClick={handleAdd}>Add Deduction</button>
      </div>

      

      <div className="header-title">Loaded Deductions</div>

      <input
        className="deduction-search"
        type="text"
        placeholder="Search deductions..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="deduction-list">
        {filteredDeductions.map((markdown, index) => {
          const headerText = markdown.split('\n')[0].replaceAll('**', '');
          return (
            <DeductionItem
              key={index}
              index={index}
              title={headerText}
              body={markdown}
              onDelete={handleRemove}
            />
          );
        })}
      </div>
    </>
  );
};

export default LibraryDetail;
