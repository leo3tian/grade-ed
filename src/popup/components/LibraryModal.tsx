import React, { useState, useEffect } from 'react';
import { Library } from '../types';

type LibraryModalProps = {
  initialLibrary: Partial<Library>;
  onSave: (updates: Partial<Library>) => void;
  onCancel: () => void;
};

const LibraryModal: React.FC<LibraryModalProps> = ({ initialLibrary, onSave, onCancel }) => {
  const [name, setName] = useState(initialLibrary.name || '');
  const [description, setDescription] = useState(initialLibrary.description || '');

  useEffect(() => {
    setName(initialLibrary.name || '');
    setDescription(initialLibrary.description || '');
  }, [initialLibrary]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Library name cannot be empty.');
      return;
    }

    onSave({
      ...initialLibrary,
      name: name.trim(),
      description: description.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
  };

  const isEditing = Boolean(initialLibrary.name);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <h2>{isEditing ? '✏️ Edit Library' : '✨ Create New Library'}</h2>

        <div className="modal-field">
          <label>Name</label>
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Recursion deductions"
          />
        </div>

        <div className="modal-field">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional — what is this library for?"
          />
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" onClick={handleSave}>
            {isEditing ? '💾 Save' : '✨ Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LibraryModal;
