import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { PublicFormPage } from './components/PublicFormPage';

//createRoot(document.getElementById('root')!).render(
 // <StrictMode>
  //  <App />
  //</StrictMode>,
//)
// /form/:token adreslerinde builder yerine public müşteri formunu gösteriyoruz.
const publicFormMatch =
  window.location.pathname.match(
    /^\/form\/([^/]+)$/
  );

createRoot(
  document.getElementById('root')!
).render(
  <StrictMode>
    {publicFormMatch ? (
      <PublicFormPage
        token={publicFormMatch[1]}
      />
    ) : (
      <App />
    )}
  </StrictMode>
);