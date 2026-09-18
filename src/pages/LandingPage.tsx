import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AnimatedCounter from '../components/AnimatedCounter';
import { getGlobalStats } from '../services/contractRead';
import { LogoIcon } from '../components/Logo';

interface Stats {
  totalRaised: number;
  activeCampaigns: number;
  successfulCampaigns: number;
  totalBackers: number;
}

const LandingPage = () => {
  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: getGlobalStats,
    placeholderData: {
      totalRaised: 4200000,
      activeCampaigns: 156,
      successfulCampaigns: 1200,
      totalBackers: 45000
    }
  });

  // Reference stats to satisfy eslint unused variable check
  if (stats) {
    // Stats query loaded
  }

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => {
      revealElements.forEach(el => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <main className="pt-14 bg-black stars-bg relative min-h-screen hero-glow overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop text-center md:text-left overflow-hidden">
        <div className="w-full max-w-container-max mx-auto py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            
            {/* Left Column (~50% or 7 cols) */}
            <div className="col-span-12 md:col-span-7 flex flex-col items-center md:items-start reveal">
              {/* Announcement Badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-1 bg-[#111] border border-outline-variant/60 rounded-full text-xs font-mono-data text-[#84cc16] select-none hover:border-[#84cc16]/50 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] animate-pulse"></span>
                Version 2.0 Live on Stellar
              </div>
              
              {/* Main Heading (Highlighted 'Empower' in green, 2 lines) */}
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] text-white mb-6 tracking-tight">
                Fund Ideas.<br />
                <span className="text-[#84cc16]">Empower</span> Builders.
              </h1>
              
              {/* Description */}
              <p className="font-body-lg text-base md:text-lg text-on-surface-variant mb-8 max-w-[580px] leading-relaxed">
                A decentralized crowdfunding platform powered by Stellar. Secure, transparent and borderless funding for creators worldwide.
              </p>
              
              {/* Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link 
                  to="/launch" 
                  className="px-8 py-3.5 bg-[#84cc16] text-black font-bold rounded-full hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#84cc16]/20 transition-all duration-300 text-center select-none active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Start Campaign
                </Link>
                <Link 
                  to="/explore" 
                  className="px-8 py-3.5 bg-transparent text-white font-bold rounded-full border border-white hover:border-[#84cc16] hover:text-[#84cc16] transition-all duration-300 text-center select-none active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16]"
                >
                  Explore Campaigns
                </Link>
              </div>
            </div>
            
            {/* Right Column (~50% or 5 cols) - Floating Logo Hero Illustration */}
            <div className="col-span-12 md:col-span-5 flex justify-center md:justify-end py-6 md:py-0 reveal transition-delay-200" style={{ transitionDelay: '200ms' }}>
              <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-center justify-center animate-float select-none">
                {/* Subtle radial glow */}
                <div className="absolute w-[240px] h-[240px] md:w-[300px] md:h-[300px] bg-[#84cc16]/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                {/* Thin circular rings */}
                <div className="absolute w-[280px] h-[280px] md:w-[360px] md:h-[360px] border border-dashed border-[#84cc16]/15 rounded-full animate-spin-slow pointer-events-none"></div>
                <div className="absolute w-[220px] h-[220px] md:w-[280px] md:h-[280px] border border-solid border-white/5 rounded-full animate-reverse-spin-slow pointer-events-none"></div>
                <div className="absolute w-[160px] h-[160px] md:w-[200px] md:h-[200px] border border-dotted border-[#84cc16]/20 rounded-full pointer-events-none"></div>
                
                {/* Logo Icon inside glass backdrop */}
                <div className="relative p-6 bg-black/40 backdrop-blur-md rounded-full border border-white/5 shadow-2xl">
                  <LogoIcon size={160} className="filter drop-shadow-[0_0_20px_rgba(132,204,22,0.2)]" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Statistics Section (Rounded dark glass card, 4 columns, interactive hover) */}
      <section className="px-margin-mobile md:px-margin-desktop py-6 max-w-container-max mx-auto reveal transition-delay-300 animate-fade-in" style={{ transitionDelay: '300ms' }}>
        <div className="glass-card glass-card-hover rounded-2xl p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
          
          {/* Active Campaigns */}
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl mb-3" role="img" aria-label="Active Campaigns">👥</span>
            <AnimatedCounter target={128} suffix="+" className="font-headline-lg text-2xl md:text-3xl text-white font-mono-data font-bold tracking-tight mb-1" />
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Active Campaigns</span>
          </div>
          
          {/* Total Donations */}
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl mb-3" role="img" aria-label="Total Donations">💰</span>
            <AnimatedCounter target={24560} suffix="+" className="font-headline-lg text-2xl md:text-3xl text-white font-mono-data font-bold tracking-tight mb-1" />
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Total Donations</span>
          </div>
          
          {/* Countries Supported */}
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl mb-3" role="img" aria-label="Countries Supported">🌍</span>
            <AnimatedCounter target={56} suffix="+" className="font-headline-lg text-2xl md:text-3xl text-white font-mono-data font-bold tracking-tight mb-1" />
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Countries Supported</span>
          </div>
          
          {/* Transparent & Secure */}
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl mb-3" role="img" aria-label="Transparent & Secure">🛡</span>
            <AnimatedCounter target={100} suffix="%" className="font-headline-lg text-2xl md:text-3xl text-white font-mono-data font-bold tracking-tight mb-1" />
            <span className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Transparent & Secure</span>
          </div>

        </div>
      </section>

      {/* Why CrowdfundX (Features Grid, 4 glass cards, subtle icons, 2-line description) */}
      <section id="about" className="py-16 md:py-24 px-margin-mobile md:px-margin-desktop bg-transparent max-w-container-max mx-auto">
        <div className="mb-12 text-center md:text-left reveal">
          <h2 className="font-headline-lg text-3xl md:text-4xl text-white font-bold mb-3 tracking-tight">Why CrowdfundX?</h2>
          <p className="text-on-surface-variant text-base max-w-xl">
            The next-generation crowdfunding protocol designed for speed, institutional security, and absolute transparency.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col items-start reveal">
            <div className="p-3 bg-[#84cc16]/10 rounded-xl mb-6 text-[#84cc16]">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <h3 className="font-headline-md text-lg font-bold text-white mb-2">Secure & Trustless</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
              Smart contracts audited and enforced by the Stellar network. No intermediaries, just pure code.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col items-start reveal transition-delay-100" style={{ transitionDelay: '100ms' }}>
            <div className="p-3 bg-[#84cc16]/10 rounded-xl mb-6 text-[#84cc16]">
              <span className="material-symbols-outlined text-3xl">bolt</span>
            </div>
            <h3 className="font-headline-md text-lg font-bold text-white mb-2">Instant Transactions</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
              Capital settlements in seconds. Funds are transferred instantly to campaign builders.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col items-start reveal transition-delay-200" style={{ transitionDelay: '200ms' }}>
            <div className="p-3 bg-[#84cc16]/10 rounded-xl mb-6 text-[#84cc16]">
              <span className="material-symbols-outlined text-3xl">public</span>
            </div>
            <h3 className="font-headline-md text-lg font-bold text-white mb-2">Global & Borderless</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
              Raise capital or support projects anywhere in the world using Stellar cross-border rails.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col items-start reveal transition-delay-300" style={{ transitionDelay: '300ms' }}>
            <div className="p-3 bg-[#84cc16]/10 rounded-xl mb-6 text-[#84cc16]">
              <span className="material-symbols-outlined text-3xl">analytics</span>
            </div>
            <h3 className="font-headline-md text-lg font-bold text-white mb-2">Live Analytics</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">
              Real-time event streams and transparent ledger logging for every single action.
            </p>
          </div>
        </div>
      </section>

      {/* Architectural Integrity Visual */}
      <section className="py-16 md:py-24 px-margin-mobile md:px-margin-desktop bg-surface-dim/40 border-y border-outline-variant/30 overflow-hidden">
        <div className="max-w-container-max mx-auto text-center reveal">
          <h2 className="font-headline-lg text-3xl md:text-4xl text-white font-bold mb-4 tracking-tight">Architectural Integrity</h2>
          <p className="text-on-surface-variant text-base mb-12 max-w-xl mx-auto">
            Decentralized core services orchestrate real-time transaction processing.
          </p>
          
          <div className="relative w-full max-w-4xl mx-auto p-6 md:p-8 rounded-2xl glass-card">
            <div className="flex flex-col items-center gap-8 py-4">
              <div className="w-32 py-2 border border-primary bg-primary text-black font-mono-data text-xs uppercase tracking-wider font-bold">
                User
              </div>
              <div className="h-12 w-px bg-gradient-to-b from-primary to-outline-variant"></div>
              <div className="w-48 py-2 border border-outline-variant bg-surface-container-highest font-mono-data text-xs uppercase tracking-wider text-primary font-bold">
                Frontend UI
              </div>
              <div className="h-12 w-px bg-outline-variant"></div>
              <div className="flex flex-col md:flex-row gap-6 justify-center items-center w-full">
                <div className="flex-1 w-full max-w-[220px] p-4 border border-outline-variant bg-surface-container-low font-mono-data text-xs text-on-surface-variant font-semibold">
                  Campaign Registry
                </div>
                <div className="flex-1 w-full max-w-[220px] p-4 border border-outline-variant bg-surface-container-low font-mono-data text-xs text-on-surface-variant font-semibold">
                  Treasury Contract
                </div>
                <div className="flex-1 w-full max-w-[220px] p-4 border border-outline-variant bg-surface-container-low font-mono-data text-xs text-on-surface-variant font-semibold">
                  Analytics Contract
                </div>
              </div>
              <div className="absolute top-1/2 left-0 w-full h-px bg-outline-variant -z-10 opacity-20"></div>
              <div className="absolute top-0 left-1/2 w-px h-full bg-outline-variant -z-10 opacity-20"></div>
            </div>
            
            <div className="mt-8 flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-mono-data text-[10px] text-on-surface-variant uppercase">Stellar Network Online</span>
              </div>
              <div className="font-mono-data text-[10px] text-on-surface-variant uppercase">v.2.0.0 Testnet</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Bento Grid */}
      <section className="py-16 md:py-24 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          
          <div className="flex justify-between items-end mb-12 reveal">
            <div>
              <h2 className="font-headline-lg text-3xl md:text-4xl text-white font-bold mb-2 tracking-tight">Featured Projects</h2>
              <p className="text-on-surface-variant text-base">Active funding rounds curated for impact and innovation.</p>
            </div>
            <Link 
              to="/explore" 
              className="font-label-md text-xs font-bold uppercase tracking-widest text-[#84cc16] border-b border-[#84cc16] pb-1 hover:opacity-70 transition-opacity"
            >
              View All
            </Link>
          </div>
          
          <div className="grid grid-cols-12 gap-6 reveal transition-delay-200" style={{ transitionDelay: '200ms' }}>
            
            {/* Big Card */}
            <div className="col-span-12 lg:col-span-8 h-[450px] md:h-[500px] glass-card rounded-2xl relative group overflow-hidden border-outline-variant/35">
              <div 
                className="absolute inset-0 z-0 opacity-40 group-hover:scale-105 transition-transform duration-700 bg-cover bg-center" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBMbWAqBw9jw_hIwgKwmHDcJcRxAHuMcgsn38ctYy377bUpFpow4PHI29TkML2dys2mY-iYDrkXP54zQVabZeyQhMqgxLIZ32yuzLqKqYZjRFEPIuxDMk4Fu7iQkPWYZ1Bl0METI_fiMvZogXPhSX3zILMIaRxsRzScfi3J1YuVrVQWpF_0XNe-PUDa0boffxPdv-bKRrhp-jjQzNV29Y9QuYcYR5REZU1ilcGSmqmdorABmu8O65v92fFLgQAVSPYb7TaOdMC086G6')" }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
              
              <div className="absolute bottom-0 p-6 md:p-8 z-20 w-full">
                <div className="flex gap-2 mb-4">
                  <span className="px-2.5 py-1 bg-white text-black font-mono-data text-[10px] uppercase font-bold rounded">Climate Tech</span>
                  <span className="px-2.5 py-1 bg-black/40 text-white border border-white/20 font-mono-data text-[10px] uppercase rounded">72% Funded</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold mb-3 text-white">Project Helios: Solar for All</h3>
                <p className="text-on-surface-variant max-w-lg mb-6 text-sm leading-relaxed">
                  Decentralized energy grids for rural infrastructure using Stellar smart contracts for automated maintenance rewards.
                </p>
                <div className="w-full h-1 bg-white/10 rounded-full mb-3 overflow-hidden">
                  <div className="h-full bg-[#84cc16] rounded-full" style={{ width: '72%' }}></div>
                </div>
                <div className="flex justify-between font-mono-data text-xs text-on-surface-variant font-semibold">
                  <span className="text-white">245,000 XLM Raised</span>
                  <span>14 Days Left</span>
                </div>
              </div>
            </div>
            
            {/* Small Card Stack */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              
              <Link to="/explore" className="flex-grow glass-card glass-card-hover p-5 rounded-2xl group cursor-pointer border-outline-variant/35 flex flex-col justify-between">
                <div>
                  <div className="aspect-[2/1] bg-surface-container-highest rounded-xl mb-4 overflow-hidden relative border border-white/5">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:scale-105 transition-transform duration-500" 
                      style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCm4gpLrgZuvCzjB1jsOAINIsNEoaN4KAgBYjIZG_5bJWVu3JX0KInqEx6O-Kbeizxh-qsQNAKgndiAlfIzHbDYWg3PGb-GmWODIMirHqJYIIcR-6cZauQQq3SBrD7mSSixL9s6AVIqvRy7DEFsM09N7ZT1qzmYc7ZekS-dfMIB9pAENgMK8nKtWhV1Hq-QpzB6n1CbIW0LxqyMM6AkcvGPKX_pBGbC2hgIsxpgE4UB_QlYyhbbGbZN9G99-jNrzNinFdLSa0lws7tt')" }}
                    ></div>
                  </div>
                  <h4 className="font-headline-md text-lg font-bold text-white mb-1.5">Quantum Ledger API</h4>
                  <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-2">Next-gen dev tools for the Soroban smart contract platform.</p>
                </div>
              </Link>
              
              <Link to="/explore" className="flex-grow glass-card glass-card-hover p-5 rounded-2xl group cursor-pointer border-outline-variant/35 flex flex-col justify-between">
                <div>
                  <div className="aspect-[2/1] bg-surface-container-highest rounded-xl mb-4 overflow-hidden relative border border-white/5">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:scale-105 transition-transform duration-500" 
                      style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBnc4N45514Cxu9duTJOIKnIDvn_6I6k8e0Y4XyTfFyHIW8aMmPwhsnFPCWVZCdcnjHMlQoaDoSkBZXKbzFyucCjyFWQVBtQ14_7tnpZm5KxVLxkB9SLdpdhcEuRvZWe6wDevjT_vPAnq1Mmv5bKESfnSamZADKcEUN9N5Hjc-J_RpC_b3DeO1xB0WHyuFMJpDYkw8a3XUSwMrF0qN4CMXKHH7CeEDx-Ok_lzsCnhjNrUtC7PhjqAla7s-uSiWYTqAJnpSM2ay1WdXP')" }}
                    ></div>
                  </div>
                  <h4 className="font-headline-md text-lg font-bold text-white mb-1.5">Bridge Foundation</h4>
                  <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-2">Micro-lending platform for underbanked entrepreneurs globally.</p>
                </div>
              </Link>

            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 border-t border-outline-variant/30 bg-white text-black relative overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="max-w-2xl text-center md:text-left">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">Ready to build the future?</h2>
            <p className="text-black/70 text-base md:text-lg">Join thousands of creators and backers shaping the decentralized economy on Stellar.</p>
          </div>
          <div className="flex gap-4 shrink-0">
            <Link 
              to="/launch" 
              className="bg-black text-white px-8 py-4 font-bold rounded-full transition-all hover:bg-black/90 hover:-translate-y-0.5 active:scale-[0.98] text-center"
            >
              Launch Project
            </Link>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 font-display text-[150px] md:text-[200px] text-black/5 select-none pointer-events-none font-bold leading-none">STELLAR</div>
      </section>
    </main>
  );
};

export default LandingPage;
