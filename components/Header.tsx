import React from 'react';
import { LOGO_URL } from '../constants';

interface HeaderProps {
  onHome: () => void;
  onAdminToggle: () => void;
  isAdmin: boolean;
}

const Header: React.FC<HeaderProps> = ({ onHome, onAdminToggle, isAdmin }) => {
  return (
    <header className="sticky top-0 z-50 glass border-b-2 border-orange-500 px-4 py-5 sm:px-6 sm:py-8 md:py-10">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-10">
        <div 
          className="flex items-center gap-4 sm:gap-8 cursor-pointer group flex-shrink-0"
          onClick={onHome}
        >
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-2 bg-orange-500 blur opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
            <img 
              src={LOGO_URL} 
              alt="NerdXNews Logo" 
              className="relative h-20 sm:h-24 md:h-32 w-auto object-contain border-4 border-zinc-800 rounded-none group-hover:scale-105 transition-transform shadow-[8px_8px_0px_0px_rgba(255,87,34,1)]"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-white leading-none uppercase italic">
              NERDX<span className="text-orange-500">NEWS</span>
            </h1>
            <span className="text-[10px] sm:text-xs font-black tracking-[0.5em] text-zinc-500 mt-2 uppercase">
              The Evolution of Nerd Culture
            </span>
          </div>
        </div>

        <nav className="hidden xl:flex items-center gap-6 sm:gap-10 font-black tracking-[0.2em] text-xs italic">
          <a href="#" className="hover:text-orange-500 transition-colors border-b-2 border-transparent hover:border-orange-500 pb-1">BOOKS & COMICS</a>
          <a href="#" className="hover:text-orange-500 transition-colors border-b-2 border-transparent hover:border-orange-500 pb-1">GAMES</a>
          <a href="#" className="hover:text-orange-500 transition-colors border-b-2 border-transparent hover:border-orange-500 pb-1 text-zinc-100">MOVIES</a>
        </nav>

        <div className="flex items-center gap-6">
          <button 
            onClick={onAdminToggle}
            className={`px-5 py-3 rounded-none border-2 text-[10px] font-black transition-all tracking-[0.2em] uppercase transform -skew-x-12 ${
              isAdmin 
              ? 'bg-orange-600 border-orange-500 text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]' 
              : 'border-zinc-800 hover:border-orange-500 text-zinc-500'
            }`}
          >
            {isAdmin ? 'SYSTEM ACTIVE' : 'ADMIN ACCESS'}
          </button>
          <button className="btn-retro px-8 py-4 rounded-none font-black text-black uppercase tracking-[0.2em] text-xs shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] active:translate-y-1 active:shadow-none transform -skew-x-12 italic">
            SUBSCRIBE
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;