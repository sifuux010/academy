/* =====================================================================
   Authentification — connexion, inscription, mot de passe oublié
   ---------------------------------------------------------------------
   Validation immédiate côté client, puis règles métier de lib/auth.
   Les erreurs (clés i18n) sont traduites puis rattachées à leur champ
   (aria-invalid + role="alert") ; le focus va au premier champ en erreur.

   Les trois écrans partagent `AuthShell` : un fond pleine page et une
   carte à droite. Seul le contenu du formulaire change.
   ===================================================================== */
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AuthShell } from '../components/layout/AuthShell';
import {
  AuthCheckbox,
  AuthField,
  AuthPasswordField,
  AuthPhoneField,
  AuthSelectField,
  withNodes
} from '../components/ui/AuthField';
import { useModal } from '../components/feedback/ModalProvider';
import { useToast } from '../components/feedback/ToastProvider';
import { Icon } from '../components/icons/Icon';
import { Alert, focusFirstError, readForm, translateErrors } from '../components/ui';
import { taxonomies } from '../data/taxonomies';
import { useSeo } from '../hooks/useSeo';
import { useI18n } from '../i18n/I18nContext';
import {
  isValidEmail,
  login,
  register,
  requestPasswordReset,
  type AuthFailure,
  type RegisterPayload
} from '../lib/auth';
import type { ProfileType } from '../model/common';

/* ------------------------------------------------------------ communs */

/**
 * Liens « conditions » et « confidentialité », insérés dans une phrase
 * traduite par ses jetons.
 */
function useLegalLinks(): Record<string, ReactNode> {
  const { t, href } = useI18n();
  return {
    terms: (
      <Link className="au-link" to={href('conditions')}>
        {t('auth.register.termsLink')}
      </Link>
    ),
    privacy: (
      <Link className="au-link" to={href('confidentialite')}>
        {t('auth.register.privacyLink')}
      </Link>
    )
  };
}

/* ------------------------------------------------------------ connexion */

export function LoginPage() {
  const { t, href } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useSeo({ title: t('auth.login.title'), path: 'connexion' });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = readForm(event.currentTarget);
    const email = form.get('email');
    const password = form.get('password');
    const next: Record<string, string> = {};
    if (!isValidEmail(email)) next.email = t('auth.errors.emailInvalid');
    if (!password) next.password = t('auth.errors.required');
    setErrors(next);
    if (Object.keys(next).length) {
      focusFirstError(formRef.current);
      return;
    }

    setBusy(true);
    setFailure(null);
    try {
      const user = await login(email, password, form.checked('remember'));
      toast(t('common.toast.loggedIn', { name: user.firstName }), 'success');
      navigate(href('dashboard'));
    } catch (error) {
      const result = (error ?? {}) as AuthFailure;
      setBusy(false);
      setFailure(t(result.message ?? 'auth.errors.credentials'));
      if (result.fields) {
        setErrors(translateErrors(result.fields, t));
        focusFirstError(formRef.current);
      }
    }
  };

  return (
    <AuthShell
      formTitle={t('auth.login.title')}
      formSubtitle={t('auth.login.subtitle')}
      switchPrompt={t('auth.login.noAccount')}
      switchLabel={t('auth.login.createOne')}
      switchTo={href('inscription')}
      withProvider
    >
      <form ref={formRef} className="au-form" noValidate onSubmit={onSubmit}>
        <div id="login-error">{failure ? <Alert variant="danger">{failure}</Alert> : null}</div>

        <AuthField
          name="email"
          label={t('auth.login.email')}
          icon="mail"
          type="email"
          required
          autoComplete="email"
          placeholder={t('auth.register.emailPlaceholder')}
          error={errors.email}
        />
        <AuthPasswordField
          name="password"
          label={t('auth.login.password')}
          required
          autoComplete="current-password"
          placeholder={t('auth.login.passwordPlaceholder')}
          error={errors.password}
        />

        <div className="au-options">
          <AuthCheckbox name="remember" defaultChecked label={t('auth.login.remember')} />
          <Link className="au-link" to={href('mot-de-passe-oublie')}>
            {t('auth.login.forgot')}
          </Link>
        </div>

        <button type="submit" className="au-submit" disabled={busy}>
          {busy ? t('common.actions.saving') : t('auth.login.submit')}
          <Icon name="arrowRight" size={17} className="icon-flip" />
        </button>
      </form>

      <div className="au-divider">{t('auth.login.demoTitle')}</div>
      <Alert variant="info">{t('auth.login.demoBody')}</Alert>
    </AuthShell>
  );
}

/* ---------------------------------------------------------- inscription */

export function RegisterPage() {
  const { t, href } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const modal = useModal();
  const [params] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const legal = useLegalLinks();

  const initial: ProfileType | '' =
    params.get('profil') === 'etudiant' ? 'STUDENT' : params.get('profil') === 'kine' ? 'PHYSIOTHERAPIST' : '';
  const [profile, setProfile] = useState<ProfileType | ''>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useSeo({ title: t('auth.register.title'), path: 'inscription' });

  const chooseProfile = (value: ProfileType) => {
    setProfile(value);
    setErrors((current) => {
      const next = { ...current };
      delete next.profileType;
      return next;
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = readForm(event.currentTarget);

    /* L'indicatif et le numéro sont saisis séparément : on les recompose
       avant de les transmettre, et on ne garde l'indicatif que s'il y a
       bien un numéro à préfixer. */
    const number = f.get('phone');
    const phone = number ? `${f.get('phoneCode')} ${number}`.trim() : '';

    const payload: RegisterPayload = {
      profileType: profile,
      firstName: f.get('firstName'),
      lastName: f.get('lastName'),
      email: f.get('email'),
      phone,
      country: f.get('country'),
      city: f.get('city'),
      password: f.get('password'),
      passwordConfirm: f.get('passwordConfirm'),
      terms: f.checked('terms'),
      newsletter: f.checked('newsletter'),
      university: f.get('university'),
      academicYear: f.get('academicYear'),
      graduationYear: f.get('graduationYear'),
      profStatus: f.get('profStatus'),
      workplace: f.get('workplace'),
      experienceYears: f.get('experienceYears')
    };

    setBusy(true);
    try {
      const user = await register(payload);
      toast(t('common.toast.loggedIn', { name: user.firstName }), 'success');
      navigate(href('dashboard'));
      modal.open({
        title: t('auth.register.verifyTitle'),
        body: <p>{t('auth.register.verifyBody', { email: user.email })}</p>,
        footer: (
          <button type="button" className="btn btn-primary" onClick={modal.close}>
            {t('common.actions.close')}
          </button>
        )
      });
    } catch (error) {
      setBusy(false);
      const result = (error ?? {}) as AuthFailure;
      if (result.fields) {
        setErrors(translateErrors(result.fields, t));
        focusFirstError(formRef.current);
      } else {
        toast(t('common.toast.genericError'), 'error');
      }
    }
  };

  return (
    <AuthShell
      formTitle={t('auth.register.title')}
      formSubtitle={t('auth.register.subtitle')}
      switchPrompt={t('auth.register.haveAccount')}
      switchLabel={t('auth.register.loginLink')}
      switchTo={href('connexion')}
      withProvider
      legal={withNodes(t('auth.register.legal'), legal)}
    >
      <form ref={formRef} className="au-form" noValidate onSubmit={onSubmit}>
        <fieldset className="au-profile">
          <legend className="au-profile-legend">{t('auth.register.chooseProfile')}</legend>
          <div className="au-profile-grid">
            <button
              type="button"
              className="au-profile-opt"
              aria-pressed={profile === 'PHYSIOTHERAPIST'}
              onClick={() => chooseProfile('PHYSIOTHERAPIST')}
            >
              <Icon name="stethoscope" size={16} />
              <span className="au-profile-label">{t('auth.register.physio.title')}</span>
            </button>
            <button
              type="button"
              className="au-profile-opt"
              aria-pressed={profile === 'STUDENT'}
              onClick={() => chooseProfile('STUDENT')}
            >
              <Icon name="graduation" size={16} />
              <span className="au-profile-label">{t('auth.register.student.title')}</span>
            </button>
          </div>
          <div id="profile-error">
            {errors.profileType ? (
              <p className="au-error" role="alert">
                {errors.profileType}
              </p>
            ) : null}
          </div>
        </fieldset>

        <div className="au-row">
          <AuthField
            name="firstName"
            label={t('auth.register.firstName')}
            icon="user"
            required
            autoComplete="given-name"
            placeholder={t('auth.register.firstNamePlaceholder')}
            error={errors.firstName}
          />
          <AuthField
            name="lastName"
            label={t('auth.register.lastName')}
            icon="user"
            required
            autoComplete="family-name"
            placeholder={t('auth.register.lastNamePlaceholder')}
            error={errors.lastName}
          />
        </div>

        <AuthField
          name="email"
          label={t('auth.register.email')}
          icon="mail"
          type="email"
          required
          autoComplete="email"
          placeholder={t('auth.register.emailPlaceholder')}
          defaultValue={params.get('email') ?? undefined}
          error={errors.email}
        />

        <AuthPhoneField
          name="phone"
          label={t('auth.register.phone')}
          required
          placeholder={t('auth.register.phonePlaceholder')}
          error={errors.phone}
        />

        <div className="au-row">
          <AuthSelectField
            name="country"
            label={t('auth.register.country')}
            icon="globe"
            required
            options={[...taxonomies.countries]}
            placeholder={t('auth.register.countryPlaceholder')}
            error={errors.country}
          />
          <AuthField
            name="city"
            label={t('auth.register.city')}
            icon="pin"
            required
            autoComplete="address-level2"
            placeholder={t('auth.register.cityPlaceholder')}
            error={errors.city}
          />
        </div>

        <div className="au-pair">
          <div className="au-row">
            <AuthPasswordField
              name="password"
              label={t('auth.register.password')}
              required
              autoComplete="new-password"
              placeholder={t('auth.register.passwordPlaceholder')}
              error={errors.password}
            />
            <AuthPasswordField
              name="passwordConfirm"
              label={t('auth.register.confirmPassword')}
              required
              autoComplete="new-password"
              placeholder={t('auth.register.confirmPlaceholder')}
              error={errors.passwordConfirm}
            />
          </div>
          {/* La règle vaut pour les deux champs : elle court sous la rangée
              plutôt que sous la seule colonne de gauche, où elle passerait
              à la ligne. */}
          <p className="au-row-hint">{t('auth.register.passwordHint')}</p>
        </div>

        <div id="student-fields" className={profile === 'STUDENT' ? 'au-branch' : 'hidden'}>
          <AuthField name="university" label={t('auth.register.university')} icon="building" />
          <div className="au-row">
            <AuthSelectField
              name="academicYear"
              label={t('auth.register.academicYear')}
              icon="graduation"
              options={[...taxonomies.academicYears]}
              placeholder="—"
            />
            <AuthField
              name="graduationYear"
              label={t('auth.register.graduationYear')}
              icon="calendar"
              type="number"
            />
          </div>
        </div>

        <div id="physio-fields" className={profile === 'PHYSIOTHERAPIST' ? 'au-branch' : 'hidden'}>
          <AuthSelectField
            name="profStatus"
            label={t('auth.register.profStatus')}
            icon="stethoscope"
            options={[...taxonomies.profStatuses]}
            placeholder="—"
          />
          <div className="au-row">
            <AuthField name="workplace" label={t('auth.register.workplace')} icon="building" />
            <AuthField
              name="experienceYears"
              label={t('auth.register.experience')}
              icon="activity"
              type="number"
            />
          </div>
        </div>

        <div className="au-checks">
          <AuthCheckbox name="terms" label={withNodes(t('auth.register.termsLabel'), legal)} />
          <div id="terms-error">
            {errors.terms ? (
              <p className="au-error" role="alert">
                {errors.terms}
              </p>
            ) : null}
          </div>
          <AuthCheckbox name="newsletter" defaultChecked label={t('auth.register.newsletter')} />
        </div>

        <button type="submit" className="au-submit" disabled={busy}>
          {busy ? t('common.actions.saving') : t('auth.register.submit')}
          <Icon name="arrowRight" size={17} className="icon-flip" />
        </button>
      </form>
    </AuthShell>
  );
}

/* --------------------------------------------------- mot de passe oublié */

export function ForgotPasswordPage() {
  const { t, href } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | undefined>();
  const [sentTo, setSentTo] = useState<string | null>(null);

  useSeo({ title: t('auth.forgot.title'), path: 'mot-de-passe-oublie' });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = readForm(event.currentTarget).get('email');
    if (!isValidEmail(email)) {
      setError(t('auth.errors.emailInvalid'));
      focusFirstError(formRef.current);
      return;
    }
    setError(undefined);
    requestPasswordReset(email).then(() => setSentTo(email));
  };

  return (
    <AuthShell
      formTitle={t('auth.forgot.title')}
      formSubtitle={t('auth.forgot.subtitle')}
      switchPrompt={t('auth.login.noAccount')}
      switchLabel={t('auth.login.createOne')}
      switchTo={href('inscription')}
    >
      <form ref={formRef} className="au-form" noValidate onSubmit={onSubmit}>
        <div id="forgot-result">
          {sentTo ? (
            <Alert variant="success" title={t('auth.forgot.sentTitle')}>
              {t('auth.forgot.sentBody', { email: sentTo })}
            </Alert>
          ) : null}
        </div>
        <AuthField
          name="email"
          label={t('auth.login.email')}
          icon="mail"
          type="email"
          required
          autoComplete="email"
          placeholder={t('auth.register.emailPlaceholder')}
          error={error}
        />
        <button type="submit" className="au-submit" disabled={!!sentTo}>
          {t('auth.forgot.submit')}
          <Icon name="arrowRight" size={17} className="icon-flip" />
        </button>
      </form>

      <p className="au-foot">
        <Link className="au-link" to={href('connexion')}>
          {t('auth.forgot.backToLogin')}
        </Link>
      </p>
    </AuthShell>
  );
}
