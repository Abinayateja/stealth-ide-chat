// Realistic mock file contents for the fake IDE explorer

const mockFiles = {
  "App.jsx": `import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import "./App.css";

export default function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Header theme={theme} setTheme={setTheme} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}`,

  "Header.jsx": `import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Header({ theme, setTheme }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/messages", label: "Messages", icon: "💬" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  const isActive = (path) =>
    location.pathname === path ? "nav-active" : "";

  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="brand-icon">⚡</span>
        <span className="brand-name">DevChat</span>
      </div>

      <nav className={\`header-nav \${menuOpen ? "open" : ""}\`}>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={\`nav-link \${isActive(link.path)}\`}
            onClick={() => setMenuOpen(false)}
          >
            {link.icon} {link.label}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        <button
          className="theme-toggle"
          onClick={() =>
            setTheme(theme === "dark" ? "light" : "dark")
          }
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {user ? (
          <div className="user-menu">
            <span className="user-avatar">
              {user.email?.[0]?.toUpperCase()}
            </span>
            <button onClick={signOut}>Sign Out</button>
          </div>
        ) : (
          <Link to="/login" className="login-btn">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}`,

  "AuthContext.jsx": `import { createContext, useContext, useState, useEffect } from "react";
import { db } from "../utils/firebaseClient";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";

const AuthContext = createContext(undefined);

const auth = getAuth();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(
        auth, email, password
      );
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email, password, displayName) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(
        auth, email, password
      );
      if (displayName) {
        await firebaseUpdateProfile(result.user, { displayName });
      }
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (updates) => {
    if (auth.currentUser) {
      await firebaseUpdateProfile(auth.currentUser, updates);
      setUser({ ...auth.currentUser });
    }
  };

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <p>Authenticating...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        error,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}`,

  "Editor.jsx": `import Editor from "@monaco-editor/react";
import { useState, useRef, useCallback } from "react";

export default function DevEditor({ content, fontSize, language }) {
  const editorRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState({
    line: 1,
    column: 1,
  });

  const handleMount = useCallback((editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Register custom keybindings
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => console.log("[DevEditor] Save triggered")
    );
  }, []);

  const getLanguage = (filename) => {
    if (!filename) return "javascript";
    if (filename.endsWith(".jsx")) return "javascript";
    if (filename.endsWith(".tsx")) return "typescript";
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".md")) return "markdown";
    return "plaintext";
  };

  return (
    <div className="editor-wrapper">
      <Editor
        height="100%"
        defaultLanguage={language || "javascript"}
        value={content}
        theme="vs-dark"
        options={{
          readOnly: true,
          fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: true, scale: 2 },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          renderLineHighlight: "all",
          cursorStyle: "line",
          padding: { top: 16 },
          smoothScrolling: true,
          cursorSmoothCaretAnimation: "on",
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
        onMount={handleMount}
      />
      <div className="editor-statusbar">
        <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
        <span>UTF-8</span>
        <span>JavaScript JSX</span>
      </div>
    </div>
  );
}`,

  "Toggle.jsx": `import { useState, useEffect } from "react";

export default function DevToggle({ showReal, setShowReal }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  }, [showReal]);

  return (
    <div className="toggle-container">
      <span className={!showReal ? "toggle-active" : ""}>
        Code
      </span>
      <input
        type="checkbox"
        className={\`toggle-switch \${animate ? "toggling" : ""}\`}
        checked={showReal}
        onChange={() => setShowReal(!showReal)}
        aria-label="Toggle between code and real view"
      />
      <span className={showReal ? "toggle-active" : ""}>
        Real
      </span>
    </div>
  );
}`,

  "FileExplorer.jsx": `import { useState, useMemo } from "react";

const FILE_ICONS = {
  jsx: "⚛️",
  js: "📜",
  css: "🎨",
  json: "📋",
  md: "📝",
  env: "🔒",
  dev: "💬",
  default: "📄",
};

function getIcon(filename) {
  const ext = filename.split(".").pop();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}

export default function DevFileExplorer({
  tree,
  activeFile,
  setActiveFile,
  openTabs,
  onOpenTab,
}) {
  const [collapsed, setCollapsed] = useState({});

  const toggleFolder = (folderName) => {
    setCollapsed((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const renderTree = (items, depth = 0) => {
    return items.map((item, i) => {
      const isFolder = item.type === "folder";
      const isOpen = !collapsed[item.name];
      const isActive = activeFile === item.name;
      const indent = depth * 16;

      return (
        <div key={item.name + i}>
          <div
            className={\`tree-item \${isActive ? "active" : ""}\`}
            style={{ paddingLeft: indent + 12 }}
            onClick={() => {
              if (isFolder) {
                toggleFolder(item.name);
              } else {
                setActiveFile(item.name);
                onOpenTab?.(item.name);
              }
            }}
          >
            <span className="tree-icon">
              {isFolder
                ? isOpen ? "▾" : "▸"
                : getIcon(item.name)}
            </span>
            <span className="tree-label">{item.name}</span>
          </div>
          {isFolder && isOpen && item.children && (
            renderTree(item.children, depth + 1)
          )}
        </div>
      );
    });
  };

  return (
    <aside className="file-explorer">
      <div className="explorer-header">
        <span className="explorer-title">EXPLORER</span>
      </div>
      <div className="explorer-section">
        <span className="section-label">PROJECT-ALPHA</span>
      </div>
      <div className="file-tree">
        {renderTree(tree)}
      </div>
    </aside>
  );
}`,

  "encodeDecode.js": `/**
 * Message encoding utilities for DevChat
 * Converts plain text into hex-encoded "code" format
 * to disguise chat messages as source code
 */

export function encodeMessage(text, index) {
  const encoded = text
    .split("")
    .map((c) => \`\\\\x\${c.charCodeAt(0).toString(16).padStart(2, "0")}\`)
    .join("");
  return \`const msg_\${index} = "\${encoded}";\`;
}

export function decodeMessage(encoded) {
  return encoded.replace(/\\\\x([0-9a-f]{2})/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

export function encodeImage(base64, index) {
  const hash = base64.slice(-8);
  return \`// asset_\${index}_\${hash} [binary]\`;
}

export function generateTimestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

export function formatSender(senderId, currentUserId) {
  return senderId === currentUserId ? "local" : "remote";
}`,

  "firebaseClient.js": `/**
 * Firebase Client Configuration
 * Initializes Firebase app and exports Firestore instance
 */
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore with offline persistence
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Persistence failed: multiple tabs open");
  } else if (err.code === "unimplemented") {
    console.warn("Persistence not available in this browser");
  }
});

// Auth
export const auth = getAuth(app);

// Storage
export const storage = getStorage(app);

// Analytics (only in production)
export let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export default app;`,

  "helpers.js": `/**
 * General helper utilities
 */

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit = 100) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = now - d;

  if (diff < 60000) return "just now";
  if (diff < 3600000) return \`\${Math.floor(diff / 60000)}m ago\`;
  if (diff < 86400000) return \`\${Math.floor(diff / 3600000)}h ago\`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str, maxLen = 50) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function generateId(prefix = "id") {
  return \`\${prefix}_\${Date.now().toString(36)}_\${Math.random()
    .toString(36)
    .slice(2, 8)}\`;
}

export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}`,

  "App.css": `/* ═══════════════════════════════════════
   DevChat — Application Styles
   ═══════════════════════════════════════ */

.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--background);
  color: var(--foreground);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.brand-icon {
  font-size: 18px;
}

/* Navigation */
.header-nav {
  display: flex;
  gap: 4px;
}

.nav-link {
  padding: 6px 12px;
  border-radius: 6px;
  color: var(--muted-foreground);
  text-decoration: none;
  font-size: 13px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: var(--secondary);
  color: var(--text-bright);
}

.nav-link.nav-active {
  background: var(--primary) / 0.12;
  color: var(--primary);
}

/* Responsive */
@media (max-width: 768px) {
  .header-nav {
    display: none;
  }

  .header-nav.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 48px;
    left: 0;
    right: 0;
    background: var(--surface-elevated);
    padding: 8px;
    border-bottom: 1px solid var(--border);
  }
}`,

  "index.css": `@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap");

:root {
  --background: 228 12% 10%;
  --foreground: 220 13% 78%;
  --primary: 210 100% 56%;
  --accent: 270 70% 65%;
  --border: 228 10% 20%;
  --surface-glass: 228 12% 14%;
  --surface-elevated: 228 12% 16%;
  --text-bright: 220 20% 92%;
  --text-dim: 220 8% 42%;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Inter", system-ui, sans-serif;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 999px;
}`,

  "main.js": `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  ".env": `# ═══════════════════════════════════════
# Environment Variables — DO NOT COMMIT
# ═══════════════════════════════════════

VITE_FIREBASE_API_KEY=AIzaSy********************
VITE_FIREBASE_AUTH_DOMAIN=project-alpha.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-alpha
VITE_FIREBASE_STORAGE_BUCKET=project-alpha.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PERSISTENCE=true
VITE_MAX_MESSAGES=50`,
};

export default mockFiles;
