/* =====================================================================
   Table des routes — miroir de l'application d'origine
   ---------------------------------------------------------------------
   Toutes les pages vivent sous /:locale (fr, en, ar). Un chemin sans
   langue (/bibliotheque) est redirigé vers la langue détectée.
     /:locale                               accueil
     /:locale/bibliotheque/:slug            fiche ressource
     /:locale/formations/:slug/lecon/:id    lecteur de leçon
     /:locale/dashboard/*                   espace membre (session requise)
     /:locale/admin/*                       administration (rôle requis)
   ===================================================================== */
import { Route, Routes } from 'react-router';
import { RequireAuth, RequireRole } from './components/layout/Guards';
import { LocaleLayout, RootRedirect } from './components/layout/LocaleLayout';
import { AdminContentPage, AdminOverviewPage, AdminSubscriptionsPage, AdminUsersPage } from './pages/AdminPages';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './pages/AuthPages';
import { CoursePage, CoursesListPage, LessonPage } from './pages/CoursesPages';
import {
  DashboardCertificatesPage,
  DashboardCoursesPage,
  DashboardDownloadsPage,
  DashboardFavoritesPage,
  DashboardPage,
  DashboardWebinarsPage
} from './pages/DashboardPages';
import { ExercisePage, ExercisesListPage } from './pages/ExercisesPages';
import { HomePage } from './pages/HomePage';
import { AboutPage, FaqPage, LegalPage, NotFoundPage } from './pages/LegalPages';
import { LibraryListPage, ResourcePage } from './pages/LibraryPages';
import { PathologiesListPage, PathologyPage } from './pages/PathologiesPages';
import { ProfileEditPage, ProfilePage, SettingsPage } from './pages/ProfilePages';
import { SearchPage } from './pages/SearchPage';
import { MySubscriptionPage, SubscriptionsPage } from './pages/SubscriptionsPages';
import { ToolPage, ToolsListPage } from './pages/ToolsPages';
import { WebinarPage, WebinarsListPage } from './pages/WebinarsPages';

/* Écrans d'administration des contenus : segment d'URL → collection. */
const ADMIN_CONTENT = [
  ['bibliotheque', 'resources'],
  ['formations', 'courses'],
  ['webinaires', 'webinars'],
  ['outils', 'tools'],
  ['exercices', 'exercises'],
  ['pathologies', 'pathologies']
] as const;

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path=":locale" element={<LocaleLayout />}>
        {/* --- Public ------------------------------------------------ */}
        <Route index element={<HomePage />} />
        <Route path="connexion" element={<LoginPage />} />
        <Route path="inscription" element={<RegisterPage />} />
        <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />

        <Route path="bibliotheque" element={<LibraryListPage />} />
        <Route path="bibliotheque/:slug" element={<ResourcePage />} />

        <Route path="formations" element={<CoursesListPage />} />
        <Route path="formations/:slug" element={<CoursePage />} />
        <Route path="formations/:slug/lecon/:lessonId" element={<LessonPage />} />

        <Route path="webinaires" element={<WebinarsListPage />} />
        <Route path="webinaires/:slug" element={<WebinarPage />} />

        <Route path="outils" element={<ToolsListPage />} />
        <Route path="outils/:slug" element={<ToolPage />} />

        <Route path="pathologies" element={<PathologiesListPage />} />
        <Route path="pathologies/:slug" element={<PathologyPage />} />

        <Route path="exercices" element={<ExercisesListPage />} />
        <Route path="exercices/:slug" element={<ExercisePage />} />

        <Route path="recherche" element={<SearchPage />} />
        <Route path="abonnements" element={<SubscriptionsPage />} />

        {/* --- Éditorial --------------------------------------------- */}
        <Route path="a-propos" element={<AboutPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<LegalPage key="contact" page="contact" path="contact" />} />
        <Route path="conditions" element={<LegalPage key="terms" page="terms" path="conditions" />} />
        <Route path="confidentialite" element={<LegalPage key="privacy" page="privacy" path="confidentialite" />} />
        <Route
          path="avertissement-medical"
          element={<LegalPage key="medical" page="medical" path="avertissement-medical" />}
        />

        {/* --- Espace membre (session requise) ----------------------- */}
        <Route element={<RequireAuth />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/formations" element={<DashboardCoursesPage />} />
          <Route path="dashboard/favoris" element={<DashboardFavoritesPage />} />
          <Route path="dashboard/telechargements" element={<DashboardDownloadsPage />} />
          <Route path="dashboard/webinaires" element={<DashboardWebinarsPage />} />
          <Route path="dashboard/certificats" element={<DashboardCertificatesPage />} />
          <Route path="dashboard/abonnement" element={<MySubscriptionPage />} />
          <Route path="profil" element={<ProfilePage />} />
          <Route path="profil/modifier" element={<ProfileEditPage />} />
          <Route path="parametres" element={<SettingsPage />} />
        </Route>

        {/* --- Administration : éditeur de contenu et plus ------------ */}
        <Route element={<RequireRole role="CONTENT_EDITOR" />}>
          <Route path="admin" element={<AdminOverviewPage />} />
          {ADMIN_CONTENT.map(([segment, collection]) => (
            <Route
              key={segment}
              path={`admin/${segment}`}
              element={<AdminContentPage key={collection} collection={collection} />}
            />
          ))}
        </Route>

        {/* --- Administration : membres et abonnements (ADMIN) -------- */}
        <Route element={<RequireRole role="ADMIN" />}>
          <Route path="admin/utilisateurs" element={<AdminUsersPage />} />
          <Route path="admin/abonnements" element={<AdminSubscriptionsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
