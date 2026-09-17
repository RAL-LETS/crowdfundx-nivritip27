import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';
import { withdrawFromCampaignContract } from '../lib/stellarContract';
import { getCampaigns, getCampaignDonations, getCampaignTimeline, getCampaignById, saveCampaignLocally, CampaignData } from '../services/contractRead';
import { trackEvent, captureError } from '../lib/monitoring';

interface Donation {
  id: number;
  address: string;
  amount: string;
  status: string;
  time: string;
}

interface TimelineItem {
  id: number;
  time: string;
  title: string;
  desc: string;
}

const INITIAL_DONATIONS: Donation[] = [];
const INITIAL_TIMELINE: TimelineItem[] = [];

const DashboardPage = () => {
  const { isConnected, address: walletAddress, signTx, refreshBalance } = useWallet();
  const { showToast } = useToast();
  const [activeChartTab, setActiveChartTab] = useState<'1D' | '1W' | '1M'>('1D');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const queryClient = useQueryClient();

  // 1. Fetch creator campaigns
  const { data: campaigns = [], isLoading, isError, refetch } = useQuery<CampaignData[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const data = await getCampaigns();
      if (walletAddress) {
        return data.filter(c => c.creator === walletAddress);
      }
      return data;
    },
    enabled: !!walletAddress,
    placeholderData: []
  });

  const activeCampaign = campaigns.length > 0 ? campaigns[0] : null;
  const campaignId = activeCampaign ? activeCampaign.id : null;

  // 2. Fetch donations for the active campaign
  const { data: donations = INITIAL_DONATIONS, isLoading: isDonationsLoading } = useQuery<Donation[]>({
    queryKey: ['donations', campaignId],
    queryFn: async () => {
      if (!campaignId) return INITIAL_DONATIONS;
      const data = await getCampaignDonations(campaignId);
      return data.map((d: any) => ({
        id: d.id,
        address: d.backer_address.slice(0, 6) + '...' + d.backer_address.slice(-4),
        amount: `${Number(d.amount_xlm).toLocaleString()} XLM`,
        status: 'Confirmed',
        time: 'Recently'
      }));
    },
    enabled: !!campaignId
  });

  // 3. Fetch timeline events for active campaign
  const { data: timeline = INITIAL_TIMELINE, isLoading: isTimelineLoading } = useQuery<TimelineItem[]>({
    queryKey: ['timeline', campaignId],
    queryFn: async () => {
      if (!campaignId) return INITIAL_TIMELINE;
      const data = await getCampaignTimeline(campaignId);
      return data.map((t: any) => ({
        id: t.id,
        time: new Date(t.createdAt).toUTCString().slice(5, 22) + ' UTC',
        title: t.eventType === 'CampaignCreated' ? 'Campaign Launched' : t.eventType,
        desc: `Transaction reference logs: ${t.data.txHash || 'ledger lock'}`
      }));
    },
    enabled: !!campaignId
  });

  const handleWithdraw = async () => {
    if (!isConnected || !walletAddress) {
      showToast('info', 'Wallet required', 'Please connect your Stellar wallet first!');
      return;
    }

    if (!campaignId || !activeCampaign) {
      showToast('error', 'Error', 'No active deployed campaign contract loaded.');
      return;
    }

    setIsWithdrawing(true);

    try {
      // 1. Trigger withdrawal via Treasury contract release_funds call
      const txHash = await withdrawFromCampaignContract(walletAddress, signTx, campaignId);

      // 2. Update local store status
      try {
        const camp = await getCampaignById(campaignId);
        camp.status = 'ENDED';
        await saveCampaignLocally(camp);
      } catch (e) {
        console.warn('Failed to update campaign state locally:', e);
      }

      // 3. Track analytics
      trackEvent('campaign_withdrawal_success', {
        campaignId,
        txHash,
      });

      showToast('success', 'Funds Released!', `Treasury successfully released funds. Tx: ${txHash.slice(0, 10)}...`);
      
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      refreshBalance();
    } catch (err: any) {
      captureError(err, { context: 'campaign_withdrawal', campaignId });
      const errMsg = err.message || String(err);
      if (errMsg.toLowerCase().includes('reject') || errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('denied')) {
        showToast('info', 'Transaction Rejected', 'You cancelled the signing request.');
      } else {
        showToast('error', 'Withdrawal Error', errMsg || 'Withdrawal failed. Please check the contract rules.');
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Safe checks for rendering
  if (!isConnected) {
    return (
      <main className="pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-[60vh] flex flex-col justify-center items-center text-center">
        <span className="material-symbols-outlined text-6xl text-outline-variant mb-4" aria-hidden="true">
          account_balance_wallet
        </span>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Wallet Disconnected</h1>
        <p className="font-body-md text-on-surface-variant max-w-md mb-6">
          Please connect your Stellar wallet using the button in the navigation bar to access the dashboard.
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-[60vh] flex flex-col justify-center items-center text-center" role="status" aria-label="Loading your dashboard">
        <div className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin mb-4" />
        <p className="font-body-md text-on-surface-variant">Fetching campaign registry stats...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-[60vh] flex flex-col justify-center items-center text-center">
        <span className="material-symbols-outlined text-6xl text-outline-variant mb-4" aria-hidden="true">
          wifi_off
        </span>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Network Error</h1>
        <p className="font-body-md text-on-surface-variant max-w-md mb-6">
          Failed to load campaign statistics from the registry.
        </p>
        <button 
          onClick={() => refetch()}
          className="bg-primary text-on-primary px-6 py-2 font-label-md rounded font-bold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Retry Connection
        </button>
      </main>
    );
  }

  if (campaigns.length === 0) {
    return (
      <main className="pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-[60vh] flex flex-col justify-center items-center text-center">
        <span className="material-symbols-outlined text-6xl text-outline-variant mb-4" aria-hidden="true">
          dashboard_customize
        </span>
        <h1 className="font-headline-lg text-headline-lg text-primary mb-2">No Campaigns Found</h1>
        <p className="font-body-md text-on-surface-variant max-w-md mb-6">
          You haven&apos;t launched any campaigns with this wallet address yet.
        </p>
        <Link 
          to="/launch" 
          className="bg-primary text-on-primary px-8 py-4 font-label-md text-label-md font-bold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Create A Campaign
        </Link>
      </main>
    );
  }

  const title = activeCampaign?.title || 'Active Campaign';
  const contractId = activeCampaign?.contract_id ? activeCampaign.contract_id.slice(0, 12) + '...' : 'STLR-9921-X';
  const goal = activeCampaign ? Number(activeCampaign.goal_xlm) : 0;
  const raised = activeCampaign ? Number(activeCampaign.raised_xlm) : 0;
  const contributors = donations.length;
  const status = activeCampaign?.status || 'ACTIVE';
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  return (
    <main className="pt-24 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      
      {/* Header */}
      <header className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-surface-container-highest text-primary font-mono-data text-label-md rounded">LIVE CAMPAIGN</span>
            <span className="text-on-surface-variant font-label-md text-label-md">ID: {contractId}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary">{title}</h1>
        </div>
        <div className="flex gap-stack-sm">
          <button className="border border-outline-variant px-4 py-2 text-primary font-label-md text-label-md hover:border-primary transition-colors hover:bg-surface-container-low duration-100">
            Edit Project
          </button>
          <button 
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="bg-primary text-on-primary-fixed px-4 py-2 font-label-md text-label-md font-bold hover:opacity-90 active:scale-[0.98] transition-all duration-100 flex items-center gap-2"
          >
            {isWithdrawing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                Withdrawing...
              </>
            ) : (
              'Withdraw Funds'
            )}
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md mb-stack-lg">
        {/* Total Raised */}
        <div className="bg-[#111111] border border-[#222222] p-stack-md hover:-translate-y-0.5 transition-transform duration-200 group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-label-md text-label-md tracking-wider">TOTAL REGISTRY RAISED</span>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors" aria-hidden="true">account_balance_wallet</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-lg text-headline-lg text-primary font-mono-data">
              {raised.toLocaleString()} XLM
            </span>
            <span className="text-on-surface-variant font-body-md text-body-md mt-1">Goal: {goal.toLocaleString()} XLM</span>
          </div>
          <div className="mt-stack-md w-full h-1 bg-[#222222]">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Contributors */}
        <div className="bg-[#111111] border border-[#222222] p-stack-md hover:-translate-y-0.5 transition-transform duration-200 group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-label-md text-label-md tracking-wider">CONTRIBUTORS</span>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors" aria-hidden="true">groups</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-lg text-headline-lg text-primary font-mono-data">{contributors.toLocaleString()}</span>
            <span className="text-on-surface-variant font-body-md text-body-md mt-1">Stellar Accounts Joined</span>
          </div>
        </div>

        {/* Campaign Status */}
        <div className="bg-[#111111] border border-[#222222] p-stack-md hover:-translate-y-0.5 transition-transform duration-200 group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-label-md text-label-md tracking-wider">ON-CHAIN STATUS</span>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors" aria-hidden="true">verified</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-lg text-headline-lg text-primary">{status}</span>
            <span className="text-on-surface-variant font-body-md text-body-md mt-1">State: Active Lifecycle</span>
          </div>
        </div>

        {/* Remaining Time */}
        <div className="bg-[#111111] border border-[#222222] p-stack-md hover:-translate-y-0.5 transition-transform duration-200 group">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-label-md text-label-md tracking-wider">TIME REMAINING</span>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors" aria-hidden="true">schedule</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-lg text-headline-lg text-primary font-mono-data">14d 06h 22m</span>
            <span className="text-on-surface-variant font-body-md text-body-md mt-1">Decentralized Epoch</span>
          </div>
        </div>
      </div>

      {/* Dashboard Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left Column: Chart & Donations */}
        <div className="lg:col-span-2 space-y-gutter">
          {/* Funding Growth Chart */}
          <div className="bg-[#111111] border border-[#222222] p-stack-lg">
            <div className="flex justify-between items-center mb-stack-lg">
              <h3 className="font-headline-md text-headline-md text-primary">Funding Growth</h3>
              <div className="flex gap-2">
                {(['1D', '1W', '1M'] as const).map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveChartTab(tab)}
                    className={`px-3 py-1 font-mono-data text-label-md rounded border transition-colors ${
                      activeChartTab === tab 
                        ? 'text-primary border-outline' 
                        : 'text-on-surface-variant border-outline-variant hover:border-outline'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative h-[300px] w-full chart-grid border-l border-b border-[#222222]">
              <svg className="absolute inset-0 w-full h-full p-4" preserveAspectRatio="none" viewBox="0 0 1000 300">
                <path 
                  d="M0,280 L100,250 L200,260 L300,200 L400,210 L500,150 L600,160 L700,100 L800,80 L900,40 L1000,30" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2" 
                  vectorEffect="non-scaling-stroke"
                ></path>
                <path 
                  d="M0,280 L100,250 L200,260 L300,200 L400,210 L500,150 L600,160 L700,100 L800,80 L900,40 L1000,30 L1000,300 L0,300 Z" 
                  fill="url(#chartGradient)" 
                  stroke="none"
                ></path>
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="white" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
                <span className="text-on-surface-variant font-mono-data text-label-md">150k</span>
                <span className="text-on-surface-variant font-mono-data text-label-md">100k</span>
                <span className="text-on-surface-variant font-mono-data text-label-md">50k</span>
                <span className="text-on-surface-variant font-mono-data text-label-md">0</span>
              </div>
            </div>
          </div>

          {/* Recent Donations Table */}
          <div className="bg-[#111111] border border-[#222222] overflow-hidden">
            <div className="p-stack-md border-b border-[#222222] flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-primary">Recent Donations</h3>
              <a className="text-on-surface-variant font-label-md text-label-md hover:text-primary underline" href="#view-all">View All</a>
            </div>
            
            <div className="overflow-x-auto">
              {isDonationsLoading ? (
                <div className="py-8 text-center font-mono-data text-on-surface-variant">
                  Loading contributions...
                </div>
              ) : (
                <table className="w-full text-left font-body-md text-body-md min-w-[500px]">
                  <thead className="bg-black/40 text-on-surface-variant border-b border-[#222222]">
                    <tr>
                      <th className="px-stack-md py-3 font-medium">Contributor Address</th>
                      <th className="px-stack-md py-3 font-medium">Amount</th>
                      <th className="px-stack-md py-3 font-medium">Status</th>
                      <th className="px-stack-md py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222]">
                    {donations.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-stack-md py-8 text-center text-on-surface-variant font-mono-data">
                          No donations recorded yet for this campaign.
                        </td>
                      </tr>
                    ) : (
                      donations.map((d) => (
                        <tr key={d.id} className="hover:bg-surface-container-low transition-colors group">
                          <td className="px-stack-md py-4 font-mono-data text-on-surface">{d.address}</td>
                          <td className="px-stack-md py-4 font-mono-data text-primary">{d.amount}</td>
                          <td className="px-stack-md py-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-highest text-primary text-label-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> {d.status}
                            </span>
                          </td>
                          <td className="px-stack-md py-4 text-on-surface-variant">{d.time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline & Tools */}
        <div className="space-y-gutter">
          <div className="bg-[#111111] border border-[#222222] p-stack-lg">
            <h3 className="font-headline-md text-headline-md text-primary mb-stack-md">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-stack-sm">
              <button className="flex items-center gap-stack-md p-stack-md bg-black/50 border border-outline-variant hover:border-primary transition-all text-left">
                <span className="material-symbols-outlined text-on-surface-variant">deskphone</span>
                <div>
                  <div className="font-label-md text-label-md font-bold text-primary">Post Update</div>
                  <div className="text-on-surface-variant font-body-md text-body-md">Inform your backers about progress.</div>
                </div>
              </button>
              <button className="flex items-center gap-stack-md p-stack-md bg-black/50 border border-outline-variant hover:border-primary transition-all text-left">
                <span className="material-symbols-outlined text-on-surface-variant">share</span>
                <div>
                  <div className="font-label-md text-label-md font-bold text-primary">Share Campaign</div>
                  <div className="text-on-surface-variant font-body-md text-body-md">Get the word out on socials.</div>
                </div>
              </button>
              <button className="flex items-center gap-stack-md p-stack-md bg-black/50 border border-outline-variant hover:border-primary transition-all text-left">
                <span className="material-symbols-outlined text-on-surface-variant">settings</span>
                <div>
                  <div className="font-label-md text-label-md font-bold text-primary">Payout Settings</div>
                  <div className="text-on-surface-variant font-body-md text-body-md">Configure your destination keys.</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#222222] p-stack-lg h-full">
            <h3 className="font-headline-md text-headline-md text-primary mb-stack-lg">Campaign Timeline</h3>
            {isTimelineLoading ? (
              <div className="py-4 text-center font-mono-data text-on-surface-variant">
                Loading timeline...
              </div>
            ) : (
              <div className="space-y-stack-lg relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-[#222222]">
                {timeline.length === 0 ? (
                  <div className="text-on-surface-variant font-mono-data text-body-md py-4 text-center">
                    No events recorded yet.
                  </div>
                ) : (
                  timeline.map((item, idx) => (
                    <div key={item.id} className="relative pl-8">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-black z-10 ${
                        idx === 0 ? 'bg-primary' : 'bg-outline-variant'
                      }`}></div>
                      <div className="text-on-surface-variant font-label-md text-label-md mb-1 uppercase tracking-tighter">{item.time}</div>
                      <div className="text-primary font-label-md text-label-md font-bold">{item.title}</div>
                      <p className="text-on-surface-variant font-body-md text-body-md mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </main>
  );
};

export default DashboardPage;
