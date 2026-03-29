// ─── TimeNest Authentication Module ───
// Handles Google Sign-In, Email/Password, and Phone/SMS OTP
// Uses Firebase Auth SDK (loaded via CDN in login.html)

import { firebaseConfig } from "./firebase-config.js";

let app, auth, db, googleProvider, recaptchaVerifier;

// ── Initialize Firebase ──

async function initFirebase() {
  const { initializeApp } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"
  );
  const {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    updateProfile,
  } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"
  );
  const { getFirestore, doc, setDoc, getDoc, updateDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();

  // Store imports on window for use in handlers
  window._fb = {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    updateProfile,
    doc,
    setDoc,
    getDoc,
    updateDoc,
  };

  // Listen for auth state changes
  window._fb.onAuthStateChanged(auth, handleAuthStateChange);

  console.log("Firebase initialized for TimeNest");
  return auth;
}

// ── Auth State Listener ──

function handleAuthStateChange(user) {
  if (user) {
    console.log("User signed in:", user.displayName || user.email || user.phoneNumber);
    syncUserToFirestore(user);
    // Redirect to dashboard if on login/signup page
    const page = window.location.pathname.split("/").pop();
    if (["login.html", "signup.html", "forgot-password.html", ""].includes(page)) {
      window.location.href = "./index.html";
    }
  }
}

// ── Sync User to Firestore ──

async function syncUserToFirestore(user) {
  try {
    const { doc, getDoc, setDoc, updateDoc } = window._fb;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        photoUrl: user.photoURL || "",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        notificationPrefs: {
          push: true,
          inApp: true,
          email: false,
          sms: false,
          whatsapp: false,
        },
      });
    } else {
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("Firestore sync error (non-fatal):", err.message);
  }
}

// ── Google Sign-In ──

async function signInWithGoogle() {
  try {
    showLoading(true);
    clearError();
    const result = await window._fb.signInWithPopup(auth, googleProvider);
    console.log("Google sign-in success:", result.user.displayName);
    // Auth state listener will redirect
  } catch (err) {
    console.error("Google sign-in error:", err);
    showError(friendlyError(err));
  } finally {
    showLoading(false);
  }
}

// ── Email/Password Sign-In ──

async function signInWithEmail(email, password) {
  try {
    showLoading(true);
    clearError();
    const result = await window._fb.signInWithEmailAndPassword(auth, email, password);
    console.log("Email sign-in success:", result.user.email);
  } catch (err) {
    console.error("Email sign-in error:", err);
    showError(friendlyError(err));
  } finally {
    showLoading(false);
  }
}

// ── Email/Password Sign-Up ──

async function signUpWithEmail(email, password, displayName) {
  try {
    showLoading(true);
    clearError();
    const result = await window._fb.createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await window._fb.updateProfile(result.user, { displayName });
    }
    console.log("Email sign-up success:", result.user.email);
  } catch (err) {
    console.error("Email sign-up error:", err);
    showError(friendlyError(err));
  } finally {
    showLoading(false);
  }
}

// ── Phone / SMS OTP ──

async function sendPhoneOtp(phoneNumber) {
  try {
    showLoading(true);
    clearError();

    // Set up invisible reCAPTCHA
    if (!recaptchaVerifier) {
      recaptchaVerifier = new window._fb.RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }

    const confirmationResult = await window._fb.signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    window._confirmationResult = confirmationResult;
    console.log("OTP sent to", phoneNumber);
    return true;
  } catch (err) {
    console.error("Phone OTP error:", err);
    showError(friendlyError(err));
    recaptchaVerifier = null;
    return false;
  } finally {
    showLoading(false);
  }
}

async function verifyPhoneOtp(otpCode) {
  try {
    showLoading(true);
    clearError();
    if (!window._confirmationResult) {
      showError("No OTP session found. Please request a new code.");
      return;
    }
    const result = await window._confirmationResult.confirm(otpCode);
    console.log("Phone sign-in success:", result.user.phoneNumber);
  } catch (err) {
    console.error("OTP verification error:", err);
    showError(friendlyError(err));
  } finally {
    showLoading(false);
  }
}

// ── Password Reset ──

async function resetPassword(email) {
  try {
    showLoading(true);
    clearError();
    await window._fb.sendPasswordResetEmail(auth, email);
    showSuccess("Password reset email sent. Check your inbox.");
  } catch (err) {
    console.error("Password reset error:", err);
    showError(friendlyError(err));
  } finally {
    showLoading(false);
  }
}

// ── Sign Out ──

async function logOut() {
  try {
    await window._fb.signOut(auth);
    window.location.href = "./login.html";
  } catch (err) {
    console.error("Sign-out error:", err);
  }
}

// ── UI Helpers ──

function showLoading(on) {
  document.querySelectorAll(".login-action, .complete-button, .gradient-btn").forEach((el) => {
    if (on) {
      el.dataset.originalText = el.textContent;
      el.style.opacity = "0.6";
      el.style.pointerEvents = "none";
    } else {
      el.style.opacity = "";
      el.style.pointerEvents = "";
    }
  });
}

function showError(msg) {
  let errEl = document.getElementById("auth-error");
  if (!errEl) {
    errEl = document.createElement("div");
    errEl.id = "auth-error";
    errEl.style.cssText =
      "background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);color:#ff6b6b;padding:0.65rem 1rem;border-radius:12px;font-size:0.82rem;margin-bottom:0.75rem;text-align:center;";
    const target =
      document.querySelector(".login-actions") ||
      document.querySelector(".login-form-shell") ||
      document.querySelector(".login-card");
    if (target) target.prepend(errEl);
  }
  errEl.textContent = msg;
  errEl.style.display = "block";
}

function showSuccess(msg) {
  let el = document.getElementById("auth-success");
  if (!el) {
    el = document.createElement("div");
    el.id = "auth-success";
    el.style.cssText =
      "background:rgba(92,232,255,0.1);border:1px solid rgba(92,232,255,0.3);color:#5ce8ff;padding:0.65rem 1rem;border-radius:12px;font-size:0.82rem;margin-bottom:0.75rem;text-align:center;";
    const target =
      document.querySelector(".login-actions") ||
      document.querySelector(".login-form-shell");
    if (target) target.prepend(el);
  }
  el.textContent = msg;
  el.style.display = "block";
}

function clearError() {
  const errEl = document.getElementById("auth-error");
  if (errEl) errEl.style.display = "none";
  const sucEl = document.getElementById("auth-success");
  if (sucEl) sucEl.style.display = "none";
}

function friendlyError(err) {
  const code = err?.code || "";
  const map = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Try again.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Try again.",
    "auth/invalid-phone-number": "Please enter a valid phone number with country code (e.g. +91...).",
    "auth/invalid-verification-code": "Invalid OTP code. Please try again.",
    "auth/code-expired": "OTP has expired. Please request a new one.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || err?.message || "Something went wrong. Please try again.";
}

// ── Expose to global scope for HTML onclick handlers ──

window.timenestAuth = {
  init: initFirebase,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPhoneOtp,
  verifyPhoneOtp,
  resetPassword,
  logOut,
};

// Auto-init when script loads
initFirebase().catch((err) => console.error("Firebase init failed:", err));
