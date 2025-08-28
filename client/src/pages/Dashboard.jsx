import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [selectedRole, setSelectedRole] = useState("student");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedRole === "student") {
      navigate("/student");
    } else if (selectedRole === "teacher") {
      navigate("/teacher");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white w-full">
      <main className="w-full text-center px-4">

        {/* Tag */}
        <span className="text-xl inline-block bg-[#5c6dc9] text-white px-3 py-1 rounded-full mb-6">
          ✦ Intervue Poll
        </span>

        {/* Heading */}
        <h1 className="text-5xl font-semibold mb-2">
          Welcome to the{" "}
          <span className="font-bold">Live Polling System</span>
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Please select the role that best describes you to begin using the live polling system
        </p>

        {/* Role Selection */}
        <div className="flex justify-center gap-8 mb-8">
  <div
    onClick={() => setSelectedRole("student")}
    className={`cursor-pointer border-2 rounded-xl p-6 text-left transition w-80 ${
      selectedRole === "student"
        ? "border-[#5c6dc9] shadow-md"
        : "border-gray-300"
    }`}
  >
    <h2 className="text-xl font-medium mb-2">I’m a Student</h2>
    <p className="text-gray-500 text-sm">
      Lorem Ipsum is simply dummy text of the printing and typesetting industry
    </p>
  </div>

  <div
    onClick={() => setSelectedRole("teacher")}
    className={`cursor-pointer border-2 rounded-xl p-6 text-left transition w-80 ${
      selectedRole === "teacher"
        ? "border-[#5c6dc9] shadow-md"
        : "border-gray-300"
    }`}
  >
    <h2 className="text-xl font-medium mb-2">I’m a Teacher</h2>
    <p className="text-gray-500 text-sm">
      Submit answers and view live poll results in real-time.
    </p>
  </div>
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
