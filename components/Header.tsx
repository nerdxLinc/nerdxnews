import React from 'react';
import { LOGO_URL } from '../constants';

interface HeaderProps {
  onHome: () => void;
  onAdminToggle: () => void;
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ onHome, onAdminToggle, isAdmin }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-orange-500/60 bg-black/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-3 text-left"
            aria-label="Go to home"
          >
            <img
              src={LOGO_URL}
              alt="NerdXNews Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded border border-orange-500/40 object-cover"
            />
            <div className="leading-tight">
              <div className="text-lg sm:text-2xl font-black uppercase tracking-tight">
                NERDX<span className="text-orange-500">NEWS</span>
              </div>
              <div className="text-[10px] sm:text-xs tracking-[0.25em] text-zinc-400 uppercase">
                Join the Nerd X Army
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onAdminToggle}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase border transition
                ${isAdmin ? 'border-orange-500 text-orange-400' : 'border-zinc-700 text-zinc-300 hover:border-orange-500/70'}`}
            >
              {isAdmin ? 'Admin On' : 'Admin'}
            </button>
            <a
              href="#newsletter"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold uppercase border border-orange-500 bg-orange-600/90 hover:bg-orange-500 transition"
            >
              Subscribe
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
