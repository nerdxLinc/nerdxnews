import React from 'react';
import { LOGO_URL, SOCIAL_LINKS } from '../constants';

interface HeaderProps {
  onHome: () => void;
  onAdminToggle: () => void;
  isAdmin: boolean;
}

function stripTrailingSlashes(url: string): string {
  return (url || '').trim().replace(/\/+$/, '');
}

function toSubstackSubscribeUrl(publicationUrl: string): string {
  const clean = stripTrailingSlashes(publicationUrl);
  if (!clean || clean === '#') return 'https://substack.com/subscribe';
  return `${clean}/subscribe`;
}

const Header: React.FC<HeaderProps> = ({ onHome, onAdminToggle, isAdmin }) => {
  const subscribeUrl = toSubstackSubscribeUrl(SOCIAL_LINKS.newsletter);

  const handleSubscribe = () => {
    window.location.href = subscribeUrl;
  };

  const adminTitle = isAdmin ? 'Admin: ON (tap to exit)' : 'Admin: OFF (tap to enter)';

  return (
    <header className="sticky top-0 z-50 glass border-b-2 border-orange-500 px-4 py-4 sm:px-6 sm:py-5 md:py-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-10">
        <div
          className="flex items-center gap-4 sm:gap-6 cursor-pointer group flex-shrink-0"
          onClick={onHome}
        >
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-2 bg-orange-500 blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
            <img
              src={LOGO_URL}
              alt="NerdXNews Logo"
              className="relative h-16 sm:h-20 md:h-24 w-auto object-contain border-4 border-zinc-800 rounded-none group-hover:scale-105 transition-transform shadow-[8px_8px_0px_0px_rgba(255,87,34,1)]"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-white leading-none uppercase italic">
              NERDX<span className="text-orange-500">NEWS</span>
            </h1>
            <span className="hidden sm:inline text-[10px] md:text-xs font-black tracking-[0.5em] text-zinc-500 mt-1 md:mt-2 uppercase">
              The Evolution of Nerd Culture
            </span>
          </div>
        </div>

        <nav className="hidden xl:flex items-center gap-10 font-black tracking-[0.2em] text-xs italic">
          <a
            href="#"
            className="hover:text-orange-500 transition-colors border-b-2 border-transparent hover:border-orange-500 pb-1"
          >
            BOOKS & COMICS
          </a>
          <a
            href="#"
            className="hover:text-orange-500 transition-colors border-b-2 border-transparent hover:border-orange-500 pb-1"
          >
            GAMES
          </a>
          <a
            href="#"
            className="hover:text-orange-500 transition-colors border-b-2 border-transparent hover:border-orange-500 pb-1 text-zinc-100"
          >
            MOVIES
          </a>
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Always-visible, quiet Admin control (icon-only) */}
          <button
            type="button"
            onClick={onAdminToggle}
            title={adminTitle}
            aria-label={adminTitle}
            className={`h-11 w-11 grid place-items-center rounded-none border-2 transition-all ${
              isAdmin
                ? 'border-orange-500 text-orange-400 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.25)]'
                : 'border-zinc-800 text-zinc-600 hover:border-orange-500 hover:text-zinc-200'
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a8 8 0 0 0-1.7-1L15 4h-6l-.3 2.4a8 8 0 0 0-1.7 1l-2.4-1-2 3.4L4.6 12a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 1.7 1L9 20h6l.3-2.4a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleSubscribe}
            className="btn-retro px-6 py-3 sm:px-8 sm:py-4 rounded-none font-black text-black uppercase tracking-[0.2em] text-xs shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] active:translate-y-1 active:shadow-none transform -skew-x-12 italic"
          >
            SUBSCRIBE
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
