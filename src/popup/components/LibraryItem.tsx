import React, { useEffect, useRef, useState } from 'react';
import { Library } from '../types';
import { updateLibrary, deleteLibrary } from '../utils/libraryStorage';

type LibraryItemProps = {
  library: Library;
  onClick: () => void;
  onRefresh: () => void;
  onEdit: (library: Library) => void;
};

const LibraryItem: React.FC<LibraryItemProps> = ({ library, onClick, onRefresh, onEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickAway = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [menuOpen]);

  const handleToggleEnabled = async () => {
    await updateLibrary(library.name, { enabled: !library.enabled });
    onRefresh();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteLibrary(library.name);
    onRefresh();
  };

  const deductionCount = library.deductions.length;

  return (
    <div
      className={`library-card ${library.enabled ? '' : 'disabled'}`}
      onClick={onClick}
    >
      <div className="library-card-header">
        <label className="toggle" onClick={(e) => e.stopPropagation()} title={library.enabled ? 'Enabled' : 'Disabled'}>
          <input
            type="checkbox"
            checked={library.enabled}
            onChange={handleToggleEnabled}
            aria-label={`Toggle ${library.name}`}
          />
          <span className="slider" />
        </label>

        <div
          ref={menuRef}
          className="library-menu-trigger"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          title="More"
          aria-label="More actions"
        >
          ⋮
          {menuOpen && (
            <div className="library-menu" onClick={(e) => e.stopPropagation()}>
              <div
                className="library-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit(library);
                }}
              >
                ✏️ Edit
              </div>
              <div className="library-menu-item danger" onClick={handleDelete}>
                🗑️ Delete
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="library-card-body">
        <div className="library-title">{library.name}</div>
        <div className="library-description">
          {library.description || 'No description.'}
        </div>
        <div className="library-meta">
          📌 {deductionCount} {deductionCount === 1 ? 'deduction' : 'deductions'}
        </div>
      </div>
    </div>
  );
};

export default LibraryItem;
