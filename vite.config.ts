import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// KINEDOK ACADÉMIE — configuration Vite
// - React (JSX automatique, Fast Refresh en développement)
// - Tailwind CSS v4 via son plugin Vite (aucun fichier tailwind.config nécessaire :
//   le thème est déclaré en CSS dans src/styles/index.css)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8080,
    strictPort: true,
    // Le front appelle `/api/...` en relatif : le serveur de développement
    // le relaie vers Django. Même origine côté navigateur, donc le cookie
    // de session et le jeton CSRF circulent sans configuration CORS.
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://127.0.0.1:8000',
        changeOrigin: false
      }
    }
  },
  preview: {
    port: 8080,
    strictPort: true
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Le socle React et les dictionnaires changent bien moins souvent
        // que les pages : les isoler garde leur cache valide d'un
        // déploiement à l'autre, et allège le lot critique.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          locales: ['./src/locales/fr', './src/locales/en', './src/locales/ar'],
          data: [
            './src/data/resources',
            './src/data/courses',
            './src/data/tools',
            './src/data/exercises',
            './src/data/pathologies',
            './src/data/webinars',
            './src/data/authors',
            './src/data/plans',
            './src/data/taxonomies'
          ]
        }
      }
    }
  }
});
