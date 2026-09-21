import { rpc, scValToNative } from 'stellar-sdk';
import { STELLAR_CONFIG } from '../config/stellar';

const rpcServer = new rpc.Server(STELLAR_CONFIG.RPC_URL);

export interface BlockchainEvent {
  type: 'CampaignCreated' | 'DonationReceived' | 'GoalReached' | 'CampaignClosed';
  payload: any;
}

type EventCallback = (event: BlockchainEvent) => void;
const subscribers: Set<EventCallback> = new Set();

export const subscribeToEvents = (callback: EventCallback) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const emitEvent = (event: BlockchainEvent) => {
  subscribers.forEach(cb => cb(event));
};

// ----------------------------------------------------
// DIRECT RPC CLIENT-SIDE EVENT POLLING
// ----------------------------------------------------
let isPollingActive = false;
let lastPolledLedger = 0;

export const startRpcEventPolling = (queryClient: any) => {
  if (isPollingActive) return;
  isPollingActive = true;

  const poll = async () => {
    if (!isPollingActive) return;

    try {
      const latestLedgerRes = await rpcServer.getLatestLedger();
      const currentLedger = latestLedgerRes.sequence;

      if (lastPolledLedger === 0) {
        lastPolledLedger = currentLedger - 20; // Look back slightly
      }

      if (currentLedger > lastPolledLedger) {
        const eventsRes = await rpcServer.getEvents({
          startLedger: lastPolledLedger,
          filters: [
            {
              type: 'contract',
              contractIds: [
                STELLAR_CONFIG.REGISTRY_CONTRACT_ID,
                STELLAR_CONFIG.TREASURY_CONTRACT_ID,
              ].filter(Boolean) as string[],
            }
          ],
          limit: 100
        });

        if (eventsRes.events && eventsRes.events.length > 0) {
          eventsRes.events.forEach(evt => {
            try {
              const topics = (evt.topic || []).map(t => scValToNative(t));
              const eventType = topics[0] as string;
              const decodedValue = evt.value ? scValToNative(evt.value) : null;

              // Event decoded: eventType with topics and decodedValue

              if (eventType === 'created') {
                const campaignId = Number(topics[1]);
                const creator = topics[2] as string;
                const [title, description, category, goalXlm, durationDays] = decodedValue;

                emitEvent({
                  type: 'CampaignCreated',
                  payload: {
                    campaignId,
                    creator,
                    title,
                    description,
                    category,
                    goalXlm: Number(goalXlm),
                    durationDays: Number(durationDays),
                    contractId: evt.contractId,
                    txHash: evt.id
                  }
                });
              } 
              else if (eventType === 'donation') {
                const campaignId = Number(topics[1]);
                const backerAddress = topics[2] as string;
                const amount = Number(decodedValue);

                emitEvent({
                  type: 'DonationReceived',
                  payload: {
                    campaignId,
                    backerAddress,
                    amount,
                    contractId: evt.contractId,
                    txHash: evt.id
                  }
                });
              }
              else if (eventType === 'goal_met') {
                const campaignId = Number(topics[1]);
                emitEvent({
                  type: 'GoalReached',
                  payload: {
                    campaignId,
                    totalRaised: Number(decodedValue || 0),
                    contractId: evt.contractId,
                    txHash: evt.id
                  }
                });
              }
            } catch (err) {
              console.error('Error parsing polled event:', err);
            }
          });

          // Invalidate React Query caches to trigger updates
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
          queryClient.invalidateQueries({ queryKey: ['campaign'] });
          queryClient.invalidateQueries({ queryKey: ['donations'] });
          queryClient.invalidateQueries({ queryKey: ['timeline'] });
        }

        lastPolledLedger = currentLedger;
      }
    } catch (e) {
      console.warn('Failed to poll Soroban events:', e);
    }

    // Schedule next poll
    setTimeout(poll, 6000);
  };

  poll();

  return () => {
    isPollingActive = false;
  };
};
