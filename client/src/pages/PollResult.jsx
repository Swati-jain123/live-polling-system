import { useState } from "react";
import ChatPopup from "../components/ChatPopup.jsx";

function PollResultCard({ question, options, counts }) {
  const total = counts.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="mb-4"> 
      <h3 className="text-xl font-medium bg-gray-700 p-2 text-white rounded-lg mb-4">
        {question}
      </h3>

      {options.map((opt, i) => {
        const value = counts[i] ?? 0;
        const percent = Math.round((value / total) * 100);

        return (
          <div
            key={i}
            className="text-xl border rounded-md p-3 relative overflow-hidden mb-2"
          >
            <div
              className="absolute top-0 left-0 h-full bg-[#5c6dc9] transition-all duration-500"
              style={{ width: `${percent}%` }}
            ></div>

            <div className="relative flex justify-between items-center px-2">
              <span className="flex items-center space-x-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-sm font-medium">
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
    </div>
  );
}

export default function PollResult({ active, counts, pollHistory, onAskNewQuestion, onEndPoll }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Question</h2>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="bg-[#5c6dc9] text-white px-12 py-4 rounded-full text-lg font-medium shadow hover:bg-purple-600"
        >
          {showHistory ? "Back to Active Poll" : "View Poll History"}
        </button>
      </div>

      <div className="bg-gray-50 border rounded-xl shadow p-6">
        {!showHistory ? (
          active ? (
            <PollResultCard
              question={active.question}
              options={active.options}
              counts={counts}
            />
          ) : (
            <p className="text-gray-500">No active poll.</p>
          )
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-4">Previous Polls</h2>
            {pollHistory.length === 0 ? (
              <p className="text-gray-500">No polls yet.</p>
            ) : (
              pollHistory.map((poll, idx) => (
                <PollResultCard
                  key={idx}
                  question={poll.question}
                  options={poll.options}
                  counts={poll.counts}
                />
              ))
            )}
          </div>
        )}

        <ChatPopup role="teacher" name="Teacher" />
      </div>

      {/* Show Ask New Question only in active poll view */}
      {!showHistory && (
        <div className="mt-6 text-right">
          <button
            onClick={onAskNewQuestion}
            className="bg-[#5c6dc9] text-white px-12 py-4 rounded-full text-lg font-medium shadow"
          >
            + Ask a new question
          </button>
        </div>
      )}
    </>
  );
}
