'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LoginForm from '@/components/login-form/page';

export default function Navbar({ user, onLogout, onLoginSuccess }) {
  const [showLogin, setShowLogin] = useState(false);
  const path = usePathname();

  const activeClass = (href) =>
    path === href
      ? 'text-indigo-600 border-b-2 border-indigo-600'
      : 'text-gray-600 hover:text-indigo-600';

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="bg-white shadow sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center font-nytBody text-gray-900 tracking-tight">
        <div className="space-x-4">
          <Link
            href="/"
            className={`${activeClass('/')} transition-colors`}
          >
            Home
          </Link>
          {user && (
            <Link
              href="/my-movies"
              className={`${activeClass('/my-movies')} transition-colors`}
            >
              My Movies
            </Link>
          )}
        </div>

        <div>
          {user ? (
            <>
              {firstName && <span className="text-gray-700 mr-2">👋 Hello {firstName},</span>}
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-nytBody tracking-tight"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowLogin(v => !v)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
              >
                {showLogin ? 'Close' : 'Login / Register'}
              </button>
              {showLogin && (
                <div className="absolute top-full right-4 mt-2 w-96 bg-white rounded shadow-lg">
                  <LoginForm onLoginSuccess={onLoginSuccess} />
                </div>
              )}
            </>
          )}
        </div>
      </nav>
    </div>
  );
}