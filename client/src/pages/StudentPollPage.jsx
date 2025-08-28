import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import ChatPopup from "../components/ChatPopup.jsx";

export default function StudentPollPage() {
  const [name] = useState(sessionStorage.getItem("studentName") || "Student");
  const [active, setActive] = useState(null);
  const [counts, setCounts] = useState([]);
  const [responded, setResponded] = useState(0);
  const [expected, setExpected] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [kicked, setKicked] = useState(false);

  const timerRef = useRef(null);

  // Register student on load
  useEffect(() => {
    if (name) {
      socket.emit("register", { name, role: "student" });
    }
  }, [name]);

  // Poll events
  useEffect(() => {
    const onStarted = (data) => {
      setActive(data);
      setCounts(new Array(data.options.length).fill(0));
      setResponded(0);
      setExpected(data.expected);
      setSelected(null);
      setSubmitted(false);
    };

    const onUpdate = (data) => {
      if (!active || data.pollId === active.pollId) {
        setCounts(data.counts);
        setResponded(data.responded);
        setExpected(data.expected);
      }
    };

    const onEnded = () => {
      setExpected(responded);
    };

    socket.on("poll:started", onStarted);
    socket.on("poll:update", onUpdate);
    socket.on("poll:ended", onEnded);

    return () => {
      socket.off("poll:started", onStarted);
      socket.off("poll:update", onUpdate);
      socket.off("poll:ended", onEnded);
    };
  }, [active, responded]);

  // Timer
  useEffect(() => {
    if (!active) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const secondsLeft = Math.max(
        0,
        active.expiresAtSec - Math.floor(Date.now() / 1000)
      );
      setRemaining(secondsLeft);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [active]);

  // Listen for being kicked
  useEffect(() => {
    const onKicked = () => {
      setKicked(true);
      socket.disconnect();
    };

    socket.on("chat:kicked", onKicked);
    return () => socket.off("chat:kicked", onKicked);
  }, []);

  // Submit after clicking button
  const handleSubmit = () => {
    if (!active || selected === null) return;
    socket.emit("student:submitAnswer", { optionIndex: selected });
    setSubmitted(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Kicked-out screen
  if (kicked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <button className="text-xl inline-block bg-[#5c6dc9] text-white px-3 py-1 rounded-full mb-6">
            ✦ Intervue Poll
          </button>
          <h1 className="text-4xl font-bold mb-2">You’ve been Kicked out!</h1>
          <p className="text-gray-600 text-xl">
            Looks like the teacher removed you from the poll system.
            <br />
            Please try again sometime.
          </p>
        </div>
      </div>
    );
  }

  // Main Poll UI
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      {!active ? (
        <div className="flex flex-col items-center text-center">
          <span className="text-xl inline-block bg-[#5c6dc9] text-white px-3 py-1 rounded-full mb-6">
            ✨ Intervue Poll
          </span>
          <div className="w-10 h-10 border-4 border-[#5c6dc9] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-4xl font-bold">
            Wait for the teacher to ask questions..
          </p>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          {/* Header outside card */}
          <div className="flex items-center mb-4 justify-between">
            <h3 className="font-bold text-xl">Question 1</h3>
            <span className="text-red-500 font-semibold text-xl">
              ⏱00:{remaining < 10 ? `0${remaining}` : remaining}s
            </span>
          </div>

          {/* Card containing question + options/results */}
          <div className="bg-white rounded-xl shadow-md p-6">
            {/* Question Text */}
            <p className="text-xl font-medium mb-4 bg-gray-700 text-white p-3 rounded-lg">
              {active.question}
            </p>

            {/* Before Submit → Options */}
            {!submitted ? (
              <div>
                <div className="space-y-3">
                  {active.options.map((opt, i) => (
                    <label
                      key={i}
                      className={`text-lg flex items-center px-4 py-3 rounded-lg border cursor-pointer transition w-full ${
                        selected === i
                          ? "border-[#5c6dc9] bg-purple-50"
                          : "border-gray-300 hover:bg-gray-100"
                      }`}
                      onClick={() => setSelected(i)}
                    >
                      <input
                        type="radio"
                        name="option"
                        checked={selected === i}
                        readOnly
                        className="mr-2"
                      />
                      {opt}
                    </label>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={selected === null}
                    className="text-xl px-12 mt-6 py-3 rounded-lg bg-[#5c6dc9] text-white font-medium disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              /* After Submit → Results */
              <div className="mt-6">
                {active.options.map((opt, i) => {
                  const total = counts.reduce((a, b) => a + b, 0) || 1;
                  const percent = Math.round((counts[i] / total) * 100);

                  return (
                    <div
                      key={i}
                      className="text-lg border rounded-md p-3 relative overflow-hidden mb-3 w-full"
                    >
                      {/* Progress Bar */}
                      <div
                        className="absolute top-0 left-0 h-full bg-[#5c6dc9] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>

                      {/* Content */}
                      <div className="relative flex justify-between items-center px-2">
                        <span className="flex items-center space-x-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white text-black text-sm font-medium">
                            {i + 1}
                          </span>
                          <span
                            className={`font-medium ${
                              percent > 0 ? "text-white" : "text-gray-700"
                            }`}
                          >
                            {opt}
                          </span>
                        </span>
                        <span className="font-bold">{percent}%</span>
                      </div>
                    </div>
                  );
                })}

                {/* Only show after submit */}
                <p className="mt-6 text-center font-bold text-2xl">
                  Wait for the teacher to ask a new question..
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat (hidden if kicked) */}
      <ChatPopup role="student" name={name} />
    </div>
  );
}
