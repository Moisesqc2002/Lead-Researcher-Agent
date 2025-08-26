import { useEffect, useState } from 'react';
import { campaignApi, Campaign } from '@/lib/api';

interface UseCampaignPollingOptions {
  campaignId: string;
  enabled?: boolean;
  interval?: number; // in milliseconds
  onStatusChange?: (newStatus: Campaign['status']) => void;
}

export function useCampaignPolling({
  campaignId,
  enabled = true,
  interval = 3000, // 3 seconds
  onStatusChange
}: UseCampaignPollingOptions) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !campaignId) return;

    let intervalId: NodeJS.Timeout;
    let isMounted = true;

    const pollCampaign = async () => {
      try {
        const updatedCampaign = await campaignApi.getCampaign(campaignId);
        
        if (!isMounted) return;

        const previousStatus = campaign?.status;
        setCampaign(updatedCampaign);
        setError(null);

        // Call onStatusChange if status changed
        if (previousStatus && previousStatus !== updatedCampaign.status && onStatusChange) {
          onStatusChange(updatedCampaign.status);
        }

        // Stop polling if campaign is completed or failed
        if (updatedCampaign.status === 'COMPLETED' || updatedCampaign.status === 'FAILED') {
          setIsPolling(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch campaign');
        }
      }
    };

    // Initial fetch
    pollCampaign();

    // Set up polling if campaign is still researching
    if (isPolling && (!campaign || campaign.status === 'RESEARCHING')) {
      intervalId = setInterval(pollCampaign, interval);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [campaignId, enabled, isPolling, interval, onStatusChange, campaign?.status]);

  return {
    campaign,
    isPolling,
    error,
    stopPolling: () => setIsPolling(false),
    startPolling: () => setIsPolling(true)
  };
}