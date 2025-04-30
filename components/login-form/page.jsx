'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';  
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5328";

export default function LoginForm({ onLoginSuccess }) {
  const router = useRouter();

  const [email, setEmail] = useState('sean@gameofthron.es');
  const [password, setPassword] = useState('123');
  const [name, setName] = useState('Ned Stark');
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const endpoint = isLogin
      ? `${API_BASE_URL}/api/login`
      : `${API_BASE_URL}/api/register`;

    const payload = isLogin
      ? { email, password }
      : { email, password, name };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include', 
      });

      const contentType = res.headers.get("content-type");
      let data;
      if (contentType?.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Unexpected response: ${text}`);
      }

      if (!res.ok) {
        setError(data?.error || data?.message || `Error: ${res.statusText}`);
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.user || { email: payload.email });
      }

      
      router.push('/'); 

    } catch (err) {
      console.error("Auth error:", err);
      setError("Incorrect username or password");
    }
  };

  return (
    <div className="flex justify-center items-center p-4 my-8">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-lg shadow-md max-w-sm w-full border border-gray-200">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
          {isLogin ? 'Login' : 'Register'}
        </h2>

        {!isLogin && (
          <div>
            <label htmlFor="name-input" className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isLogin}
              className="border border-gray-300 p-2 w-full rounded-md"
            />
          </div>
        )}

        <div>
          <label htmlFor="email-input" className="block text-sm font-medium text-gray-600 mb-1">Email</label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 p-2 w-full rounded-md"
          />
        </div>

        <div>
          <label htmlFor="password-input" className="block text-sm font-medium text-gray-600 mb-1">Password</label>
          <input
            id="password-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 p-2 w-full rounded-md"
          />
        </div>

        {error && <p className="text-red-600 text-sm text-center py-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
        >
          {isLogin ? 'Login' : 'Create Account'}
        </button>

        <p
          onClick={() => { setIsLogin(!isLogin); setError(null); }}
          className="cursor-pointer text-center text-indigo-600 hover:text-indigo-800 text-sm mt-4"
        >
          {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
        </p>
      </form>
    </div>
  );
}
