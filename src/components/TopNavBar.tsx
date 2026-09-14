import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useState } from 'react';
import WalletModal from './WalletModal';

import { LogoIcon } from './Logo';

const TopNavBar = () => {
  const { isConnected, address: walletAddress, disconnect, balance } = useWallet();
  const location = useLocation();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#11111133] backdrop-blur-xl border-b border-outline-variant">
      <nav className="flex justify-between items-center px-margin-desktop h-14 w-full max-w-container-max mx-auto">
        {/* Left Section: Logo */}
        <div className="flex-1 flex justify-start">
          <Link 
            to="/" 
            className="flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16] rounded px-1"
            aria-label="CrowdfundX Home"
          >
            <LogoIcon size={28} className="transition-transform duration-300 group-hover:scale-105" />
            <span className="font-headline-md text-headline-md font-bold text-white tracking-tighter">
              Crowdfund<span className="text-[#84cc16]">X</span>
            </span>
          </Link>
        </div>
        
        {/* Center Section: Centered Navigation */}
        <div className="hidden md:flex items-center justify-center gap-8">
          <Link 
            to="/explore" 
            className={`font-body-md text-body-md transition-colors nav-link-underline py-1 outline-none focus-visible:text-[#84cc16] ${
              isLinkActive('/explore') 
                ? 'text-[#84cc16] font-bold after:scale-x-100' 
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Discover
          </Link>
          <Link 
            to="/terminal" 
            className={`font-body-md text-body-md transition-colors nav-link-underline py-1 outline-none focus-visible:text-[#84cc16] ${
              isLinkActive('/terminal') 
                ? 'text-[#84cc16] font-bold after:scale-x-100' 
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Live Terminal
          </Link>
          <Link 
            to="/dashboard" 
            className={`font-body-md text-body-md transition-colors nav-link-underline py-1 outline-none focus-visible:text-[#84cc16] ${
              isLinkActive('/dashboard') 
                ? 'text-[#84cc16] font-bold after:scale-x-100' 
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Creators
          </Link>
          <a 
            href="#about" 
            className="font-body-md text-body-md transition-colors nav-link-underline py-1 text-on-surface-variant hover:text-white outline-none focus-visible:text-[#84cc16]"
          >
            About
          </a>
        </div>
        
        {/* Right Section: Wallet Card */}
        <div className="flex-1 flex justify-end items-center gap-stack-md">
          {location.pathname === '/dashboard' && (
            <div className="hidden lg:flex items-center bg-black border border-outline-variant px-3 py-1 rounded">
              <span className="material-symbols-outlined text-outline-variant mr-2" style={{ fontSize: '16px' }}>search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface w-40 outline-none" 
                placeholder="Search projects..." 
                type="text"
              />
            </div>
          )}
          
          {isConnected && walletAddress ? (
            <button 
              onClick={disconnect}
              className="bg-surface-container-highest text-primary border border-outline-variant px-4 py-1.5 font-mono-data text-label-md font-bold rounded hover:bg-red-950/20 hover:border-red-800 transition-all duration-200 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16]"
              title="Click to Disconnect"
            >
              {balance ? `${balance} XLM | ` : ''}{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </button>
          ) : (
            <button 
              onClick={() => setIsWalletModalOpen(true)}
              className="bg-[#84cc16] text-black px-4 py-1.5 font-label-md text-label-md font-bold rounded transition-all duration-200 active:scale-[0.98] hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </nav>
      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
    </header>
  );
};

export default TopNavBar;
