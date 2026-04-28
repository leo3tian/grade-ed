import React from 'react';
import { View } from '../types';

type HeaderProps = {
    activeTab: View;
    navigate: (newTab: View) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, navigate }) => {
    return (
        <div className="header-container">
            <div className="header-bar">
                <div className="title" onClick={() => navigate({ name: 'home' })} title="Home">
                    <span className="title-mark">12X</span>
                    <span className="title-sub">Grading Helper</span>
                </div>
                <button
                    className="settings-button"
                    onClick={() => navigate({ name: 'settings' })}
                    title="Settings"
                    aria-label="Settings"
                    aria-pressed={activeTab.name === 'settings'}
                >
                    ⚙️
                </button>
            </div>
        </div>
    );
};

export default Header;
