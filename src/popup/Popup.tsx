import { useState } from 'react';
import { View } from './types';
import Header from './components/Header';
import LibraryDetail from './views/LibraryDetail';
import Home from './views/Home';
import Rules from './views/Rules';
import Settings from './views/Settings';

const Popup = () => {
  const [view, setView] = useState<View>({ name: 'home' });

  const renderView = () => {
    switch (view.name) {
      case 'home':
        return <Home navigate={setView} />;
      case 'library':
        return (
          <LibraryDetail
            libraryName={view.libraryName}
            goBack={() => setView({ name: 'home' })}
          />
        );
      case 'rules':
        return <Rules goBack={() => setView({ name: 'settings' })} />;
      case 'settings':
        return <Settings navigate={setView} />;
      default:
        return <div>Page not found!</div>;
    }
  };

  return (
    <>
      <Header activeTab={view} navigate={setView} />
      <div className="container">{renderView()}</div>
    </>
  );
};

export default Popup;
