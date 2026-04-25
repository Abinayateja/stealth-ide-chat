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
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

const formatTime = (ts) => {
  if (!ts?.seconds) return "";
  const d = new Date(ts.seconds * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

function initGame() {
  const colors = ["R", "G", "B", "Y"];
  let deck = [];
  colors.forEach((c) => {
    for (let i = 0; i <= 9; i++) deck.push(c + i);
    deck.push(c + "+2");
    deck.push(c + "S");
  });
  deck.push("W", "W");
  deck = deck.sort(() => Math.random() - 0.5);
  const p1 = deck.splice(0, 7);
  const p2 = deck.splice(0, 7);
  const top = deck.pop();
  return { turn: "P1", topCard: top, hands: { P1: p1, P2: p2 }, deck, log: ["[sys] game started"], winner: null };
}

function isPlayable(card, topCard) {
  if (card === "W") return true;
  if (card[0] === topCard[0]) return true;
  if (card.slice(1) === topCard.slice(1)) return true;
  return false;
}

function playCard(state, card) {
  const { topCard, turn, hands, deck, log } = state;
  if (!isPlayable(card, topCard)) return state;

  const newHands = { P1: [...hands.P1], P2: [...hands.P2] };
  newHands[turn] = newHands[turn].filter((c, i) => {
    if (c === card) { card = c; return i !== newHands[turn].indexOf(card); }
    return true;
  });
  // remove first occurrence
  const idx = hands[turn].indexOf(card);
  newHands[turn] = [...hands[turn]];
  newHands[turn].splice(idx, 1);

  let nextTurn = turn === "P1" ? "P2" : "P1";
  let newTop = card;
  const newLog = [...log];

  newLog.push("[" + turn + "] played " + card);

  if (card.includes("+2")) {
    if (deck.length >= 2) {
      newHands[nextTurn].push(deck.pop(), deck.pop());
    }
    newLog.push("[sys] " + nextTurn + " draws 2");
    nextTurn = turn;
  }

  if (card.includes("S")) {
    newLog.push("[sys] " + nextTurn + " skipped");
    nextTurn = turn;
  }

  if (card === "W") {
  const opponent = nextTurn;

  for (let i = 0; i < 4; i++) {
    if (deck.length) newHands[opponent].push(deck.pop());
  }

  newLog.push("[sys] " + opponent + " draws 4");

  const counts = { R: 0, G: 0, B: 0, Y: 0 };
  newHands[turn].forEach((c) => {
    if (counts[c[0]] !== undefined) counts[c[0]]++;
  });

  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  newTop = best + "0";

  newLog.push("[sys] color -> " + best);

  nextTurn = turn;
}

  let winner = null;
  if (newHands[turn].length === 1) {
  newLog.push("[sys] UNO! pressure on " + nextTurn);
}
  if (newHands[turn].length === 0) {
    winner = turn;
    newLog.push("[sys] " + turn + " wins");
  }
  newLog.push("[sys] next: " + nextTurn);

  return { topCard: newTop, turn: nextTurn, hands: newHands, deck, log: newLog, winner };
}

function drawCard(state) {
  const { turn, hands, deck, log } = state;
  if (deck.length === 0) return state;
  const newHands = { P1: [...hands.P1], P2: [...hands.P2] };
  const drawn = deck.pop();
  newHands[turn].push(drawn);
  const newLog = [...log, "[" + turn + "] drew a card"];
  const nextTurn = turn === "P1" ? "P2" : "P1";
  return { ...state, hands: newHands, deck, log: newLog, turn: nextTurn };
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showReal, setShowReal] = useState(false);
  const [activeFile, setActiveFile] = useState("messages.dev");
  const [clearTime, setClearTime] = useState(0);
  const [showHistory, setShowHistory] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [openTabs, setOpenTabs] = useState(["messages.dev"]);
  const bottomRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const isAtBottomRef = useRef(true);
  const lastSeenRef = useRef(null);
 const gameDocRef = doc(db, "game", "room1");
 const [selectedImage, setSelectedImage] = useState(null);
 const [mediaRecorder, setMediaRecorder] = useState(null);
const [audioChunks, setAudioChunks] = useState([]);
const [isRecording, setIsRecording] = useState(false);
const [mediaStream, setMediaStream] = useState(null);
  const [gameState, setGameState] = useState(null);

  const [fontSize, setFontSize] = useState(
    Number(localStorage.getItem("fontSize")) || 13
  );

  const USER_ID =
    localStorage.getItem("userId") || crypto.randomUUID();

  useEffect(() => {
    localStorage.setItem("userId", USER_ID);
  }, []);
  
useEffect(() => {
  const unsubscribe = onSnapshot(gameDocRef, (docSnap) => {
    if (docSnap.exists()) {
      setGameState(docSnap.data());
    }
  });

  return () => unsubscribe();
}, []);

  useEffect(() => {
    const el = document.querySelector(".editor-container");
    if (!el) return;
    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Auto-start game when game.dev tab is opened
  useEffect(() => {
  if (activeFile === "game.dev") {
    startGame();
  }
}, [activeFile]);

const startGame = async () => {
  const snap = await getDoc(gameDocRef);
  if (!snap.exists() || snap.data()?.ended) {
    await setDoc(gameDocRef, initGame());
  }
};

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("created_at")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fresh = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMessages(fresh);

      const lastMsg = fresh[fresh.length - 1];
      if (!lastMsg) return;
      if (lastMsg.sender === USER_ID) return;
      if (lastSeenRef.current === lastMsg.id) return;
      if (document.visibilityState === "visible") return;

      lastSeenRef.current = lastMsg.id;

      const favicon = document.getElementById("favicon");
      if (favicon) favicon.href = "/alert-icon.png";
      document.title = ":) .....";
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      const favicon = document.getElementById("favicon");
      if (favicon) favicon.href = "/icon-192.png";
      document.title = "R E A C T";
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        setShowReal((prev) => !prev);
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        e.stopPropagation();
        const confirmDelete = window.confirm("Delete ALL messages?");
        if (confirmDelete) deleteAllMessages();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
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
      if (file === "game.dev") setGameState(null);
      return next.length ? next : ["messages.dev"];
    });
  };

  const sendMessage = async () => {
    if (activeFile === "game.dev") return; // block chat input on game tab

    if (!input.trim() || isSending) return;
    setIsSending(true);

    const text = input;
    setInput("");

    const clientId = crypto.randomUUID();
    const tempMsg = {
      id: "temp-" + clientId,
      text,
      sender: USER_ID,
      clientId,
      created_at: { seconds: Math.floor(Date.now() / 1000) },
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      await addDoc(collection(db, "messages"), {
        text,
        sender: USER_ID,
        clientId,
        created_at: serverTimestamp(),
      });
    } catch (err) {
      console.error("SEND ERROR:", err);
    }

    setIsSending(false);
  };

  const handleGameClick = async (card) => {
  if (!gameState || gameState.winner) return;

  const newState = playCard(gameState, card);
  await setDoc(gameDocRef, newState);
};

  const handleGameDraw = async () => {
  if (!gameState || gameState.winner) return;

  const newState = drawCard(gameState);

  await setDoc(gameDocRef, newState);
};
const handleGameRestart = async () => {
  await setDoc(gameDocRef, initGame());
};
const handleImageUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "chat_upload");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dcfzrytu1/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  await addDoc(collection(db, "messages"), {
    imageUrl: data.secure_url,
    sender: USER_ID,
    created_at: serverTimestamp(),
  });
};

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  setMediaStream(stream);
  const recorder = new MediaRecorder(stream);

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      setAudioChunks((prev) => [...prev, e.data]);
    }
  };

  recorder.start();
  setMediaRecorder(recorder);
  setIsRecording(true);
};

const stopRecording = async () => {
  if (!mediaRecorder) return;

  mediaRecorder.stop();
  setIsRecording(false);

  mediaRecorder.onstop = async () => {
    const blob = new Blob(audioChunks, { type: "audio/webm" });

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "chat_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dcfzrytu1/video/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    await addDoc(collection(db, "messages"), {
      audioUrl: data.secure_url,
      sender: USER_ID,
      created_at: serverTimestamp(),
    });

    setAudioChunks([]);

    // ✅ STOP MIC HERE
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
  };
};

  const deleteAllMessages = async () => {
    setMessages([]);
    const snapshot = await getDocs(collection(db, "messages"));
    await Promise.all(snapshot.docs.map((doc) => deleteDoc(doc.ref)));
  };

  // Build game display content
  const gameContent = useMemo(() => {
    
    if (!gameState) return "";
    const g = gameState;
    const lines = [];
     if (g.ended) {
  lines.push("STATUS: ENDED");
  lines.push("RESULT: game closed");
  return lines.join("\n");
}
    lines.push("// game.dev - two player card game");
    lines.push("// --------------------------------");
    lines.push("");

    if (g.winner) {
      lines.push("STATUS: COMPLETE");
      lines.push("RESULT: " + g.winner + " wins");
      lines.push("");
      lines.push("// click [restart] below to play again");
    } else {
      lines.push("TURN:     " + g.turn);
      lines.push("TOP CARD: " + g.topCard);
      lines.push("DECK:     " + g.deck.length + " remaining");
      lines.push("");
      lines.push("-- " + g.turn + " hand --");
      const hand = g.hands[g.turn];
      const playable = hand.filter((c) => isPlayable(c, g.topCard));
      lines.push(hand.map((c) => (playable.includes(c) ? "[" + c + "]" : " " + c + " ")).join("  "));
      lines.push("");
      if (playable.length === 0) {
        lines.push("no valid plays. click [draw] below.");
      } else {
        lines.push("click a [card] above or use buttons below.");
      }
    }

    lines.push("");
    lines.push("-- log --");
    const recent = g.log.slice(-8);
    recent.forEach((l) => lines.push(l));

    return lines.join("\n");
  }, [gameState]);

  const content = useMemo(() => {
    if (activeFile === "game.dev") {
      return gameContent;
    }

    if (activeFile !== "messages.dev") {
      return mockFiles[activeFile] || "// " + activeFile + "\n// File not found";
    }

    return (
      messages
        .filter((msg) =>
          showHistory ? true : msg.created_at?.seconds * 1000 > clearTime
        )
        .map((msg, i) => {
          const isMe = msg.sender === USER_ID;
          if (msg.imageUrl) {
  return showReal
    ? `// ${isMe ? "[me]" : "[peer]"} (${formatTime(msg.created_at)}) [image]`
    : encodeMessage("[image]", i);
}
if (msg.audioUrl) {
  return showReal
    ? `// ${isMe ? "[me]" : "[peer]"} (${formatTime(msg.created_at)}) [voice]`
    : encodeMessage("[voice]", i);
}
          return showReal
  ? `// ${isMe ? "[me]" : "[peer]"} (${formatTime(msg.created_at)}) ${msg.text}`
  : encodeMessage(msg.text, i);
        })
        .join("\n\n") + "\n\n\n\n\n\n\n\n"
    );
  }, [messages, showHistory, clearTime, showReal, activeFile, gameContent]);

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

        <div className="topbar">
          <button className="menu-btn" onClick={() => setShowSidebar((p) => !p)}>
            =
          </button>
          <span className="topbar-filename">{activeFile}</span>

          <div className="controls">
            <button className="ctrl-btn danger" onClick={deleteAllMessages}>
              Wipe DB
            </button>
            <Toggle showReal={showReal} setShowReal={setShowReal} />
            <button className="ctrl-btn" onClick={() => setFontSize((f) => f - 1)}>
              A-
            </button>
            <button className="ctrl-btn" onClick={() => setFontSize((f) => f + 1)}>
              A+
            </button>
          </div>
        </div>

        <CodeEditor content={content} fontSize={fontSize} />
        <div ref={bottomRef} />

        {showReal && (
  <div className="preview-area">
    {messages.map((msg, i) =>
      msg.imageUrl ? (
        <img
          key={i}
          src={msg.imageUrl}
          onClick={() => setSelectedImage(msg.imageUrl)}
          style={{
            maxWidth: "200px",
            maxHeight: "180px",
            objectFit: "contain",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        />
      ) : msg.audioUrl ? (
        <audio
          key={i}
          controls
          src={msg.audioUrl}
          style={{
            display: "block",
            marginBottom: "10px",
            width: "200px"
          }}
        />
      ) : null
    )}
  </div>
)}

        {/* Game controls bar - replaces input bar when on game.dev */}
        {activeFile === "game.dev" && gameState ? (
          <div className="input-bar">
            {gameState.winner ? (
              <button className="send-btn" onClick={handleGameRestart}>
                restart
              </button>
            ) : (
              <>
                <div style={{ display: "flex", gap: "4px", flex: 1, flexWrap: "wrap", alignItems: "center" }}>
                  {gameState.hands[gameState.turn].map((card, i) => (
                    <button
                      key={i}
                      className={isPlayable(card, gameState.topCard) ? "send-btn" : "ctrl-btn"}
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", padding: "5px 8px" }}
                      disabled={!isPlayable(card, gameState.topCard)}
                      onClick={() => handleGameClick(card)}
                    >
                      {card}
                    </button>
                  ))}
                </div>
                <button className="ctrl-btn" onClick={handleGameDraw}>
                  draw
                </button>
                <button className="ctrl-btn danger" onClick={async () => {
  await setDoc(gameDocRef, { ...gameState, ended: true });
  setGameState(null);
}}>
  end
</button>
              </>
            )}
          </div>
        ) : (
          <div className="input-bar">
            <textarea
              rows={1}
              placeholder="> run command..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
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

            <button className="icon-btn" onClick={() => setShowInput((p) => !p)}>
              {showInput ? "hide" : "show"}
            </button>

            <input type="file" id="imgUpload" hidden onChange={handleImageUpload} />

            <button className="icon-btn" onClick={() => document.getElementById("imgUpload").click()}>
              file
            </button>
            
            <button className="send-btn" onClick={sendMessage}>
              Send
            </button>
          </div>
        )}
      </div>
      {selectedImage && (
  <div
    onClick={() => setSelectedImage(null)}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "relative"
      }}
    >
      {/* CLOSE BUTTON */}
      <span
        onClick={() => setSelectedImage(null)}
        style={{
          position: "absolute",
          top: "-10px",
          right: "-10px",
          background: "#fff",
          color: "#000",
          borderRadius: "50%",
          width: "25px",
          height: "25px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        ✕
      </span>

      {/* IMAGE */}
      <img
        src={selectedImage}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          borderRadius: "10px"
        }}
      />
    </div>
  </div>
)}
    </div>
  );
}
