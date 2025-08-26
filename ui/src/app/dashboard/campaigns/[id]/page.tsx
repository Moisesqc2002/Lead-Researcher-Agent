'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CopilotChat } from '@/components/copilot/copilot-chat';
import { LeadTable } from '@/components/leads/lead-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { campaignApi, Campaign } from '@/lib/api';
import { useCampaignPolling } from '@/hooks/use-campaign-polling';
import { ArrowLeft, Download, Play, RefreshCw } from 'lucide-react';

export default function CampaignPage() {
  const params = useParams();
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);

  // Use polling hook for real-time updates
  const { campaign, isPolling, error } = useCampaignPolling({
    campaignId: params.id as string,
    enabled: !!params.id,
    onStatusChange: (newStatus) => {
      console.log(`Campaign status changed to: ${newStatus}`);
      if (newStatus === 'COMPLETED') {
        // Could show a success toast here
        console.log('Research completed! New leads available.');
      }
    }
  });

  useEffect(() => {
    if (campaign || error) {
      setInitialLoading(false);
    }
    
    if (error && initialLoading) {
      router.push('/dashboard');
    }
  }, [campaign, error, initialLoading, router]);

  const handleStartResearch = async () => {
    if (!campaign) return;
    
    try {
      await campaignApi.updateCampaignStatus(campaign.id, 'RESEARCHING');
      // No need to manually update state - polling will handle it
    } catch (error) {
      console.error('Failed to start research:', error);
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      RESEARCHING: { variant: 'default' as const, label: 'Researching' },
      COMPLETED: { variant: 'default' as const, label: 'Complete' },
      FAILED: { variant: 'destructive' as const, label: 'Failed' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={
        status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''
      }>
        {config.label}
      </Badge>
    );
  };

  if (initialLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 bg-background border-r border-border animate-pulse">
          <div className="h-16 border-b border-border p-4">
            <div className="h-6 bg-muted rounded w-3/4"></div>
          </div>
        </div>
        <div className="flex-1 animate-pulse">
          <div className="p-6">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div>Campaign not found</div>
      </DashboardLayout>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Dashboard Layout */}
      <div className="w-64 bg-background border-r border-border flex-shrink-0">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold">Campaign</span>
          </div>
          
          {/* Campaign Info */}
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm text-muted-foreground mb-2">CAMPAIGN DETAILS</h2>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{campaign.name}</h3>
              {isPolling && campaign.status === 'RESEARCHING' && (
                <RefreshCw className="h-4 w-4 text-primary animate-spin" />
              )}
            </div>
            {getStatusBadge(campaign.status)}
            {campaign.description && (
              <p className="text-sm text-muted-foreground mt-2">{campaign.description}</p>
            )}
            {campaign.status === 'RESEARCHING' && (
              <div className="mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                  Live updates enabled
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 space-y-2">
            {campaign.status === 'DRAFT' && (
              <Button onClick={handleStartResearch} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Start Research
              </Button>
            )}
            {campaign.leads && campaign.leads.length > 0 && (
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Panel - Leads Table */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-semibold">Leads</h1>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <LeadTable 
              leads={campaign.leads || []} 
              campaignStatus={campaign.status}
            />
          </div>
        </div>

        {/* Right Panel - Copilot Chat */}
        <div className="w-96 border-l border-border">
          <CopilotChat campaign={campaign} />
        </div>
      </div>
    </div>
  );
}