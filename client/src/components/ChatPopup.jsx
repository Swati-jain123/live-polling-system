import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

export default function ChatPopup({ role, name }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState("chat");
  const listRef = useRef(null);
  const [unread, setUnread] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [kicked, setKicked] = useState(false);

  // ✅ Listen for chat messages
  useEffect(() => {
    const handler = (data) => {
      setMessages((prev) => [...prev, data]);
      if (!open) setUnread((u) => u + 1);
    };
    socket.on("chat:message", handler);
    return () => socket.off("chat:message", handler);
  }, [open]);

  // ✅ Listen for participant list updates
  useEffect(() => {
    const handler = (list) => setParticipants(list);
    socket.on("chat:participants", handler);
    return () => socket.off("chat:participants", handler);
  }, []);

  // ✅ Listen for being kicked
  useEffect(() => {
    const handler = () => {
      setKicked(true);
      socket.disconnect();
    };
    socket.on("chat:kicked", handler);
    return () => socket.off("chat:kicked", handler);
  }, []);

  // ✅ Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    socket.emit("chat:message", { sender: name, message: text, role });
    setInput("");
  };

  const kickUser = (user) => {
    if (role === "teacher" || role === "admin") {
      socket.emit("chat:kick", user);
    }
  };

  // ✅ Show "Kicked Out" UI
  if (kicked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <button className="px-4 py-2 bg-[#5c6dc9] text-white rounded-full mb-6">
            ✦ Intervue Poll
          </button>
          <h1 className="text-4xl font-bold mb-2">You’ve been Kicked out!</h1>
          <p className="text-xl text-gray-600">
            Looks like the teacher removed you from the poll system.
            <br />
            Please try again sometime.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Normal Chat UI
  return (
    <div className="fixed right-5 bottom-5 z-50">
      {/* Floating Chat Button */}
      <button
        onClick={() => {
          if (!kicked) setOpen(!open);
          setUnread(0);
        }}
        className="bg-[#5c6dc9] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#4a58a3] flex items-center"
      >
        💬
        {unread > 0 && !kicked && (
          <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-14 right-0 bg-white rounded-xl shadow-lg w-96 overflow-hidden border border-gray-300 h-96">
          {/* Header Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 p-2 text-center font-medium ${
                activeTab === "chat"
                  ? "border-b-2 border-purple-600 text-black"
                  : "text-gray-600"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`flex-1 p-2 text-center font-medium ${
                activeTab === "participants"
                  ? "border-b-2 border-purple-600 text-black"
                  : "text-gray-600"
              }`}
            >
              Participants
            </button>
          </div>

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-80">
              <div ref={listRef} className="flex-1 overflow-y-auto p-3 bg-gray-50">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`mb-3 ${
                      m.sender === name ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`text-xs mb-1 ${
                        m.sender === name ? "text-purple-600" : "text-blue-600"
                      }`}
                    >
                      {m.sender}
                    </div>
                    <div
                      className={`inline-block px-3 py-2 rounded-lg ${
                        m.sender === name
                          ? "bg-purple-500 text-white"
                          : "bg-gray-600 text-white"
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex border-t p-2">
                <input
                  className="flex-1 border rounded-full px-3 py-2 text-base outline-none"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
                />
                <button
                  onClick={send}
                  className="ml-2 bg-[#5c6dc9] text-white px-4 rounded-full hover:bg-purple-700"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === "participants" && (
            <div className="font-bold p-3 h-80 overflow-y-auto">
              {participants.length === 0 ? (
                <p className="text-gray-500">No participants yet.</p>
              ) : (
                <>
                     <div className="flex justify-between items-center border-b pb-2 mb-2 mx-2">
        <span className="text-gray-600 font-semibold">Name</span>
        {(role === "teacher" || role === "admin") && (
          <span className="text-gray-600 font-semibold text-base">Action</span>
        )}
      </div>

                  {participants.map((user, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b"
                    >
                      <span className="text-gray-700">{user}</span>

                      {(role === "teacher" || role === "admin") && (

                        <button
                          onClick={() => kickUser(user)}
                          className="text-lg text-blue-500 hover:underline text-base font-medium"
                        >
                          Kick out
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
