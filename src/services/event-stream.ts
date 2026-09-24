import { startRpcEventPolling } from './contractEvents';

export const startEventSubscription = (queryClient: any) => {
  return startRpcEventPolling(queryClient);
};

export default startEventSubscription;
