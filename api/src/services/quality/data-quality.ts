import { EnhancedLead } from '../advanced-lead-research.js';

interface DataQualityMetrics {
  completeness: number;        // 0-100: How complete the lead data is
  accuracy: number;           // 0-100: Estimated data accuracy
  freshness: number;          // 0-100: How recent the data is
  consistency: number;        // 0-100: Data consistency across sources
  reliability: number;        // 0-100: Source reliability score
  overallQuality: number;     // 0-100: Composite quality score
  issues: string[];           // List of identified data issues
  recommendations: string[];   // Recommendations for improvement
}

interface DuplicateAnalysis {
  isDuplicate: boolean;
  duplicateScore: number;     // 0-100: How similar to other leads
  matchedFields: string[];    // Fields that match with other leads
  similarLeads: string[];     // IDs of similar leads
  consolidationSuggestion: string;
}

interface DataEnrichment {
  missingFields: string[];
  enrichmentSources: string[];
  estimatedCompleteness: number;
  priorityFields: string[];
}

export class DataQualityService {
  private static processedLeads: Map<string, EnhancedLead> = new Map();
  
  static async processLeads(leads: EnhancedLead[]): Promise<EnhancedLead[]> {
    console.log(`🧹 Processing ${leads.length} leads for data quality and deduplication...`);
    
    // Step 1: Quality assessment
    const qualityAssessedLeads = await Promise.all(
      leads.map(lead => this.assessDataQuality(lead))
    );
    
    // Step 2: Deduplication
    const deduplicatedLeads = await this.deduplicateLeads(qualityAssessedLeads);
    
    // Step 3: Data enrichment recommendations
    const enrichedLeads = await this.suggestEnrichments(deduplicatedLeads);
    
    // Step 4: Final quality scoring
    const finalLeads = await this.calculateFinalQualityScores(enrichedLeads);
    
    console.log(`✅ Data quality processing complete: ${finalLeads.length} unique, high-quality leads`);
    return finalLeads;
  }

  private static async assessDataQuality(lead: EnhancedLead): Promise<EnhancedLead> {
    const metrics = await this.calculateQualityMetrics(lead);
    
    return {
      ...lead,
      dataFreshnessScore: metrics.freshness,
      sourceCredibility: metrics.reliability,
      duplicateRisk: 0, // Will be calculated in deduplication step
      dataPoints: {
        ...lead.dataPoints,
        qualityMetrics: metrics,
        qualityIssues: metrics.issues,
        qualityRecommendations: metrics.recommendations
      }
    };
  }

  private static async calculateQualityMetrics(lead: EnhancedLead): Promise<DataQualityMetrics> {
    // Calculate completeness
    const requiredFields = [
      'firstName', 'lastName', 'email', 'role', 'companyName'
    ];
    const optionalFields = [
      'linkedinUrl', 'website', 'phoneNumber', 'companySize', 
      'aboutSummary', 'department', 'seniority'
    ];
    
    const completedRequired = requiredFields.filter(field => 
      this.isFieldComplete(lead[field as keyof EnhancedLead])
    ).length;
    const completedOptional = optionalFields.filter(field => 
      this.isFieldComplete(lead[field as keyof EnhancedLead])
    ).length;
    
    const completeness = Math.round(
      (completedRequired / requiredFields.length) * 70 + 
      (completedOptional / optionalFields.length) * 30
    );

    // Calculate accuracy based on patterns and validation
    const accuracy = await this.assessDataAccuracy(lead);
    
    // Calculate freshness
    const freshness = lead.dataFreshnessScore || this.calculateFreshness(lead);
    
    // Calculate consistency across sources
    const consistency = this.calculateConsistency(lead);
    
    // Calculate reliability based on sources
    const reliability = this.calculateReliability(lead.sources || []);
    
    // Overall quality score
    const overallQuality = Math.round(
      completeness * 0.3 +
      accuracy * 0.25 +
      freshness * 0.2 +
      consistency * 0.15 +
      reliability * 0.1
    );

    // Identify issues and recommendations
    const issues = this.identifyDataIssues(lead, {
      completeness, accuracy, freshness, consistency, reliability
    });
    const recommendations = this.generateQualityRecommendations(issues);

    return {
      completeness,
      accuracy,
      freshness,
      consistency,
      reliability,
      overallQuality,
      issues,
      recommendations
    };
  }

  private static isFieldComplete(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }

  private static async assessDataAccuracy(lead: EnhancedLead): Promise<number> {
    let accuracy = 80; // Base accuracy score
    
    // Email format validation
    if (lead.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(lead.email)) {
        accuracy -= 20;
      }
    }
    
    // LinkedIn URL validation
    if (lead.linkedinUrl) {
      const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[\w\-_]+\/?$/;
      if (!linkedinRegex.test(lead.linkedinUrl)) {
        accuracy -= 10;
      }
    }
    
    // Website URL validation
    if (lead.website) {
      try {
        new URL(lead.website);
      } catch {
        accuracy -= 10;
      }
    }
    
    // Name validation (basic checks)
    if (lead.firstName && lead.firstName.length < 2) accuracy -= 15;
    if (lead.lastName && lead.lastName.length < 2) accuracy -= 15;
    
    // Company name validation
    if (lead.companyName) {
      // Check for obvious test/fake data
      const fakeCompanyPatterns = ['test', 'example', 'sample', 'fake'];
      if (fakeCompanyPatterns.some(pattern => 
        lead.companyName!.toLowerCase().includes(pattern)
      )) {
        accuracy -= 30;
      }
    }
    
    // Phone number validation
    if (lead.phoneNumber) {
      const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)\.]{7,15}$/;
      if (!phoneRegex.test(lead.phoneNumber)) {
        accuracy -= 10;
      }
    }
    
    return Math.max(0, Math.min(100, accuracy));
  }

  private static calculateFreshness(lead: EnhancedLead): number {
    const lastUpdated = lead.lastUpdated || new Date();
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate <= 1) return 100;
    if (daysSinceUpdate <= 7) return 90;
    if (daysSinceUpdate <= 30) return 75;
    if (daysSinceUpdate <= 90) return 60;
    if (daysSinceUpdate <= 180) return 40;
    return 20;
  }

  private static calculateConsistency(lead: EnhancedLead): number {
    let consistency = 100;
    
    // Check email/company domain consistency
    if (lead.email && lead.website) {
      const emailDomain = lead.email.split('@')[1];
      const websiteDomain = this.extractDomain(lead.website);
      
      if (emailDomain !== websiteDomain && !this.areRelatedDomains(emailDomain, websiteDomain)) {
        consistency -= 15;
      }
    }
    
    // Check name consistency across fields
    if (lead.linkedinUrl && (lead.firstName || lead.lastName)) {
      const nameInUrl = this.extractNameFromLinkedInUrl(lead.linkedinUrl);
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      
      if (nameInUrl && !this.namesAreSimilar(nameInUrl, fullName)) {
        consistency -= 20;
      }
    }
    
    // Check role/seniority consistency
    if (lead.role && lead.seniority) {
      if (!this.roleMatchesSeniority(lead.role, lead.seniority)) {
        consistency -= 10;
      }
    }
    
    return Math.max(0, consistency);
  }

  private static calculateReliability(sources: string[]): number {
    const sourceReliability = {
      'linkedin': 95,
      'apollo': 90,
      'zoominfo': 95,
      'hunter': 85,
      'clearbit': 90,
      'manual': 70,
      'web_scraping': 60,
      'unknown': 30
    };
    
    if (sources.length === 0) return 50;
    
    const avgReliability = sources.reduce((sum, source) => {
      return sum + (sourceReliability[source as keyof typeof sourceReliability] || 50);
    }, 0) / sources.length;
    
    // Bonus for multiple sources
    const multiSourceBonus = Math.min(sources.length * 5, 15);
    
    return Math.min(100, Math.round(avgReliability + multiSourceBonus));
  }

  private static identifyDataIssues(
    lead: EnhancedLead, 
    metrics: {
      completeness: number;
      accuracy: number; 
      freshness: number;
      consistency: number;
      reliability: number;
    }
  ): string[] {
    const issues: string[] = [];
    
    if (metrics.completeness < 70) {
      issues.push('Incomplete lead profile - missing key information');
    }
    
    if (metrics.accuracy < 80) {
      issues.push('Data accuracy concerns - validation failures detected');
    }
    
    if (metrics.freshness < 60) {
      issues.push('Stale data - information may be outdated');
    }
    
    if (metrics.consistency < 80) {
      issues.push('Data inconsistency - conflicting information across fields');
    }
    
    if (metrics.reliability < 70) {
      issues.push('Low source reliability - data from questionable sources');
    }
    
    if (!lead.email) {
      issues.push('Missing email address - cannot be contacted');
    } else if (!lead.emailVerified) {
      issues.push('Unverified email - deliverability uncertain');
    }
    
    if (!lead.role) {
      issues.push('Missing job title - role unclear');
    }
    
    if (!lead.companyName) {
      issues.push('Missing company information');
    }
    
    return issues;
  }

  private static generateQualityRecommendations(issues: string[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(issue => issue.includes('Incomplete'))) {
      recommendations.push('Enrich lead data from additional sources');
    }
    
    if (issues.some(issue => issue.includes('accuracy'))) {
      recommendations.push('Validate and clean data fields');
    }
    
    if (issues.some(issue => issue.includes('Stale'))) {
      recommendations.push('Update lead information from current sources');
    }
    
    if (issues.some(issue => issue.includes('inconsistency'))) {
      recommendations.push('Reconcile conflicting data points');
    }
    
    if (issues.some(issue => issue.includes('Unverified email'))) {
      recommendations.push('Verify email address before outreach');
    }
    
    if (issues.some(issue => issue.includes('Missing email'))) {
      recommendations.push('Find and verify email address');
    }
    
    return recommendations;
  }

  private static async deduplicateLeads(leads: EnhancedLead[]): Promise<EnhancedLead[]> {
    const uniqueLeads: EnhancedLead[] = [];
    const duplicateMap: Map<string, EnhancedLead[]> = new Map();
    
    for (const lead of leads) {
      const duplicateAnalysis = await this.analyzeDuplicates(lead, uniqueLeads);
      
      if (duplicateAnalysis.isDuplicate) {
        // Handle duplicate
        const existingLeadIndex = uniqueLeads.findIndex(existing => 
          duplicateAnalysis.similarLeads.includes(this.generateLeadId(existing))
        );
        
        if (existingLeadIndex >= 0) {
          // Merge with existing lead
          uniqueLeads[existingLeadIndex] = await this.mergeLeads(
            uniqueLeads[existingLeadIndex], 
            lead
          );
        }
      } else {
        // Add as unique lead
        uniqueLeads.push({
          ...lead,
          duplicateRisk: duplicateAnalysis.duplicateScore,
          dataPoints: {
            ...lead.dataPoints,
            duplicateAnalysis
          }
        });
      }
    }
    
    return uniqueLeads;
  }

  private static async analyzeDuplicates(
    lead: EnhancedLead, 
    existingLeads: EnhancedLead[]
  ): Promise<DuplicateAnalysis> {
    let highestScore = 0;
    const matchedFields: string[] = [];
    const similarLeads: string[] = [];
    
    for (const existing of existingLeads) {
      const similarity = this.calculateSimilarity(lead, existing);
      
      if (similarity.score > highestScore) {
        highestScore = similarity.score;
      }
      
      if (similarity.score > 70) { // Threshold for considering as duplicate
        similarLeads.push(this.generateLeadId(existing));
        matchedFields.push(...similarity.matchedFields);
      }
    }
    
    const isDuplicate = highestScore > 85; // High threshold for automatic deduplication
    
    return {
      isDuplicate,
      duplicateScore: Math.round(highestScore),
      matchedFields: [...new Set(matchedFields)],
      similarLeads,
      consolidationSuggestion: isDuplicate ? 
        'Merge with existing lead to create comprehensive profile' :
        'No consolidation needed'
    };
  }

  private static calculateSimilarity(lead1: EnhancedLead, lead2: EnhancedLead): {
    score: number;
    matchedFields: string[];
  } {
    let score = 0;
    const matchedFields: string[] = [];
    
    // Email match (very strong indicator)
    if (lead1.email && lead2.email && lead1.email.toLowerCase() === lead2.email.toLowerCase()) {
      score += 50;
      matchedFields.push('email');
    }
    
    // Name match
    const name1 = `${lead1.firstName || ''} ${lead1.lastName || ''}`.toLowerCase().trim();
    const name2 = `${lead2.firstName || ''} ${lead2.lastName || ''}`.toLowerCase().trim();
    
    if (name1 && name2) {
      const nameSimilarity = this.calculateStringSimilarity(name1, name2);
      if (nameSimilarity > 0.8) {
        score += 30;
        matchedFields.push('name');
      } else if (nameSimilarity > 0.6) {
        score += 15;
      }
    }
    
    // LinkedIn URL match
    if (lead1.linkedinUrl && lead2.linkedinUrl && 
        lead1.linkedinUrl === lead2.linkedinUrl) {
      score += 40;
      matchedFields.push('linkedinUrl');
    }
    
    // Company + Role match
    if (lead1.companyName && lead2.companyName &&
        lead1.companyName.toLowerCase() === lead2.companyName.toLowerCase()) {
      score += 10;
      matchedFields.push('company');
      
      if (lead1.role && lead2.role &&
          lead1.role.toLowerCase() === lead2.role.toLowerCase()) {
        score += 15;
        matchedFields.push('role');
      }
    }
    
    // Phone number match
    if (lead1.phoneNumber && lead2.phoneNumber) {
      const cleanPhone1 = lead1.phoneNumber.replace(/\D/g, '');
      const cleanPhone2 = lead2.phoneNumber.replace(/\D/g, '');
      
      if (cleanPhone1 === cleanPhone2) {
        score += 25;
        matchedFields.push('phone');
      }
    }
    
    return { score: Math.min(100, score), matchedFields };
  }

  private static async mergeLeads(existing: EnhancedLead, duplicate: EnhancedLead): Promise<EnhancedLead> {
    // Merge strategy: keep most complete and recent data
    const merged: EnhancedLead = { ...existing };
    
    // Take non-empty values from duplicate if existing is empty
    Object.keys(duplicate).forEach(key => {
      const existingValue = (existing as any)[key];
      const duplicateValue = (duplicate as any)[key];
      
      if (!this.isFieldComplete(existingValue) && this.isFieldComplete(duplicateValue)) {
        (merged as any)[key] = duplicateValue;
      }
    });
    
    // Merge sources
    merged.sources = [...new Set([
      ...(existing.sources || []),
      ...(duplicate.sources || [])
    ])];
    
    // Merge data points
    merged.dataPoints = {
      ...existing.dataPoints,
      ...duplicate.dataPoints,
      mergedFrom: [
        ...(existing.dataPoints?.mergedFrom || []),
        this.generateLeadId(duplicate)
      ]
    };
    
    // Update quality scores
    merged.dataFreshnessScore = Math.max(
      existing.dataFreshnessScore || 0,
      duplicate.dataFreshnessScore || 0
    );
    
    merged.sourceCredibility = Math.max(
      existing.sourceCredibility || 0,
      duplicate.sourceCredibility || 0
    );
    
    return merged;
  }

  private static async suggestEnrichments(leads: EnhancedLead[]): Promise<EnhancedLead[]> {
    return leads.map(lead => {
      const enrichment = this.analyzeEnrichmentOpportunities(lead);
      
      return {
        ...lead,
        dataPoints: {
          ...lead.dataPoints,
          enrichmentSuggestions: enrichment
        }
      };
    });
  }

  private static analyzeEnrichmentOpportunities(lead: EnhancedLead): DataEnrichment {
    const allFields = [
      'firstName', 'lastName', 'email', 'phoneNumber', 'linkedinUrl',
      'role', 'department', 'seniority', 'companyName', 'website',
      'companySize', 'companyRevenue', 'companyFunding', 'aboutSummary'
    ];
    
    const missingFields = allFields.filter(field => 
      !this.isFieldComplete(lead[field as keyof EnhancedLead])
    );
    
    const priorityFields = this.getPriorityFields(missingFields, lead);
    const enrichmentSources = this.suggestEnrichmentSources(missingFields);
    
    const completedFields = allFields.length - missingFields.length;
    const estimatedCompleteness = Math.round((completedFields / allFields.length) * 100);
    
    return {
      missingFields,
      priorityFields,
      enrichmentSources,
      estimatedCompleteness
    };
  }

  private static getPriorityFields(missingFields: string[], lead: EnhancedLead): string[] {
    const fieldPriority = {
      'email': 10,
      'phoneNumber': 8,
      'role': 7,
      'companyName': 7,
      'linkedinUrl': 6,
      'department': 5,
      'seniority': 5,
      'companySize': 4,
      'website': 4,
      'aboutSummary': 3
    };
    
    return missingFields
      .filter(field => fieldPriority[field as keyof typeof fieldPriority])
      .sort((a, b) => 
        (fieldPriority[b as keyof typeof fieldPriority] || 0) - 
        (fieldPriority[a as keyof typeof fieldPriority] || 0)
      )
      .slice(0, 5);
  }

  private static suggestEnrichmentSources(missingFields: string[]): string[] {
    const sources = new Set<string>();
    
    if (missingFields.includes('email') || missingFields.includes('phoneNumber')) {
      sources.add('Apollo.io');
      sources.add('ZoomInfo');
      sources.add('Hunter.io');
    }
    
    if (missingFields.includes('linkedinUrl') || missingFields.includes('role')) {
      sources.add('LinkedIn Sales Navigator');
      sources.add('Apollo.io');
    }
    
    if (missingFields.includes('companySize') || missingFields.includes('companyRevenue')) {
      sources.add('Crunchbase');
      sources.add('ZoomInfo');
      sources.add('Company website scraping');
    }
    
    return Array.from(sources);
  }

  private static async calculateFinalQualityScores(leads: EnhancedLead[]): Promise<EnhancedLead[]> {
    return leads.map(lead => {
      const qualityMetrics = lead.dataPoints?.qualityMetrics;
      
      if (qualityMetrics) {
        // Final quality score considers all factors
        const finalScore = Math.round(
          qualityMetrics.overallQuality * 0.7 +
          (100 - (lead.duplicateRisk || 0)) * 0.2 +
          (lead.dataPoints?.enrichmentSuggestions?.estimatedCompleteness || 70) * 0.1
        );
        
        return {
          ...lead,
          dataPoints: {
            ...lead.dataPoints,
            finalQualityScore: finalScore,
            qualityTier: this.getQualityTier(finalScore)
          }
        };
      }
      
      return lead;
    });
  }

  private static getQualityTier(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Poor';
    return 'Very Poor';
  }

  // Helper methods
  private static generateLeadId(lead: EnhancedLead): string {
    return `${lead.firstName}_${lead.lastName}_${lead.email || lead.linkedinUrl || 'unknown'}`;
  }

  private static extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  private static areRelatedDomains(domain1: string, domain2: string): boolean {
    const parts1 = domain1.split('.');
    const parts2 = domain2.split('.');
    
    const root1 = parts1[parts1.length - 2];
    const root2 = parts2[parts2.length - 2];
    
    return root1 === root2;
  }

  private static extractNameFromLinkedInUrl(url: string): string {
    const match = url.match(/linkedin\.com\/in\/([\w\-_]+)/);
    return match ? match[1].replace(/[\-_]/g, ' ').toLowerCase() : '';
  }

  private static namesAreSimilar(name1: string, name2: string): boolean {
    return this.calculateStringSimilarity(name1, name2) > 0.6;
  }

  private static roleMatchesSeniority(role: string, seniority: string): boolean {
    const seniorityKeywords = {
      'junior': ['junior', 'associate', 'coordinator', 'assistant'],
      'mid': ['manager', 'specialist', 'lead'],
      'senior': ['senior', 'director', 'head'],
      'executive': ['vp', 'vice president', 'executive'],
      'c-level': ['ceo', 'cto', 'cmo', 'cfo', 'chief']
    };
    
    const keywords = seniorityKeywords[seniority as keyof typeof seniorityKeywords] || [];
    const roleLower = role.toLowerCase();
    
    return keywords.some(keyword => roleLower.includes(keyword));
  }

  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export default DataQualityService;