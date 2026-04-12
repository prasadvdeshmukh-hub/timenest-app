import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  RecaptchaVerifier,
  GoogleAuthProvider,
  browserLocalPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  useDeviceLanguage
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const PUBLIC_PAGES = new Set(["login.html", "signup.html", "forgot-password.html"]);
const USER_SCOPE_STORAGE_KEY = "timenest-user-scope";
const AUTH_PUBLIC_PATHS = {
  login: "./login.html",
  app: "./index.html"
};

let authBootstrapPromise = null;
let logoutInProgress = false;
let phoneConfirmationResult = null;
let recaptchaVerifier = null;

function getPageName(urlLike = window.location.href) {
  try {
    return new URL(urlLike, window.location.href).pathname.split("/").pop().toLowerCase() || "index.html";
  } catch (_) {
    return "index.html";
  }
}

function isPublicPage() {
  return document.body.dataset.authPublic === "true" || PUBLIC_PAGES.has(getPageName());
}

function getCurrentAppUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function sanitizeReturnTo(rawValue) {
  if (!rawValue) {
    return "";
  }

  try {
    const nextUrl = new URL(rawValue, window.location.origin);
    if (nextUrl.origin !== window.location.origin) {
      return "";
    }

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  } catch (_) {
    return "";
  }
}

function buildLoginUrl() {
  const loginUrl = new URL(AUTH_PUBLIC_PATHS.login, window.location.href);
  if (!logoutInProgress && !isPublicPage()) {
    loginUrl.searchParams.set("returnTo", getCurrentAppUrl());
  }
  return loginUrl.toString();
}

function redirectAfterAuth() {
  const params = new URLSearchParams(window.location.search);
  const requestedTarget = sanitizeReturnTo(params.get("returnTo"));
  const nextUrl = requestedTarget || new URL(AUTH_PUBLIC_PATHS.app, window.location.href).toString();
  window.location.replace(nextUrl);
}

function showToastMessage(message, type = "info", duration = 3400) {
  if (typeof window.showToast === "function") {
    window.showToast(message, type, duration);
    return;
  }

  console[type === "error" ? "error" : "log"](message);
}

function setAuthNotice(message, tone = "info") {
  document.querySelectorAll("[data-auth-banner], [data-auth-feedback]").forEach((element) => {
    element.textContent = message;
    element.dataset.tone = tone;
    element.hidden = false;
  });
}

function setAuthMethodAvailability(selector, enabled) {
  document.querySelectorAll(selector).forEach((element) => {
    element.hidden = !enabled;
    if ("disabled" in element) {
      element.disabled = !enabled;
    }
  });
}

function mountAuthGate(message) {
  if (document.querySelector("[data-auth-gate]")) {
    return () => {};
  }

  const gate = document.createElement("div");
  gate.className = "auth-gate";
  gate.dataset.authGate = "true";
  gate.innerHTML = `
    <div class="auth-gate-card panel">
      <p class="mini-label">Authentication</p>
      <h2>TimeNest is checking your session</h2>
      <p>${message}</p>
    </div>
  `;
  document.body.append(gate);

  return () => gate.remove();
}

function renderBlockingSetupState(title, message) {
  const existing = document.querySelector("[data-auth-gate]");
  if (existing) {
    existing.innerHTML = `
      <div class="auth-gate-card panel">
        <p class="mini-label">Authentication</p>
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
    `;
    return;
  }

  const gate = document.createElement("div");
  gate.className = "auth-gate";
  gate.dataset.authGate = "true";
  gate.innerHTML = `
    <div class="auth-gate-card panel">
      <p class="mini-label">Authentication</p>
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  `;
  document.body.append(gate);
}

function getDisplayName(user) {
  if (!user) {
    return "TimeNest User";
  }

  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return user.phoneNumber || "TimeNest User";
}

function getFirstName(user) {
  return getDisplayName(user).split(/\s+/)[0];
}

function buildTimeGreeting(user) {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${getFirstName(user)}`;
}

function syncUserScope(user) {
  if (user?.uid) {
    localStorage.setItem(USER_SCOPE_STORAGE_KEY, user.uid);
    return;
  }

  localStorage.removeItem(USER_SCOPE_STORAGE_KEY);
  localStorage.removeItem("timenest-auth-state");
  localStorage.removeItem("timenest-signup-method");
}

function updateProviderCard(card, linked, copyText) {
  const pill = card.querySelector("[data-auth-provider-pill]");
  const copy = card.querySelector("[data-auth-provider-copy]");

  card.classList.toggle("surface-item-status-good", linked);
  if (pill) {
    pill.classList.toggle("good", linked);
    pill.classList.toggle("warn", !linked);
    pill.textContent = linked ? "Linked" : "Not linked";
  }
  if (copy) {
    copy.textContent = copyText;
  }
}

function syncAuthenticatedUi(user) {
  const displayName = getDisplayName(user);
  const authLabel = user?.email || user?.phoneNumber || "Not signed in";

  document.querySelectorAll("[data-auth-display-name]").forEach((element) => {
    element.textContent = displayName;
  });

  document.querySelectorAll("[data-auth-email]").forEach((element) => {
    element.textContent = authLabel;
  });

  document.querySelectorAll("[data-auth-greeting]").forEach((element) => {
    element.textContent = buildTimeGreeting(user);
  });

  document.querySelectorAll("[data-auth-sync-state]").forEach((element) => {
    element.textContent = user ? "Authenticated" : "Signed Out";
  });

  const providerIds = new Set((user?.providerData || []).map((provider) => provider.providerId));
  document.querySelectorAll("[data-auth-provider-card]").forEach((card) => {
    const providerId = card.dataset.authProviderCard;
    const linked = providerIds.has(providerId);
    let copyText = "Link this provider from your Firebase Auth account settings.";

    if (providerId === "google.com") {
      copyText = linked ? "Google is linked for one-tap sign-in." : "Google sign-in is available but not linked on this account.";
    } else if (providerId === "password") {
      copyText = linked ? "Email and password sign-in is enabled for this account." : "Email and password have not been set on this account.";
    } else if (providerId === "phone") {
      copyText = linked ? "Phone verification is linked for SMS sign-in." : "Phone sign-in is available once a number is linked.";
    }

    updateProviderCard(card, linked, copyText);
  });
}

function formatAuthError(error) {
  const code = error?.code || "";
  const authErrors = {
    "auth/invalid-email": "The email address format is invalid.",
    "auth/invalid-credential": "The credentials were rejected. Double-check the email or password.",
    "auth/user-not-found": "No account exists for that email yet.",
    "auth/wrong-password": "The password is incorrect.",
    "auth/email-already-in-use": "That email already has a TimeNest account.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "auth/popup-closed-by-user": "The Google sign-in popup was closed before completion.",
    "auth/popup-blocked": "The browser blocked the Google sign-in popup.",
    "auth/missing-phone-number": "Enter a phone number with country code, for example +91XXXXXXXXXX.",
    "auth/invalid-phone-number": "The phone number format is invalid.",
    "auth/code-expired": "The verification code expired. Request a new code.",
    "auth/invalid-verification-code": "The verification code is invalid.",
    "auth/network-request-failed": "A network request failed. Check the browser connection and try again.",
    "auth/too-many-requests": "Firebase temporarily throttled this request. Wait a moment and try again."
  };

  return authErrors[code] || error?.message || "Authentication failed.";
}

function setBusyState(button, busyLabel) {
  if (!button) {
    return () => {};
  }

  const originalLabel = button.dataset.originalLabel || button.textContent;
  button.dataset.originalLabel = originalLabel;
  button.disabled = true;
  button.textContent = busyLabel;

  return () => {
    button.disabled = false;
    button.textContent = originalLabel;
  };
}

function normalizeCountryCode(countryCode) {
  if (!countryCode) {
    return "";
  }

  const digits = String(countryCode).replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function normalizePhoneNumber(rawValue, defaultCountryCode = "+91") {
  const value = rawValue.trim();
  if (!value) {
    return { ok: false, reason: "missing" };
  }

  if (!/^[+\d\s().-]+$/.test(value)) {
    return { ok: false, reason: "invalid-characters" };
  }

  const fallbackCountryCode = normalizeCountryCode(defaultCountryCode);
  let candidate = value.replace(/[\s().-]/g, "");

  if (candidate.startsWith("00")) {
    candidate = `+${candidate.slice(2)}`;
  }

  if (candidate.startsWith("+")) {
    return /^\+\d{8,15}$/.test(candidate)
      ? { ok: true, value: candidate }
      : { ok: false, reason: "invalid-format" };
  }

  const digits = candidate.replace(/\D/g, "");
  if (!digits) {
    return { ok: false, reason: "missing" };
  }

  if (fallbackCountryCode) {
    const fallbackDigits = fallbackCountryCode.slice(1);

    if (digits.startsWith(fallbackDigits) && digits.length >= fallbackDigits.length + 8 && digits.length <= 15) {
      return { ok: true, value: `+${digits}` };
    }

    const localDigits = digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
    if (localDigits.length === 10) {
      return { ok: true, value: `${fallbackCountryCode}${localDigits}` };
    }
  }

  if (digits.length >= 8 && digits.length <= 15) {
    return { ok: true, value: `+${digits}` };
  }

  return { ok: false, reason: "invalid-format" };
}

async function loadRuntimeConfig() {
  const response = await fetch(new URL("./app-config.json", window.location.href), {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Could not load auth config (${response.status})`);
  }

  return response.json();
}

async function initializeFirebaseAuth(runtimeConfig) {
  const app = getApps().length ? getApp() : initializeApp(runtimeConfig.firebase);
  const auth = getAuth(app);

  if (runtimeConfig.auth.useEmulator && !auth.emulatorConfig) {
    connectAuthEmulator(
      auth,
      `http://${runtimeConfig.auth.emulatorHost}:${runtimeConfig.auth.emulatorPort}`,
      { disableWarnings: true }
    );
  }

  if (runtimeConfig.auth.disableAppVerificationForTesting) {
    auth.settings.appVerificationDisabledForTesting = true;
  }

  useDeviceLanguage(auth);
  await setPersistence(auth, browserLocalPersistence);
  return auth;
}

async function ensureRecaptcha(auth) {
  const container = document.getElementById("recaptcha-container");
  if (!container) {
    return null;
  }

  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, container, {
      size: "normal"
    });
    await recaptchaVerifier.render();
  }

  return recaptchaVerifier;
}

function bindLogout(auth) {
  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-auth-logout]");
    if (!trigger) {
      return;
    }

    event.preventDefault();
    logoutInProgress = true;
    const resetButton = setBusyState(trigger, "Signing out...");

    try {
      await signOut(auth);
      showToastMessage("Signed out successfully.");
      window.location.replace(new URL(AUTH_PUBLIC_PATHS.login, window.location.href).toString());
    } catch (error) {
      logoutInProgress = false;
      showToastMessage(formatAuthError(error), "error");
    } finally {
      resetButton();
    }
  });
}

function bindGoogleButtons(auth) {
  document.querySelectorAll("[data-auth-google-login], [data-auth-google-signup]").forEach((button) => {
    button.addEventListener("click", async () => {
      const resetButton = setBusyState(button, "Opening Google...");

      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
        showToastMessage("Google sign-in successful.");
      } catch (error) {
        showToastMessage(formatAuthError(error), "error");
      } finally {
        resetButton();
      }
    });
  });
}

function bindLoginForm(auth) {
  const loginForm = document.querySelector("[data-auth-login-form]");
  if (!loginForm) {
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = loginForm.querySelector("[name='email']")?.value.trim();
    const password = loginForm.querySelector("[name='password']")?.value;
    const submitButton = loginForm.querySelector("[type='submit']");

    if (!email || !password) {
      showToastMessage("Enter your email and password to sign in.", "error");
      return;
    }

    const resetButton = setBusyState(submitButton, "Signing in...");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToastMessage("Signed in successfully.");
    } catch (error) {
      showToastMessage(formatAuthError(error), "error");
    } finally {
      resetButton();
    }
  });
}

function bindSignupForm(auth) {
  const signupForm = document.querySelector("[data-auth-signup-form]");
  if (!signupForm) {
    return;
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const displayName = signupForm.querySelector("[name='displayName']")?.value.trim();
    const email = signupForm.querySelector("[name='email']")?.value.trim();
    const password = signupForm.querySelector("[name='password']")?.value;
    const confirmPassword = signupForm.querySelector("[name='confirmPassword']")?.value;
    const submitButton = signupForm.querySelector("[type='submit']");

    if (!displayName || !email || !password || !confirmPassword) {
      showToastMessage("Complete all account fields before continuing.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToastMessage("The password confirmation does not match.", "error");
      return;
    }

    const resetButton = setBusyState(submitButton, "Creating account...");

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      showToastMessage("Account created successfully.");
    } catch (error) {
      showToastMessage(formatAuthError(error), "error");
    } finally {
      resetButton();
    }
  });
}

function bindResetForm(auth) {
  const resetForm = document.querySelector("[data-auth-reset-form]");
  if (!resetForm) {
    return;
  }

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = resetForm.querySelector("[name='email']")?.value.trim();
    const submitButton = resetForm.querySelector("[type='submit']");

    if (!email) {
      showToastMessage("Enter the email address tied to your TimeNest account.", "error");
      return;
    }

    const resetButton = setBusyState(submitButton, "Sending link...");

    try {
      await sendPasswordResetEmail(auth, email);
      showToastMessage("Password reset email sent.", "success");
      setAuthNotice("Reset link sent. Check your inbox and spam folder.", "success");
    } catch (error) {
      showToastMessage(formatAuthError(error), "error");
    } finally {
      resetButton();
    }
  });
}

function bindPhoneAuth(auth, runtimeConfig) {
  const phoneSection = document.querySelector("[data-auth-phone-section]");
  if (!phoneSection) {
    return;
  }

  if (!runtimeConfig.auth.phoneEnabled) {
    phoneSection.hidden = true;
    return;
  }

  const sendButton = phoneSection.querySelector("[data-auth-phone-send]");
  const verifyButton = phoneSection.querySelector("[data-auth-phone-verify]");
  const phoneInput = phoneSection.querySelector("[name='phoneNumber']");
  const codeInput = phoneSection.querySelector("[name='verificationCode']");
  const defaultCountryCode = phoneSection.dataset.authDefaultCountryCode || "+91";

  if (!sendButton || !verifyButton || !phoneInput || !codeInput) {
    return;
  }

  sendButton.addEventListener("click", async () => {
    const normalizedPhone = normalizePhoneNumber(phoneInput.value, defaultCountryCode);
    if (!normalizedPhone.ok) {
      showToastMessage(
        "Enter a valid mobile number. Use +919876543210 or a 10-digit Indian mobile number.",
        "error"
      );
      return;
    }

    const phoneNumber = normalizedPhone.value;
    phoneInput.value = phoneNumber;
    codeInput.value = "";
    codeInput.disabled = true;
    verifyButton.disabled = true;
    phoneConfirmationResult = null;

    const resetButton = setBusyState(sendButton, "Sending code...");

    try {
      const verifier = await ensureRecaptcha(auth);
      phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      codeInput.disabled = false;
      verifyButton.disabled = false;
      setAuthNotice("Verification code sent. Enter the SMS code to finish sign-in.", "success");
      showToastMessage("Verification code sent.", "success");
    } catch (error) {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
      showToastMessage(formatAuthError(error), "error");
    } finally {
      resetButton();
    }
  });

  verifyButton.addEventListener("click", async () => {
    if (!phoneConfirmationResult) {
      showToastMessage("Request an SMS code before verifying.", "error");
      return;
    }

    const verificationCode = codeInput.value.trim();
    if (!verificationCode) {
      showToastMessage("Enter the SMS verification code.", "error");
      return;
    }

    const resetButton = setBusyState(verifyButton, "Verifying...");

    try {
      await phoneConfirmationResult.confirm(verificationCode);
      showToastMessage("Phone sign-in successful.");
    } catch (error) {
      showToastMessage(formatAuthError(error), "error");
    } finally {
      resetButton();
    }
  });
}

function applyProviderAvailability(runtimeConfig) {
  setAuthMethodAvailability("[data-auth-google-control]", runtimeConfig.auth.googleEnabled);
  setAuthMethodAvailability("[data-auth-email-control]", runtimeConfig.auth.emailPasswordEnabled);
  setAuthMethodAvailability("[data-auth-phone-control]", runtimeConfig.auth.phoneEnabled);
}

function lockProtectedPage(message) {
  renderBlockingSetupState(
    "Authentication setup is incomplete",
    `${message} Start the preview with npm run ui:preview and configure Firebase in .env.`
  );
}

async function bootstrapAuth() {
  const publicPage = isPublicPage();
  const releaseGate = mountAuthGate(publicPage ? "Connecting Firebase Authentication..." : "Checking your signed-in session...");

  if (window.location.protocol === "file:") {
    setAuthNotice("Run the site from http://localhost:4173 to use real authentication.", "warn");
    if (!publicPage) {
      lockProtectedPage("This page is protected, but the app was opened directly from disk.");
    } else {
      releaseGate();
    }
    return;
  }

  let runtimeConfig;
  try {
    runtimeConfig = await loadRuntimeConfig();
  } catch (error) {
    setAuthNotice("Could not load Firebase config from the preview server.", "error");
    if (!publicPage) {
      lockProtectedPage("The preview server could not provide Firebase configuration.");
    } else {
      releaseGate();
    }
    console.error(error);
    return;
  }

  applyProviderAvailability(runtimeConfig);

  if (!runtimeConfig.hasFirebaseConfig) {
    setAuthNotice("Firebase Auth is not configured yet. Add the Firebase values to .env and restart the preview server.", "warn");
    if (!publicPage) {
      lockProtectedPage("Firebase configuration is missing.");
    } else {
      releaseGate();
    }
    return;
  }

  const auth = await initializeFirebaseAuth(runtimeConfig);
  window.__TIMENEST_REAL_AUTH__ = true;

  bindLogout(auth);
  bindGoogleButtons(auth);
  bindLoginForm(auth);
  bindSignupForm(auth);
  bindResetForm(auth);
  bindPhoneAuth(auth, runtimeConfig);

  let initialized = false;
  onAuthStateChanged(auth, (user) => {
    syncUserScope(user);
    syncAuthenticatedUi(user);

    if (user) {
      setAuthNotice(`Signed in as ${getDisplayName(user)}.`, "success");
      if (publicPage) {
        redirectAfterAuth();
        return;
      }
    } else if (!publicPage) {
      window.location.replace(buildLoginUrl());
      return;
    }

    if (!initialized) {
      releaseGate();
      initialized = true;
    }
  });
}

export function initAuth() {
  if (!authBootstrapPromise) {
    authBootstrapPromise = bootstrapAuth();
  }

  return authBootstrapPromise;
}