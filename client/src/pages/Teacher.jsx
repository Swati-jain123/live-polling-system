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
  const [creatorKey, setCreatorKey] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);

  const activeRef = useRef(active);
  const countsRef = useRef(counts);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { countsRef.current = counts; }, [counts]);

  useEffect(() => {
    socket.emit("register", { name: "Teacher", role: "teacher" });

    const onStarted = (data) => {
      setActive(data);
      setCounts(new Array(data.options.length).fill(0));
      setShowCreator(false);
      setShowResults(true);
    };

    const onUpdate = (data) => {
      if (activeRef.current && data.pollId === activeRef.current.pollId) {
        setCounts(data.counts);
      }
    };

    const onEnded = (data) => {
      // This is the core change: we use a temporary listener to get the final state.
      // This listener handles both timeout and manual ends.
      if (activeRef.current && data.pollId === activeRef.current.pollId) {
        // Save the final, correct state to history
        setPollHistory((prev) => [
          ...prev,
          {
            question: activeRef.current.question,
            options: activeRef.current.options,
            counts: data.counts, // Use the final counts from the server
          },
        ]);
      }
      setActive(null);
      setShowCreator(true);
      setShowResults(false);
      setCreatorKey(Date.now());
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
    // The view change logic is now handled by the onEnded event listener.
  };

  const handleAskNewQuestion = () => {
    // We can directly call end poll here, and the onEnded listener will
    // handle the state update and view change.
    if (active) {
      socket.emit("teacher:endPoll");
    } else {
      // If there's no active poll, just switch to creator view
      setShowCreator(true);
      setCreatorKey(Date.now());
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl">
        {showCreator ? (
          <PollCreator
            key={creatorKey}
            onPollStart={() => setShowCreator(false)}
          />
        ) : (
          <PollResult
            active={active}
            counts={counts}
            pollHistory={pollHistory}
            showResults={showResults}
            onEndPoll={handleEndPoll}
            onAskNewQuestion={handleAskNewQuestion}
          />
        )}
      </div>
    </div>
  );
}