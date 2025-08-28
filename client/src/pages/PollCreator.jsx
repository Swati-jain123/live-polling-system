// PollCreator.jsx
import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function PollCreator({ onPollStart }) {
  const [name] = useState("Teacher");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(null);
  const [durationSec, setDurationSec] = useState(60);

  useEffect(() => {
    socket.emit("register", { name, role: "teacher" });
  }, [name]);

  const addOption = () => setOptions((prev) => [...prev, ""]);

  const updateOption = (i, v) =>
    setOptions((prev) => prev.map((opt, idx) => (idx === i ? v : opt)));

  const removeOption = (i) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    if (correctOptionIndex === i) {
      setCorrectOptionIndex(null);
    } else if (correctOptionIndex > i) {
      setCorrectOptionIndex((prev) => prev - 1);
    }
  };

  const startPoll = () => {
    const trimmed = options.map((opt) => opt.trim());
    const cleaned = trimmed.filter(Boolean);

    if (!question.trim() || cleaned.length < 2) {
      return alert("Enter a valid question and at least 2 options.");
    }

    if (
      correctOptionIndex === null ||
      !trimmed[correctOptionIndex] ||
      correctOptionIndex >= cleaned.length
    ) {
      return alert("Mark one valid option as correct.");
    }

    socket.emit("teacher:createPoll", {
      question: question.trim(),
      options: cleaned,
      correctIndex: correctOptionIndex,
      durationSec: Number(durationSec) || 60,
    });
    
    // ✅ Add this line to signal to the parent component that the poll has started.
    // This triggers the view change in Teacher.jsx.
    if (onPollStart) {
      onPollStart();
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-left mb-8">
          <span className="text-xl inline-block bg-[#5c6dc9] text-white text-xs px-3 py-1 rounded-full mb-3">
            ✦ Intervue Poll
          </span>
          <h1 className="text-4xl font-semibold">
            Let’s <span className="font-bold">Get Started</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            You’ll have the ability to create and manage polls, ask questions,
            and monitor your students’ responses in real-time.
          </p>
        </div>

        {/* Poll Creation Form */}
        <div className="text-xl bg-gray-50 border rounded-xl shadow p-6">
          {/* Question Input */}
          <div className="mb-6 flex justify-between items-center">
            <label className="text-xl font-medium">
              Enter your question
            </label>

            {/* Duration dropdown on the right */}
            <select
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="border rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {[30, 60, 90, 120].map((d) => (
                <option key={d} value={d}>
                  {d} seconds
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={100}
            placeholder="Type your question..."
            className="w-full h-24 border rounded-md px-4 py-2 bg-white focus:ring-2 focus:ring-purple-500 outline-none mb-2"
          />
          <div className="text-right text-sm text-gray-400 mb-4">
            {question.length}/100
          </div>

          {/* Options List */}
          <div className="mb-4">
            <div className="text-lg flex justify-between items-center mb-2">
              <span className="font-medium">Edit Options</span>
              <span className="font-medium">Is it Correct?</span>
            </div>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-4 mb-3">
                <span className="w-6 h-6 flex items-center justify-center bg-purple-600 text-white rounded-full text-sm">
                  {i + 1}
                </span>

                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />

                {/* ✅ Yes / No Selection */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer text-lg">
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={correctOptionIndex === i}
                      onChange={() => setCorrectOptionIndex(i)}
                    />
                    <span className="select-none">Yes</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={correctOptionIndex !== i}
                      onChange={() => setCorrectOptionIndex(null)}
                    />
                    <span className="text-sm select-none">No</span>
                  </label>
                </div>

                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(i)}
                    className="text-red-500 text-sm font-medium"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addOption}
              className="mt-2 text-lg text-purple-600 font-medium hover:underline border border-black p-2 rounded-lg"
            >
              + Add More option
            </button>
          </div>
          
          {/* Start Button */}
          <div className="flex justify-end">
            <button
              onClick={startPoll}
              className="px-12 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-full font-medium shadow hover:opacity-90 transition"
            >
              Ask Question
            </button>
          </div>
        </div>

        <p className="text-gray-400 text-xs text-center mt-6">
          New polls can be started only when there is no active poll.
        </p>
      </div>
    </div>
  );
}