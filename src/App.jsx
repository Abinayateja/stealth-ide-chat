import { useState, useEffect, useMemo } from "react";
import CodeEditor from "./components/Editor";
import FileExplorer from "./components/FileExplorer";
import Toggle from "./components/Toggle";
import { encodeMessage } from "./utils/encodeDecode";
import { db } from "./utils/firebaseClient";
import { getDocs, deleteDoc } from "firebase/firestore";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showReal, setShowReal] = useState(false);
  const [activeFile, setActiveFile] = useState("messages.dev");
  const [clearTime, setClearTime] = useState(0);
  const [showHistory, setShowHistory] = useState(true);

  const [fontSize, setFontSize] = useState(
    Number(localStorage.getItem("fontSize")) || 13
  );

  const USER_ID =
    localStorage.getItem("userId") || crypto.randomUUID();

  useEffect(() => {
    localStorage.setItem("userId", USER_ID);
  }, []);

  // 🔥 Firebase Realtime
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
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!input) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: input,
        sender: USER_ID,
        created_at: new Date(),
      });

      setInput("");
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const deleteAllMessages = async () => {
  const confirm1 = confirm("Delete ALL messages permanently?");
  if (!confirm1) return;

  const confirm2 = prompt("Type DELETE to confirm");
  if (confirm2 !== "DELETE") return;

  try {
    const snapshot = await getDocs(collection(db, "messages"));

    const deletions = snapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );

    await Promise.all(deletions);

    alert("All messages deleted");
  } catch (err) {
    console.error("Delete failed:", err);
  }
};

  const content = useMemo(() => {
    if (activeFile !== "messages.dev") {
      return `// ${activeFile}
function demo() {
  console.log("Working...");
}`;
    }

    return messages
      .filter((msg) => {
        if (showHistory) return true;
        return new Date(msg.created_at).getTime() > clearTime;
      })
      .map((msg, i) => {
        const isMe = msg.sender === USER_ID;

        return showReal
          ? `// ${isMe ? "[me]" : "[peer]"} ${msg.text}`
          : encodeMessage(msg.text, i);
      })
      .join("\n\n");
  }, [messages, showHistory, clearTime, showReal, activeFile]);

  return (
    <div className="app">
      <FileExplorer setActiveFile={setActiveFile} />

      <div className="main">
        <div className="topbar">
          <span>{activeFile}</span>

          <div className="controls">
            <button onClick={() => setFontSize((f) => Math.max(10, f - 1))}>
              A-
            </button>
            <button onClick={() => setFontSize((f) => Math.min(24, f + 1))}>
              A+
            </button>

            <button onClick={() => setClearTime(Date.now())}>
              Reset Logs
            </button>

            <button onClick={() => setShowHistory((prev) => !prev)}>
              {showHistory ? "Hide History" : "Show History"}
            </button>
            <button
              onClick={deleteAllMessages}
              style={{ color: "#ff4d4f" }}
            >
              Wipe DB
            </button>

            <Toggle showReal={showReal} setShowReal={setShowReal} />
          </div>
        </div>

        <CodeEditor content={content} fontSize={fontSize} />

        <div className="inputBar">
          <input
            type="password"
            placeholder="> run command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}