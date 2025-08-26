'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, campaignApi, Campaign } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CampaignList } from '@/components/dashboard/campaign-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(authApi.getCurrentUser());
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const loadCampaigns = async () => {
      try {
        const campaignsData = await campaignApi.getCampaigns();
        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, [user, router]);

  const handleCreateCampaign = () => {
    router.push('/dashboard/campaigns/new');
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Campaigns</h1>
        <Button onClick={handleCreateCampaign}>
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>
      
      <div className="mt-8">
        <CampaignList campaigns={campaigns} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}