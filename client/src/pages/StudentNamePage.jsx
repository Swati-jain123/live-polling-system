import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentNamePage() {
  const [name, setName] = useState(sessionStorage.getItem("studentName") || "");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!name.trim()) return;
    sessionStorage.setItem("studentName", name.trim());
    navigate("/student/poll");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <main className="w-full max-w-md text-center">
        {/* Tag */}
        <span className="text-xl inline-block bg-[#5c6dc9] text-white px-3 py-1 rounded-full mb-6">
          ✦ Intervue Poll
        </span>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-semibold mb-3">
          Let’s <span className="font-bold">Get Started</span>
        </h1>
        <p className="text-gray-600 text-sm mb-8">
          If you’re a student, you’ll be able to{" "}
          <span className="font-semibold">submit your answers</span>, participate
          in live polls, and see how your responses compare with your classmates.
        </p>

        {/* Input */}
        <div className="text-left mb-6">
          <label className="block text-lg font-medium mb-2">Enter your Name</label>
          <input
            type="text"
            placeholder="Rahul Bajaj"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none bg-gray-100"
          />
        </div>

        {/* Continue Button */}
         <button
          onClick={handleContinue}
          className="bg-[#5c6dc9] text-white px-12 py-3 rounded-full font-medium shadow hover:opacity-90 transition text-xl"
        >
          Continue
        </button>
      </main>
    </div>
  );
}
