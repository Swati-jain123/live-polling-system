// Teacher.jsx
import { useState, useEffect, useRef } from "react";
import { socket } from "../socket";
import PollCreator from "./PollCreator.jsx";
import PollResult from "./PollResult.jsx";

export default function Teacher() {
  const [active, setActive] = useState(null);
  const [counts, setCounts] = useState([]);
  const [pollHistory, setPollHistory] = useState([]);
  const [showCreator, setShowCreator] = useState(true);

  // Refs to store stable references to the latest state values
  const activeRef = useRef(active);
  const countsRef = useRef(counts);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);

  useEffect(() => {
    socket.emit("register", { name: "Teacher", role: "teacher" });

    const onStarted = (data) => {
      // Poll has started on server, now switch view
      setActive(data);
      setCounts(new Array(data.options.length).fill(0));
      setShowCreator(false);
    };

    const onUpdate = (data) => {
      if (activeRef.current && data.pollId === activeRef.current.pollId) {
        setCounts(data.counts);
      }
    };

    const onEnded = () => {
      const finalActive = activeRef.current;
      const finalCounts = countsRef.current;

      if (finalActive) {
        setPollHistory((prev) => [
          ...prev,
          {
            question: finalActive.question,
            options: finalActive.options,
            counts: finalCounts,
          },
        ]);
        setActive(null);
        setCounts([]);
      }
    };

    socket.on("poll:started", onStarted);
    socket.on("poll:update", onUpdate);
    socket.on("poll:ended", onEnded);

    return () => {
      socket.off("poll:started", onStarted);
      socket.off("poll:update", onUpdate);
      socket.off("poll:ended", onEnded);
    };
  }, []);

  const handleEndPoll = () => {
    socket.emit("teacher:endPoll");
  };

  const handleAskNewQuestion = () => {
    // When asking a new question, simply show the creator view
    setActive(null);
    setCounts([]);
    setShowCreator(true);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl">
        {showCreator ? (
          <PollCreator
            onPollStart={() => setShowCreator(false)}
          />
        ) : (
          <PollResult
            active={active}
            counts={counts}
            pollHistory={pollHistory}
            onEndPoll={handleEndPoll}
            onAskNewQuestion={handleAskNewQuestion}
          />
        )}
      </div>
    </div>
  );
}