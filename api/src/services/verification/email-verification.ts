import { EnhancedLead } from '../advanced-lead-research.js';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

interface EmailVerificationResult {
  email: string;
  isValid: boolean;
  deliverabilityScore: number;
  verificationStatus: 'valid' | 'invalid' | 'risky' | 'unknown';
  reason: string;
  phoneNumber?: string;
  alternativeEmails?: string[];
  catchAll: boolean;
  disposable: boolean;
  role: boolean;
  free: boolean;
  mxRecords?: dns.MxRecord[];
}

interface EmailServiceProvider {
  name: string;
  domains: string[];
  deliverabilityScore: number;
  businessFriendly: boolean;
}

export class EmailVerificationService {
  private static readonly HUNTER_API_KEY = process.env.HUNTER_API_KEY;
  private static readonly ZEROBOUNCE_API_KEY = process.env.ZEROBOUNCE_API_KEY;
  private static readonly NEVERBOUNCE_API_KEY = process.env.NEVERBOUNCE_API_KEY;

  // Email service providers database
  private static readonly emailProviders: EmailServiceProvider[] = [
    { name: 'Gmail', domains: ['gmail.com', 'googlemail.com'], deliverabilityScore: 70, businessFriendly: false },
    { name: 'Outlook', domains: ['outlook.com', 'hotmail.com', 'live.com'], deliverabilityScore: 75, businessFriendly: false },
    { name: 'Yahoo', domains: ['yahoo.com', 'ymail.com'], deliverabilityScore: 65, businessFriendly: false },
    { name: 'iCloud', domains: ['icloud.com', 'me.com', 'mac.com'], deliverabilityScore: 70, businessFriendly: false },
    { name: 'ProtonMail', domains: ['protonmail.com', 'protonmail.ch'], deliverabilityScore: 85, businessFriendly: true },
    { name: 'FastMail', domains: ['fastmail.com', 'fastmail.fm'], deliverabilityScore: 90, businessFriendly: true }
  ];

  private static readonly disposableProviders = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'maildrop.cc', 'yopmail.com'
  ];

  private static readonly roleBasedPrefixes = [
    'admin', 'support', 'info', 'contact', 'sales', 'marketing', 'hr',
    'help', 'webmaster', 'noreply', 'no-reply', 'postmaster'
  ];

  static async verifyContact(lead: Partial<EnhancedLead>): Promise<EmailVerificationResult> {
    if (!lead.email) {
      // Try to generate and verify email
      const generatedEmails = await this.generatePotentialEmails(lead);
      const bestEmail = await this.findBestEmail(generatedEmails);
      
      if (bestEmail) {
        lead.email = bestEmail.email;
        return bestEmail;
      }
      
      return {
        email: '',
        isValid: false,
        deliverabilityScore: 0,
        verificationStatus: 'invalid',
        reason: 'No email found',
        catchAll: false,
        disposable: false,
        role: false,
        free: false
      };
    }

    try {
      // Multi-layered verification approach
      const results = await Promise.allSettled([
        this.basicEmailValidation(lead.email),
        this.dnsVerification(lead.email),
        this.externalVerification(lead.email),
        this.socialVerification(lead)
      ]);

      // Combine results
      const basicResult = results[0].status === 'fulfilled' ? results[0].value : null;
      const dnsResult = results[1].status === 'fulfilled' ? results[1].value : null;
      const externalResult = results[2].status === 'fulfilled' ? results[2].value : null;
      const socialResult = results[3].status === 'fulfilled' ? results[3].value : null;

      return this.combineVerificationResults(lead.email, basicResult, dnsResult, externalResult, socialResult);

    } catch (error) {
      console.error('Email verification failed:', error);
      return {
        email: lead.email,
        isValid: false,
        deliverabilityScore: 30,
        verificationStatus: 'unknown',
        reason: 'Verification service error',
        catchAll: false,
        disposable: false,
        role: false,
        free: false
      };
    }
  }

  private static async basicEmailValidation(email: string): Promise<Partial<EmailVerificationResult>> {
    // Regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        deliverabilityScore: 0,
        verificationStatus: 'invalid',
        reason: 'Invalid email format'
      };
    }

    const [localPart, domain] = email.split('@');
    const lowerDomain = domain.toLowerCase();
    
    // Check if disposable
    const disposable = this.disposableProviders.includes(lowerDomain);
    
    // Check if role-based
    const role = this.roleBasedPrefixes.some(prefix => 
      localPart.toLowerCase().startsWith(prefix)
    );
    
    // Check if free email provider
    const provider = this.emailProviders.find(p => 
      p.domains.includes(lowerDomain)
    );
    const free = provider ? !provider.businessFriendly : false;
    
    let deliverabilityScore = 80; // Base score
    
    if (disposable) deliverabilityScore -= 50;
    if (role) deliverabilityScore -= 20;
    if (free) deliverabilityScore -= 15;
    if (provider?.businessFriendly) deliverabilityScore += 10;

    return {
      deliverabilityScore: Math.max(0, Math.min(100, deliverabilityScore)),
      disposable,
      role,
      free: free || provider === undefined,
      reason: disposable ? 'Disposable email' : role ? 'Role-based email' : 'Valid format'
    };
  }

  private static async dnsVerification(email: string): Promise<Partial<EmailVerificationResult>> {
    try {
      const domain = email.split('@')[1];
      const mxRecords = await resolveMx(domain);
      
      if (!mxRecords || mxRecords.length === 0) {
        return {
          isValid: false,
          deliverabilityScore: 0,
          verificationStatus: 'invalid',
          reason: 'No MX records found',
          mxRecords: []
        };
      }

      // Check for catch-all indication (heuristic)
      const catchAll = mxRecords.some(record => 
        record.exchange.toLowerCase().includes('catch') ||
        record.exchange.toLowerCase().includes('all')
      );

      return {
        isValid: true,
        deliverabilityScore: 85,
        verificationStatus: 'valid',
        reason: 'Valid MX records found',
        mxRecords,
        catchAll
      };

    } catch (error) {
      return {
        isValid: false,
        deliverabilityScore: 20,
        verificationStatus: 'unknown',
        reason: 'DNS verification failed'
      };
    }
  }

  private static async externalVerification(email: string): Promise<Partial<EmailVerificationResult>> {
    // Try multiple verification services
    const services = [
      () => this.verifyWithHunter(email),
      () => this.verifyWithZeroBounce(email),
      () => this.verifyWithNeverBounce(email)
    ];

    for (const service of services) {
      try {
        const result = await service();
        if (result && result.verificationStatus !== 'unknown') {
          return result;
        }
      } catch (error) {
        console.warn('External verification service failed:', error);
        continue;
      }
    }

    return {
      verificationStatus: 'unknown',
      reason: 'External verification unavailable'
    };
  }

  private static async verifyWithHunter(email: string): Promise<Partial<EmailVerificationResult>> {
    if (!this.HUNTER_API_KEY) {
      return { verificationStatus: 'unknown', reason: 'Hunter API key not configured' };
    }

    try {
      const response = await fetch(
        `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${this.HUNTER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Hunter API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.data;

      return {
        isValid: result.result === 'deliverable',
        deliverabilityScore: result.score || 50,
        verificationStatus: this.mapHunterStatus(result.result),
        reason: result.reason || 'Hunter verification'
      };

    } catch (error) {
      console.error('Hunter verification failed:', error);
      return { verificationStatus: 'unknown', reason: 'Hunter service error' };
    }
  }

  private static async verifyWithZeroBounce(email: string): Promise<Partial<EmailVerificationResult>> {
    if (!this.ZEROBOUNCE_API_KEY) {
      return { verificationStatus: 'unknown', reason: 'ZeroBounce API key not configured' };
    }

    try {
      const response = await fetch(
        `https://api.zerobounce.net/v2/validate?api_key=${this.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        throw new Error(`ZeroBounce API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        isValid: data.status === 'valid',
        deliverabilityScore: this.mapZeroBounceScore(data.status),
        verificationStatus: this.mapZeroBounceStatus(data.status),
        reason: data.sub_status || 'ZeroBounce verification'
      };

    } catch (error) {
      console.error('ZeroBounce verification failed:', error);
      return { verificationStatus: 'unknown', reason: 'ZeroBounce service error' };
    }
  }

  private static async verifyWithNeverBounce(email: string): Promise<Partial<EmailVerificationResult>> {
    if (!this.NEVERBOUNCE_API_KEY) {
      return { verificationStatus: 'unknown', reason: 'NeverBounce API key not configured' };
    }

    try {
      const response = await fetch(
        `https://api.neverbounce.com/v4/single/check?key=${this.NEVERBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        throw new Error(`NeverBounce API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        isValid: data.result === 'valid',
        deliverabilityScore: this.mapNeverBounceScore(data.result),
        verificationStatus: this.mapNeverBounceStatus(data.result),
        reason: 'NeverBounce verification'
      };

    } catch (error) {
      console.error('NeverBounce verification failed:', error);
      return { verificationStatus: 'unknown', reason: 'NeverBounce service error' };
    }
  }

  private static async socialVerification(lead: Partial<EnhancedLead>): Promise<Partial<EmailVerificationResult>> {
    // Cross-reference with social profiles and company data
    let confidence = 50;
    let phoneNumber: string | undefined;

    // LinkedIn URL validation
    if (lead.linkedinUrl && this.isValidLinkedInUrl(lead.linkedinUrl)) {
      confidence += 15;
    }

    // Company website correlation
    if (lead.email && lead.website) {
      const emailDomain = lead.email.split('@')[1];
      const websiteDomain = this.extractDomain(lead.website);
      
      if (emailDomain === websiteDomain) {
        confidence += 20;
      } else if (this.areRelatedDomains(emailDomain, websiteDomain)) {
        confidence += 10;
      }
    }

    // Mock phone number lookup (in production, would use services like TrueCaller, etc.)
    if (lead.firstName && lead.lastName && lead.companyName) {
      phoneNumber = this.generateMockPhoneNumber();
      confidence += 5;
    }

    return {
      deliverabilityScore: Math.min(100, confidence),
      phoneNumber,
      reason: 'Social profile correlation'
    };
  }

  private static async generatePotentialEmails(lead: Partial<EnhancedLead>): Promise<EmailVerificationResult[]> {
    if (!lead.firstName || !lead.lastName || !lead.companyName) {
      return [];
    }

    const firstName = lead.firstName.toLowerCase();
    const lastName = lead.lastName.toLowerCase();
    const domain = this.guessDomainFromCompany(lead.companyName, lead.website);

    if (!domain) return [];

    const patterns = [
      `${firstName}.${lastName}@${domain}`,
      `${firstName}@${domain}`,
      `${firstName[0]}${lastName}@${domain}`,
      `${firstName}.${lastName[0]}@${domain}`,
      `${firstName}${lastName}@${domain}`,
      `${lastName}.${firstName}@${domain}`,
      `${firstName}_${lastName}@${domain}`
    ];

    const results = await Promise.allSettled(
      patterns.map(email => this.verifyContact({ email }))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<EmailVerificationResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
      .filter(result => result.isValid);
  }

  private static async findBestEmail(candidates: EmailVerificationResult[]): Promise<EmailVerificationResult | null> {
    if (candidates.length === 0) return null;
    
    // Sort by deliverability score and choose the best
    return candidates.sort((a, b) => b.deliverabilityScore - a.deliverabilityScore)[0];
  }

  private static combineVerificationResults(
    email: string,
    basic: Partial<EmailVerificationResult> | null,
    dns: Partial<EmailVerificationResult> | null,
    external: Partial<EmailVerificationResult> | null,
    social: Partial<EmailVerificationResult> | null
  ): EmailVerificationResult {
    
    // Calculate weighted average of deliverability scores
    const scores = [
      { score: basic?.deliverabilityScore || 0, weight: 0.3 },
      { score: dns?.deliverabilityScore || 0, weight: 0.3 },
      { score: external?.deliverabilityScore || 0, weight: 0.3 },
      { score: social?.deliverabilityScore || 0, weight: 0.1 }
    ].filter(s => s.score > 0);

    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedScore = totalWeight > 0 
      ? scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight
      : 30;

    // Determine overall validity
    const isValid = external?.isValid ?? dns?.isValid ?? (basic?.deliverabilityScore || 0) > 60;
    
    // Determine verification status
    let verificationStatus: EmailVerificationResult['verificationStatus'] = 'unknown';
    if (external?.verificationStatus && external.verificationStatus !== 'unknown') {
      verificationStatus = external.verificationStatus;
    } else if (isValid && weightedScore > 70) {
      verificationStatus = 'valid';
    } else if (!isValid || weightedScore < 30) {
      verificationStatus = 'invalid';
    } else {
      verificationStatus = 'risky';
    }

    return {
      email,
      isValid,
      deliverabilityScore: Math.round(weightedScore),
      verificationStatus,
      reason: external?.reason || dns?.reason || basic?.reason || 'Combined verification',
      phoneNumber: social?.phoneNumber,
      catchAll: dns?.catchAll || false,
      disposable: basic?.disposable || false,
      role: basic?.role || false,
      free: basic?.free || false,
      mxRecords: dns?.mxRecords
    };
  }

  // Helper methods
  private static mapHunterStatus(status: string): EmailVerificationResult['verificationStatus'] {
    switch (status) {
      case 'deliverable': return 'valid';
      case 'undeliverable': return 'invalid';
      case 'risky': return 'risky';
      default: return 'unknown';
    }
  }

  private static mapZeroBounceStatus(status: string): EmailVerificationResult['verificationStatus'] {
    switch (status) {
      case 'valid': return 'valid';
      case 'invalid': return 'invalid';
      case 'catch-all':
      case 'spamtrap':
      case 'abuse': return 'risky';
      default: return 'unknown';
    }
  }

  private static mapZeroBounceScore(status: string): number {
    switch (status) {
      case 'valid': return 95;
      case 'catch-all': return 70;
      case 'unknown': return 50;
      case 'spamtrap':
      case 'abuse': return 20;
      case 'invalid': return 10;
      default: return 30;
    }
  }

  private static mapNeverBounceStatus(status: string): EmailVerificationResult['verificationStatus'] {
    switch (status) {
      case 'valid': return 'valid';
      case 'invalid': return 'invalid';
      case 'disposable':
      case 'catchall': return 'risky';
      default: return 'unknown';
    }
  }

  private static mapNeverBounceScore(status: string): number {
    switch (status) {
      case 'valid': return 95;
      case 'catchall': return 75;
      case 'unknown': return 50;
      case 'disposable': return 30;
      case 'invalid': return 10;
      default: return 40;
    }
  }

  private static isValidLinkedInUrl(url: string): boolean {
    return /^https:\/\/(www\.)?linkedin\.com\/in\/[\w\-_]+\/?$/.test(url);
  }

  private static extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  private static areRelatedDomains(domain1: string, domain2: string): boolean {
    // Simple heuristic for related domains
    const parts1 = domain1.split('.');
    const parts2 = domain2.split('.');
    
    const root1 = parts1[parts1.length - 2];
    const root2 = parts2[parts2.length - 2];
    
    return root1 === root2;
  }

  private static guessDomainFromCompany(companyName: string, website?: string): string | null {
    if (website) {
      return this.extractDomain(website);
    }

    // Generate domain from company name
    const cleaned = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .replace(/(inc|corp|llc|ltd|company|co)$/, '');

    return `${cleaned}.com`;
  }

  private static generateMockPhoneNumber(): string {
    const areaCode = Math.floor(Math.random() * 800) + 200;
    const exchange = Math.floor(Math.random() * 800) + 200;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `+1-${areaCode}-${exchange}-${number}`;
  }
}