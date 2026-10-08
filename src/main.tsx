/* =====================================================================
   KINEDOK ACADÉMIE — point d'entrée
   ---------------------------------------------------------------------
   1. Magasin local (migration de version) et contenus (démo + calque)
   2. Détection des fichiers de logo officiels déposés dans public/brand/
   3. Compte courant chargé depuis l'API (GET /auth/me/) AVANT le premier
      rendu, pour éviter un clignotement « déconnecté » au rechargement
   4. Rendu : thème → routeur → application
   ===================================================================== */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { hydrateSession } from './lib/auth';
import { detectOfficialLogos } from './lib/brand';
import { hydrateContent, initContent } from './lib/content';
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

// Les contenus réels de l'API arrivent en tâche de fond : le jeu compilé est
// déjà affiché, la bascule se fait via notify() sans bloquer le rendu.
void hydrateContent().catch((error: unknown) => console.error('[app] contenus', error));

// La session, en revanche, est attendue avant le premier rendu : cela évite
// un clignotement « déconnecté » de l'en-tête au rechargement.
hydrateSession()
  .catch((error: unknown) => console.error('[app] session', error))
  .finally(render);
