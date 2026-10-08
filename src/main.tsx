/* =====================================================================
   KINEDOK ACADÉMIE — point d'entrée
   ---------------------------------------------------------------------
   1. Magasin local (migration de version) et contenus (démo + calque)
   2. Détection des fichiers de logo officiels déposés dans public/brand/
   3. Comptes de démonstration créés AVANT le premier rendu (la dérivation
      PBKDF2 est asynchrone) afin que la connexion fonctionne d'emblée
   4. Rendu : thème → routeur → application
   ===================================================================== */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { seedDemoUsers } from './lib/auth';
import { detectOfficialLogos } from './lib/brand';
import { initContent } from './lib/content';
import { ensureVersion } from './lib/storage';
import { ThemeProvider } from './theme/ThemeContext';
import './styles/index.css';

function render(): void {
  const root = document.getElementById('root');
  if (!root) throw new Error('Élément #root introuvable dans index.html.');
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </StrictMode>
  );
}

ensureVersion();
initContent();
detectOfficialLogos();

seedDemoUsers()
  .catch((error: unknown) => {
    console.error('[app] amorçage', error);
  })
  .finally(render);
