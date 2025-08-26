import puppeteer, { Browser, Page } from 'puppeteer';
import { parse } from 'node-html-parser';
import { ICPDetails } from '../openai.js';
import { EnhancedLead } from '../advanced-lead-research.js';

interface LinkedInSearchParams {
  keywords?: string;
  location?: string;
  currentCompany?: string;
  pastCompany?: string;
  industry?: string;
  seniority?: string;
  function?: string;
  title?: string;
  connectionLevel?: string;
  schoolAttended?: string;
  profileLanguage?: string;
  serviceCategory?: string;
}

export class LinkedInService {
  private static browser: Browser | null = null;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });
      this.isInitialized = true;
      console.log('🔗 LinkedIn service initialized');
    } catch (error) {
      console.error('Failed to initialize LinkedIn service:', error);
      throw error;
    }
  }

  static async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('🔗 LinkedIn service cleaned up');
    }
  }

  static async searchProfiles(icpDetails: ICPDetails, maxResults = 50): Promise<EnhancedLead[]> {
    try {
      console.log('🔍 Starting LinkedIn Sales Navigator search...');
      
      // For production, we would implement real LinkedIn scraping
      // For now, return enhanced mock data based on ICP
      return await this.generateEnhancedMockProfiles(icpDetails, maxResults);
      
    } catch (error) {
      console.error('LinkedIn search failed:', error);
      return [];
    }
  }

  private static async generateEnhancedMockProfiles(
    icpDetails: ICPDetails, 
    maxResults: number
  ): Promise<EnhancedLead[]> {
    
    const mockProfiles = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'VP of Marketing',
        seniority: 'executive' as const,
        department: 'Marketing',
        companyName: 'TechFlow Solutions',
        companySize: '250-500 employees',
        linkedinUrl: 'https://linkedin.com/in/sarahjohnson-marketing',
        linkedinConnections: 2847,
        aboutSummary: 'Marketing leader with 10+ years experience scaling SaaS companies from seed to IPO. Expert in demand generation, marketing automation, and revenue attribution.',
        location: 'San Francisco, CA',
        recentActivity: ['Posted about marketing attribution trends', 'Shared content on B2B lead generation', 'Attended SaaStr conference'],
        companyFunding: 'Series B - $25M',
        companyTechStack: ['HubSpot', 'Salesforce', 'Marketo', 'Google Analytics'],
        jobChangeSignals: false
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'Marketing Director',
        seniority: 'senior' as const,
        department: 'Marketing',
        companyName: 'DataVault Inc',
        companySize: '100-250 employees',
        linkedinUrl: 'https://linkedin.com/in/michael-chen-growth',
        linkedinConnections: 1923,
        aboutSummary: 'Growth-focused marketing director specializing in B2B lead generation and conversion optimization. Former consultant with experience at McKinsey.',
        location: 'Austin, TX',
        recentActivity: ['Published article on conversion optimization', 'Spoke at Growth Marketing Conference', 'Posted about AI in marketing'],
        companyFunding: 'Series A - $8M',
        companyTechStack: ['Pardot', 'Tableau', 'Segment', 'Intercom'],
        jobChangeSignals: false
      },
      {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        role: 'Head of Growth',
        seniority: 'executive' as const,
        department: 'Growth',
        companyName: 'CloudSync',
        companySize: '500-1000 employees',
        linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
        linkedinConnections: 3241,
        aboutSummary: 'Data-driven growth leader helping B2B SaaS companies scale efficiently. Previously scaled growth team at Stripe from 10 to 100+ employees.',
        location: 'New York, NY',
        recentActivity: ['Posted about product-led growth strategies', 'Shared hiring updates', 'Commented on industry trends'],
        companyFunding: 'Series C - $50M',
        companyTechStack: ['Amplitude', 'Mixpanel', 'Salesforce', 'Zapier'],
        jobChangeSignals: true
      },
      {
        firstName: 'David',
        lastName: 'Kim',
        role: 'CMO',
        seniority: 'c-level' as const,
        department: 'Marketing',
        companyName: 'InnovateLabs',
        companySize: '50-100 employees',
        linkedinUrl: 'https://linkedin.com/in/davidkim-cmo',
        linkedinConnections: 4156,
        aboutSummary: 'CMO with expertise in digital transformation and marketing technology stack optimization. Led marketing at 3 successful exits.',
        location: 'Seattle, WA',
        recentActivity: ['Announced new product launch', 'Posted about team expansion', 'Shared thought leadership article'],
        companyFunding: 'Seed - $3M',
        companyTechStack: ['HubSpot', 'Drift', 'Outreach', 'ChartMogul'],
        jobChangeSignals: false
      },
      {
        firstName: 'Jennifer',
        lastName: 'Thompson',
        role: 'VP Marketing',
        seniority: 'executive' as const,
        department: 'Marketing',
        companyName: 'ScaleUp Software',
        companySize: '1000+ employees',
        linkedinUrl: 'https://linkedin.com/in/jenniferthompson-vp',
        linkedinConnections: 2654,
        aboutSummary: 'Marketing executive focused on revenue growth and customer acquisition for B2B companies. Expert in account-based marketing and sales alignment.',
        location: 'Boston, MA',
        recentActivity: ['Posted about ABM strategies', 'Shared customer success story', 'Announced new partnership'],
        companyFunding: 'IPO - Public Company',
        companyTechStack: ['Salesforce', '6sense', 'Demandbase', 'Gong'],
        jobChangeSignals: false
      },
      {
        firstName: 'Alex',
        lastName: 'Morgan',
        role: 'Marketing Manager',
        seniority: 'mid' as const,
        department: 'Marketing',
        companyName: 'NextGen Analytics',
        companySize: '25-50 employees',
        linkedinUrl: 'https://linkedin.com/in/alexmorgan-marketing',
        linkedinConnections: 876,
        aboutSummary: 'Marketing manager specializing in demand generation and marketing attribution. Rising star with strong analytical background.',
        location: 'Denver, CO',
        recentActivity: ['Posted about marketing metrics', 'Shared conference learnings', 'Engaged with industry content'],
        companyFunding: 'Pre-Seed - $1M',
        companyTechStack: ['HubSpot', 'Google Analytics', 'Hotjar', 'Mailchimp'],
        jobChangeSignals: true
      },
      {
        firstName: 'Lisa',
        lastName: 'Wang',
        role: 'Director of Marketing',
        seniority: 'senior' as const,
        department: 'Marketing',
        companyName: 'AgileFlow',
        companySize: '100-250 employees',
        linkedinUrl: 'https://linkedin.com/in/lisawang-director',
        linkedinConnections: 1547,
        aboutSummary: 'Marketing director with strong background in product marketing and customer success. Expert in go-to-market strategy for technical products.',
        location: 'Chicago, IL',
        recentActivity: ['Posted about product launches', 'Shared customer testimonials', 'Participated in webinar'],
        companyFunding: 'Series A - $12M',
        companyTechStack: ['Marketo', 'Salesforce', 'PendoV', 'Zendesk'],
        jobChangeSignals: false
      },
      {
        firstName: 'Robert',
        lastName: 'Davis',
        role: 'Head of Marketing',
        seniority: 'executive' as const,
        department: 'Marketing',
        companyName: 'TechPioneer',
        companySize: '250-500 employees',
        linkedinUrl: 'https://linkedin.com/in/robertdavis-head',
        linkedinConnections: 2103,
        aboutSummary: 'Marketing leader driving growth through content strategy and thought leadership. Built marketing function from ground up at 2 unicorns.',
        location: 'Portland, OR',
        recentActivity: ['Published industry report', 'Spoke at marketing conference', 'Shared hiring updates'],
        companyFunding: 'Series B - $30M',
        companyTechStack: ['Eloqua', 'Salesforce', 'Tableau', 'Slack'],
        jobChangeSignals: false
      },
      {
        firstName: 'Priya',
        lastName: 'Patel',
        role: 'VP of Growth Marketing',
        seniority: 'executive' as const,
        department: 'Growth',
        companyName: 'DataSync Pro',
        companySize: '500-1000 employees',
        linkedinUrl: 'https://linkedin.com/in/priyapatel-growth',
        linkedinConnections: 3567,
        aboutSummary: 'Growth marketing executive with deep expertise in PLG motions and viral growth strategies. Previously at Dropbox and Zoom.',
        location: 'San Jose, CA',
        recentActivity: ['Posted about PLG strategies', 'Shared growth metrics', 'Announced team expansion'],
        companyFunding: 'Series D - $100M',
        companyTechStack: ['Amplitude', 'Iterable', 'Segment', 'Looker'],
        jobChangeSignals: true
      },
      {
        firstName: 'James',
        lastName: 'Wilson',
        role: 'Marketing Operations Director',
        seniority: 'senior' as const,
        department: 'Marketing Operations',
        companyName: 'RevTech Systems',
        companySize: '100-250 employees',
        linkedinUrl: 'https://linkedin.com/in/jameswilson-ops',
        linkedinConnections: 1834,
        aboutSummary: 'Marketing operations leader specializing in RevOps alignment and marketing technology optimization. Certified in multiple marketing automation platforms.',
        location: 'Atlanta, GA',
        recentActivity: ['Posted about marketing attribution', 'Shared MOPs best practices', 'Attended RevOps conference'],
        companyFunding: 'Series A - $15M',
        companyTechStack: ['Marketo', 'Salesforce', 'LeanData', 'Bizible'],
        jobChangeSignals: false
      }
    ];

    // Filter based on ICP criteria
    let filteredProfiles = mockProfiles;

    // Apply role filtering
    if (icpDetails.targetRole) {
      const roleKeywords = icpDetails.targetRole.toLowerCase().split(/[\s,]+/);
      filteredProfiles = filteredProfiles.filter(profile => 
        roleKeywords.some(keyword => 
          profile.role.toLowerCase().includes(keyword) ||
          profile.department.toLowerCase().includes(keyword)
        )
      );
    }

    // Apply seniority filtering
    if (icpDetails.seniority) {
      const seniorityMap: Record<string, string[]> = {
        'junior': ['junior'],
        'mid': ['mid'],
        'senior': ['senior', 'executive'],
        'executive': ['executive', 'c-level'],
        'c-level': ['c-level']
      };
      
      const targetLevels = seniorityMap[icpDetails.seniority.toLowerCase()] || [icpDetails.seniority.toLowerCase()];
      filteredProfiles = filteredProfiles.filter(profile => 
        targetLevels.includes(profile.seniority)
      );
    }

    // Apply company size filtering
    if (icpDetails.companySize) {
      filteredProfiles = filteredProfiles.filter(profile => {
        const sizeRanges = {
          'startup': ['25-50 employees', '50-100 employees'],
          'small': ['50-100 employees', '100-250 employees'],
          'medium': ['250-500 employees', '500-1000 employees'],
          'large': ['1000+ employees'],
          'enterprise': ['1000+ employees']
        };
        
        const targetSizes = sizeRanges[icpDetails.companySize?.toLowerCase() as keyof typeof sizeRanges] || [];
        return targetSizes.length === 0 || targetSizes.includes(profile.companySize);
      });
    }

    // Apply industry filtering
    if (icpDetails.targetIndustry) {
      const industryKeywords = icpDetails.targetIndustry.toLowerCase().split(/[\s,]+/);
      filteredProfiles = filteredProfiles.filter(profile =>
        industryKeywords.some(keyword => 
          profile.companyName.toLowerCase().includes(keyword) ||
          profile.aboutSummary.toLowerCase().includes(keyword) ||
          (keyword === 'saas' && (
            profile.companyName.toLowerCase().includes('tech') ||
            profile.aboutSummary.toLowerCase().includes('saas') ||
            profile.aboutSummary.toLowerCase().includes('software')
          ))
        )
      );
    }

    // Take only the requested number of results
    filteredProfiles = filteredProfiles.slice(0, Math.min(maxResults, filteredProfiles.length));

    // Convert to EnhancedLead format
    return filteredProfiles.map(profile => ({
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      seniority: profile.seniority,
      department: profile.department,
      companyName: profile.companyName,
      companySize: profile.companySize,
      linkedinUrl: profile.linkedinUrl,
      linkedinConnections: profile.linkedinConnections,
      aboutSummary: profile.aboutSummary,
      emailVerified: false,
      recentActivity: profile.recentActivity,
      companyFunding: profile.companyFunding,
      companyTechStack: profile.companyTechStack,
      jobChangeSignals: profile.jobChangeSignals,
      linkedinActivityScore: Math.floor(Math.random() * 40) + 60, // 60-100
      contentEngagement: Math.floor(Math.random() * 50) + 30, // 30-80
      dataFreshnessScore: Math.floor(Math.random() * 20) + 80, // 80-100
      sourceCredibility: 95, // LinkedIn is highly credible
      sources: ['linkedin'],
      lastUpdated: new Date(),
      dataPoints: {
        location: profile.location,
        profileViews: Math.floor(Math.random() * 2000) + 1000,
        connectionsGrowth: Math.floor(Math.random() * 50) + 10,
        postFrequency: Math.floor(Math.random() * 5) + 1,
        industryInfluence: Math.floor(Math.random() * 30) + 70
      }
    }));
  }

  // Future implementation for real LinkedIn scraping
  private static async realLinkedInSearch(
    searchParams: LinkedInSearchParams,
    maxResults: number
  ): Promise<EnhancedLead[]> {
    if (!this.browser) {
      throw new Error('LinkedIn service not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set user agent and headers to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to LinkedIn Sales Navigator (requires authentication)
      // This would require implementing LinkedIn OAuth flow
      // await page.goto('https://www.linkedin.com/sales/search/people');
      
      // Implementation would include:
      // 1. Authentication handling
      // 2. Search form filling
      // 3. Results parsing
      // 4. Pagination handling
      // 5. Rate limiting compliance
      // 6. Profile data extraction
      
      console.log('Real LinkedIn scraping not implemented yet');
      return [];
      
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  static async extractProfileData(linkedinUrl: string): Promise<Partial<EnhancedLead>> {
    // This would extract detailed profile information
    // For now, return mock data
    console.log(`Extracting profile data from ${linkedinUrl}`);
    
    return {
      linkedinActivityScore: Math.floor(Math.random() * 40) + 60,
      contentEngagement: Math.floor(Math.random() * 50) + 30,
      recentActivity: [
        'Posted about industry trends',
        'Shared company updates',
        'Engaged with thought leadership content'
      ]
    };
  }

  static async validateLinkedInUrl(url: string): Promise<boolean> {
    const linkedInPattern = /^https:\/\/(?:www\.)?linkedin\.com\/in\/[\w\-_]+\/?$/;
    return linkedInPattern.test(url);
  }
}