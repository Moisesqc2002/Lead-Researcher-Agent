import { ICPDetails } from '../openai.js';
import { EnhancedLead } from '../advanced-lead-research.js';

interface ApolloSearchParams {
  person_titles?: string[];
  person_locations?: string[];
  organization_locations?: string[];
  organization_ids?: string[];
  organization_num_employees_ranges?: string[];
  technologies?: string[];
  organization_latest_funding_stage_cd?: string[];
  person_seniorities?: string[];
  contact_email_status?: string[];
  per_page?: number;
  page?: number;
}

interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url: string;
  title: string;
  email: string;
  employment_history: {
    organization: {
      name: string;
      website_url: string;
      linkedin_url: string;
      num_employees: number;
      industry: string;
      founded_year: number;
      publicly_traded_symbol: string;
    };
    title: string;
    start_date: string;
    end_date: string | null;
  }[];
  phone_numbers: { raw_number: string; type: string; }[];
  organization: {
    name: string;
    website_url: string;
    linkedin_url: string;
    num_employees: number;
    industry: string;
    founded_year: number;
    publicly_traded_symbol: string;
    short_description: string;
    annual_revenue: string;
    technologies: string[];
  };
}

export class ApolloService {
  private static readonly API_BASE = 'https://api.apollo.io/v1';
  private static readonly API_KEY = process.env.APOLLO_API_KEY;
  
  static async searchLeads(icpDetails: ICPDetails, maxResults = 30): Promise<EnhancedLead[]> {
    try {
      console.log('🚀 Starting Apollo.io database search...');
      
      // For production with Apollo API key, use real API
      if (this.API_KEY) {
        return await this.realApolloSearch(icpDetails, maxResults);
      }
      
      // For development, return enhanced mock data
      return await this.generateApolloMockData(icpDetails, maxResults);
      
    } catch (error) {
      console.error('Apollo search failed:', error);
      return [];
    }
  }

  private static async realApolloSearch(icpDetails: ICPDetails, maxResults: number): Promise<EnhancedLead[]> {
    const searchParams: ApolloSearchParams = {
      per_page: Math.min(maxResults, 100), // Apollo max is 100
      page: 1
    };

    // Map ICP details to Apollo search parameters
    if (icpDetails.targetRole) {
      searchParams.person_titles = [icpDetails.targetRole];
    }

    if (icpDetails.location) {
      searchParams.person_locations = [icpDetails.location];
    }

    if (icpDetails.companySize) {
      const sizeRanges = {
        'startup': ['1-10', '11-50'],
        'small': ['11-50', '51-200'],
        'medium': ['51-200', '201-1000'],
        'large': ['201-1000', '1001-5000'],
        'enterprise': ['1001-5000', '5001-10000', '10001+']
      };
      searchParams.organization_num_employees_ranges = 
        sizeRanges[icpDetails.companySize.toLowerCase() as keyof typeof sizeRanges] || [];
    }

    if (icpDetails.seniority) {
      const seniorityMap = {
        'junior': ['individual_contributor'],
        'mid': ['manager'],
        'senior': ['director', 'vp'],
        'executive': ['vp', 'c_suite'],
        'c-level': ['c_suite']
      };
      searchParams.person_seniorities = 
        seniorityMap[icpDetails.seniority.toLowerCase() as keyof typeof seniorityMap] || [];
    }

    // Only search for contacts with verified emails
    searchParams.contact_email_status = ['verified'];

    try {
      const response = await fetch(`${this.API_BASE}/mixed_people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.API_KEY!
        },
        body: JSON.stringify(searchParams)
      });

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.transformApolloContacts(data.people || []);
      
    } catch (error) {
      console.error('Apollo API request failed:', error);
      throw error;
    }
  }

  private static transformApolloContacts(contacts: ApolloContact[]): EnhancedLead[] {
    return contacts.map(contact => ({
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      emailVerified: true, // Apollo verified emails
      linkedinUrl: contact.linkedin_url,
      role: contact.title,
      companyName: contact.organization?.name,
      website: contact.organization?.website_url,
      phoneNumber: contact.phone_numbers?.[0]?.raw_number,
      
      // Company intelligence from Apollo
      companySize: this.formatEmployeeCount(contact.organization?.num_employees),
      companyRevenue: contact.organization?.annual_revenue,
      companyTechStack: contact.organization?.technologies || [],
      
      // Additional enrichment
      department: this.extractDepartment(contact.title),
      seniority: this.mapSeniority(contact.title),
      
      // Data quality metrics
      dataFreshnessScore: 85, // Apollo data is fairly fresh
      sourceCredibility: 90, // Apollo is a credible source
      sources: ['apollo'],
      lastUpdated: new Date(),
      
      aboutSummary: contact.organization?.short_description,
      
      dataPoints: {
        apolloId: contact.id,
        companyIndustry: contact.organization?.industry,
        companyFounded: contact.organization?.founded_year,
        publiclyTraded: contact.organization?.publicly_traded_symbol,
        employmentHistory: contact.employment_history?.map(job => ({
          company: job.organization.name,
          title: job.title,
          startDate: job.start_date,
          endDate: job.end_date
        }))
      }
    }));
  }

  private static async generateApolloMockData(icpDetails: ICPDetails, maxResults: number): Promise<EnhancedLead[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockApolloData = [
      {
        firstName: 'Amanda',
        lastName: 'Foster',
        email: 'amanda.foster@growthhub.com',
        role: 'VP of Revenue Operations',
        companyName: 'GrowthHub',
        companySize: '100-200 employees',
        companyRevenue: '$10M-$50M',
        companyTechStack: ['Salesforce', 'HubSpot', 'Outreach', 'ZoomInfo'],
        industry: 'Marketing Technology',
        phoneNumber: '+1-555-0123',
        linkedinUrl: 'https://linkedin.com/in/amandafoster-revops',
        companyWebsite: 'https://growthhub.com',
        department: 'Revenue Operations',
        seniority: 'executive' as const
      },
      {
        firstName: 'Brian',
        lastName: 'Martinez',
        email: 'b.martinez@scalevp.io',
        role: 'Director of Marketing',
        companyName: 'ScaleVP',
        companySize: '50-100 employees',
        companyRevenue: '$5M-$10M',
        companyTechStack: ['Marketo', 'Salesforce', '6sense', 'Drift'],
        industry: 'Venture Capital',
        phoneNumber: '+1-555-0124',
        linkedinUrl: 'https://linkedin.com/in/brianmartinez-marketing',
        companyWebsite: 'https://scalevp.io',
        department: 'Marketing',
        seniority: 'senior' as const
      },
      {
        firstName: 'Caroline',
        lastName: 'Lee',
        email: 'caroline@techstartup.ai',
        role: 'CMO',
        companyName: 'TechStartup AI',
        companySize: '25-50 employees',
        companyRevenue: '$1M-$5M',
        companyTechStack: ['HubSpot', 'Intercom', 'Mixpanel', 'Slack'],
        industry: 'Artificial Intelligence',
        phoneNumber: '+1-555-0125',
        linkedinUrl: 'https://linkedin.com/in/carolinelee-cmo',
        companyWebsite: 'https://techstartup.ai',
        department: 'Marketing',
        seniority: 'c-level' as const
      },
      {
        firstName: 'Daniel',
        lastName: 'Brown',
        email: 'daniel.brown@dataflow.tech',
        role: 'Head of Demand Generation',
        companyName: 'DataFlow Technologies',
        companySize: '200-500 employees',
        companyRevenue: '$20M-$50M',
        companyTechStack: ['Pardot', 'Salesforce', 'Tableau', 'Outreach'],
        industry: 'Data Analytics',
        phoneNumber: '+1-555-0126',
        linkedinUrl: 'https://linkedin.com/in/danielbrown-demand',
        companyWebsite: 'https://dataflow.tech',
        department: 'Demand Generation',
        seniority: 'executive' as const
      },
      {
        firstName: 'Elena',
        lastName: 'Vasquez',
        email: 'e.vasquez@cloudscale.co',
        role: 'VP of Marketing',
        companyName: 'CloudScale',
        companySize: '500-1000 employees',
        companyRevenue: '$50M-$100M',
        companyTechStack: ['Eloqua', 'Salesforce', 'Adobe Analytics', 'Terminus'],
        industry: 'Cloud Infrastructure',
        phoneNumber: '+1-555-0127',
        linkedinUrl: 'https://linkedin.com/in/elenavasquez-vp',
        companyWebsite: 'https://cloudscale.co',
        department: 'Marketing',
        seniority: 'executive' as const
      },
      {
        firstName: 'Frank',
        lastName: 'Zhang',
        email: 'frank@nexustech.com',
        role: 'Marketing Operations Manager',
        companyName: 'Nexus Technologies',
        companySize: '100-200 employees',
        companyRevenue: '$10M-$20M',
        companyTechStack: ['Marketo', 'Salesforce', 'LeanData', 'Bizible'],
        industry: 'Enterprise Software',
        phoneNumber: '+1-555-0128',
        linkedinUrl: 'https://linkedin.com/in/frankzhang-mops',
        companyWebsite: 'https://nexustech.com',
        department: 'Marketing Operations',
        seniority: 'mid' as const
      }
    ];

    // Filter based on ICP
    let filteredData = mockApolloData;

    if (icpDetails.targetRole) {
      const roleKeywords = icpDetails.targetRole.toLowerCase().split(/[\s,]+/);
      filteredData = filteredData.filter(lead =>
        roleKeywords.some(keyword =>
          lead.role.toLowerCase().includes(keyword) ||
          lead.department.toLowerCase().includes(keyword)
        )
      );
    }

    if (icpDetails.seniority) {
      const targetSeniority = icpDetails.seniority.toLowerCase();
      filteredData = filteredData.filter(lead => {
        if (targetSeniority === 'executive') return ['executive', 'c-level'].includes(lead.seniority);
        return lead.seniority === targetSeniority;
      });
    }

    // Take requested number of results
    filteredData = filteredData.slice(0, maxResults);

    // Transform to EnhancedLead format
    return filteredData.map(lead => ({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      emailVerified: true,
      phoneNumber: lead.phoneNumber,
      linkedinUrl: lead.linkedinUrl,
      role: lead.role,
      department: lead.department,
      seniority: lead.seniority,
      companyName: lead.companyName,
      website: lead.companyWebsite,
      companySize: lead.companySize,
      companyRevenue: lead.companyRevenue,
      companyTechStack: lead.companyTechStack,
      
      // Apollo-specific enrichment
      emailDeliverabilityScore: Math.floor(Math.random() * 15) + 85, // 85-100
      dataFreshnessScore: Math.floor(Math.random() * 10) + 85, // 85-95
      sourceCredibility: 90,
      sources: ['apollo'],
      lastUpdated: new Date(),
      
      dataPoints: {
        industry: lead.industry,
        apolloEnriched: true,
        technologyStack: lead.companyTechStack,
        revenueRange: lead.companyRevenue,
        employeeRange: lead.companySize
      }
    }));
  }

  private static formatEmployeeCount(numEmployees: number): string {
    if (!numEmployees) return 'Unknown';
    if (numEmployees <= 10) return '1-10 employees';
    if (numEmployees <= 50) return '11-50 employees';
    if (numEmployees <= 200) return '51-200 employees';
    if (numEmployees <= 1000) return '201-1000 employees';
    if (numEmployees <= 5000) return '1001-5000 employees';
    return '5000+ employees';
  }

  private static extractDepartment(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('marketing')) return 'Marketing';
    if (titleLower.includes('sales')) return 'Sales';
    if (titleLower.includes('revenue') || titleLower.includes('revops')) return 'Revenue Operations';
    if (titleLower.includes('growth')) return 'Growth';
    if (titleLower.includes('demand')) return 'Demand Generation';
    if (titleLower.includes('product')) return 'Product';
    if (titleLower.includes('operations')) return 'Operations';
    return 'Other';
  }

  private static mapSeniority(title: string): 'junior' | 'mid' | 'senior' | 'executive' | 'c-level' {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('ceo') || titleLower.includes('cto') || titleLower.includes('cmo') || titleLower.includes('cfo')) {
      return 'c-level';
    }
    if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('head of')) {
      return 'executive';
    }
    if (titleLower.includes('director') || titleLower.includes('senior manager')) {
      return 'senior';
    }
    if (titleLower.includes('manager') || titleLower.includes('lead')) {
      return 'mid';
    }
    return 'junior';
  }

  static async enrichContactWithApollo(lead: Partial<EnhancedLead>): Promise<Partial<EnhancedLead>> {
    // This would enrich an existing lead with additional Apollo data
    // For now, return mock enrichment
    console.log(`Enriching contact with Apollo: ${lead.firstName} ${lead.lastName}`);
    
    return {
      ...lead,
      emailDeliverabilityScore: Math.floor(Math.random() * 15) + 85,
      phoneNumber: lead.phoneNumber || `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      companyTechStack: ['Salesforce', 'HubSpot', 'Outreach'].slice(0, Math.floor(Math.random() * 3) + 1),
      sources: [...(lead.sources || []), 'apollo']
    };
  }
}