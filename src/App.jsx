import { useState, useEffect, useMemo } from "react";
import CodeEditor from "./components/Editor";
import FileExplorer from "./components/FileExplorer";
import Toggle from "./components/Toggle";
import Tabs from "./components/Tabs";
import mockFiles from "./utils/mockFiles";

import { encodeMessage } from "./utils/encodeDecode";
import { db } from "./utils/firebaseClient";
import { useRef } from "react";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showReal, setShowReal] = useState(false);
  const [activeFile, setActiveFile] = useState("messages.dev");
  const [clearTime, setClearTime] = useState(0);
  const [showHistory, setShowHistory] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [openTabs, setOpenTabs] = useState(["messages.dev"]);
  const bottomRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const isAtBottomRef = useRef(true);
  const lastSeenRef = useRef(null);

  const [fontSize, setFontSize] = useState(
    Number(localStorage.getItem("fontSize")) || 13
  );

  const USER_ID =
    localStorage.getItem("userId") || crypto.randomUUID();

    useEffect(() => {
  console.log("🔥 USER_ID:", USER_ID);
}, []);

  useEffect(() => {
    localStorage.setItem("userId", USER_ID);
  }, []);

  useEffect(() => {
  const el = document.querySelector(".editor-container");
  if (!el) return;

  if (isAtBottomRef.current) {
    el.scrollTop = el.scrollHeight;
  }
}, [messages]);

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("created_at"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
  const fresh = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  setMessages(fresh);

  const lastMsg = fresh[fresh.length - 1];

if (!lastMsg) return;

// ignore own message
if (lastMsg.sender === USER_ID) return;

// ignore already seen
if (lastSeenRef.current === lastMsg.id) return;

// ignore if tab is active
if (document.visibilityState === "visible") return;

// new message detected
lastSeenRef.current = lastMsg.id;

const favicon = document.getElementById("favicon");
if (favicon) favicon.href = "/alert-icon.png";

document.title = "•••••••••";
});

    return () => unsubscribe();
  }, []);

  useEffect(() => {
  const handleFocus = () => {
    const favicon = document.getElementById("favicon");

    if (favicon) {
      favicon.href = "/icon-192.png";
    }

    document.title = "R E A C T";
  };

  window.addEventListener("focus", handleFocus);

  return () => window.removeEventListener("focus", handleFocus);
}, []);

  // 🔥 KEYBOARD SHORTCUTS
useEffect(() => {
  const handler = (e) => {
    // 🚫 Ignore if user is typing in input/textarea/contentEditable
    const tag = e.target.tagName;
    const isTypingField =
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      e.target.isContentEditable;

    // ✅ Allow Ctrl+ArrowLeft EVEN inside input (your requirement)
    if (e.ctrlKey && e.key === "ArrowLeft") {
      e.preventDefault();
      e.stopPropagation(); // 🔥 important
      setShowReal((prev) => !prev);
      return;
    }

    // ❌ Block dangerous delete if typing (optional safety)
    if (
      e.ctrlKey &&
      e.shiftKey &&
      e.key.toLowerCase() === "x"
    ) {
      e.preventDefault();
      e.stopPropagation();

      const confirmDelete = window.confirm("Delete ALL messages?");
      if (confirmDelete) {
        deleteAllMessages();
      }
    }
  };

  // 🔥 KEY CHANGE: use capture phase
  window.addEventListener("keydown", handler, true);

  return () =>
    window.removeEventListener("keydown", handler, true);
}, []);

  const handleOpenTab = (file) => {
    setOpenTabs((prev) =>
      prev.includes(file) ? prev : [...prev, file]
    );
  };


  const handleCloseTab = (file) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== file);

      if (activeFile === file) {
        setActiveFile(next[next.length - 1] || "messages.dev");
      }

      return next.length ? next : ["messages.dev"];
    });
  };

 const sendMessage = async () => {
  if (!input.trim() || isSending) return;

  setIsSending(true);

  const text = input;
  setInput("");

  const clientId = crypto.randomUUID(); // 🔥 KEY

  const tempMsg = {
    id: "temp-" + clientId,
    text,
    sender: USER_ID,
    clientId, // 🔥 important
    created_at: { seconds: Math.floor(Date.now() / 1000) }
  };

  setMessages(prev => [...prev, tempMsg]);

  try {
    await addDoc(collection(db, "messages"), {
      text,
      sender: USER_ID,
      clientId, // 🔥 send to firestore
      created_at: serverTimestamp(),
    });
  } catch (err) {
    console.error("SEND ERROR:", err);
  }

  setIsSending(false);
};

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      await addDoc(collection(db, "messages"), {
        image: reader.result,
        sender: USER_ID,
        created_at: serverTimestamp(),
      });

      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const deleteAllMessages = async () => {
  // ⚡ instant UI clear
  setMessages([]);

  const snapshot = await getDocs(collection(db, "messages"));
  await Promise.all(snapshot.docs.map((doc) => deleteDoc(doc.ref)));
};

  const content = useMemo(() => {
    if (activeFile !== "messages.dev") {
  return mockFiles[activeFile] || `// ${activeFile}\n// File not found`;
}

    return messages
      .filter((msg) =>
        showHistory
          ? true
          : msg.created_at?.seconds * 1000 > clearTime
      )
      .map((msg, i) => {
        const isMe = msg.sender === USER_ID;

        if (msg.image) {
          return showReal
            ? `<img src="${msg.image}" style="max-width:200px;border-radius:6px;" />`
            : `// 📦 image_${i}`;
        }

        return showReal
          ? `// ${isMe ? "[me]" : "[peer]"} ${msg.text}`
          : encodeMessage(msg.text, i);
      })
      .join("\n\n") + "\n\n\n\n\n\n\n\n";
  }, [messages, showHistory, clearTime, showReal, activeFile]);

  return (
    <div className="app-container">
      <FileExplorer
      className={showSidebar ? "sidebar open" : "sidebar"}
        setActiveFile={(f) => {
          setActiveFile(f);
          handleOpenTab(f);
        }}
      />

      <div className="main-area">
        <Tabs
          tabs={openTabs}
          activeFile={activeFile}
          setActiveFile={setActiveFile}
          onCloseTab={handleCloseTab}
        />

        {/* ✅ FIXED TOPBAR */}
        <div className="topbar">
          <button className="menu-btn" onClick={() => setShowSidebar(p => !p)}>☰</button>
          <span className="topbar-filename">{activeFile}</span>
          

          <div className="controls">
            
            <button className="ctrl-btn danger" onClick={deleteAllMessages}>
              Wipe DB
            </button>
            <Toggle showReal={showReal} setShowReal={setShowReal} />
            <button className="ctrl-btn" onClick={() => setFontSize((f) => f - 1)}>A−</button>
            <button className="ctrl-btn" onClick={() => setFontSize((f) => f + 1)}>A+</button>
          </div>
        </div>

        <CodeEditor content={content} fontSize={fontSize} />
        <div ref={bottomRef} />

        {showReal && (
          <div className="preview-area">
            {messages.map((msg, i) =>
              msg.image ? <img key={i} src={msg.image} /> : null
            )}
          </div>
        )}

        {/* ✅ FIXED INPUT BAR */}
        <div className="input-bar">

          <textarea
  rows={1}
  placeholder="> run command..."
  value={input}
  onChange={(e) => {
    setInput(e.target.value);

    // 🔥 AUTO RESIZE
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }}
  onKeyDown={(e) => {
  if (e.key === "Enter" && !e.shiftKey && !isSending) {
    e.preventDefault();
    sendMessage();
  }
}}
/>

          <button
            className="icon-btn"
            onClick={() => setShowInput((p) => !p)}
          >
            {showInput ? "🙈" : "👁️"}
          </button>

          <input
            type="file"
            id="imgUpload"
            hidden
            onChange={handleImageUpload}
          />

          <button
            className="icon-btn"
            onClick={() =>
              document.getElementById("imgUpload").click()
            }
          >
            📎
          </button>

          <button className="send-btn" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}