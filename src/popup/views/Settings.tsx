import React, { useEffect, useState } from 'react';
import { loadLibraries, saveLibraries } from '../utils/libraryStorage';

const Settings: React.FC = () => {
  const [livePreviewEnabled, setLivePreviewEnabled] = useState<boolean>(true);

  useEffect(() => {
    chrome.storage.local.get(['livePreview'], (data) => {
      if (data.livePreview === undefined) {
        // Set default value if it doesn't exist
        chrome.storage.local.set({ livePreview: true });
        setLivePreviewEnabled(true);
      } else {
        setLivePreviewEnabled(Boolean(data.livePreview));
      }
    });
  }, []);

  const handleDeleteAllLibraries = async () => {
    const confirmed = confirm('Are you sure you want to delete all libraries?');
    if (confirmed) {
      await saveLibraries({});
      alert('✅ All libraries deleted.');
    }
  };

  const handleTogglePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setLivePreviewEnabled(enabled);
    chrome.storage.local.set({ livePreview: enabled });
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>

      <div className="setting-item">
        <label htmlFor="preview-toggle">Live Markdown Preview on Hover</label>
        <input
          id="preview-toggle"
          type="checkbox"
          checked={livePreviewEnabled}
          onChange={handleTogglePreview}
        />
      </div>

      <div className="setting-item">
        <button className="secondary-button" onClick={handleDeleteAllLibraries}>
          Delete All Libraries
        </button>
      </div>
    </div>
  );
};

export default Settings;
