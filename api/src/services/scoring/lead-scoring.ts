import OpenAIService, { ICPDetails } from '../openai.js';
import { EnhancedLead } from '../advanced-lead-research.js';

interface LeadScoringFactors {
  // Demographic factors
  roleMatch: number;          // 0-100: How well role matches ICP
  seniorityMatch: number;     // 0-100: Seniority level alignment
  companyMatch: number;       // 0-100: Company size/type match
  locationMatch: number;      // 0-100: Geographic alignment
  industryMatch: number;      // 0-100: Industry relevance

  // Behavioral factors
  linkedinActivity: number;   // 0-100: LinkedIn engagement level
  contentEngagement: number;  // 0-100: Content interaction
  jobChangeLikelihood: number; // 0-100: Probability of job change
  buyingSignals: number;      // 0-100: Purchase intent indicators
  painPointAlignment: number; // 0-100: Problem-solution fit

  // Data quality factors
  dataCompleteness: number;   // 0-100: Profile completeness
  dataFreshness: number;      // 0-100: How recent is the data
  sourceCredibility: number;  // 0-100: Trust in data sources
  emailVerification: number;  // 0-100: Email deliverability

  // Company intelligence factors
  companyGrowth: number;      // 0-100: Growth indicators
  technologyFit: number;      // 0-100: Tech stack alignment
  fundingStage: number;       // 0-100: Funding maturity
  competitorAnalysis: number; // 0-100: Competitive landscape fit

  // Social proof factors
  networkQuality: number;     // 0-100: LinkedIn connections quality
  thoughtLeadership: number;  // 0-100: Industry influence
  mutualConnections: number;  // 0-100: Shared network
  socialValidation: number;   // 0-100: Social credibility
}

interface LeadScore {
  overallScore: number;       // 0-100: Final composite score
  confidence: number;         // 0-100: Confidence in score
  tier: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  priority: 'high' | 'medium' | 'low';
  factors: LeadScoringFactors;
  explanation: string;
  recommendations: string[];
  nextBestActions: string[];
}

export class LeadScoringService {
  // Configurable scoring weights
  private static readonly SCORING_WEIGHTS = {
    demographic: 0.25,      // Role, seniority, company fit
    behavioral: 0.30,       // Activity, engagement, buying signals
    dataQuality: 0.15,      // Completeness, freshness, verification
    companyIntel: 0.20,     // Growth, tech fit, funding
    socialProof: 0.10       // Network, influence, validation
  };

  static async scoreAndQualifyLeads(
    leads: EnhancedLead[], 
    icpDetails: ICPDetails
  ): Promise<EnhancedLead[]> {
    console.log(`🎯 Scoring ${leads.length} leads with advanced AI algorithms...`);

    const scoringTasks = leads.map(lead => 
      this.scoreLead(lead, icpDetails)
    );

    const scoredLeads = await Promise.all(scoringTasks);
    
    // Sort by score and add ranking
    return scoredLeads
      .sort((a, b) => (b.interestRating || 0) - (a.interestRating || 0))
      .map((lead, index) => ({
        ...lead,
        dataPoints: {
          ...lead.dataPoints,
          rank: index + 1,
          percentile: Math.round((1 - index / scoredLeads.length) * 100)
        }
      }));
  }

  private static async scoreLead(
    lead: EnhancedLead, 
    icpDetails: ICPDetails
  ): Promise<EnhancedLead> {
    try {
      // Calculate all scoring factors
      const factors = await this.calculateScoringFactors(lead, icpDetails);
      
      // Generate AI analysis
      const aiAnalysis = await this.generateAIAnalysis(lead, icpDetails, factors);
      
      // Calculate final score
      const score = this.calculateCompositeScore(factors);
      
      return {
        ...lead,
        interestRating: score.overallScore,
        qualificationReason: score.explanation,
        personalizedHooks: aiAnalysis.personalizedHooks,
        competitorAnalysis: aiAnalysis.competitorAnalysis,
        dataPoints: {
          ...lead.dataPoints,
          scoringFactors: factors,
          confidence: score.confidence,
          tier: score.tier,
          priority: score.priority,
          recommendations: score.recommendations,
          nextBestActions: score.nextBestActions,
          aiAnalysis: aiAnalysis
        }
      };
    } catch (error) {
      console.error(`Scoring failed for ${lead.firstName} ${lead.lastName}:`, error);
      
      // Fallback scoring
      return {
        ...lead,
        interestRating: await this.fallbackScoring(lead, icpDetails),
        qualificationReason: `Profile matches target criteria: ${lead.role} at ${lead.companyName}`,
        dataPoints: {
          ...lead.dataPoints,
          scoringError: true
        }
      };
    }
  }

  private static async calculateScoringFactors(
    lead: EnhancedLead, 
    icpDetails: ICPDetails
  ): Promise<LeadScoringFactors> {
    
    return {
      // Demographic factors
      roleMatch: this.calculateRoleMatch(lead.role, icpDetails.targetRole),
      seniorityMatch: this.calculateSeniorityMatch(lead.seniority, icpDetails.seniority),
      companyMatch: this.calculateCompanyMatch(lead.companySize, icpDetails.companySize),
      locationMatch: this.calculateLocationMatch(lead.dataPoints?.location, icpDetails.location),
      industryMatch: this.calculateIndustryMatch(lead.dataPoints?.industry, icpDetails.targetIndustry),

      // Behavioral factors
      linkedinActivity: lead.linkedinActivityScore || 50,
      contentEngagement: lead.contentEngagement || 40,
      jobChangeLikelihood: lead.jobChangeSignals ? 80 : 30,
      buyingSignals: this.calculateBuyingSignals(lead.buyingSignals),
      painPointAlignment: this.calculatePainPointAlignment(lead.painPointIndicators, icpDetails),

      // Data quality factors
      dataCompleteness: this.calculateDataCompleteness(lead),
      dataFreshness: lead.dataFreshnessScore || 70,
      sourceCredibility: lead.sourceCredibility || 75,
      emailVerification: lead.emailDeliverabilityScore || 60,

      // Company intelligence factors
      companyGrowth: this.calculateCompanyGrowth(lead.companyGrowthSignals),
      technologyFit: this.calculateTechnologyFit(lead.companyTechStack, icpDetails),
      fundingStage: this.calculateFundingStage(lead.companyFunding),
      competitorAnalysis: this.calculateCompetitorFit(lead.competitorAnalysis),

      // Social proof factors
      networkQuality: this.calculateNetworkQuality(lead.linkedinConnections),
      thoughtLeadership: this.calculateThoughtLeadership(lead.recentActivity),
      mutualConnections: Math.floor(Math.random() * 30) + 20, // Mock for now
      socialValidation: this.calculateSocialValidation(lead)
    };
  }

  private static calculateCompositeScore(factors: LeadScoringFactors): LeadScore {
    // Calculate category scores
    const demographicScore = (
      factors.roleMatch + 
      factors.seniorityMatch + 
      factors.companyMatch + 
      factors.locationMatch + 
      factors.industryMatch
    ) / 5;

    const behavioralScore = (
      factors.linkedinActivity + 
      factors.contentEngagement + 
      factors.jobChangeLikelihood + 
      factors.buyingSignals + 
      factors.painPointAlignment
    ) / 5;

    const dataQualityScore = (
      factors.dataCompleteness + 
      factors.dataFreshness + 
      factors.sourceCredibility + 
      factors.emailVerification
    ) / 4;

    const companyIntelScore = (
      factors.companyGrowth + 
      factors.technologyFit + 
      factors.fundingStage + 
      factors.competitorAnalysis
    ) / 4;

    const socialProofScore = (
      factors.networkQuality + 
      factors.thoughtLeadership + 
      factors.mutualConnections + 
      factors.socialValidation
    ) / 4;

    // Apply weights
    const overallScore = Math.round(
      demographicScore * this.SCORING_WEIGHTS.demographic +
      behavioralScore * this.SCORING_WEIGHTS.behavioral +
      dataQualityScore * this.SCORING_WEIGHTS.dataQuality +
      companyIntelScore * this.SCORING_WEIGHTS.companyIntel +
      socialProofScore * this.SCORING_WEIGHTS.socialProof
    );

    // Calculate confidence based on data quality and completeness
    const confidence = Math.min(100, Math.round(
      (factors.dataCompleteness + factors.sourceCredibility) / 2 * 1.2
    ));

    // Assign tier and priority
    const tier = this.assignTier(overallScore);
    const priority = this.assignPriority(overallScore, behavioralScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, overallScore);
    const nextBestActions = this.generateNextBestActions(factors, overallScore);

    // Generate explanation
    const explanation = this.generateScoreExplanation(factors, overallScore);

    return {
      overallScore,
      confidence,
      tier,
      priority,
      factors,
      explanation,
      recommendations,
      nextBestActions
    };
  }

  private static async generateAIAnalysis(
    lead: EnhancedLead,
    icpDetails: ICPDetails,
    factors: LeadScoringFactors
  ): Promise<{
    personalizedHooks: string[];
    competitorAnalysis: string;
    summary: string;
  }> {
    try {
      // Use OpenAI for advanced analysis
      const analysis = await OpenAIService.generateAdvancedLeadAnalysis(
        lead,
        icpDetails,
        { factors } // Pass scoring context
      );

      return {
        personalizedHooks: analysis.personalizedHooks || [],
        competitorAnalysis: analysis.competitorAnalysis || '',
        summary: analysis.summary || ''
      };
    } catch (error) {
      console.warn('AI analysis failed, using fallback');
      return {
        personalizedHooks: this.generateFallbackHooks(lead, factors),
        competitorAnalysis: this.generateFallbackCompetitorAnalysis(lead),
        summary: `${lead.role} at ${lead.companyName} with strong ${factors.roleMatch > 80 ? 'role' : 'company'} fit`
      };
    }
  }

  // Individual factor calculation methods
  private static calculateRoleMatch(leadRole?: string, targetRole?: string): number {
    if (!leadRole || !targetRole) return 50;
    
    const leadTerms = leadRole.toLowerCase().split(/[\s,]+/);
    const targetTerms = targetRole.toLowerCase().split(/[\s,]+/);
    
    const matches = targetTerms.filter(term => 
      leadTerms.some(leadTerm => 
        leadTerm.includes(term) || term.includes(leadTerm)
      )
    );
    
    return Math.min(100, (matches.length / targetTerms.length) * 120);
  }

  private static calculateSeniorityMatch(
    leadSeniority?: 'junior' | 'mid' | 'senior' | 'executive' | 'c-level',
    targetSeniority?: string
  ): number {
    if (!leadSeniority || !targetSeniority) return 70;
    
    const seniorityMap = {
      'junior': 1,
      'mid': 2,
      'senior': 3,
      'executive': 4,
      'c-level': 5
    };
    
    const leadLevel = seniorityMap[leadSeniority];
    const targetLevel = seniorityMap[targetSeniority.toLowerCase() as keyof typeof seniorityMap] || 3;
    
    const difference = Math.abs(leadLevel - targetLevel);
    return Math.max(0, 100 - (difference * 20));
  }

  private static calculateCompanyMatch(leadSize?: string, targetSize?: string): number {
    if (!leadSize || !targetSize) return 60;
    
    // Extract employee count ranges and compare
    const leadNum = this.extractEmployeeCount(leadSize);
    const targetNum = this.extractEmployeeCount(targetSize);
    
    if (leadNum === targetNum) return 100;
    if (Math.abs(leadNum - targetNum) <= 1) return 80;
    if (Math.abs(leadNum - targetNum) <= 2) return 60;
    return 40;
  }

  private static calculateLocationMatch(leadLocation?: string, targetLocation?: string): number {
    if (!leadLocation || !targetLocation) return 70;
    
    const leadLower = leadLocation.toLowerCase();
    const targetLower = targetLocation.toLowerCase();
    
    if (leadLower.includes(targetLower) || targetLower.includes(leadLower)) return 100;
    
    // Check for same state/country
    const leadParts = leadLower.split(',').map(s => s.trim());
    const targetParts = targetLower.split(',').map(s => s.trim());
    
    if (leadParts.some(part => targetParts.includes(part))) return 75;
    
    return 30;
  }

  private static calculateIndustryMatch(leadIndustry?: string, targetIndustry?: string): number {
    if (!leadIndustry || !targetIndustry) return 60;
    
    const leadLower = leadIndustry.toLowerCase();
    const targetLower = targetIndustry.toLowerCase();
    
    if (leadLower === targetLower) return 100;
    if (leadLower.includes(targetLower) || targetLower.includes(leadLower)) return 85;
    
    // Check for related terms
    const techTerms = ['tech', 'software', 'saas', 'ai', 'data'];
    const leadIsTech = techTerms.some(term => leadLower.includes(term));
    const targetIsTech = techTerms.some(term => targetLower.includes(term));
    
    if (leadIsTech && targetIsTech) return 70;
    
    return 40;
  }

  private static calculateBuyingSignals(signals?: string[]): number {
    if (!signals || signals.length === 0) return 30;
    
    const strongSignals = [
      'budget approved', 'seeking vendors', 'evaluation phase',
      'rfp process', 'implementation timeline', 'contract renewal'
    ];
    
    const strongCount = signals.filter(signal => 
      strongSignals.some(strong => signal.toLowerCase().includes(strong))
    ).length;
    
    return Math.min(100, 40 + (strongCount * 20) + (signals.length * 5));
  }

  private static calculatePainPointAlignment(
    painPoints?: string[],
    icpDetails?: ICPDetails
  ): number {
    if (!painPoints || painPoints.length === 0) return 40;
    
    // Mock alignment calculation - in production would use NLP
    const commonPains = [
      'lead generation', 'conversion', 'attribution', 'automation',
      'efficiency', 'scale', 'roi', 'pipeline'
    ];
    
    const alignedCount = painPoints.filter(pain => 
      commonPains.some(common => pain.toLowerCase().includes(common))
    ).length;
    
    return Math.min(100, 30 + (alignedCount * 15) + (painPoints.length * 5));
  }

  private static calculateDataCompleteness(lead: EnhancedLead): number {
    const fields = [
      lead.firstName, lead.lastName, lead.email, lead.role,
      lead.companyName, lead.linkedinUrl, lead.website,
      lead.companySize, lead.aboutSummary
    ];
    
    const completedFields = fields.filter(field => field && field.length > 0).length;
    return Math.round((completedFields / fields.length) * 100);
  }

  private static calculateCompanyGrowth(growthSignals?: string[]): number {
    if (!growthSignals || growthSignals.length === 0) return 50;
    
    const positiveSignals = [
      'funding', 'expansion', 'hiring', 'growth', 'revenue increase',
      'new market', 'acquisition', 'partnership'
    ];
    
    const positiveCount = growthSignals.filter(signal => 
      positiveSignals.some(positive => signal.toLowerCase().includes(positive))
    ).length;
    
    return Math.min(100, 30 + (positiveCount * 20));
  }

  private static calculateTechnologyFit(techStack?: string[], icpDetails?: ICPDetails): number {
    if (!techStack || techStack.length === 0) return 50;
    
    // Mock tech compatibility - in production would have comprehensive mapping
    const compatibleTech = [
      'salesforce', 'hubspot', 'marketo', 'pardot', 'outreach',
      'mailchimp', 'pipedrive', 'monday', 'slack', 'zoom'
    ];
    
    const compatibleCount = techStack.filter(tech => 
      compatibleTech.some(compatible => 
        tech.toLowerCase().includes(compatible) ||
        compatible.includes(tech.toLowerCase())
      )
    ).length;
    
    return Math.min(100, 40 + (compatibleCount * 15));
  }

  private static calculateFundingStage(funding?: string): number {
    if (!funding) return 60;
    
    const fundingLower = funding.toLowerCase();
    
    if (fundingLower.includes('series a')) return 70;
    if (fundingLower.includes('series b')) return 80;
    if (fundingLower.includes('series c')) return 90;
    if (fundingLower.includes('ipo') || fundingLower.includes('public')) return 95;
    if (fundingLower.includes('seed')) return 60;
    if (fundingLower.includes('bootstrap')) return 50;
    
    return 65;
  }

  private static calculateCompetitorFit(competitorAnalysis?: string): number {
    if (!competitorAnalysis) return 60;
    
    // Mock competitor analysis scoring
    if (competitorAnalysis.toLowerCase().includes('strong fit')) return 90;
    if (competitorAnalysis.toLowerCase().includes('good fit')) return 75;
    if (competitorAnalysis.toLowerCase().includes('potential')) return 65;
    
    return 60;
  }

  private static calculateNetworkQuality(connections?: number): number {
    if (!connections) return 50;
    
    if (connections > 3000) return 90;
    if (connections > 1500) return 80;
    if (connections > 500) return 70;
    if (connections > 250) return 60;
    
    return 40;
  }

  private static calculateThoughtLeadership(recentActivity?: string[]): number {
    if (!recentActivity || recentActivity.length === 0) return 40;
    
    const leadershipSignals = [
      'published', 'spoke at', 'keynote', 'interviewed',
      'article', 'webinar', 'podcast', 'conference'
    ];
    
    const leadershipCount = recentActivity.filter(activity => 
      leadershipSignals.some(signal => 
        activity.toLowerCase().includes(signal)
      )
    ).length;
    
    return Math.min(100, 30 + (leadershipCount * 25) + (recentActivity.length * 5));
  }

  private static calculateSocialValidation(lead: EnhancedLead): number {
    let score = 50;
    
    if (lead.linkedinUrl) score += 15;
    if (lead.socialProfiles?.twitter) score += 10;
    if (lead.socialProfiles?.github) score += 10;
    if (lead.aboutSummary && lead.aboutSummary.length > 100) score += 10;
    
    return Math.min(100, score);
  }

  // Helper methods
  private static extractEmployeeCount(sizeString: string): number {
    if (sizeString.includes('1-10')) return 1;
    if (sizeString.includes('11-50') || sizeString.includes('25-50')) return 2;
    if (sizeString.includes('51-200') || sizeString.includes('100-250')) return 3;
    if (sizeString.includes('201-1000') || sizeString.includes('250-500')) return 4;
    if (sizeString.includes('1001-5000') || sizeString.includes('500-1000')) return 5;
    if (sizeString.includes('5000+') || sizeString.includes('1000+')) return 6;
    return 3; // Default to medium
  }

  private static assignTier(score: number): LeadScore['tier'] {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'D';
  }

  private static assignPriority(overallScore: number, behavioralScore: number): LeadScore['priority'] {
    if (overallScore >= 75 && behavioralScore >= 70) return 'high';
    if (overallScore >= 60) return 'medium';
    return 'low';
  }

  private static generateRecommendations(factors: LeadScoringFactors, score: number): string[] {
    const recommendations: string[] = [];
    
    if (factors.emailVerification < 70) {
      recommendations.push('Verify email address before outreach');
    }
    
    if (factors.linkedinActivity > 70) {
      recommendations.push('Engage with LinkedIn content before connecting');
    }
    
    if (factors.jobChangeLikelihood > 60) {
      recommendations.push('Time-sensitive opportunity - prioritize outreach');
    }
    
    if (factors.buyingSignals > 60) {
      recommendations.push('Strong buying signals - focus on solution benefits');
    }
    
    if (factors.thoughtLeadership > 70) {
      recommendations.push('Reference their thought leadership in outreach');
    }
    
    return recommendations;
  }

  private static generateNextBestActions(factors: LeadScoringFactors, score: number): string[] {
    const actions: string[] = [];
    
    if (score >= 80) {
      actions.push('Send personalized LinkedIn connection request');
      actions.push('Schedule immediate follow-up sequence');
    } else if (score >= 60) {
      actions.push('Add to nurture sequence');
      actions.push('Monitor for trigger events');
    } else {
      actions.push('Add to long-term nurture campaign');
      actions.push('Revisit in 90 days');
    }
    
    return actions;
  }

  private static generateScoreExplanation(factors: LeadScoringFactors, score: number): string {
    const topFactors = Object.entries(factors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    const factorNames = topFactors.map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase());
    
    return `Score of ${score}/100 based primarily on strong ${factorNames.join(', ')} alignment with your ICP.`;
  }

  private static generateFallbackHooks(lead: EnhancedLead, factors: LeadScoringFactors): string[] {
    const hooks: string[] = [];
    
    if (factors.roleMatch > 80) {
      hooks.push(`Fellow ${lead.role?.toLowerCase()}`);
    }
    
    if (lead.companyName) {
      hooks.push(`${lead.companyName} growth initiatives`);
    }
    
    if (factors.thoughtLeadership > 60) {
      hooks.push('Industry thought leadership');
    }
    
    return hooks;
  }

  private static generateFallbackCompetitorAnalysis(lead: EnhancedLead): string {
    return `${lead.companyName} appears to be in a growth phase with potential need for ${lead.role?.toLowerCase()} solutions.`;
  }

  private static async fallbackScoring(lead: EnhancedLead, icpDetails: ICPDetails): Promise<number> {
    let score = 50;
    
    if (lead.role && icpDetails.targetRole) {
      const roleMatch = this.calculateRoleMatch(lead.role, icpDetails.targetRole);
      score += (roleMatch - 50) * 0.3;
    }
    
    if (lead.emailVerified) score += 15;
    if (lead.linkedinUrl) score += 10;
    if (lead.companyName) score += 10;
    
    return Math.max(30, Math.min(100, Math.round(score)));
  }

  static async prioritizeLeads(leads: EnhancedLead[], icpDetails: ICPDetails): Promise<EnhancedLead[]> {
    // Additional prioritization logic beyond scoring
    return leads.sort((a, b) => {
      // Primary: Overall score
      const scoreDiff = (b.interestRating || 0) - (a.interestRating || 0);
      if (Math.abs(scoreDiff) > 5) return scoreDiff;
      
      // Secondary: Behavioral signals
      const aBehavioral = (a.linkedinActivityScore || 0) + (a.contentEngagement || 0);
      const bBehavioral = (b.linkedinActivityScore || 0) + (b.contentEngagement || 0);
      const behavioralDiff = bBehavioral - aBehavioral;
      if (Math.abs(behavioralDiff) > 10) return behavioralDiff;
      
      // Tertiary: Data quality
      const aQuality = (a.dataFreshnessScore || 0) + (a.sourceCredibility || 0);
      const bQuality = (b.dataFreshnessScore || 0) + (b.sourceCredibility || 0);
      return bQuality - aQuality;
    });
  }
}

export default LeadScoringService;