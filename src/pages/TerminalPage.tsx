import { useState, useEffect, useRef } from 'react'
import { subscribeToEvents } from '../services/contractEvents';

interface FeedItem {
  id: string;
  time: string;
  type: 'Donation' | 'Campaign' | 'Milestone' | 'System';
  title: string;
  desc: string;
  details: string;
  refName: string;
}

const INITIAL_FEED: FeedItem[] = [
  {
    id: 'init-1',
    time: '14:22:01 UTC',
    type: 'Donation',
    title: 'Transaction Success',
    desc: 'Donation Received',
    details: 'TX: GA7F...9B3R',
    refName: '500.00 XLM'
  },
  {
    id: 'init-2',
    time: '14:21:44 UTC',
    type: 'Milestone',
    title: 'Campaign Contract Called',
    desc: 'Goal Achieved: Project Solar',
    details: 'Contract: GD8B...2E4W | Total Raised: 25,000 XLM',
    refName: '25,000 XLM'
  },
  {
    id: 'init-3',
    time: '14:21:30 UTC',
    type: 'Campaign',
    title: 'New Campaign Created',
    desc: 'Anchor: CleanWater_Kenya_Phase2',
    details: 'Creator: GB5V...11Z9 | Target: 50,000 XLM',
    refName: '50,000 XLM Target'
  }
];



const TerminalPage = () => {
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CAMPAIGN' | 'DONATION' | 'MILESTONE'>('ALL');
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [typingText, setTypingText] = useState('Awaiting network confirmation...');
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal to bottom on feed updates
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [feed]);

  // Client-side Event Subscription
  useEffect(() => {
    if (!isSimulationRunning) return;

    const unsubscribe = subscribeToEvents((parsed) => {
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 8) + ' UTC';

      let newItem: FeedItem;
      
      if (parsed.type === 'CampaignCreated') {
        newItem = {
          id: 'evt_' + Math.random().toString(36).substring(2, 9),
          time: timeString,
          type: 'Campaign',
          title: 'New Campaign Created',
          desc: `Anchor Contract Deploy: ${parsed.payload.title}`,
          details: `Contract: ${parsed.payload.contractId} | Tx: ${parsed.payload.txHash.slice(0, 10)}...`,
          refName: `${parsed.payload.goalXlm.toLocaleString()} XLM Target`
        };
      } else if (parsed.type === 'DonationReceived') {
        newItem = {
          id: 'evt_' + Math.random().toString(36).substring(2, 9),
          time: timeString,
          type: 'Donation',
          title: 'Transaction Success',
          desc: `Donation Received from ${parsed.payload.backerAddress.slice(0, 8)}...`,
          details: `Treasury deposit | Tx: ${parsed.payload.txHash.slice(0, 10)}...`,
          refName: `${parsed.payload.amount.toLocaleString()} XLM`
        };
      } else if (parsed.type === 'GoalReached') {
        newItem = {
          id: 'evt_' + Math.random().toString(36).substring(2, 9),
          time: timeString,
          type: 'Milestone',
          title: 'Campaign Contract Called',
          desc: `Goal Achieved! Funding Target Completed.`,
          details: `Total raised: ${parsed.payload.totalRaised.toLocaleString()} XLM`,
          refName: `${parsed.payload.totalRaised.toLocaleString()} XLM`
        };
      } else if (parsed.type === 'CampaignClosed') {
        newItem = {
          id: 'evt_' + Math.random().toString(36).substring(2, 9),
          time: timeString,
          type: 'Milestone',
          title: 'Milestone Released',
          desc: `Campaign Contract Disbursed.`,
          details: `Funds released | Tx: ${parsed.payload.txHash.slice(0, 10)}...`,
          refName: `Ended`
        };
      } else {
        return;
      }
      setFeed(prev => [...prev, newItem]);
      setTypingText(`Validating sequence ${parsed.payload.txHash || Math.random().toString(36).substring(7).toUpperCase()}...`);
    });

    return () => {
      unsubscribe();
    };
  }, [isSimulationRunning]);

  // Count helper
  const counts = {
    all: feed.length + 1246,
    campaigns: feed.filter(f => f.type === 'Campaign').length + 81,
    donations: feed.filter(f => f.type === 'Donation').length + 939,
    milestones: feed.filter(f => f.type === 'Milestone').length + 220
  };

  const filteredFeed = feed.filter(f => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CAMPAIGN') return f.type === 'Campaign';
    if (activeFilter === 'DONATION') return f.type === 'Donation';
    if (activeFilter === 'MILESTONE') return f.type === 'Milestone';
    return true;
  });

  return (
    <main className="pt-16 min-h-screen flex flex-col md:flex-row max-w-[1440px] mx-auto border-x border-outline-variant/30">
      
      {/* Sidebar Filter Area */}
      <aside className="w-full md:w-64 md:h-[calc(100vh-64px)] p-stack-lg border-r border-outline-variant/30 bg-surface-container-lowest/50 sticky top-16 flex flex-col justify-between">
        <div className="mb-stack-lg">
          <h2 className="font-label-md text-label-md text-outline uppercase tracking-widest mb-stack-md">Event Filters</h2>
          <div className="flex flex-col gap-unit">
            <button 
              onClick={() => setActiveFilter('ALL')}
              className={`flex items-center justify-between w-full p-stack-sm rounded font-body-md text-body-md transition-all ${
                activeFilter === 'ALL' ? 'bg-surface-container-highest text-primary' : 'hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="flex items-center gap-stack-sm">
                <span className="material-symbols-outlined">list</span> All Events
              </span>
              <span className="font-mono-data text-label-md opacity-50">{counts.all}</span>
            </button>
            <button 
              onClick={() => setActiveFilter('CAMPAIGN')}
              className={`flex items-center justify-between w-full p-stack-sm rounded font-body-md text-body-md transition-all ${
                activeFilter === 'CAMPAIGN' ? 'bg-surface-container-highest text-primary' : 'hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="flex items-center gap-stack-sm">
                <span className="material-symbols-outlined">campaign</span> Campaigns
              </span>
              <span className="font-mono-data text-label-md opacity-50">{counts.campaigns}</span>
            </button>
            <button 
              onClick={() => setActiveFilter('DONATION')}
              className={`flex items-center justify-between w-full p-stack-sm rounded font-body-md text-body-md transition-all ${
                activeFilter === 'DONATION' ? 'bg-surface-container-highest text-primary' : 'hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="flex items-center gap-stack-sm">
                <span className="material-symbols-outlined">payments</span> Donations
              </span>
              <span className="font-mono-data text-label-md opacity-50">{counts.donations}</span>
            </button>
            <button 
              onClick={() => setActiveFilter('MILESTONE')}
              className={`flex items-center justify-between w-full p-stack-sm rounded font-body-md text-body-md transition-all ${
                activeFilter === 'MILESTONE' ? 'bg-surface-container-highest text-primary' : 'hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="flex items-center gap-stack-sm">
                <span className="material-symbols-outlined">check_circle</span> Milestones
              </span>
              <span className="font-mono-data text-label-md opacity-50">{counts.milestones}</span>
            </button>
          </div>
        </div>

        <div className="pt-stack-lg border-t border-outline-variant/20 mt-auto">
          <div className="flex items-center gap-stack-sm mb-stack-sm">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="font-label-md text-label-md text-primary">Live Connection</span>
          </div>
          <div className="p-stack-md rounded bg-surface-container-low border border-outline-variant/30">
            <p className="font-label-md text-label-md text-outline mb-unit">Network Status</p>
            <p className="font-mono-data text-body-md text-on-surface">Horizon: Healthy</p>
            <p className="font-mono-data text-label-md text-outline-variant mt-unit">Latency: 14ms</p>
          </div>
        </div>
      </aside>

      {/* Main Terminal Area */}
      <section className="flex-1 flex flex-col bg-surface-container-lowest min-h-[500px]">
        {/* Terminal Header */}
        <header className="p-stack-md border-b border-outline-variant/30 flex items-center justify-between bg-surface-dim">
          <div className="flex items-center gap-stack-md">
            <span className="font-mono-data text-body-md text-primary font-bold">BLOCKCHAIN_FEED_V2.0</span>
            <span className="font-mono-data text-label-md px-stack-sm py-1 rounded bg-secondary-container text-on-secondary-container">
              Simulation Mode: Active
            </span>
          </div>
          <div className="flex items-center gap-stack-md">
            <button 
              onClick={() => setIsSimulationRunning(!isSimulationRunning)}
              className={`font-label-md text-label-md border border-outline-variant px-stack-md py-1 rounded transition-all ${
                isSimulationRunning ? 'hover:bg-surface-container' : 'bg-primary text-black font-bold'
              }`}
            >
              {isSimulationRunning ? 'Pause Stream' : 'Resume Stream'}
            </button>
            <button className="material-symbols-outlined text-outline-variant hover:text-primary transition-all">settings</button>
          </div>
        </header>

        {/* Feed Content */}
        <div className="flex-grow h-[calc(100vh-190px)] overflow-y-auto p-stack-lg custom-scrollbar space-y-stack-sm font-mono-data text-on-surface-variant">
          {filteredFeed.map((item) => (
            <div key={item.id} className="feed-item p-stack-md flex flex-col gap-unit animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-outline text-label-md">[{item.time}]</span>
                <span className="text-primary font-bold text-label-md uppercase tracking-tighter">{item.title}</span>
              </div>
              <div className="text-body-md text-on-surface">
                <span className="text-outline">Event:</span> {item.desc} <span className="text-primary font-bold">{item.refName}</span>
              </div>
              <div className="text-label-md opacity-60">
                Info: <span className="underline">{item.details}</span>
              </div>
            </div>
          ))}
          
          <div ref={feedEndRef} />
          
          <div className="p-stack-md">
            <span className="text-primary">&gt;</span> <span>{typingText}</span>
            <span className="terminal-cursor"></span>
          </div>
        </div>
      </section>

    </main>
  )
}

export default TerminalPage
