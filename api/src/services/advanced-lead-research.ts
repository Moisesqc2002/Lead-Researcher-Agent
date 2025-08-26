import { PrismaClient } from '@prisma/client';
import OpenAIService, { ICPDetails } from './openai.js';
import { LinkedInService } from './sources/linkedin-service.js';
import { ApolloService } from './sources/apollo-service.js';
import { ZoomInfoService } from './sources/zoominfo-service.js';
import { EmailVerificationService } from './verification/email-verification.js';
import { CompanyIntelligenceService } from './intelligence/company-intelligence.js';
import { SocialSignalsService } from './intelligence/social-signals.js';
import { LeadScoringService } from './scoring/lead-scoring.js';
import { DataQualityService } from './quality/data-quality.js';
import Bottleneck from 'bottleneck';

const prisma = new PrismaClient();

// Advanced lead research configuration
const RESEARCH_CONFIG = {
  maxLeadsPerCampaign: 100,
  minQualityScore: 7.0,
  maxConcurrentRequests: 3,
  requestDelayMs: 2000,
  sources: {
    linkedin: { enabled: true, priority: 1, maxResults: 50 },
    apollo: { enabled: true, priority: 2, maxResults: 30 },
    zoominfo: { enabled: true, priority: 3, maxResults: 25 },
    webScraping: { enabled: true, priority: 4, maxResults: 20 }
  }
};

export interface AdvancedLeadResearchParams {
  campaignId: string;
  icpDetails: ICPDetails;
  userContext: any;
  targetCount?: number;
  qualityThreshold?: number;
  sourcePriorities?: string[];
}

export interface EnhancedLead {
  // Basic Info
  firstName: string;
  lastName: string;
  email?: string;
  emailVerified: boolean;
  emailDeliverabilityScore?: number;
  
  // Professional Info
  linkedinUrl?: string;
  linkedinConnections?: number;
  linkedinActivityScore?: number;
  companyName?: string;
  role?: string;
  seniority?: 'junior' | 'mid' | 'senior' | 'executive' | 'c-level';
  department?: string;
  
  // Company Intelligence
  website?: string;
  companySize?: string;
  companyRevenue?: string;
  companyFunding?: string;
  companyTechStack?: string[];
  companyGrowthSignals?: string[];
  
  // Contact Intelligence
  phoneNumber?: string;
  personalEmail?: string;
  socialProfiles?: {
    twitter?: string;
    github?: string;
    crunchbase?: string;
  };
  
  // Behavioral Signals
  recentActivity?: string[];
  contentEngagement?: number;
  jobChangeSignals?: boolean;
  buyingSignals?: string[];
  painPointIndicators?: string[];
  
  // AI Analysis
  aboutSummary?: string;
  qualificationReason?: string;
  interestRating?: number;
  personalizedHooks?: string[];
  competitorAnalysis?: string;
  
  // Data Quality
  dataFreshnessScore?: number;
  sourceCredibility?: number;
  duplicateRisk?: number;
  
  // Metadata
  dataPoints?: any;
  sources?: string[];
  lastUpdated?: Date;
  researchNotes?: string;
}

export class AdvancedLeadResearchService {
  private static rateLimiter = new Bottleneck({
    maxConcurrent: RESEARCH_CONFIG.maxConcurrentRequests,
    minTime: RESEARCH_CONFIG.requestDelayMs
  });

  static async conductAdvancedResearch(params: AdvancedLeadResearchParams): Promise<EnhancedLead[]> {
    console.log(`🚀 Starting advanced lead research for campaign ${params.campaignId}`);
    
    try {
      // Step 1: Multi-source lead discovery
      const rawLeads = await this.discoverLeadsFromMultipleSources(params);
      console.log(`📊 Discovered ${rawLeads.length} raw leads from multiple sources`);
      
      // Step 2: Data quality and deduplication
      const cleanedLeads = await DataQualityService.processLeads(rawLeads);
      console.log(`🧹 Cleaned data: ${cleanedLeads.length} unique leads after deduplication`);
      
      // Step 3: Advanced email verification
      const verifiedLeads = await this.verifyContactInformation(cleanedLeads);
      console.log(`✅ Email verification complete: ${verifiedLeads.filter(l => l.emailVerified).length} verified contacts`);
      
      // Step 4: Company intelligence gathering
      const enrichedLeads = await this.enrichWithCompanyIntelligence(verifiedLeads);
      console.log(`🏢 Company intelligence added to ${enrichedLeads.length} leads`);
      
      // Step 5: Social signals analysis
      const socialEnrichedLeads = await this.analyzeSocialSignals(enrichedLeads);
      console.log(`📱 Social signals analyzed for ${socialEnrichedLeads.length} leads`);
      
      // Step 6: AI-powered lead scoring and qualification
      const scoredLeads = await this.scoreAndQualifyLeads(socialEnrichedLeads, params);
      console.log(`🎯 AI scoring complete: ${scoredLeads.length} leads scored`);
      
      // Step 7: Advanced prioritization
      const prioritizedLeads = await LeadScoringService.prioritizeLeads(scoredLeads, params.icpDetails);
      console.log(`⭐ Lead prioritization complete`);
      
      // Step 8: Quality filtering
      const finalLeads = prioritizedLeads
        .filter(lead => (lead.interestRating || 0) >= (params.qualityThreshold || RESEARCH_CONFIG.minQualityScore))
        .slice(0, params.targetCount || RESEARCH_CONFIG.maxLeadsPerCampaign);
      
      console.log(`✨ Advanced research completed: ${finalLeads.length} high-quality leads found`);
      return finalLeads;
      
    } catch (error) {
      console.error('❌ Advanced research failed:', error);
      throw error;
    }
  }

  private static async discoverLeadsFromMultipleSources(params: AdvancedLeadResearchParams): Promise<EnhancedLead[]> {
    const allLeads: EnhancedLead[] = [];
    const sources = RESEARCH_CONFIG.sources;
    
    const discoveryTasks = [];
    
    // LinkedIn Sales Navigator (highest priority)
    if (sources.linkedin.enabled) {
      discoveryTasks.push(
        this.rateLimiter.schedule(() => 
          LinkedInService.searchProfiles(params.icpDetails, sources.linkedin.maxResults)
        )
      );
    }
    
    // Apollo.io database
    if (sources.apollo.enabled) {
      discoveryTasks.push(
        this.rateLimiter.schedule(() => 
          ApolloService.searchLeads(params.icpDetails, sources.apollo.maxResults)
        )
      );
    }
    
    // ZoomInfo database
    if (sources.zoominfo.enabled) {
      discoveryTasks.push(
        this.rateLimiter.schedule(() => 
          ZoomInfoService.searchContacts(params.icpDetails, sources.zoominfo.maxResults)
        )
      );
    }
    
    // Execute all searches in parallel with rate limiting
    const results = await Promise.allSettled(discoveryTasks);
    
    // Combine results from all sources
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allLeads.push(...result.value);
      }
    }
    
    return allLeads;
  }

  private static async verifyContactInformation(leads: EnhancedLead[]): Promise<EnhancedLead[]> {
    const verificationTasks = leads.map(lead => 
      this.rateLimiter.schedule(async () => {
        try {
          const verification = await EmailVerificationService.verifyContact(lead);
          return {
            ...lead,
            emailVerified: verification.isValid,
            emailDeliverabilityScore: verification.deliverabilityScore,
            phoneNumber: verification.phoneNumber
          };
        } catch (error) {
          console.warn(`Email verification failed for ${lead.email}:`, error);
          return lead;
        }
      })
    );
    
    return Promise.all(verificationTasks);
  }

  private static async enrichWithCompanyIntelligence(leads: EnhancedLead[]): Promise<EnhancedLead[]> {
    const enrichmentTasks = leads.map(lead => 
      this.rateLimiter.schedule(async () => {
        try {
          const intelligence = await CompanyIntelligenceService.gatherIntelligence(lead.companyName, lead.website);
          return {
            ...lead,
            companySize: intelligence.size,
            companyRevenue: intelligence.revenue,
            companyFunding: intelligence.funding,
            companyTechStack: intelligence.techStack,
            companyGrowthSignals: intelligence.growthSignals,
            buyingSignals: intelligence.buyingSignals,
            painPointIndicators: intelligence.painPoints
          };
        } catch (error) {
          console.warn(`Company intelligence failed for ${lead.companyName}:`, error);
          return lead;
        }
      })
    );
    
    return Promise.all(enrichmentTasks);
  }

  private static async analyzeSocialSignals(leads: EnhancedLead[]): Promise<EnhancedLead[]> {
    const socialTasks = leads.map(lead => 
      this.rateLimiter.schedule(async () => {
        try {
          const signals = await SocialSignalsService.analyzeSignals(lead);
          return {
            ...lead,
            linkedinActivityScore: signals.linkedinActivity,
            contentEngagement: signals.contentEngagement,
            jobChangeSignals: signals.jobChangeSignals,
            recentActivity: signals.recentActivity,
            socialProfiles: signals.socialProfiles
          };
        } catch (error) {
          console.warn(`Social analysis failed for ${lead.firstName} ${lead.lastName}:`, error);
          return lead;
        }
      })
    );
    
    return Promise.all(socialTasks);
  }

  private static async scoreAndQualifyLeads(leads: EnhancedLead[], params: AdvancedLeadResearchParams): Promise<EnhancedLead[]> {
    const scoringTasks = leads.map(lead => 
      this.rateLimiter.schedule(async () => {
        try {
          // Advanced AI analysis using OpenAI with enriched data
          const analysis = await OpenAIService.generateAdvancedLeadAnalysis(
            lead, 
            params.icpDetails, 
            params.userContext
          );
          
          return {
            ...lead,
            qualificationReason: analysis.qualificationReason,
            interestRating: analysis.interestRating,
            personalizedHooks: analysis.personalizedHooks,
            competitorAnalysis: analysis.competitorAnalysis,
            aboutSummary: analysis.summary
          };
        } catch (error) {
          console.warn(`AI scoring failed for ${lead.firstName} ${lead.lastName}:`, error);
          return {
            ...lead,
            qualificationReason: 'Profile matches target criteria based on role and company',
            interestRating: 6.5
          };
        }
      })
    );
    
    return Promise.all(scoringTasks);
  }

  static async saveAdvancedLeadsToDatabase(campaignId: string, leads: EnhancedLead[]): Promise<void> {
    try {
      const leadData = leads.map(lead => ({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        emailVerified: lead.emailVerified,
        linkedinUrl: lead.linkedinUrl,
        companyName: lead.companyName,
        role: lead.role,
        website: lead.website,
        aboutSummary: lead.aboutSummary,
        dataPoints: {
          // Store all enriched data
          seniority: lead.seniority,
          department: lead.department,
          companySize: lead.companySize,
          companyRevenue: lead.companyRevenue,
          companyFunding: lead.companyFunding,
          companyTechStack: lead.companyTechStack,
          companyGrowthSignals: lead.companyGrowthSignals,
          phoneNumber: lead.phoneNumber,
          socialProfiles: lead.socialProfiles,
          recentActivity: lead.recentActivity,
          contentEngagement: lead.contentEngagement,
          jobChangeSignals: lead.jobChangeSignals,
          buyingSignals: lead.buyingSignals,
          painPointIndicators: lead.painPointIndicators,
          personalizedHooks: lead.personalizedHooks,
          competitorAnalysis: lead.competitorAnalysis,
          emailDeliverabilityScore: lead.emailDeliverabilityScore,
          dataFreshnessScore: lead.dataFreshnessScore,
          sourceCredibility: lead.sourceCredibility,
          sources: lead.sources,
          lastUpdated: lead.lastUpdated
        },
        qualificationReason: lead.qualificationReason,
        interestRating: lead.interestRating,
        campaignId
      }));

      await prisma.lead.createMany({ data: leadData });
      console.log(`💾 Saved ${leads.length} advanced leads to database for campaign ${campaignId}`);
      
    } catch (error) {
      console.error('❌ Failed to save advanced leads to database:', error);
      throw error;
    }
  }
}

export default AdvancedLeadResearchService;