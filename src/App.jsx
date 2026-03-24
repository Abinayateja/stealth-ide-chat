import { useState, useEffect, useMemo, useCallback } from "react";
import CodeEditor from "./components/Editor";
import FileExplorer from "./components/FileExplorer";
import Toggle from "./components/Toggle";
import Tabs from "./components/Tabs";
import TypingIndicator from "./components/TypingIndicator";
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
  setDoc,
  doc,
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

  const [openTabs, setOpenTabs] = useState(["messages.dev"]);
  const [peerTyping, setPeerTyping] = useState(false);
  const bottomRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const isAtBottomRef = useRef(true);

  const [fontSize, setFontSize] = useState(
    Number(localStorage.getItem("fontSize")) || 13
  );

  const USER_ID =
    localStorage.getItem("userId") || crypto.randomUUID();

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
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages((prev) => {
  const lastMsg = msgs[msgs.length - 1];

  if (lastMsg && lastMsg.sender !== USER_ID) {
  const favicon = document.getElementById("favicon");

  // 🔴 change icon
  if (favicon) {
    favicon.href = "/alert-icon.png";
  }

  // 🔥 subtle tab title
  document.title = "• T C A E R";
}

  return msgs;
});
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
  import("./firebase-messaging").then(({ initNotifications, listenMessages }) => {
    initNotifications();
    listenMessages();
  });
}, []);

  useEffect(() => {
    const typingRef = collection(db, "typing");

    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const typingUsers = snapshot.docs
        .map((doc) => doc.data())
        .filter((d) => d.userId !== USER_ID && d.isTyping);

      setPeerTyping(typingUsers.length > 0);
    });

    return () => unsubscribe();
  }, [USER_ID]);

  const updateTyping = useCallback(
    async (isTyping) => {
      try {
        await setDoc(doc(db, "typing", USER_ID), {
          userId: USER_ID,
          isTyping,
          timestamp: serverTimestamp(),
        });
      } catch {}
    },
    [USER_ID]
  );

  useEffect(() => {
    if (!input) return;

    updateTyping(true);
    const timer = setTimeout(() => updateTyping(false), 1500);

    return () => clearTimeout(timer);
  }, [input, updateTyping]);

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
  if (!input) return;

  const text = input;
  setInput("");

  await addDoc(collection(db, "messages"), {
    text,
    sender: USER_ID,
    created_at: new Date(),
  });

  // 🔥 FORCE SCROLL AFTER SENDING
  setTimeout(() => {
    const el = document.querySelector(".editor-container");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, 100);

  updateTyping(false);
};

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      await addDoc(collection(db, "messages"), {
        image: reader.result,
        sender: USER_ID,
        created_at: new Date(),
      });

      e.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const deleteAllMessages = async () => {
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
          : new Date(msg.created_at).getTime() > clearTime
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
          <TypingIndicator visible={peerTyping} />

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
    if (e.key === "Enter" && !e.shiftKey) {
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