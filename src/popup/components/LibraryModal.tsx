import React, { useState, useEffect } from 'react';
import { Library } from '../types';

// Props for the modal
type LibraryModalProps = {
  initialLibrary: Partial<Library>;
  onSave: (updates: Partial<Library>) => void;
  onCancel: () => void;
}

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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{initialLibrary.name ? 'Edit Library' : 'Create New Library'}</h2>

        <div className="modal-field">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Library Name"
          />
        </div>

        <div className="modal-field">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Library Description"
          />
        </div>

        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default LibraryModal;
