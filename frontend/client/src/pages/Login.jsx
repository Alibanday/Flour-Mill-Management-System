import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Input validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/auth/login", {
        email,
        password,
      });
      
      if (res.data.token) {
        // Store token and user data
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        // Set default Authorization header
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
        
        // Only navigate after successful login
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid email or password");
        } else if (err.response.status === 500) {
          setError("Server error. Please try again later");
        } else {
          setError(err.response.data.message || "Login failed");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection");
      } else {
        setError("An unexpected error occurred");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen w-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/dashboard.jpg')",
      }}
    >
      <div className="bg-white p-16 rounded-3xl shadow-2xl w-full max-w-3xl">
        <h2 className="text-4xl font-bold text-center mb-10 text-black">
          Welcome back!
        </h2>

        {error && (
          <div className="mb-5 text-red-600 text-sm text-center border border-red-300 bg-red-50 py-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block text-black font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-black rounded-lg px-4 py-3 placeholder-gray-400 text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-6 relative">
            <label className="block text-black font-medium mb-1">
              Password
            </label>
            <input
              type={showPass ? "text" : "password"}
              className="w-full border border-black rounded-lg px-4 py-3 placeholder-gray-400 text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <span
              className="absolute right-4 top-11 text-gray-500 cursor-pointer"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-lg font-semibold transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg 
                  className="animate-spin h-5 w-5 mr-3" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}