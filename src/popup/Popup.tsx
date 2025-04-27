import React, { useEffect, useState, useRef } from 'react';
import '../../public/popup.css';
import DeductionItem from './components/DeductionItem';
import Header from './components/Header';
import LibraryDetail from './views/LibraryDetail';
import Home from './views/Home';

export type View = 
| { name: 'home' }
| { name: 'library', libraryName: string }
| { name: 'settings' };

const Popup = () => {

  const [view, setView] = useState<View>({ name: 'home'});

  const renderView = () => {
    switch(view.name) {
      case 'home':
        return <Home navigate={setView}/>
      case 'library':
        return <LibraryDetail libraryName={view.libraryName}/>
      default:
        return <div>Error - '{view.name}' is not a page!</div>;
    }
  }
  return(
    <>
    <Header activeTab={view} navigate={setView}></Header>
    <div className="container">
      {renderView()}
    </div>
    </>
  );
};

export default Popup;
