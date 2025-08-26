'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Campaign } from '@/lib/api';
import { formatDistance } from 'date-fns';
import { MoreHorizontal, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CampaignListProps {
  campaigns: Campaign[];
  isLoading: boolean;
}

export function CampaignList({ campaigns, isLoading }: CampaignListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold">No campaigns yet</h3>
            <p className="text-muted-foreground mt-2">
              Create your first lead research campaign to get started.
            </p>
            <Button 
              className="mt-4"
              onClick={() => router.push('/dashboard/campaigns/new')}
            >
              Create Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const statusConfig = {
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      RESEARCHING: { variant: 'default' as const, label: 'In progress' },
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

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  {getStatusBadge(campaign.status)}
                </div>
                <CardDescription className="mt-2">
                  Due on {new Date(campaign.updatedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} • Created {formatDistance(new Date(campaign.createdAt), new Date(), { addSuffix: true })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View project
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {campaign.description && (
            <CardContent>
              <p className="text-muted-foreground">{campaign.description}</p>
              {campaign.leads && campaign.leads.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {campaign.leads.length} leads found
                </p>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}