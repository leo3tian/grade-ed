import React from 'react';
import { View } from '../types';

type HeaderProps = {
    activeTab: View;
    navigate: (newTab: View) => void;
}

const Header: React.FC<HeaderProps> = ({activeTab, navigate}) => {  
    return (
    <div className="header-container">
        <div className="header-bar">
          <div className="title" onClick={() => navigate({ name: 'home' })}><span className="gray">grad</span>ed</div>
          <button >Settings</button>
        </div>
        {/* <span className="info-text">Email tleo@cs for feedback and suggestions 🙂</span> */}
      </div>
    )
}

export default Header;