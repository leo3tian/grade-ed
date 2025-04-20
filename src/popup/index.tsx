import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './Popup';
import '../../public/popup.css';

const root = createRoot(document.getElementById('root')!);
root.render(<Popup />);
