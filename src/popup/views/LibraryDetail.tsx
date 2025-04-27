import React, { useEffect, useState, useRef } from 'react';
import { Library } from '../types';
import DeductionItem from '../components/DeductionItem';
import { loadLibraries, updateLibrary } from '../utils/libraryStorage';

type LibraryDetailProps = {
  libraryName: string;
  goBack: () => void;
};

const LibraryDetail: React.FC<LibraryDetailProps> = ({ libraryName, goBack }) => {
  const [library, setLibrary] = useState<Library | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      const libs = await loadLibraries();
      const lib = libs[libraryName];
      if (lib) {
        setLibrary(lib);
      }
    };

    fetchLibrary();
  }, [libraryName]);

  const handleAdd = async () => {
    const newText = inputRef.current?.value.trim();
    if (!newText || !library) return;

    const updated = { ...library, deductions: [...library.deductions, newText] };
    const updatedLibraries = await updateLibrary(libraryName, updated);
    setLibrary(updatedLibraries[updated.name])
    
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = async (index: number) => {
    if (!library) return;

    const updated = {
      ...library,
      deductions: library.deductions.filter((_, i) => i !== index),
    };

    // Calls updateLibrary method. If success, sets current library to the updated version
    const updatedLibraries = await updateLibrary(libraryName, updated);
    setLibrary(updatedLibraries[updated.name])
    
  };

  if (!library) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="button-row">
        <button className="secondary-button" onClick={goBack}>Back</button>
      </div>

      <div className="large">Editing {library.name}</div>

      <textarea 
        className="library-textarea" 
        ref={inputRef} 
        placeholder="Enter markdown..." 
      />
      <button className="primary-button" onClick={handleAdd}>Add Deduction</button>

      <div className="large">Loaded Deductions</div>
      
      <div className="deduction-list">
        {library.deductions.map((markdown, index) => {
          const headerText = markdown.split('\n')[0].replaceAll('**', '');
          const bodyText = markdown;
          return (
            <DeductionItem
              key={index}
              index={index}
              title={headerText}
              body={bodyText}
              onDelete={() => handleRemove(index)}
            />
          );
        })}
      </div>
    </>
  );
};

export default LibraryDetail;
