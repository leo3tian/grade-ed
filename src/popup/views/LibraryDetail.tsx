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

  const filteredDeductions = library?.deductions
    .map((markdown, originalIndex) => ({ markdown, originalIndex }))
    .filter(({ markdown }) =>
      markdown.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (!library) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⏳</div>
        <div className="empty-title">Loading…</div>
      </div>
    );
  }

  const totalCount = library.deductions.length;

  return (
    <>
      <div className="details-header-bar">
        <div className="details-title">
          <div className="details-title-eyebrow">Editing library</div>
          <div className="details-title-name" title={library.name}>{library.name}</div>
        </div>
        <button className="secondary-button" onClick={goBack}>← Back</button>
      </div>

      <div className="editor-toolbar">
        <textarea
          ref={inputRef}
          className="library-textarea"
          placeholder="Enter markdown for a new deduction…"
        />
        <button className="primary-button" onClick={handleAdd}>
          ➕ Add Deduction
        </button>
      </div>

      <div className="section-header">
        <span>Deductions</span>
        <span className="section-count">{totalCount}</span>
      </div>

      <input
        className="deduction-search"
        type="text"
        placeholder="🔍 Search deductions…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="deduction-list">
        {filteredDeductions.length === 0 ? (
          <div className="deduction-empty">
            {totalCount === 0
              ? 'No deductions yet — add one above to get started.'
              : 'No deductions match your search.'}
          </div>
        ) : (
          filteredDeductions.map(({ markdown, originalIndex }) => {
            const headerText = markdown.split('\n')[0].replaceAll('**', '');
            return (
              <DeductionItem
                key={originalIndex}
                index={originalIndex}
                title={headerText}
                body={markdown}
                onDelete={handleRemove}
              />
            );
          })
        )}
      </div>
    </>
  );
};

export default LibraryDetail;
