'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lead, Campaign } from '@/lib/api';
import { ExternalLink, Star, Mail, Building2 } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  campaignStatus: Campaign['status'];
}

export function LeadTable({ leads, campaignStatus }: LeadTableProps) {
  if (campaignStatus === 'DRAFT') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Ready to start researching?</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Use the Copilot to define your Ideal Customer Profile and start finding qualified leads.
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>💬 Chat with the Copilot on the right</p>
              <p>🎯 Define your target audience</p>
              <p>🔍 Start the research process</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaignStatus === 'RESEARCHING') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold">Researching leads...</h3>
            <p className="text-muted-foreground mt-2">
              Our AI is finding qualified prospects that match your criteria. This typically takes 5-10 minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold">No leads found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search criteria and research again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInterestRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-200'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">{rating}/10</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {leads.length} Lead{leads.length !== 1 ? 's' : ''} Found
        </h2>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>LinkedIn</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {lead.firstName} {lead.lastName}
                    </div>
                    {lead.aboutSummary && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {lead.aboutSummary}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {lead.companyName && (
                      <>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.companyName}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {lead.role && (
                    <Badge variant="secondary">{lead.role}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {lead.email ? (
                      <>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{lead.email}</span>
                        {lead.emailVerified && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Verified
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {getInterestRating(lead.interestRating)}
                </TableCell>
                <TableCell>
                  {lead.linkedinUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(lead.linkedinUrl, '_blank')}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination would go here */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            2
          </Button>
          <Button variant="outline" size="sm" disabled>
            ...
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}