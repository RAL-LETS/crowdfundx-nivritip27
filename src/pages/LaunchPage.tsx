import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../contexts/ToastContext';
import { createCampaignContract } from '../lib/stellarContract';
import { saveCampaignLocally } from '../services/contractRead';
import { emitEvent } from '../services/contractEvents';
import { trackEvent, captureError } from '../lib/monitoring';
import { 
  validateCampaignTitle, 
  validateDescription, 
  validateGoalAmount,
  sanitizeInput
} from '../lib/validation';

const LaunchPage = () => {
  const navigate = useNavigate();
  const { isConnected, address: walletAddress, signTx, refreshBalance } = useWallet();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology & Hardware');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState(30);

  // Validation Error States
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = async () => {
    // Clear previous step errors
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      const titleRes = validateCampaignTitle(title);
      if (!titleRes.valid) {
        newErrors.title = titleRes.error || 'Invalid title';
      }

      const descRes = validateDescription(description);
      if (!descRes.valid) {
        newErrors.description = descRes.error || 'Invalid description';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        showToast('error', 'Validation Error', 'Please check the details you entered.');
        return;
      }

      setCurrentStep(1);
    } else if (currentStep === 1) {
      const goalRes = validateGoalAmount(goal);
      if (!goalRes.valid) {
        newErrors.goal = goalRes.error || 'Invalid goal amount';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        showToast('error', 'Validation Error', 'Please check the details you entered.');
        return;
      }

      setCurrentStep(2);
    } else {
      // Final submission (step 2)
      if (!isConnected || !walletAddress) {
        showToast('info', 'Wallet required', 'Please connect your Stellar wallet first!');
        return;
      }
      
      const goalNum = Number(goal);
      const goalRes = validateGoalAmount(goal);
      if (!goalRes.valid) {
        showToast('error', 'Validation Error', goalRes.error || 'Invalid goal amount');
        return;
      }

      setIsSubmitting(true);
      
      try {
        const sanitizedTitle = sanitizeInput(title);
        const sanitizedDescription = sanitizeInput(description);

        // 1. Submit transaction to registry contract on ledger
        const contractResult = await createCampaignContract(walletAddress, signTx, {
          title: sanitizedTitle,
          description: sanitizedDescription,
          category,
          goalXlm: goalNum,
          durationDays: duration,
        });
        
        const campaignId = contractResult.campaignId || Math.floor(Math.random() * 1000000);
        const campaignContractId = `C_REGISTRY_ID_${campaignId || Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        // 2. Save campaign details locally
        await saveCampaignLocally({
          id: campaignId,
          title: sanitizedTitle,
          description: sanitizedDescription,
          category,
          goal_xlm: goalNum,
          duration_days: duration,
          contract_id: campaignContractId,
          raised_xlm: 0,
          status: 'ACTIVE',
          creator: walletAddress,
          created_at: new Date().toISOString(),
        });

        // 3. Emit local creation event for Terminal page updates
        emitEvent({
          type: 'CampaignCreated',
          payload: {
            campaignId: campaignId,
            creator: walletAddress,
            title: sanitizedTitle,
            description: sanitizedDescription,
            category,
            goalXlm: goalNum,
            durationDays: duration,
            contractId: campaignContractId,
            txHash: contractResult.txHash,
          }
        });

        // 4. Track monitoring events
        trackEvent('campaign_creation_success', {
          campaignId,
          category,
          goalXlm: goalNum,
          durationDays: duration,
        });

        setTxHash(contractResult.txHash);
        setIsSubmitted(true);
        refreshBalance();
        showToast('success', 'Campaign Created!', 'Your campaign was successfully deployed to Stellar!');
      } catch (err: any) {
        captureError(err, { context: 'campaign_creation', title, goal });
        const errMsg = err.message || String(err);
        
        if (errMsg.toLowerCase().includes('reject') || errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('denied')) {
          showToast('info', 'Transaction Rejected', 'You cancelled the signing request.');
        } else {
          showToast('error', 'Stellar Soroban Error', `Failed to launch campaign: ${errMsg}`);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  return (
    <main className="flex-grow pt-32 pb-stack-lg px-margin-mobile md:px-margin-desktop">
      <div className="max-w-2xl mx-auto">
        
        {/* Form Header & Stepper */}
        {!isSubmitted && (
          <div className="mb-stack-lg text-center">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-sm animate-in fade-in">Launch your vision</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Step {currentStep + 1} of 3</p>
            <div className="flex justify-between items-center mt-stack-lg relative px-4">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant -z-10"></div>
              
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono-data text-mono-data font-bold ring-4 ring-background transition-all ${
                  currentStep >= 0 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                1
              </div>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono-data text-mono-data font-bold ring-4 ring-background transition-all ${
                  currentStep >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                2
              </div>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono-data text-mono-data font-bold ring-4 ring-background transition-all ${
                  currentStep >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                3
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="glass-panel p-stack-lg rounded-xl">
          {isSubmitting ? (
            <div className="py-stack-lg flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin mb-stack-md"></div>
              <p className="font-headline-md text-headline-md text-primary">Publishing to Stellar...</p>
              <p className="font-body-md text-on-surface-variant mt-stack-sm">Securing your smart contract on the ledger.</p>
            </div>
          ) : isSubmitted ? (
            <div className="py-stack-lg flex flex-col items-center justify-center text-center animate-fade-in">
              <span className="material-symbols-outlined text-[64px] text-primary mb-stack-md">check_circle</span>
              <p className="font-headline-lg text-headline-lg text-primary animate-pulse">Live on Stellar</p>
              <p className="font-body-md text-on-surface-variant mt-stack-sm mb-stack-lg">
                Transaction Hash: <span className="font-mono-data text-primary break-all">{txHash}</span>
              </p>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="bg-primary text-on-primary font-label-md px-stack-lg py-stack-md rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                View Campaign Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => e.preventDefault()}>
              
              {/* Step 1: Basic Details */}
              {currentStep === 0 && (
                <div className="step-transition active-step space-y-stack-md">
                  <div className="space-y-stack-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant block">CAMPAIGN TITLE</label>
                    <input 
                      className={`w-full bg-surface-container-lowest border ${errors.title ? 'border-red-500' : 'border-outline-variant'} text-on-surface p-stack-md rounded-lg font-body-md focus:border-primary transition-colors text-white outline-none`} 
                      placeholder="Project name" 
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                      }}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-xs mt-1 font-mono-data">{errors.title}</p>
                    )}
                  </div>
                  <div className="space-y-stack-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant block">DESCRIPTION</label>
                    <textarea 
                      className={`w-full bg-surface-container-lowest border ${errors.description ? 'border-red-500' : 'border-outline-variant'} text-on-surface p-stack-md rounded-lg font-body-md focus:border-primary transition-colors text-white outline-none`} 
                      placeholder="Tell the world why they should care about your mission..." 
                      rows={4}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                      }}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs mt-1 font-mono-data">{errors.description}</p>
                    )}
                  </div>
                  <div className="space-y-stack-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant block">CATEGORY</label>
                    <select 
                      className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface p-stack-md rounded-lg font-body-md focus:border-primary transition-colors appearance-none text-white outline-none"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Technology & Hardware">Technology &amp; Hardware</option>
                      <option value="DeFi & Web3 Tools">DeFi &amp; Web3 Tools</option>
                      <option value="Environmental Sustainability">Environmental Sustainability</option>
                      <option value="Digital Art & NFTs">Digital Art &amp; NFTs</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Funding Details */}
              {currentStep === 1 && (
                <div className="step-transition active-step space-y-stack-md">
                  <div className="space-y-stack-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant block">GOAL AMOUNT (XLM)</label>
                    <div className="relative">
                      <input 
                        className={`w-full bg-surface-container-lowest border ${errors.goal ? 'border-red-500' : 'border-outline-variant'} text-on-surface p-stack-md rounded-lg font-mono-data text-body-md focus:border-primary transition-colors pr-16 text-white outline-none`} 
                        placeholder="0.00" 
                        type="number"
                        value={goal}
                        onChange={(e) => {
                          setGoal(e.target.value);
                          if (errors.goal) setErrors(prev => ({ ...prev, goal: '' }));
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-md text-outline">XLM</span>
                    </div>
                    {errors.goal && (
                      <p className="text-red-500 text-xs mt-1 font-mono-data">{errors.goal}</p>
                    )}
                    <p className="text-[10px] text-outline uppercase tracking-widest">Powered by Stellar Network</p>
                  </div>
                  <div className="space-y-stack-sm">
                    <label className="font-label-md text-label-md text-on-surface-variant block">CAMPAIGN DURATION (DAYS)</label>
                    <input 
                      className="w-full h-1 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-primary" 
                      max="90" 
                      min="7" 
                      type="range"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    />
                    <div className="flex justify-between font-mono-data text-label-md text-on-surface-variant">
                      <span>7 Days</span>
                      <span className="text-primary font-bold">{duration} Days</span>
                      <span>90 Days</span>
                    </div>
                  </div>
                  <div className="bg-surface-container p-stack-md rounded-lg border border-outline-variant/30 flex items-start gap-stack-sm">
                    <span className="material-symbols-outlined text-primary text-body-lg">info</span>
                    <p className="font-body-md text-[12px] text-on-surface-variant">Your funds will be held in a smart contract and released only if the goal is met within the deadline.</p>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 2 && (
                <div className="step-transition active-step">
                  <div className="space-y-stack-md">
                    <h3 className="font-headline-md text-headline-md text-primary">Final Verification</h3>
                    <div className="divide-y divide-outline-variant border-t border-b border-outline-variant">
                      <div className="py-stack-md flex justify-between">
                        <span className="font-label-md text-on-surface-variant">PROJECT NAME</span>
                        <span className="font-body-md text-primary">{title || 'Untitled Project'}</span>
                      </div>
                      <div className="py-stack-md flex justify-between">
                        <span className="font-label-md text-on-surface-variant">TARGET GOAL</span>
                        <span className="font-mono-data text-primary">{goal || '0'} XLM</span>
                      </div>
                      <div className="py-stack-md flex justify-between">
                        <span className="font-label-md text-on-surface-variant">DURATION</span>
                        <span className="font-body-md text-primary">{duration} Days</span>
                      </div>
                      <div className="py-stack-md flex justify-between">
                        <span className="font-label-md text-on-surface-variant">CATEGORY</span>
                        <span className="font-body-md text-primary">{category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-stack-lg flex gap-stack-md pt-stack-lg border-t border-outline-variant">
                {currentStep > 0 && (
                  <button 
                    onClick={handleBack}
                    className="flex-1 border border-outline-variant text-primary font-label-md py-stack-md rounded-lg hover:bg-surface-container-highest transition-all duration-100" 
                    type="button"
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  className="flex-1 bg-primary text-on-primary font-label-md py-stack-md rounded-lg hover:bg-opacity-90 transition-all font-bold active:scale-[0.98] duration-100" 
                  type="button"
                >
                  {currentStep === 2 ? 'Publish Campaign' : 'Next'}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </main>
  );
};

export default LaunchPage;
