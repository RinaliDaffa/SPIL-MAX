import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './vendor/react-video/ui/styles/index.css';
import './styles/apple-tv-pure.css';
import './styles/player-tv.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
