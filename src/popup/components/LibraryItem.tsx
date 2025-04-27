import React, { useState } from 'react';
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

  const handleToggleEnabled = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    await updateLibrary(library.name, { enabled: !library.enabled });
    onRefresh();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteLibrary(library.name);
    onRefresh()
  };

  return (
    <div className="library-card" onClick={onClick}>
      <div className="library-card-header">
        <input
          type="checkbox"
          checked={library.enabled}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleToggleEnabled(e)}
        />
        <div className="library-menu-trigger" onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}>
          ⋮
        </div>

        {menuOpen && (
          <div className="library-menu">
            <div onClick={(e) => {
                e.stopPropagation();
                onEdit(library);
            }}>✏️ Edit</div>
            <div onClick={handleDelete}>🗑️ Delete</div>
          </div>
        )}
      </div>

      <div className="library-card-body">
        <div className="library-title">{library.name}</div>
        <div className="library-description">{library.description || "No description."}</div>
      </div>
    </div>
  );
};

export default LibraryItem;
