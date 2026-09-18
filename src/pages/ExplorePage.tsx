import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';
import { donateToCampaignContract } from '../lib/stellarContract';
import { getCampaigns, recordDonationLocally } from '../services/contractRead';
import { emitEvent } from '../services/contractEvents';
import { trackEvent, captureError } from '../lib/monitoring';
import DonationModal from '../components/DonationModal';
import SkeletonCard from '../components/SkeletonCard';

interface Campaign {
  id: number;
  tag: string;
  title: string;
  desc: string;
  creator: string;
  raised: number;
  goal: number;
  timeLeft: string;
  funded: boolean;
  ended: boolean;
  bgUrl: string;
}

const INITIAL_CAMPAIGNS_BG = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBw1YphEAikmxEj0Gwdn_RypbMrZjjiHNnl4GXysOxUAa4imIquD88miykWd8PHqxh6ClLGCZ67vQT9-wn0V_TmnvRBlU6bdXXfZdtG8Ot8JiaVqfZuliFnbCIKCQYQMGyVrunEsxMo0rAjkGPzgaRxCMjZWNOD7v_cXeiixCiajmpYKDei-6f-QJw9rpq9RAqr3pZvG6t0FFHtaxvxsU6RCEYaPiGQE-ZixM7YOGafsVTaJNKqXJ0MzhQutVG2b-L5CEKkMAUlDU5S",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuQNGEaPSAH2jMJmDedkSO667oCVOaID4pUCKNbP5o6RDGnRQFRFyrLSIgha57_1TPXcmzha_ozBNW-4ArS-wa5IWj3gGZCHHDnBoTmJIxl4cwB_TbpZ6kdyHf2k34jkUPXQ5th0fN0_XtZxgZuwtmFahlUegbSv07svL-yc8e5p08qwY6fl3r0Nr9juBkGIkuTuRIqxt8cgrXIAiXNbsQXXg3zK2AyrCKa5FuRWIgB_8OTcjfKE0eiH1wNFmZI0DB2W1tNw9UdB_pE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAu1cwPfZ8MEtuYdo-mk2xhBIoQgYy5q4WLbavjQIT_fhS8VGqndBXANB9y-ct36INYS2FdAmS8Emo5zd3fbaIPJpbcDU64XkrV-fcrbEem5LtQOV72uHl7KSM2PikZkQ0e7e86M4MTg9WHIRdC7JnP9Xs1wyKeOvT1AJlhI7dLBJg-06aZzIsTcx3g3jvnplUGm_TsUI1MIVkwKyPRDr8a0uTGGX62jP3cAW43sEjDLq7T5L1g83pboVHuCeqfcJXA9DUnLMhvpu-h",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC3JJMO_HTwSkrIdZ3XckS7qiPT8vzoVkuG-V1y2RdNZQLK3b5LLA8aYmnSy3yF2eXnw8cjQ3x5_YoAC88l0IB9ZYCVBorEwwBd2yR_IR9vh7oaBQmW6o1qq_DFlDcjpxavhRzwyJTnwda3sdgCedVBpQodYusQPNAbNkTWkHWsqZXKTUhwdJt9fGL2661HVL13csS_XDTbFYp4lWrG2azG2Gpi04PErRkrsrUUE_O4t_icHHD1WB1kbleqKTcBaufStJ6csUuejrnV",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8Qn6avX0TdMbvx7lcBTigpmGZg0_LLuFL_bvZBWG9Q5Sz5QuMm_hXZqU6N8haFzJlnfVEAVesVt4wLtUnrhHfasTwHDSt_riGNbB96vpE0sbHnQU9CRKzI2R1xF3AUrD26KKO2HD-0Z4AsoFPkDLf_l4ruMIszkadKaj3zNLGm4XLK4BBMgvFV4nDTLHbKnRS3KwWedTaDwDiXakZO-Nq8mr5VJSduY61WTSjbw4jpbS-GtXJV69w3itKI8SVwnTOYXsSuWwAcfL0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBOsMSx2nqsuacfnXKKHaIoJ_WkachWetqC9x08oenqTWK65qSLfkvVvsRzmcR5YtNvX0LSDTzOVf6gmi_CfLflXlRhAQMXSy0QP4hVjgUQyDptzYwe7nKD8wkbo5kcgTiehEItN4iLJmkUoUhfXrVnRhbPTgCvyFK_ZCjHNHA1ASSkevxETN-mDsd3zIV5DEhA1JuOQHy7RkvLbgTEal2Q3nLm0Pu0uZNCT0GLUN232IDghlwoVWpzfZVVjzCf3fhBws8zxB18mb6w"
];

const ExplorePage = () => {
  const { isConnected, address: walletAddress, signTx, refreshBalance } = useWallet();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ACTIVE' | 'FUNDED' | 'ENDED'>('ACTIVE');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isDonatingId, setIsDonatingId] = useState<number | null>(null);
  const [donationTarget, setDonationTarget] = useState<{ id: number; title: string } | null>(null);

  const queryClient = useQueryClient();

  // Fetch campaigns via TanStack Query
  const { data: campaigns = [], isLoading, isError, refetch } = useQuery<Campaign[]>({
    queryKey: ['campaigns', search, activeFilter],
    queryFn: async () => {
      const data = await getCampaigns(search, activeFilter);
      return data.map((d: any, idx: number) => ({
        id: d.id,
        tag: d.category.toUpperCase().slice(0, 4),
        title: d.title,
        desc: d.description,
        creator: d.creator ? (d.creator.slice(0, 6) + '...' + d.creator.slice(-4)) : 'Soroban',
        raised: Number(d.raised_xlm),
        goal: Number(d.goal_xlm),
        timeLeft: d.status === 'ACTIVE' ? '12 Days Left' : (d.status === 'FUNDED' ? 'Funded' : 'Ended'),
        funded: d.status === 'FUNDED' || d.status === 'ENDED',
        ended: d.status === 'ENDED',
        bgUrl: INITIAL_CAMPAIGNS_BG[idx % INITIAL_CAMPAIGNS_BG.length]
      }));
    },
    placeholderData: []
  });

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 3, 244));
  };

  const openDonationModal = (c: Campaign) => {
    if (!isConnected || !walletAddress) {
      showToast('info', 'Wallet required', 'Please connect your Stellar wallet to donate.');
      return;
    }
    setDonationTarget({ id: c.id, title: c.title });
  };

  const handleDonate = async (amount: number) => {
    if (!donationTarget || !walletAddress) return;
    const { id, title } = donationTarget;
    setDonationTarget(null);
    setIsDonatingId(id);

    try {
      // 1. Submit real Soroban transaction
      const txHash = await donateToCampaignContract(walletAddress, signTx, id, amount);

      // 2. Report transaction to local store
      await recordDonationLocally(id, walletAddress, amount, txHash);

      // 3. Emit local event for Terminal page updates
      emitEvent({
        type: 'DonationReceived',
        payload: {
          campaignId: id,
          backerAddress: walletAddress,
          amount,
          contractId: 'treasury',
          txHash,
        }
      });

      // 4. Track success event
      trackEvent('donation_success', { campaignId: id, amount, title });

      showToast('success', 'Donation successful!', `${amount} XLM donated to "${title}". Tx: ${txHash.slice(0, 10)}...`);

      // Invalidate queries to refresh state
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      refreshBalance();
    } catch (err: any) {
      captureError(err, { campaignId: id, amount });
      const msg: string = err?.message ?? String(err);
      if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('denied')) {
        showToast('info', 'Donation cancelled', 'You rejected the transaction in your wallet.');
      } else {
        showToast('error', 'Donation failed', msg || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsDonatingId(null);
    }
  };

  return (
    <main className="pt-32 pb-stack-lg px-margin-desktop w-full max-w-container-max mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-stack-lg gap-stack-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-sm animate-in fade-in duration-500">Explore Campaigns</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
            Discover and back the next generation of decentralized innovation on the Stellar network. Purely transparent, fully auditable.
          </p>
        </div>
        <Link
          to="/terminal"
          className="flex gap-stack-sm items-center font-mono-data text-mono-data bg-surface-container-lowest border border-outline-variant px-stack-md py-stack-sm rounded hover:border-primary transition-all duration-300"
        >
          <span className="text-on-surface-variant">Live Nodes:</span>
          <span className="text-primary font-bold">1,402</span>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-stack-md mb-stack-lg items-center">
        <div className={`relative w-full lg:flex-1 transition-all duration-200 ${isSearchFocused ? 'scale-[1.01]' : ''}`}>
          <span className="material-symbols-outlined absolute left-stack-md top-1/2 -translate-y-1/2 text-outline" aria-hidden="true">search</span>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant pl-12 pr-stack-md py-stack-md rounded font-body-md focus:border-primary focus:ring-0 transition-all outline-none text-white animate-fade-in"
            placeholder="Search projects by name, tag, or creator..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            aria-label="Search campaigns"
          />
        </div>

        <div className="flex items-center gap-stack-sm overflow-x-auto no-scrollbar w-full lg:w-auto">
          {(['ACTIVE', 'FUNDED', 'ENDED'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`px-stack-md py-stack-sm rounded font-label-md text-label-md whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                activeFilter === filter
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-surface-container-low border border-outline-variant text-on-surface-variant hover:border-outline'
              }`}
            >
              {filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
          <div className="h-8 w-[1px] bg-outline-variant mx-stack-sm" aria-hidden="true" />
          <button className="bg-surface-container-low border border-outline-variant text-on-surface-variant hover:border-outline px-stack-md py-stack-sm rounded font-label-md text-label-md whitespace-nowrap transition-colors flex items-center gap-1">
            Most Funded <span className="material-symbols-outlined text-[16px]" aria-hidden="true">expand_more</span>
          </button>
          <button className="bg-surface-container-low border border-outline-variant text-on-surface-variant hover:border-outline px-stack-md py-stack-sm rounded font-label-md text-label-md whitespace-nowrap transition-colors flex items-center gap-1">
            Newest <span className="material-symbols-outlined text-[16px]" aria-hidden="true">expand_more</span>
          </button>
        </div>
      </div>

      {/* Campaign Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter" role="status" aria-label="Loading campaigns">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 border border-outline-variant bg-surface-container-lowest rounded-lg">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">wifi_off</span>
          <p className="text-on-surface-variant font-headline-md mb-4">Failed to load campaigns.</p>
          <button
            onClick={() => refetch()}
            className="border border-outline-variant px-stack-lg py-stack-md rounded font-label-md text-primary hover:bg-surface-container-highest transition-all"
          >
            Retry
          </button>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 border border-outline-variant bg-surface-container-lowest rounded-lg">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">folder_off</span>
          <p className="text-on-surface-variant font-headline-md mb-2">No campaigns found.</p>
          <p className="text-on-surface-variant font-body-md mb-6">
            {search ? `No results for "${search}".` : 'Be the first to launch one!'}
          </p>
          <Link
            to="/launch"
            className="inline-block bg-primary text-on-primary px-6 py-3 font-label-md font-bold rounded hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Launch a Campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {campaigns.slice(0, visibleCount).map((c, i) => {
            const progress = Math.min((c.raised / c.goal) * 100, 100);
            const isDonating = isDonatingId === c.id;

            return (
              <article
                key={c.id}
                className="stagger-in card-hover-lift flex flex-col bg-[#111111] border border-[#222222] rounded-lg overflow-hidden"
                style={{ animationDelay: `${(i + 1) * 0.1}s` }}
              >
                <div className="relative h-48 w-full group">
                  <div
                    className="w-full h-full bg-cover bg-center grayscale opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundImage: `url('${c.bgUrl}')` }}
                    role="img"
                    aria-label={`Campaign image for ${c.title}`}
                  />
                  <div className="absolute top-stack-sm right-stack-sm bg-surface-container-lowest/80 backdrop-blur-md px-stack-sm py-1 rounded border border-outline-variant">
                    <span className="font-mono-data text-label-md text-primary">{c.tag}</span>
                  </div>
                </div>

                <div className="p-stack-md flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-stack-sm">
                    <h3 className="font-headline-md text-headline-md text-primary leading-tight">{c.title}</h3>
                    <button
                      aria-label={`Bookmark ${c.title}`}
                      className="text-outline-variant hover:text-primary cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded"
                    >
                      <span className="material-symbols-outlined">bookmark</span>
                    </button>
                  </div>

                  <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md line-clamp-2">
                    {c.desc}
                  </p>

                  <div className="mt-auto">
                    <div className="flex items-center gap-stack-sm mb-stack-md">
                      <div className="w-6 h-6 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-mono-data text-[8px] text-primary" aria-hidden="true">ID</div>
                      <span className="font-mono-data text-label-md text-outline">{c.creator}</span>
                    </div>

                    <div className="space-y-stack-sm">
                      <div className="flex justify-between font-mono-data text-label-md">
                        <span className="text-on-surface-variant">
                          Raised: <span className="text-primary font-bold">{c.raised.toLocaleString()} XLM</span>
                        </span>
                        <span className="text-outline" aria-label={`${Math.round(progress)}% funded`}>{Math.round(progress)}%</span>
                      </div>

                      <div className="w-full h-1 bg-[#222222] rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>

                      <div className="flex justify-between font-mono-data text-label-md text-outline pt-stack-sm">
                        <span>Goal: {c.goal.toLocaleString()} XLM</span>
                        {c.ended ? (
                          <span className="text-primary font-bold">Ended</span>
                        ) : (
                          <span className="text-primary">{c.timeLeft}</span>
                        )}
                      </div>
                    </div>

                    {c.ended ? (
                      <button
                        className="w-full mt-stack-lg bg-surface-container-highest text-on-surface-variant py-stack-md font-label-md text-label-md font-bold uppercase tracking-widest cursor-not-allowed"
                        disabled
                        aria-disabled="true"
                      >
                        Campaign Ended
                      </button>
                    ) : (
                      <button
                        onClick={() => openDonationModal(c)}
                        disabled={isDonating}
                        aria-disabled={isDonating}
                        aria-label={`Donate to ${c.title}`}
                        className="w-full mt-stack-lg bg-primary text-on-primary py-stack-md font-label-md text-label-md font-bold uppercase tracking-widest hover:bg-secondary-fixed transition-all active:scale-[0.98] duration-100 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                      >
                        {isDonating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                            Processing...
                          </>
                        ) : (
                          'Donate'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination / Load More */}
      {!isLoading && !isError && campaigns.length > 0 && (
        <div className="mt-stack-lg flex flex-col items-center gap-stack-md border-t border-outline-variant pt-stack-lg">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Showing {Math.min(campaigns.length, visibleCount)} of {campaigns.length} campaigns
          </p>
          {campaigns.length > visibleCount && (
            <button
              onClick={loadMore}
              className="border border-outline-variant px-stack-lg py-stack-md rounded font-label-md text-label-md hover:bg-surface-container-highest transition-all group flex items-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Load More
              <span className="material-symbols-outlined ml-2 group-hover:translate-y-1 transition-transform" aria-hidden="true">expand_more</span>
            </button>
          )}
        </div>
      )}

      {/* Donation Modal */}
      <DonationModal
        isOpen={!!donationTarget}
        campaignTitle={donationTarget?.title ?? ''}
        onConfirm={handleDonate}
        onClose={() => setDonationTarget(null)}
      />
    </main>
  );
};

export default ExplorePage;
