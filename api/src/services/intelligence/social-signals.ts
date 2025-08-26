import puppeteer, { Browser, Page } from 'puppeteer';
import { EnhancedLead } from '../advanced-lead-research.js';

interface SocialSignals {
  // LinkedIn signals
  linkedinActivity: number;        // 0-100: Overall activity score
  linkedinPostFrequency: number;   // Posts per week
  linkedinEngagement: number;      // Average likes/comments per post
  linkedinConnections: number;     // Total connections
  linkedinConnectionsGrowth: number; // Monthly growth rate
  linkedinInfluence: number;       // Industry influence score
  
  // Content engagement
  contentEngagement: number;       // 0-100: Overall engagement score
  contentTypes: string[];          // Article, video, poll, etc.
  contentTopics: string[];         // Main topics discussed
  contentSentiment: 'positive' | 'neutral' | 'negative';
  thoughtLeadership: number;       // 0-100: Thought leadership score
  
  // Professional signals
  jobChangeSignals: boolean;       // Indicators of potential job change
  careerProgression: number;       // 0-100: Career growth trajectory
  industryInvolvement: number;     // Conference speaking, etc.
  networkQuality: number;          // Quality of professional network
  
  // Behavioral patterns
  activityPattern: {
    bestTimeToContact: string;     // Time of day for highest activity
    activeWeekdays: string[];      // Most active days
    responsePattern: string;       // Response likelihood
  };
  
  // Recent activity analysis
  recentActivity: string[];        // Last 10 activities
  activityTrends: {
    increasing: boolean;           // Activity trending up
    engagementUp: boolean;         // Engagement improving
    topicShifts: string[];         // New topics being discussed
  };
  
  // Social proof indicators
  socialProfiles: {
    twitter?: {
      handle: string;
      followers: number;
      engagement: number;
    };
    github?: {
      username: string;
      repos: number;
      contributions: number;
    };
    medium?: {
      username: string;
      followers: number;
      articles: number;
    };
    personal?: {
      website: string;
      blog: boolean;
      newsletter: boolean;
    };
  };
  
  // Verification and confidence
  profileCompleteness: number;     // 0-100: How complete profiles are
  dataFreshness: number;          // 0-100: How recent the data is
  signalConfidence: number;       // 0-100: Confidence in the signals
}

export class SocialSignalsService {
  private static browser: Browser | null = null;
  private static readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

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
          '--window-size=1920x1080'
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

  static async analyzeSignals(lead: EnhancedLead): Promise<SocialSignals> {
    console.log(`📱 Analyzing social signals for ${lead.firstName} ${lead.lastName}...`);

    try {
      // For development, return comprehensive mock data
      return await this.generateMockSocialSignals(lead);
    } catch (error) {
      console.error('Social signals analysis failed:', error);
      return this.generateFallbackSignals(lead);
    }
  }

  private static async realSocialAnalysis(lead: EnhancedLead): Promise<SocialSignals> {
    await this.initialize();
    
    const signals: Partial<SocialSignals> = {
      linkedinConnections: lead.linkedinConnections || 0,
      linkedinActivity: lead.linkedinActivityScore || 50,
      contentEngagement: lead.contentEngagement || 30,
      recentActivity: lead.recentActivity || []
    };

    // Analyze LinkedIn profile
    if (lead.linkedinUrl) {
      await this.analyzeLinkedInProfile(lead.linkedinUrl, signals);
    }

    // Search for other social profiles
    await this.findAdditionalSocialProfiles(lead, signals);

    // Analyze content and engagement patterns
    await this.analyzeContentPatterns(signals);

    // Calculate behavioral patterns
    await this.analyzeBehavioralPatterns(signals);

    return this.processSocialSignals(signals as SocialSignals);
  }

  private static async analyzeLinkedInProfile(
    linkedinUrl: string, 
    signals: Partial<SocialSignals>
  ): Promise<void> {
    if (!this.browser) return;

    const page = await this.browser.newPage();
    
    try {
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      // Note: LinkedIn requires authentication and has strict anti-bot measures
      // This is a placeholder for the real implementation
      console.log('LinkedIn profile analysis requires authentication - using mock data');

      await this.delay(this.RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.warn('LinkedIn analysis failed:', error);
    } finally {
      await page.close();
    }
  }

  private static async findAdditionalSocialProfiles(
    lead: EnhancedLead, 
    signals: Partial<SocialSignals>
  ): Promise<void> {
    if (!this.browser) return;

    const page = await this.browser.newPage();
    
    try {
      const searchQuery = `"${lead.firstName} ${lead.lastName}" ${lead.companyName}`;
      
      // Search for Twitter profile
      await this.searchTwitterProfile(page, searchQuery, signals);
      
      // Search for GitHub profile
      await this.searchGitHubProfile(page, lead, signals);
      
      // Search for personal website/blog
      await this.searchPersonalWebsite(page, searchQuery, signals);
      
    } catch (error) {
      console.warn('Additional profile search failed:', error);
    } finally {
      await page.close();
    }
  }

  private static async searchTwitterProfile(
    page: Page, 
    searchQuery: string, 
    signals: Partial<SocialSignals>
  ): Promise<void> {
    try {
      // Mock Twitter analysis - real implementation would require Twitter API
      const mockTwitterData = {
        handle: '@johndoe_marketing',
        followers: Math.floor(Math.random() * 5000) + 500,
        engagement: Math.floor(Math.random() * 50) + 20
      };

      if (!signals.socialProfiles) signals.socialProfiles = {};
      signals.socialProfiles.twitter = mockTwitterData;

    } catch (error) {
      console.warn('Twitter search failed:', error);
    }
  }

  private static async searchGitHubProfile(
    page: Page, 
    lead: EnhancedLead, 
    signals: Partial<SocialSignals>
  ): Promise<void> {
    try {
      // Search GitHub by name (if in tech role)
      const techRoles = ['engineer', 'developer', 'cto', 'technical', 'tech'];
      const isTechRole = techRoles.some(role => 
        lead.role?.toLowerCase().includes(role) || 
        lead.department?.toLowerCase().includes(role)
      );

      if (isTechRole && Math.random() > 0.3) { // 70% chance for tech roles
        const mockGitHubData = {
          username: `${lead.firstName?.toLowerCase()}${lead.lastName?.toLowerCase()}`,
          repos: Math.floor(Math.random() * 50) + 5,
          contributions: Math.floor(Math.random() * 1000) + 100
        };

        if (!signals.socialProfiles) signals.socialProfiles = {};
        signals.socialProfiles.github = mockGitHubData;
      }

    } catch (error) {
      console.warn('GitHub search failed:', error);
    }
  }

  private static async searchPersonalWebsite(
    page: Page, 
    searchQuery: string, 
    signals: Partial<SocialSignals>
  ): Promise<void> {
    try {
      // Mock personal website detection
      if (Math.random() > 0.7) { // 30% have personal websites
        const mockWebsiteData = {
          website: `https://${lead.firstName?.toLowerCase()}-${lead.lastName?.toLowerCase()}.com`,
          blog: Math.random() > 0.5,
          newsletter: Math.random() > 0.8
        };

        if (!signals.socialProfiles) signals.socialProfiles = {};
        signals.socialProfiles.personal = mockWebsiteData;
      }

    } catch (error) {
      console.warn('Personal website search failed:', error);
    }
  }

  private static async analyzeContentPatterns(signals: Partial<SocialSignals>): Promise<void> {
    // Mock content analysis
    const contentTypes = ['Article', 'LinkedIn Post', 'Industry Report', 'Webinar', 'Podcast'];
    const contentTopics = [
      'Marketing Automation', 'Lead Generation', 'Sales Alignment', 
      'Customer Success', 'Growth Strategy', 'Digital Transformation'
    ];

    signals.contentTypes = contentTypes.slice(0, Math.floor(Math.random() * 3) + 2);
    signals.contentTopics = contentTopics.slice(0, Math.floor(Math.random() * 4) + 2);
    signals.contentSentiment = ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any;
    signals.thoughtLeadership = Math.floor(Math.random() * 40) + 40; // 40-80
  }

  private static async analyzeBehavioralPatterns(signals: Partial<SocialSignals>): Promise<void> {
    // Mock behavioral pattern analysis
    const timeZones = ['9-11 AM EST', '2-4 PM EST', '6-8 PM EST'];
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const responsePatterns = ['Quick responder', 'Thoughtful responder', 'Occasional responder'];

    signals.activityPattern = {
      bestTimeToContact: timeZones[Math.floor(Math.random() * timeZones.length)],
      activeWeekdays: weekdays.slice(0, Math.floor(Math.random() * 3) + 3),
      responsePattern: responsePatterns[Math.floor(Math.random() * responsePatterns.length)]
    };

    // Job change signals
    const jobChangeIndicators = [
      'Recently updated LinkedIn headline',
      'Increased networking activity',
      'Posted about career growth',
      'Engaging with recruiters',
      'Skills endorsements increasing'
    ];

    const hasJobChangeSignals = Math.random() > 0.7; // 30% show job change signals
    signals.jobChangeSignals = hasJobChangeSignals;

    if (hasJobChangeSignals) {
      signals.recentActivity = [
        ...signals.recentActivity || [],
        jobChangeIndicators[Math.floor(Math.random() * jobChangeIndicators.length)]
      ];
    }
  }

  private static async generateMockSocialSignals(lead: EnhancedLead): Promise<SocialSignals> {
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate realistic mock data based on lead profile
    const isActiveOnSocial = Math.random() > 0.3; // 70% are active on social
    const isSeniorRole = ['executive', 'c-level'].includes(lead.seniority || '');
    const isMarketingRole = lead.role?.toLowerCase().includes('marketing') || 
                           lead.department?.toLowerCase().includes('marketing');

    const baseActivity = isSeniorRole ? 70 : isMarketingRole ? 80 : 60;
    const activityVariance = Math.floor(Math.random() * 20) - 10; // +/- 10
    const linkedinActivity = Math.max(20, Math.min(100, baseActivity + activityVariance));

    const mockSocialProfiles: SocialSignals['socialProfiles'] = {};

    // Twitter profile (higher chance for marketing roles)
    if (isMarketingRole && Math.random() > 0.4) {
      mockSocialProfiles.twitter = {
        handle: `@${lead.firstName?.toLowerCase()}${lead.lastName?.toLowerCase()}_${lead.role?.split(' ')[0]?.toLowerCase()}`,
        followers: Math.floor(Math.random() * 3000) + 500,
        engagement: Math.floor(Math.random() * 40) + 30
      };
    }

    // GitHub profile (for technical roles)
    const techRoles = ['engineer', 'developer', 'cto', 'technical', 'tech', 'data'];
    const isTechRole = techRoles.some(role => 
      lead.role?.toLowerCase().includes(role) || 
      lead.department?.toLowerCase().includes(role)
    );

    if (isTechRole && Math.random() > 0.3) {
      mockSocialProfiles.github = {
        username: `${lead.firstName?.toLowerCase()}${lead.lastName?.toLowerCase()}`,
        repos: Math.floor(Math.random() * 30) + 10,
        contributions: Math.floor(Math.random() * 800) + 200
      };
    }

    // Personal website/blog (higher chance for senior roles)
    if (isSeniorRole && Math.random() > 0.5) {
      mockSocialProfiles.personal = {
        website: `https://${lead.firstName?.toLowerCase()}${lead.lastName?.toLowerCase()}.com`,
        blog: Math.random() > 0.4,
        newsletter: Math.random() > 0.7
      };
    }

    // Generate activity trends
    const activityTrends = {
      increasing: Math.random() > 0.6, // 40% showing increased activity
      engagementUp: Math.random() > 0.5, // 50% showing improved engagement
      topicShifts: isMarketingRole ? 
        ['AI in Marketing', 'Customer Experience', 'Marketing Attribution'] :
        ['Industry Trends', 'Leadership', 'Professional Development']
    };

    // Recent activity based on role and activity level
    const baseActivities = [
      'Posted about industry trends',
      'Shared company updates',
      'Engaged with thought leadership content',
      'Participated in industry discussion',
      'Shared professional milestone'
    ];

    const marketingActivities = [
      'Posted about marketing automation',
      'Shared lead generation insights',
      'Discussed conversion optimization',
      'Posted about customer journey mapping',
      'Shared marketing attribution article'
    ];

    const seniorActivities = [
      'Posted about team leadership',
      'Shared strategic insights',
      'Announced new partnership',
      'Posted about company growth',
      'Shared hiring updates'
    ];

    let activityPool = baseActivities;
    if (isMarketingRole) activityPool = [...activityPool, ...marketingActivities];
    if (isSeniorRole) activityPool = [...activityPool, ...seniorActivities];

    const recentActivity = [];
    const activityCount = Math.floor(linkedinActivity / 20) + 2; // 2-7 activities
    
    for (let i = 0; i < Math.min(activityCount, 8); i++) {
      const randomActivity = activityPool[Math.floor(Math.random() * activityPool.length)];
      if (!recentActivity.includes(randomActivity)) {
        recentActivity.push(randomActivity);
      }
    }

    // Content topics based on role
    let contentTopics = ['Professional Development', 'Industry Insights'];
    if (isMarketingRole) {
      contentTopics.push('Marketing Strategy', 'Lead Generation', 'Customer Acquisition');
    }
    if (isSeniorRole) {
      contentTopics.push('Leadership', 'Strategic Planning', 'Team Building');
    }

    // Job change signals (higher for mid-level roles)
    const jobChangeSignals = lead.seniority === 'mid' ? Math.random() > 0.7 : Math.random() > 0.8;

    return {
      linkedinActivity,
      linkedinPostFrequency: Math.floor(linkedinActivity / 20) + 1, // 1-6 posts per week
      linkedinEngagement: Math.floor(linkedinActivity * 0.8) + 20,
      linkedinConnections: lead.linkedinConnections || Math.floor(Math.random() * 3000) + 500,
      linkedinConnectionsGrowth: Math.floor(Math.random() * 20) + 5, // 5-25 per month
      linkedinInfluence: isSeniorRole ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 40,

      contentEngagement: Math.floor(linkedinActivity * 0.9) + 10,
      contentTypes: isMarketingRole ? 
        ['LinkedIn Post', 'Article', 'Webinar', 'Industry Report'] :
        ['LinkedIn Post', 'Article', 'Company Update'],
      contentTopics,
      contentSentiment: Math.random() > 0.8 ? 'negative' : Math.random() > 0.3 ? 'positive' : 'neutral',
      thoughtLeadership: isSeniorRole ? Math.floor(Math.random() * 30) + 60 : Math.floor(Math.random() * 40) + 30,

      jobChangeSignals,
      careerProgression: Math.floor(Math.random() * 30) + (isSeniorRole ? 70 : 50),
      industryInvolvement: isSeniorRole ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30) + 30,
      networkQuality: Math.floor(Math.random() * 30) + (isSeniorRole ? 70 : 50),

      activityPattern: {
        bestTimeToContact: ['9-11 AM EST', '2-4 PM EST', '6-8 PM EST'][Math.floor(Math.random() * 3)],
        activeWeekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'].slice(0, Math.floor(Math.random() * 2) + 3),
        responsePattern: isSeniorRole ? 'Thoughtful responder' : 'Quick responder'
      },

      recentActivity,
      activityTrends,

      socialProfiles: mockSocialProfiles,

      profileCompleteness: Math.floor(Math.random() * 20) + 75, // 75-95
      dataFreshness: Math.floor(Math.random() * 15) + 85, // 85-100
      signalConfidence: Math.floor(Math.random() * 20) + 70 // 70-90
    };
  }

  private static generateFallbackSignals(lead: EnhancedLead): SocialSignals {
    return {
      linkedinActivity: lead.linkedinActivityScore || 50,
      linkedinPostFrequency: 2,
      linkedinEngagement: lead.contentEngagement || 40,
      linkedinConnections: lead.linkedinConnections || 500,
      linkedinConnectionsGrowth: 10,
      linkedinInfluence: 45,

      contentEngagement: 40,
      contentTypes: ['LinkedIn Post'],
      contentTopics: ['Professional Development'],
      contentSentiment: 'neutral',
      thoughtLeadership: 35,

      jobChangeSignals: false,
      careerProgression: 50,
      industryInvolvement: 40,
      networkQuality: 50,

      activityPattern: {
        bestTimeToContact: '2-4 PM EST',
        activeWeekdays: ['Tuesday', 'Wednesday', 'Thursday'],
        responsePattern: 'Occasional responder'
      },

      recentActivity: ['Posted professional update'],
      activityTrends: {
        increasing: false,
        engagementUp: false,
        topicShifts: []
      },

      socialProfiles: {},

      profileCompleteness: 60,
      dataFreshness: 70,
      signalConfidence: 50
    };
  }

  private static processSocialSignals(signals: SocialSignals): SocialSignals {
    // Calculate composite scores
    const activityScore = (signals.linkedinActivity + signals.contentEngagement + signals.thoughtLeadership) / 3;
    const professionalScore = (signals.careerProgression + signals.industryInvolvement + signals.networkQuality) / 3;
    const dataQualityScore = (signals.profileCompleteness + signals.dataFreshness) / 2;

    // Adjust confidence based on data quality and activity level
    signals.signalConfidence = Math.round(
      (signals.signalConfidence * 0.5) + 
      (dataQualityScore * 0.3) + 
      (activityScore * 0.2)
    );

    // Ensure all scores are within bounds
    Object.keys(signals).forEach(key => {
      const value = (signals as any)[key];
      if (typeof value === 'number' && key.includes('Score') || key.includes('Activity') || key.includes('Engagement')) {
        (signals as any)[key] = Math.max(0, Math.min(100, value));
      }
    });

    return signals;
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods for specific signal analysis
  static async getLinkedInActivityScore(linkedinUrl: string): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 40) + 60; // 60-100
  }

  static async getContentEngagementMetrics(lead: EnhancedLead): Promise<{
    averageLikes: number;
    averageComments: number;
    postFrequency: number;
  }> {
    return {
      averageLikes: Math.floor(Math.random() * 50) + 10,
      averageComments: Math.floor(Math.random() * 20) + 2,
      postFrequency: Math.floor(Math.random() * 5) + 1
    };
  }

  static async detectJobChangeSignals(lead: EnhancedLead): Promise<{
    likelihood: number;
    indicators: string[];
  }> {
    const indicators = [
      'Recently updated LinkedIn profile',
      'Increased networking activity',
      'Posted about career opportunities',
      'Skills endorsements trending up'
    ];

    const likelihood = Math.floor(Math.random() * 60) + 20; // 20-80
    const relevantIndicators = indicators.slice(0, Math.floor(Math.random() * 3) + 1);

    return {
      likelihood,
      indicators: relevantIndicators
    };
  }
}

export default SocialSignalsService;