import React, { useEffect, useState } from 'react';
import { View } from '../types';
import { saveLibraries } from '../utils/libraryStorage';

type SettingsProps = {
  navigate: (view: View) => void;
};

const Settings: React.FC<SettingsProps> = ({ navigate }) => {
  const [livePreviewEnabled, setLivePreviewEnabled] = useState<boolean>(true);
  const [linterEnabled, setLinterEnabled] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(['livePreview', 'linterEnabled'], (data) => {
      if (data.livePreview === undefined) {
        chrome.storage.local.set({ livePreview: true });
        setLivePreviewEnabled(true);
      } else {
        setLivePreviewEnabled(Boolean(data.livePreview));
      }

      if (data.linterEnabled === undefined) {
        chrome.storage.local.set({ linterEnabled: true });
        setLinterEnabled(true);
      } else {
        setLinterEnabled(Boolean(data.linterEnabled));
      }
    });
  }, []);

  const handleTogglePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setLivePreviewEnabled(enabled);
    chrome.storage.local.set({ livePreview: enabled });
  };

  const handleToggleLinter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setLinterEnabled(enabled);
    chrome.storage.local.set({ linterEnabled: enabled });
  };

  const handleDeleteAllLibraries = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete all libraries? This cannot be undone.',
    );
    if (confirmed) {
      await saveLibraries({});
      alert('✅ All libraries deleted.');
    }
  };

  return (
    <div className="settings-container">
      <h2>⚙️ Settings</h2>

      <div className="settings-section">
        <div className="settings-section-title">Behavior</div>

        <div className="setting-item">
          <div className="setting-label-block">
            <label htmlFor="preview-toggle">Live Markdown Preview</label>
            <span className="setting-description">
              Show a rendered preview of a deduction when hovering over it in Ed.
            </span>
          </div>
          <label className="toggle">
            <input
              id="preview-toggle"
              type="checkbox"
              checked={livePreviewEnabled}
              onChange={handleTogglePreview}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-label-block">
            <label htmlFor="linter-toggle">Enable Linter</label>
            <span className="setting-description">
              Highlight problematic lines in the Feedback tab's diff view.
            </span>
          </div>
          <label className="toggle">
            <input
              id="linter-toggle"
              type="checkbox"
              checked={linterEnabled}
              onChange={handleToggleLinter}
            />
            <span className="slider" />
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-label-block">
            <label>Manage Linter Rules</label>
            <span className="setting-description">
              Add, edit, or remove the rules the linter checks each line against.
            </span>
          </div>
          <button
            className="secondary-button"
            onClick={() => navigate({ name: 'rules' })}
          >
            📏 Open
          </button>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Danger zone</div>

        <div className="setting-item">
          <div className="setting-label-block">
            <label>Delete all libraries</label>
            <span className="setting-description">
              Permanently remove every saved library and all of its deductions.
            </span>
          </div>
          <button className="danger-button" onClick={handleDeleteAllLibraries}>
            🗑️ Delete all
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
