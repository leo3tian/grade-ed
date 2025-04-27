import React from 'react';
import { Library } from '../types';

type LibraryItemProps = {
    library: Library;
    updateLibrary: (libraryName: string, updates: Partial<Library>) => void;
    onClick: () => void;
}

const Header: React.FC<LibraryItemProps> = ({library, onClick, updateLibrary}) => {  
    return (
        <div className="library-item" onClick={onClick}>
            <div className="library-header">
                <input
                    type="checkbox"
                    checked={library.enabled}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => updateLibrary(library.name, {enabled: !library.enabled})}
                />
                <span className="library-name">{library.name}</span>
            </div>
            <div className="library-description">{library.description || 'No description'}</div>
        </div>
    )
}

export default Header;