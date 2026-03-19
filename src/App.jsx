import { useState, useEffect, useMemo } from "react";
import CodeEditor from "./components/Editor";
import FileExplorer from "./components/FileExplorer";
import Toggle from "./components/Toggle";
import { encodeMessage } from "./utils/encodeDecode";
import { supabase } from "./utils/supabaseClient";

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

  // 🔥 Realtime (OPTIMIZED)
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("realtime-messages")
      .on(
  "postgres_changes",
  { event: "INSERT", schema: "public", table: "messages" },
  (payload) => {
    setMessages((prev) => {
      const exists = prev.some(
        (msg) =>
          msg.text === payload.new.text &&
          msg.sender === payload.new.sender
      );

      if (exists) return prev;

      return [...prev.slice(-49), payload.new];
    });
  }
)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🔹 Persist UI state
  useEffect(() => {
    localStorage.setItem("clearTime", clearTime);
  }, [clearTime]);

  useEffect(() => {
    const saved = localStorage.getItem("clearTime");
    if (saved) setClearTime(Number(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("showHistory", showHistory);
  }, [showHistory]);

  useEffect(() => {
    const saved = localStorage.getItem("showHistory");
    if (saved !== null) setShowHistory(saved === "true");
  }, []);

  // 🔥 FETCH (LIMITED)
  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(50);

    setMessages(data || []);
  };

  const sendMessage = async () => {
  if (!input) return;

  const tempMsg = {
    id: Date.now(),
    text: input,
    sender: USER_ID,
    created_at: new Date().toISOString(),
  };

  setMessages((prev) => [...prev.slice(-49), tempMsg]); // fixed

  setInput("");

  const { error } = await supabase.from("messages").insert([
    {
      text: tempMsg.text,
      sender: USER_ID,
    },
  ]);

  if (error) {
    console.error("Send failed:", error);
  }
};

  // 🧨 HARD DELETE
  const deleteAllMessages = async () => {
    const confirm1 = confirm("Delete ALL messages permanently?");
    if (!confirm1) return;

    const confirm2 = prompt("Type DELETE to confirm");
    if (confirm2 !== "DELETE") return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .neq("id", 0);

    if (error) {
      console.error("Delete error:", error);
    } else {
      setMessages([]);
      alert("All messages deleted");
    }
  };

  // 🚀 OPTIMIZED CONTENT GENERATION
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