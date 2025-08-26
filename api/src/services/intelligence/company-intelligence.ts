import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { parse } from 'node-html-parser';

interface CompanyIntelligence {
  // Basic company info
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  
  // Size and financial metrics
  size?: string;
  employeeCount?: number;
  revenue?: string;
  funding?: string;
  fundingStage?: string;
  fundingAmount?: number;
  
  // Technology and infrastructure
  techStack?: string[];
  cloudProviders?: string[];
  marketingTools?: string[];
  salesTools?: string[];
  
  // Growth and market signals
  growthSignals?: string[];
  buyingSignals?: string[];
  painPoints?: string[];
  
  // Leadership and team
  leadership?: {
    name: string;
    role: string;
    linkedinUrl?: string;
  }[];
  
  // News and events
  recentNews?: string[];
  events?: string[];
  pressReleases?: string[];
  
  // Social presence
  socialMediaPresence?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
  
  // Competitive landscape
  competitors?: string[];
  marketPosition?: string;
  
  // Contact and location info
  headquarters?: string;
  locations?: string[];
  phoneNumber?: string;
  
  // Data quality metrics
  dataFreshness?: number;
  completeness?: number;
  confidence?: number;
}

export class CompanyIntelligenceService {
  private static browser: Browser | null = null;
  private static readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
  ];

  static async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
          '--disable-blink-features=AutomationControlled'
        ]
      });
    }
  }

  static async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  static async gatherIntelligence(companyName?: string, website?: string): Promise<CompanyIntelligence> {
    if (!companyName && !website) {
      throw new Error('Either company name or website must be provided');
    }

    console.log(`🔍 Gathering intelligence for ${companyName || website}...`);

    try {
      // For development, return comprehensive mock data
      return await this.generateMockIntelligence(companyName, website);
    } catch (error) {
      console.error('Company intelligence gathering failed:', error);
      return this.generateFallbackIntelligence(companyName, website);
    }
  }

  private static async realWebScraping(companyName?: string, website?: string): Promise<CompanyIntelligence> {
    await this.initialize();
    
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    const intelligence: Partial<CompanyIntelligence> = {
      name: companyName || '',
      website: website
    };

    try {
      // Set random user agent
      const userAgent = this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
      await page.setUserAgent(userAgent);

      // Scrape company website
      if (website) {
        await this.scrapeCompanyWebsite(page, website, intelligence);
      }

      // Scrape LinkedIn company page
      if (companyName) {
        await this.scrapeLinkedInCompany(page, companyName, intelligence);
      }

      // Scrape Crunchbase data
      if (companyName) {
        await this.scrapeCrunchbase(page, companyName, intelligence);
      }

      // Scrape news and press releases
      if (companyName) {
        await this.scrapeCompanyNews(page, companyName, intelligence);
      }

      // Technology detection
      if (website) {
        await this.detectTechnology(page, website, intelligence);
      }

    } catch (error) {
      console.error('Web scraping failed:', error);
    } finally {
      await page.close();
    }

    return this.processIntelligence(intelligence as CompanyIntelligence);
  }

  private static async scrapeCompanyWebsite(
    page: Page, 
    website: string, 
    intelligence: Partial<CompanyIntelligence>
  ): Promise<void> {
    try {
      await page.goto(website, { waitUntil: 'networkidle2', timeout: 10000 });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // Extract company description
      const description = $('meta[name="description"]').attr('content') ||
                         $('meta[property="og:description"]').attr('content') ||
                         $('.hero-description, .company-description, .about-text').first().text().trim();
      
      if (description) {
        intelligence.description = description.substring(0, 500);
      }

      // Look for contact information
      const phoneMatch = content.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) {
        intelligence.phoneNumber = phoneMatch[0];
      }

      // Extract location information
      const locationSelectors = [
        '.contact-address', '.address', '.location',
        '.footer-address', '[class*="location"]'
      ];
      
      for (const selector of locationSelectors) {
        const locationText = $(selector).text().trim();
        if (locationText && locationText.length > 10) {
          intelligence.headquarters = locationText.substring(0, 200);
          break;
        }
      }

      // Look for technology mentions
      const techKeywords = [
        'salesforce', 'hubspot', 'marketo', 'pardot', 'mailchimp',
        'slack', 'zoom', 'microsoft', 'google workspace', 'aws',
        'azure', 'shopify', 'wordpress', 'react', 'angular'
      ];

      const pageText = content.toLowerCase();
      const detectedTech = techKeywords.filter(tech => pageText.includes(tech));
      
      if (detectedTech.length > 0) {
        intelligence.techStack = [...(intelligence.techStack || []), ...detectedTech];
      }

    } catch (error) {
      console.warn('Website scraping failed:', error);
    }
  }

  private static async scrapeLinkedInCompany(
    page: Page,
    companyName: string,
    intelligence: Partial<CompanyIntelligence>
  ): Promise<void> {
    try {
      // Note: LinkedIn scraping requires careful handling due to anti-bot measures
      const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // This would require LinkedIn authentication and careful bot detection avoidance
      console.log('LinkedIn scraping requires authentication - skipping');
      
    } catch (error) {
      console.warn('LinkedIn scraping failed:', error);
    }
  }

  private static async scrapeCrunchbase(
    page: Page,
    companyName: string,
    intelligence: Partial<CompanyIntelligence>
  ): Promise<void> {
    try {
      const searchUrl = `https://www.crunchbase.com/discover/organization.companies/field/organizations/num_funding_rounds/funding-rounds-total?q=${encodeURIComponent(companyName)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Crunchbase also has anti-bot measures
      console.log('Crunchbase scraping requires special handling - skipping');
      
    } catch (error) {
      console.warn('Crunchbase scraping failed:', error);
    }
  }

  private static async scrapeCompanyNews(
    page: Page,
    companyName: string,
    intelligence: Partial<CompanyIntelligence>
  ): Promise<void> {
    try {
      // Search for recent news
      const searchQuery = `"${companyName}" news funding hiring growth`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=nws`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Extract news headlines
      const newsHeadlines = await page.evaluate(() => {
        const headlines = Array.from(document.querySelectorAll('[data-hveid] h3'));
        return headlines.map(h => h.textContent?.trim()).filter(Boolean).slice(0, 5);
      });

      if (newsHeadlines.length > 0) {
        intelligence.recentNews = newsHeadlines as string[];
      }

    } catch (error) {
      console.warn('News scraping failed:', error);
    }
  }

  private static async detectTechnology(
    page: Page,
    website: string,
    intelligence: Partial<CompanyIntelligence>
  ): Promise<void> {
    try {
      await page.goto(website, { waitUntil: 'networkidle2', timeout: 10000 });
      
      // Detect technologies from script tags, meta tags, etc.
      const technologies = await page.evaluate(() => {
        const detected: string[] = [];
        
        // Check for common analytics and tracking
        if (window.gtag || window.ga) detected.push('Google Analytics');
        if (window.fbq) detected.push('Facebook Pixel');
        if (window.heap) detected.push('Heap Analytics');
        if (window.mixpanel) detected.push('Mixpanel');
        
        // Check for common frameworks
        if (window.React) detected.push('React');
        if (window.Vue) detected.push('Vue.js');
        if (window.jQuery) detected.push('jQuery');
        
        // Check for CRM/Marketing tools
        const scripts = Array.from(document.scripts);
        scripts.forEach(script => {
          const src = script.src.toLowerCase();
          if (src.includes('hubspot')) detected.push('HubSpot');
          if (src.includes('salesforce')) detected.push('Salesforce');
          if (src.includes('marketo')) detected.push('Marketo');
          if (src.includes('pardot')) detected.push('Pardot');
          if (src.includes('drift')) detected.push('Drift');
          if (src.includes('intercom')) detected.push('Intercom');
          if (src.includes('zendesk')) detected.push('Zendesk');
        });
        
        return detected;
      });

      if (technologies.length > 0) {
        intelligence.techStack = [...(intelligence.techStack || []), ...technologies];
      }

    } catch (error) {
      console.warn('Technology detection failed:', error);
    }
  }

  private static async generateMockIntelligence(companyName?: string, website?: string): Promise<CompanyIntelligence> {
    // Simulate scraping delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockCompanies = {
      'TechFlow Solutions': {
        industry: 'Marketing Technology',
        size: '250-500 employees',
        revenue: '$20M-$50M',
        funding: 'Series B - $25M',
        techStack: ['Salesforce', 'HubSpot', 'AWS', 'React', 'Node.js', 'PostgreSQL'],
        growthSignals: ['Recently expanded to EU market', 'Hiring 50+ engineers', 'New product launch'],
        buyingSignals: ['Seeking marketing automation platform', 'Budget approved for Q4'],
        painPoints: ['Lead attribution challenges', 'Scaling demand generation'],
        leadership: [
          { name: 'John Smith', role: 'CEO', linkedinUrl: 'https://linkedin.com/in/johnsmith' },
          { name: 'Sarah Johnson', role: 'VP Marketing', linkedinUrl: 'https://linkedin.com/in/sarahjohnson' }
        ],
        recentNews: [
          'TechFlow Solutions Raises $25M Series B',
          'Company Announces European Expansion',
          'TechFlow Launches AI-Powered Analytics Platform'
        ]
      },
      'DataVault Inc': {
        industry: 'Data Analytics',
        size: '100-250 employees',
        revenue: '$10M-$20M',
        funding: 'Series A - $8M',
        techStack: ['AWS', 'Snowflake', 'Tableau', 'Python', 'Docker'],
        growthSignals: ['Partnership with Microsoft', '40% revenue growth', 'Opening new office'],
        buyingSignals: ['Evaluating CRM solutions', 'Looking for lead generation tools'],
        painPoints: ['Customer acquisition cost', 'Sales and marketing alignment'],
        leadership: [
          { name: 'Michael Chen', role: 'Founder & CEO' },
          { name: 'Lisa Wang', role: 'Head of Growth' }
        ],
        recentNews: [
          'DataVault Partners with Microsoft Azure',
          'Startup Sees 40% Growth in Enterprise Clients'
        ]
      }
    };

    const company = mockCompanies[companyName as keyof typeof mockCompanies];
    
    return {
      name: companyName || 'Unknown Company',
      website: website,
      description: company ? `${companyName} is a leading company in ${company.industry} sector, focused on helping businesses scale their operations.` : 'Dynamic technology company',
      industry: company?.industry || 'Technology',
      size: company?.size || '100-500 employees',
      employeeCount: this.parseEmployeeCount(company?.size || '100-500 employees'),
      revenue: company?.revenue || '$5M-$20M',
      funding: company?.funding || 'Series A',
      fundingStage: this.extractFundingStage(company?.funding || 'Series A'),
      
      techStack: company?.techStack || ['Salesforce', 'HubSpot', 'AWS'],
      cloudProviders: ['AWS', 'Microsoft Azure'],
      marketingTools: ['HubSpot', 'Google Analytics', 'Mailchimp'],
      salesTools: ['Salesforce', 'Outreach', 'ZoomInfo'],
      
      growthSignals: company?.growthSignals || [
        'Recent funding round',
        'Expanding team',
        'New market entry'
      ],
      buyingSignals: company?.buyingSignals || [
        'Evaluating new tools',
        'Budget allocated for growth'
      ],
      painPoints: company?.painPoints || [
        'Lead generation challenges',
        'Need for better attribution'
      ],
      
      leadership: company?.leadership || [],
      
      recentNews: company?.recentNews || [
        `${companyName} announces growth initiative`,
        'Company expands product offerings'
      ],
      
      socialMediaPresence: {
        linkedin: `https://linkedin.com/company/${companyName?.toLowerCase().replace(/\s+/g, '-')}`,
        twitter: `https://twitter.com/${companyName?.toLowerCase().replace(/\s+/g, '')}`
      },
      
      competitors: this.generateCompetitors(company?.industry || 'Technology'),
      marketPosition: 'Growing market player',
      
      headquarters: 'San Francisco, CA',
      locations: ['San Francisco, CA', 'Austin, TX'],
      
      dataFreshness: Math.floor(Math.random() * 20) + 80, // 80-100
      completeness: Math.floor(Math.random() * 15) + 85, // 85-100
      confidence: Math.floor(Math.random() * 20) + 75 // 75-95
    };
  }

  private static generateFallbackIntelligence(companyName?: string, website?: string): CompanyIntelligence {
    return {
      name: companyName || 'Unknown Company',
      website: website,
      description: 'Company information unavailable',
      industry: 'Technology',
      size: '100-500 employees',
      employeeCount: 250,
      revenue: 'Unknown',
      funding: 'Unknown',
      
      techStack: ['Unknown'],
      growthSignals: [],
      buyingSignals: [],
      painPoints: [],
      
      leadership: [],
      recentNews: [],
      
      competitors: [],
      marketPosition: 'Unknown',
      
      dataFreshness: 30,
      completeness: 20,
      confidence: 40
    };
  }

  private static processIntelligence(intelligence: CompanyIntelligence): CompanyIntelligence {
    // Remove duplicates from arrays
    if (intelligence.techStack) {
      intelligence.techStack = [...new Set(intelligence.techStack)];
    }
    
    if (intelligence.growthSignals) {
      intelligence.growthSignals = [...new Set(intelligence.growthSignals)];
    }

    // Calculate completeness score
    const fields = [
      intelligence.description,
      intelligence.industry,
      intelligence.size,
      intelligence.revenue,
      intelligence.funding,
      intelligence.techStack?.length,
      intelligence.leadership?.length,
      intelligence.headquarters
    ];

    const completedFields = fields.filter(field => field && field !== 'Unknown').length;
    intelligence.completeness = Math.round((completedFields / fields.length) * 100);

    return intelligence;
  }

  // Helper methods
  private static parseEmployeeCount(sizeString: string): number {
    if (sizeString.includes('1-10')) return 5;
    if (sizeString.includes('11-50')) return 25;
    if (sizeString.includes('51-200')) return 100;
    if (sizeString.includes('201-1000')) return 500;
    if (sizeString.includes('1001-5000')) return 2500;
    if (sizeString.includes('5000+')) return 7500;
    
    // Extract numbers and average them
    const numbers = sizeString.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      return Math.round((parseInt(numbers[0]) + parseInt(numbers[1])) / 2);
    }
    
    return 250; // Default
  }

  private static extractFundingStage(fundingString: string): string {
    const lowerFunding = fundingString.toLowerCase();
    
    if (lowerFunding.includes('seed')) return 'Seed';
    if (lowerFunding.includes('series a')) return 'Series A';
    if (lowerFunding.includes('series b')) return 'Series B';
    if (lowerFunding.includes('series c')) return 'Series C';
    if (lowerFunding.includes('series d')) return 'Series D';
    if (lowerFunding.includes('ipo') || lowerFunding.includes('public')) return 'Public';
    if (lowerFunding.includes('bootstrap')) return 'Bootstrapped';
    
    return 'Unknown';
  }

  private static generateCompetitors(industry: string): string[] {
    const competitorMap: Record<string, string[]> = {
      'Marketing Technology': ['HubSpot', 'Marketo', 'Pardot', 'Mailchimp'],
      'Data Analytics': ['Tableau', 'Looker', 'Sisense', 'Qlik'],
      'Cloud Computing': ['AWS', 'Microsoft Azure', 'Google Cloud'],
      'Technology': ['Salesforce', 'Microsoft', 'Oracle', 'SAP']
    };

    return competitorMap[industry] || competitorMap['Technology'];
  }

  // Public methods for specific intelligence gathering
  static async getCompanyFunding(companyName: string): Promise<{
    totalFunding: number;
    lastRound: string;
    stage: string;
  }> {
    // Mock funding data
    return {
      totalFunding: Math.floor(Math.random() * 50000000) + 5000000,
      lastRound: 'Series B',
      stage: 'Growth'
    };
  }

  static async getCompanyTechStack(website: string): Promise<string[]> {
    // Mock tech stack detection
    return ['React', 'Node.js', 'AWS', 'PostgreSQL', 'Redis'];
  }

  static async getCompanyNews(companyName: string, days: number = 30): Promise<string[]> {
    // Mock recent news
    return [
      `${companyName} announces Q3 growth results`,
      `${companyName} expands engineering team`,
      `${companyName} launches new product feature`
    ];
  }

  static async getLeadership(companyName: string): Promise<Array<{
    name: string;
    role: string;
    linkedinUrl?: string;
  }>> {
    // Mock leadership data
    return [
      { name: 'John Doe', role: 'CEO', linkedinUrl: 'https://linkedin.com/in/johndoe' },
      { name: 'Jane Smith', role: 'CTO', linkedinUrl: 'https://linkedin.com/in/janesmith' }
    ];
  }
}

export default CompanyIntelligenceService;