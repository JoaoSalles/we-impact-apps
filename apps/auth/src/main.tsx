import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import AuthApp from './AuthApp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <AuthApp />
  </StrictMode>,
);
