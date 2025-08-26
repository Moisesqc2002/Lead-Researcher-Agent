import { PrismaClient } from '@prisma/client';
import OpenAIService, { ICPDetails } from './openai.js';

const prisma = new PrismaClient();

export interface LeadResearchParams {
  campaignId: string;
  icpDetails: ICPDetails;
  userContext: any;
  targetCount?: number;
}

export interface ResearchedLead {
  firstName: string;
  lastName: string;
  email?: string;
  emailVerified: boolean;
  linkedinUrl?: string;
  companyName?: string;
  role?: string;
  website?: string;
  aboutSummary?: string;
  dataPoints?: any;
  qualificationReason?: string;
  interestRating?: number;
}

export class LeadResearchService {
  static async conductResearch(params: LeadResearchParams): Promise<ResearchedLead[]> {
    console.log(`Starting lead research for campaign ${params.campaignId}`);
    
    // Step 1: Generate base leads from mock LinkedIn search
    const baseLeads = await this.mockLinkedInSearch(params.icpDetails);
    
    // Step 2: Enrich leads with company data
    const enrichedLeads = await this.enrichWithCompanyData(baseLeads);
    
    // Step 3: Verify emails (mock process)
    const verifiedLeads = await this.mockEmailVerification(enrichedLeads);
    
    // Step 4: Score and qualify leads using AI
    const qualifiedLeads = await this.qualifyLeads(verifiedLeads, params.icpDetails, params.userContext);
    
    // Step 5: Sort by interest rating and limit results
    const finalLeads = qualifiedLeads
      .sort((a, b) => (b.interestRating || 0) - (a.interestRating || 0))
      .slice(0, params.targetCount || 30);
    
    console.log(`Research completed: ${finalLeads.length} qualified leads found`);
    return finalLeads;
  }

  private static async mockLinkedInSearch(icpDetails: ICPDetails): Promise<ResearchedLead[]> {
    // Simulate LinkedIn search delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate realistic mock leads based on ICP criteria
    const mockProfiles = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'VP of Marketing',
        companyName: 'TechFlow Solutions',
        linkedinUrl: 'https://linkedin.com/in/sarahjohnson-marketing',
        aboutSummary: 'Marketing leader with 10+ years experience scaling SaaS companies from seed to IPO',
        location: 'San Francisco, CA'
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'Marketing Director',
        companyName: 'DataVault Inc',
        linkedinUrl: 'https://linkedin.com/in/michael-chen-growth',
        aboutSummary: 'Growth-focused marketing director specializing in B2B lead generation and conversion optimization',
        location: 'Austin, TX'
      },
      {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        role: 'Head of Growth',
        companyName: 'CloudSync',
        linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
        aboutSummary: 'Data-driven growth leader helping B2B SaaS companies scale efficiently',
        location: 'New York, NY'
      },
      {
        firstName: 'David',
        lastName: 'Kim',
        role: 'CMO',
        companyName: 'InnovateLabs',
        linkedinUrl: 'https://linkedin.com/in/davidkim-cmo',
        aboutSummary: 'CMO with expertise in digital transformation and marketing technology stack optimization',
        location: 'Seattle, WA'
      },
      {
        firstName: 'Jennifer',
        lastName: 'Thompson',
        role: 'VP Marketing',
        companyName: 'ScaleUp Software',
        linkedinUrl: 'https://linkedin.com/in/jenniferthompson-vp',
        aboutSummary: 'Marketing executive focused on revenue growth and customer acquisition for B2B companies',
        location: 'Boston, MA'
      },
      {
        firstName: 'Alex',
        lastName: 'Morgan',
        role: 'Marketing Manager',
        companyName: 'NextGen Analytics',
        linkedinUrl: 'https://linkedin.com/in/alexmorgan-marketing',
        aboutSummary: 'Marketing manager specializing in demand generation and marketing attribution',
        location: 'Denver, CO'
      },
      {
        firstName: 'Lisa',
        lastName: 'Wang',
        role: 'Director of Marketing',
        companyName: 'AgileFlow',
        linkedinUrl: 'https://linkedin.com/in/lisawang-director',
        aboutSummary: 'Marketing director with strong background in product marketing and customer success',
        location: 'Chicago, IL'
      },
      {
        firstName: 'Robert',
        lastName: 'Davis',
        role: 'Head of Marketing',
        companyName: 'TechPioneer',
        linkedinUrl: 'https://linkedin.com/in/robertdavis-head',
        aboutSummary: 'Marketing leader driving growth through content strategy and thought leadership',
        location: 'Portland, OR'
      }
    ];

    // Filter and customize based on ICP
    let filteredProfiles = mockProfiles;
    
    // Apply role filtering
    if (icpDetails.targetRole) {
      const roleKeywords = icpDetails.targetRole.toLowerCase().split(' ');
      filteredProfiles = filteredProfiles.filter(profile => 
        roleKeywords.some(keyword => profile.role.toLowerCase().includes(keyword))
      );
    }

    // Apply industry/company filtering  
    if (icpDetails.targetIndustry && icpDetails.targetIndustry.includes('saas')) {
      // Keep SaaS-focused profiles
      filteredProfiles = filteredProfiles.filter(profile => 
        profile.aboutSummary.toLowerCase().includes('saas') || 
        profile.aboutSummary.toLowerCase().includes('software') ||
        profile.companyName.toLowerCase().includes('tech')
      );
    }

    return filteredProfiles.map(profile => ({
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      companyName: profile.companyName,
      linkedinUrl: profile.linkedinUrl,
      aboutSummary: profile.aboutSummary,
      emailVerified: false,
      dataPoints: {
        location: profile.location,
        profileViews: Math.floor(Math.random() * 1000) + 500,
        connections: Math.floor(Math.random() * 500) + 500,
        recentActivity: 'Posted about marketing automation trends'
      }
    }));
  }

  private static async enrichWithCompanyData(leads: ResearchedLead[]): Promise<ResearchedLead[]> {
    // Simulate company data enrichment delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const companyWebsites = {
      'TechFlow Solutions': 'https://techflow.com',
      'DataVault Inc': 'https://datavault.io',
      'CloudSync': 'https://cloudsync.co',
      'InnovateLabs': 'https://innovatelabs.com',
      'ScaleUp Software': 'https://scaleup.software',
      'NextGen Analytics': 'https://nextgen-analytics.com',
      'AgileFlow': 'https://agileflow.io',
      'TechPioneer': 'https://techpioneer.com'
    };

    return leads.map(lead => ({
      ...lead,
      website: companyWebsites[lead.companyName as keyof typeof companyWebsites],
      dataPoints: {
        ...lead.dataPoints,
        companySize: Math.floor(Math.random() * 400) + 100 + ' employees',
        fundingStage: ['Series A', 'Series B', 'Series C', 'Bootstrapped'][Math.floor(Math.random() * 4)],
        techStack: ['HubSpot', 'Salesforce', 'Marketo', 'Pardot'][Math.floor(Math.random() * 4)],
        recentNews: 'Recently announced new product launch'
      }
    }));
  }

  private static async mockEmailVerification(leads: ResearchedLead[]): Promise<ResearchedLead[]> {
    // Simulate email verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return leads.map(lead => {
      // Generate professional email based on name and company
      const firstName = lead.firstName.toLowerCase();
      const lastName = lead.lastName.toLowerCase();
      const domain = lead.companyName?.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '') + '.com';
      
      const emailFormats = [
        `${firstName}.${lastName}@${domain}`,
        `${firstName}@${domain}`,
        `${firstName[0]}${lastName}@${domain}`,
        `${firstName}.${lastName[0]}@${domain}`
      ];

      const email = emailFormats[Math.floor(Math.random() * emailFormats.length)];
      const isVerified = Math.random() > 0.3; // 70% verification rate

      return {
        ...lead,
        email,
        emailVerified: isVerified
      };
    });
  }

  private static async qualifyLeads(
    leads: ResearchedLead[], 
    icpDetails: ICPDetails, 
    userContext: any
  ): Promise<ResearchedLead[]> {
    console.log('Qualifying leads with AI...');
    
    const qualifiedLeads = await Promise.all(
      leads.map(async (lead) => {
        try {
          const qualification = await OpenAIService.generateLeadQualificationReason(
            lead, 
            icpDetails, 
            userContext
          );

          return {
            ...lead,
            qualificationReason: qualification.reason,
            interestRating: qualification.interestRating
          };
        } catch (error) {
          console.error('Failed to qualify lead:', error);
          // Fallback qualification
          return {
            ...lead,
            qualificationReason: `${lead.role} at ${lead.companyName} matches target profile`,
            interestRating: Math.floor(Math.random() * 4) + 6 // 6-9 rating
          };
        }
      })
    );

    return qualifiedLeads;
  }

  static async saveLeadsToDatabase(campaignId: string, leads: ResearchedLead[]): Promise<void> {
    try {
      await prisma.lead.createMany({
        data: leads.map(lead => ({
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          emailVerified: lead.emailVerified,
          linkedinUrl: lead.linkedinUrl,
          companyName: lead.companyName,
          role: lead.role,
          website: lead.website,
          aboutSummary: lead.aboutSummary,
          dataPoints: lead.dataPoints,
          qualificationReason: lead.qualificationReason,
          interestRating: lead.interestRating,
          campaignId
        }))
      });

      console.log(`Saved ${leads.length} leads to database for campaign ${campaignId}`);
    } catch (error) {
      console.error('Failed to save leads to database:', error);
      throw error;
    }
  }
}

export default LeadResearchService;