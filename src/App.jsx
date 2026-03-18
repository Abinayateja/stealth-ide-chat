import { useState, useEffect } from "react";
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

  // 🔥 Realtime
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        async () => {
          await fetchMessages();
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

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!input) return;

    await supabase.from("messages").insert([
      {
        text: input,
        sender: USER_ID,
      },
    ]);

    setInput("");
  };

  // 🧨 HARD DELETE (DB WIPE)
  const deleteAllMessages = async () => {
    const confirm1 = confirm("Delete ALL messages permanently?");
    if (!confirm1) return;

    const confirm2 = prompt("Type DELETE to confirm");
    if (confirm2 !== "DELETE") return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .neq("id", 0); // deletes all rows

    if (error) {
      console.error("Delete error:", error);
    } else {
      setMessages([]); // instant UI clear
      alert("All messages deleted");
    }
  };

  // 🔥 FILTER LOGIC
  const generateContent = () => {
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
          : encodeMessage(msg.text, i, msg.sender);
      })
      .join("\n\n");
  };

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

            {/* 🧼 UI CLEAR */}
            <button onClick={() => setClearTime(Date.now())}>
              Reset Logs
            </button>

            {/* 📜 HISTORY */}
            <button onClick={() => setShowHistory((prev) => !prev)}>
              {showHistory ? "Hide History" : "Show History"}
            </button>

            {/* 🧨 HARD DELETE */}
            <button
              onClick={deleteAllMessages}
              style={{ color: "#ff4d4f" }}
            >
              Wipe DB
            </button>

            <Toggle showReal={showReal} setShowReal={setShowReal} />
          </div>
        </div>

        <CodeEditor content={generateContent()} fontSize={fontSize} />

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