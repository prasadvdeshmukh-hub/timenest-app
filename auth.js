import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import {
  RecaptchaVerifier,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  getRedirectResult,
  signOut,
  signInWithRedirect,
  updateProfile,
  useDeviceLanguage
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const PUBLIC_PAGES = new Set(["login.html", "signup.html", "forgot-password.html"]);
const USER_SCOPE_STORAGE_KEY = "timenest-user-scope";
const GOOGLE_REDIRECT_PENDING_KEY = "timenest-google-redirect-pending";
const RECENT_SIGNIN_MARKER_KEY = "timenest-recent-signin";
const AUTH_PUBLIC_PATHS = {
  login: "./login.html",
  app: "./index.html"
};

let authBootstrapPromise = null;
let logoutInProgress = false;
let phoneConfirmationResult = null;
let recaptchaVerifier = null;
let authDebugState = {};
let authGateStuckTimer = 0;
let authGateStuckShown = false;

function getRecentSigninMarker(maxAgeMs = 20000) {
  try {
    const raw = sessionStorage.getItem(RECENT_SIGNIN_MARKER_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.uid || !parsed?.ts || Date.now() - parsed.ts > maxAgeMs) {
      sessionStorage.removeItem(RECENT_SIGNIN_MARKER_KEY);
      return null;
    }

    return parsed;
  } catch (_) {
    sessionStorage.removeItem(RECENT_SIGNIN_MARKER_KEY);
    return null;
  }
}

function setRecentSigninMarker(user) {
  if (!user?.uid) {
    return;
  }

  sessionStorage.setItem(
    RECENT_SIGNIN_MARKER_KEY,
    JSON.stringify({
      uid: user.uid,
      ts: Date.now()
    })
  );
}

function clearRecentSigninMarker() {
  sessionStorage.removeItem(RECENT_SIGNIN_MARKER_KEY);
}

function updateAuthGateDiagnostics() {
  const gate = document.querySelector("[data-auth-gate]");
  if (!gate || !authGateStuckShown) {
    return;
  }

  let details = gate.querySelector("[data-auth-gate-debug]");
  if (!details) {
    details = document.createElement("div");
    details.dataset.authGateDebug = "true";
    details.style.marginTop = "1rem";
    details.style.paddingTop = "0.85rem";
    details.style.borderTop = "1px solid rgba(120, 149, 194, 0.22)";
    details.style.fontFamily = "'Space Grotesk', sans-serif";
    details.style.fontSize = "0.78rem";
    details.style.lineHeight = "1.5";
    details.style.color = "rgba(220, 233, 255, 0.78)";
    gate.querySelector(".auth-gate-card")?.append(details);
  }

  const lines = [
    `Step: ${authDebugState.step || "starting"}`,
    `Page: ${authDebugState.page || "unknown"}`,
    `Host: ${authDebugState.host || window.location.hostname}`,
    `Redirect pending: ${authDebugState.redirectPending ? "yes" : "no"}`,
    `Current user: ${authDebugState.currentUser || "none"}`,
    `Recent sign-in marker: ${getRecentSigninMarker() ? "yes" : "no"}`,
    `Updated: ${authDebugState.updatedAt || "now"}`
  ];

  details.innerHTML = `
    <strong style="display:block;margin-bottom:0.4rem;color:#fff;">Auth diagnostics</strong>
    ${lines.map((line) => `<div>${line}</div>`).join("")}
  `;
}

function setAuthDebugState(patch = {}) {
  authDebugState = {
    ...authDebugState,
    ...patch,
    page: getPageName(),
    host: window.location.hostname,
    redirectPending: sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === "true",
    currentUser: window._fb?.auth?.currentUser?.uid || patch.currentUser || null,
    updatedAt: new Date().toLocaleTimeString()
  };
  updateAuthGateDiagnostics();
  console.debug("TimeNest auth debug", authDebugState);
}

function armAuthGateDiagnostics() {
  window.clearTimeout(authGateStuckTimer);
  authGateStuckTimer = window.setTimeout(() => {
    const gate = document.querySelector("[data-auth-gate]");
    if (!gate) {
      return;
    }

    authGateStuckShown = true;
    updateAuthGateDiagnostics();
  }, 6500);
}

async function waitForPersistence(auth) {
  if (!auth.__timenestPersistenceReadyPromise) {
    auth.__timenestPersistenceReadyPromise = setPersistence(auth, browserLocalPersistence).catch(async (error) => {
      console.warn("Falling back to session persistence for TimeNest auth", error);
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (fallbackError) {
        console.warn("Session persistence fallback also failed", fallbackError);
      }
    });
  }

  try {
    if (auth.__timenestPersistenceReadyPromise) {
      await auth.__timenestPersistenceReadyPromise;
    }
  } catch (error) {
    console.warn("TimeNest auth persistence setup did not complete cleanly", error);
  }
}

async function waitForInitialAuthState(auth, timeoutMs = 4500) {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = 0;
    let unsubscribe = () => {};

    const finish = (user = null) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      unsubscribe();
      resolve(user || auth.currentUser || null);
    };

    timeoutId = window.setTimeout(() => {
      finish(auth.currentUser || null);
    }, timeoutMs);

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        finish(user || null);
      },
      () => {
        finish(auth.currentUser || null);
      }
    );
  });
}

async function waitForAuthenticatedUser(auth, expectedUid = "", timeoutMs = 7000) {
  if (auth.currentUser && (!expectedUid || auth.currentUser.uid === expectedUid)) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = 0;
    let unsubscribe = () => {};

    const finish = (user = null) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      unsubscribe();

      if (user && (!expectedUid || user.uid === expectedUid)) {
        resolve(user);
        return;
      }

      if (auth.currentUser && (!expectedUid || auth.currentUser.uid === expectedUid)) {
        resolve(auth.currentUser);
        return;
      }

      resolve(null);
    };

    timeoutId = window.setTimeout(() => {
      finish(null);
    }, timeoutMs);

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!expectedUid || user?.uid === expectedUid) {
          finish(user || null);
        }
      },
      () => {
        finish(null);
      }
    );
  });
}

async function resolveGoogleRedirectResult(auth) {
  if (!isPublicPage()) {
    return null;
  }

  setAuthDebugState({ step: "awaiting redirect result" });
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) {
      setAuthDebugState({ step: "no redirect result" });
      return null;
    }

    setGoogleRedirectPending(false);
    setRecentSigninMarker(result.user);
    setAuthNotice(`Signed in as ${getDisplayName(result.user)}.`, "success");
    showToastMessage("Google sign-in successful.");
    setAuthDebugState({ step: "redirect result user received", currentUser: result.user.uid });
    return result.user;
  } catch (error) {
    setGoogleRedirectPending(false);
    console.error("Google redirect result failed", error);
    setAuthDebugState({ step: `redirect result error: ${error.code || "unknown"}` });
    if (error.code !== "auth/popup-closed-by-user") {
      setAuthNotice(formatAuthError(error), "error");
      showToastMessage(formatAuthError(error), "error");
    }
    return null;
  }
}

function setGoogleRedirectPending(pending) {
  if (pending) {
    sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, "true");
    setAuthDebugState({ redirectPending: true });
    return;
  }

  sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
  setAuthDebugState({ redirectPending: false });
}

function isGoogleRedirectPending() {
  return sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === "true";
}

function handleIncompleteGoogleRedirect(auth) {
  if (!isGoogleRedirectPending() || auth.currentUser) {
    return;
  }

  setGoogleRedirectPending(false);
  clearRecentSigninMarker();
  setAuthDebugState({ step: "incomplete google redirect" });

  if (isPublicPage()) {
    setAuthNotice("Google sign-in did not complete. Please try again.", "warn");
    return;
  }

  renderBlockingSetupState(
    "Google sign-in did not finish",
    "TimeNest could not restore the Google session. Returning to the login page so you can try again."
  );
  window.setTimeout(() => {
    window.location.replace(buildLoginUrl());
  }, 1400);
}

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

function getGitHubPagesProjectSegment(urlLike = window.location.href) {
  try {
    const url = new URL(urlLike, window.location.href);
    if (!url.hostname.toLowerCase().endsWith(".github.io")) {
      return "";
    }

    const [firstSegment = ""] = url.pathname.split("/").filter(Boolean);
    return firstSegment && !firstSegment.includes(".") ? firstSegment : "";
  } catch (_) {
    return "";
  }
}

function isGitHubPagesProjectSite(urlLike = window.location.href) {
  return Boolean(getGitHubPagesProjectSegment(urlLike));
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

function mountAuthGate(message, blocking = true) {
  if (document.querySelector("[data-auth-gate]")) {
    return () => {};
  }

  const gate = document.createElement("div");
  gate.className = "auth-gate";
  gate.dataset.authGate = "true";
  gate.dataset.authGateBlocking = blocking ? "true" : "false";
  gate.innerHTML = `
    <div class="auth-gate-card panel">
      <p class="mini-label">Secure Access</p>
      <h2>TimeNest is preparing sign-in</h2>
      <p>${message}</p>
    </div>
  `;
  document.body.append(gate);
  armAuthGateDiagnostics();

  return () => {
    window.clearTimeout(authGateStuckTimer);
    authGateStuckShown = false;
    gate.remove();
  };
}

function renderBlockingSetupState(title, message) {
  const existing = document.querySelector("[data-auth-gate]");
  if (existing) {
    existing.innerHTML = `
      <div class="auth-gate-card panel">
        <p class="mini-label">Secure Access</p>
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
    `;
    updateAuthGateDiagnostics();
    return;
  }

  const gate = document.createElement("div");
  gate.className = "auth-gate";
  gate.dataset.authGate = "true";
  gate.innerHTML = `
    <div class="auth-gate-card panel">
      <p class="mini-label">Secure Access</p>
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  `;
  document.body.append(gate);
  armAuthGateDiagnostics();
  updateAuthGateDiagnostics();
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
    "auth/unauthorized-domain": "This domain is not authorized for Firebase Auth. Add localhost in Firebase Authentication Settings -> Authorized domains.",
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
    "auth/operation-not-supported-in-this-environment": "This browser cannot complete Google sign-in here. Open TimeNest in Chrome or Safari, or use email/password instead.",
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
  const db = getFirestore(app);

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
  window._fb = {
    ...(window._fb || {}),
    app,
    auth,
    db,
    onAuthStateChanged,
    signOut
  };

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

function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function shouldDisableGoogleAuthOnThisDevice() {
  return isMobileBrowser() && isGitHubPagesProjectSite();
}

function getMobileGoogleAuthWarning() {
  const projectSegment = getGitHubPagesProjectSegment();
  const projectUrl = projectSegment
    ? `${window.location.origin}/${projectSegment}/`
    : window.location.origin;

  return `Google sign-in is not supported on this mobile GitHub Pages link because Firebase cannot return redirect auth to ${projectUrl}. Use email/password here, or deploy TimeNest on a root or custom domain for mobile Google sign-in.`;
}

function canUseRedirectFallback() {
  return !isGitHubPagesProjectSite();
}

function bindGoogleButtons(auth, onGoogleSuccess = null) {
  document.querySelectorAll("[data-auth-google-login], [data-auth-google-signup]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (shouldDisableGoogleAuthOnThisDevice()) {
        const warningMessage = getMobileGoogleAuthWarning();
        setAuthNotice(warningMessage, "warn");
        showToastMessage(warningMessage, "error", 5600);
        return;
      }

      const resetButton = setBusyState(button, "Opening Google...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      setAuthNotice("Opening Google sign-in...", "info");
      setAuthDebugState({ step: "google button clicked" });

      try {
        await waitForPersistence(auth);
        setAuthDebugState({ step: "persistence ready for google sign-in" });

        if (isMobileBrowser() && canUseRedirectFallback()) {
          setGoogleRedirectPending(true);
          setAuthDebugState({ step: "starting google redirect" });
          await signInWithRedirect(auth, provider);
          return;
        }

        // Use popup on desktop for a faster flow, and redirect on mobile.
        const result = await signInWithPopup(auth, provider);
        setGoogleRedirectPending(false);
        setRecentSigninMarker(result.user);
        setAuthDebugState({ step: "google popup returned", currentUser: result.user?.uid || null });
        const settledUser = await waitForAuthenticatedUser(auth, result.user?.uid || "", 5000);
        if (typeof onGoogleSuccess === "function") {
          await onGoogleSuccess(settledUser || result.user);
        }
        showToastMessage("Google sign-in successful.");
      } catch (error) {
        setGoogleRedirectPending(false);
        console.error("Google sign-in failed", error);
        setAuthDebugState({ step: `google sign-in error: ${error.code || "unknown"}` });

        if (
          canUseRedirectFallback() &&
          [
            "auth/popup-blocked",
            "auth/popup-closed-by-user",
            "auth/cancelled-popup-request",
            "auth/operation-not-supported-in-this-environment"
          ].includes(error.code)
        ) {
          setAuthNotice("Popup sign-in failed, switching to Google redirect sign-in...", "warn");
          await signInWithRedirect(auth, provider);
          return;
        }

        if (error.code === "auth/popup-blocked") {
          setAuthNotice(
            "Please allow pop-ups for this site to sign in with Google. If you are on mobile GitHub Pages, use email/password instead.",
            "error"
          );
          showToastMessage(
            "Please allow pop-ups for this site to sign in with Google. If you are on mobile GitHub Pages, use email/password instead.",
            "error"
          );
        } else if (error.code !== "auth/popup-closed-by-user") {
          setAuthNotice(formatAuthError(error), "error");
          showToastMessage(formatAuthError(error), "error");
        }
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
      await waitForPersistence(auth);
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
      await waitForPersistence(auth);
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
      await waitForPersistence(auth);
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
  const googleEnabled = runtimeConfig.auth.googleEnabled && !shouldDisableGoogleAuthOnThisDevice();
  setAuthMethodAvailability("[data-auth-google-control]", googleEnabled);
  setAuthMethodAvailability("[data-auth-email-control]", runtimeConfig.auth.emailPasswordEnabled);
  setAuthMethodAvailability("[data-auth-phone-control]", runtimeConfig.auth.phoneEnabled);
}

function lockProtectedPage(message) {
  renderBlockingSetupState(
    "Sign-in setup is incomplete",
    `${message} Start the preview with npm run ui:preview and complete the sign-in configuration in .env.`
  );
}

async function bootstrapAuth() {
  const publicPage = isPublicPage();
  setAuthDebugState({ step: "bootstrap start", publicPage });
  const releaseGate = mountAuthGate(
    publicPage ? "Connecting secure sign-in..." : "Checking your signed-in session...",
    !publicPage
  );

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
    setAuthDebugState({ step: "runtime config loaded" });
  } catch (error) {
    setAuthNotice("Could not load the sign-in configuration from the preview server.", "error");
    if (!publicPage) {
      lockProtectedPage("The preview server could not provide sign-in configuration.");
    } else {
      releaseGate();
    }
    console.error(error);
    return;
  }

  const preferredHostedDomain = `${runtimeConfig.firebase.projectId}.firebaseapp.com`;
  const currentHost = window.location.hostname;
  const isLocalHost = currentHost === "localhost" || currentHost === "127.0.0.1";

  if (
    currentHost &&
    !isLocalHost &&
    !isGitHubPagesProjectSite() &&
    currentHost !== preferredHostedDomain
  ) {
    const redirectUrl = new URL(window.location.href);
    redirectUrl.hostname = preferredHostedDomain;
    setAuthDebugState({ step: "redirecting to firebaseapp host" });
    window.location.replace(redirectUrl.toString());
    return;
  }

  applyProviderAvailability(runtimeConfig);

  if (runtimeConfig.auth.googleEnabled && shouldDisableGoogleAuthOnThisDevice()) {
    setAuthNotice(getMobileGoogleAuthWarning(), "warn");
  } else if (isGoogleRedirectPending()) {
    setAuthNotice("Finishing Google sign-in...", "info");
    setAuthDebugState({ step: "google redirect pending on load" });
  }

  if (!runtimeConfig.hasFirebaseConfig) {
    setAuthNotice("Sign-in is not configured yet. Add the required values to .env and restart the preview server.", "warn");
    if (!publicPage) {
      lockProtectedPage("Sign-in configuration is missing.");
    } else {
      releaseGate();
    }
    return;
  }

  try {
    const auth = await initializeFirebaseAuth(runtimeConfig);
    window.__TIMENEST_REAL_AUTH__ = true;
    setAuthDebugState({ step: "firebase auth initialized", currentUser: auth.currentUser?.uid || null });

    let publicRedirectStarted = false;
    const finishPublicSignIn = async (user) => {
      if (!user || publicRedirectStarted || !isPublicPage()) {
        return;
      }

      setAuthDebugState({ step: "finalizing public sign-in", currentUser: user.uid });
      publicRedirectStarted = true;
      setGoogleRedirectPending(false);
      setRecentSigninMarker(user);
      const settledUser = await waitForAuthenticatedUser(auth, user.uid, 7000);
      if (!settledUser) {
        clearRecentSigninMarker();
        setAuthNotice("Google sign-in finished, but TimeNest could not restore the session yet. Please try once more.", "warn");
        setAuthDebugState({ step: "public sign-in did not settle", currentUser: null });
        publicRedirectStarted = false;
        return;
      }

      syncUserScope(settledUser);
      syncAuthenticatedUi(settledUser);
      setAuthNotice(`Signed in as ${getDisplayName(settledUser)}.`, "success");
      setAuthDebugState({ step: "redirecting into app", currentUser: settledUser.uid });
      window.setTimeout(() => {
        redirectAfterAuth();
      }, 120);
    };

    bindLogout(auth);
    bindGoogleButtons(auth, finishPublicSignIn);
    bindLoginForm(auth);
    bindSignupForm(auth);
    bindResetForm(auth);
    bindPhoneAuth(auth, runtimeConfig);

    const redirectResultUser = await resolveGoogleRedirectResult(auth);
    if (redirectResultUser) {
      await finishPublicSignIn(redirectResultUser);
      return;
    }

    const applyResolvedAuthState = (user) => {
      setAuthDebugState({
        step: user ? "auth state resolved with user" : "auth state resolved without user",
        currentUser: user?.uid || null
      });
      syncUserScope(user);
      syncAuthenticatedUi(user);

      if (user) {
        clearRecentSigninMarker();
        if (publicPage) {
          void finishPublicSignIn(user);
          return "redirected";
        }
        setGoogleRedirectPending(false);
        setAuthNotice(`Signed in as ${getDisplayName(user)}.`, "success");
      } else if (!publicPage) {
        const recentSignin = getRecentSigninMarker();
        if (isGoogleRedirectPending() || recentSignin) {
          window.setTimeout(() => {
            if (auth.currentUser) {
              return;
            }

            clearRecentSigninMarker();
            handleIncompleteGoogleRedirect(auth);
          }, recentSignin ? 4200 : 2200);
          setAuthDebugState({ step: "waiting for protected session restore" });
          return "pending";
        }
        window.location.replace(buildLoginUrl());
        return "redirected";
      } else if (isGoogleRedirectPending()) {
        window.setTimeout(() => {
          if (!auth.currentUser && isGoogleRedirectPending()) {
            handleIncompleteGoogleRedirect(auth);
          }
        }, 2200);
      }
      return "ready";
    };

    const initialUser = await waitForInitialAuthState(auth, getRecentSigninMarker() ? 9000 : 4500);
    const initialState = applyResolvedAuthState(initialUser);

    if (initialState === "ready") {
      setAuthDebugState({ step: "auth gate released" });
      releaseGate();
    }

    onAuthStateChanged(auth, (user) => {
      const state = applyResolvedAuthState(user);
      if (state === "ready" && document.querySelector("[data-auth-gate]")) {
        setAuthDebugState({ step: "auth listener released gate" });
        releaseGate();
      }
    });
  } catch (error) {
    console.error("TimeNest auth bootstrap failed", error);
    setGoogleRedirectPending(false);
    clearRecentSigninMarker();
    setAuthDebugState({ step: `bootstrap error: ${error.code || error.message || "unknown"}` });
    if (publicPage) {
      releaseGate();
      setAuthNotice(formatAuthError(error), "error");
      return;
    }

    renderBlockingSetupState(
      "Sign-in could not finish",
      "TimeNest hit an authentication startup problem. Returning to the login page so you can try again."
    );
    window.setTimeout(() => {
      window.location.replace(buildLoginUrl());
    }, 1800);
  }
}

export function initAuth() {
  if (!authBootstrapPromise) {
    authBootstrapPromise = bootstrapAuth();
  }

  return authBootstrapPromise;
}
