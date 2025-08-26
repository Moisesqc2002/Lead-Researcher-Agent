import OpenAI from 'openai';
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;
export class OpenAIService {
    static async generateCopilotResponse(message, conversationHistory, userContext, campaignContext) {
        // Fallback to intelligent mock responses if OpenAI is not configured
        if (!openai || !process.env.OPENAI_API_KEY) {
            return this.generateMockResponse(message, conversationHistory, userContext, campaignContext);
        }
        try {
            const systemPrompt = this.buildSystemPrompt(userContext, campaignContext);
            const messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory.map(msg => ({
                    role: msg.type === 'user' ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: message }
            ];
            const response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
            });
            return response.choices[0]?.message?.content || 'I apologize, but I encountered an error. Please try again.';
        }
        catch (error) {
            console.error('OpenAI API error:', error);
            return this.generateMockResponse(message, conversationHistory, userContext, campaignContext);
        }
    }
    static async extractICPFromConversation(conversationHistory) {
        // Fallback to simple keyword extraction if OpenAI is not configured
        if (!openai || !process.env.OPENAI_API_KEY) {
            return this.extractICPWithKeywords(conversationHistory);
        }
        try {
            const conversationText = conversationHistory
                .map(msg => `${msg.type}: ${msg.content}`)
                .join('\n');
            const response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert at extracting Ideal Customer Profile (ICP) details from conversations. 
            Analyze the conversation and extract the following information if mentioned:
            - targetRole: Job titles/roles being targeted
            - targetIndustry: Industry or sector focus
            - targetLocation: Geographic location preferences
            - companySize: Company size preferences (startup, small, mid-size, enterprise, etc.)
            - additionalCriteria: Any other specific requirements mentioned
            
            Return a JSON object with these fields. If information is not mentioned, use null for that field.
            Only return the JSON object, no other text.`
                    },
                    {
                        role: 'user',
                        content: `Extract ICP details from this conversation:\n\n${conversationText}`
                    }
                ],
                max_tokens: 500,
                temperature: 0.1,
            });
            const content = response.choices[0]?.message?.content;
            if (content) {
                try {
                    return JSON.parse(content);
                }
                catch (parseError) {
                    console.error('Failed to parse ICP extraction response:', parseError);
                    return this.extractICPWithKeywords(conversationHistory);
                }
            }
            return this.extractICPWithKeywords(conversationHistory);
        }
        catch (error) {
            console.error('OpenAI ICP extraction error:', error);
            return this.extractICPWithKeywords(conversationHistory);
        }
    }
    static extractICPWithKeywords(conversationHistory) {
        const conversationText = conversationHistory
            .map(msg => msg.content)
            .join(' ')
            .toLowerCase();
        const icpDetails = {};
        // Extract role keywords
        const roleKeywords = ['marketing director', 'cmo', 'vp marketing', 'marketing manager', 'ceo', 'cto', 'founder', 'director', 'manager'];
        for (const role of roleKeywords) {
            if (conversationText.includes(role)) {
                icpDetails.targetRole = role;
                break;
            }
        }
        // Extract industry keywords
        const industryKeywords = ['saas', 'software', 'technology', 'healthcare', 'finance', 'e-commerce', 'fintech', 'edtech'];
        for (const industry of industryKeywords) {
            if (conversationText.includes(industry)) {
                icpDetails.targetIndustry = industry;
                break;
            }
        }
        // Extract company size
        if (conversationText.includes('startup'))
            icpDetails.companySize = 'startup';
        else if (conversationText.includes('enterprise'))
            icpDetails.companySize = 'enterprise';
        else if (conversationText.includes('small business'))
            icpDetails.companySize = 'small';
        else if (conversationText.includes('mid-size'))
            icpDetails.companySize = 'mid-size';
        // Extract location
        const locationKeywords = ['north america', 'usa', 'europe', 'global', 'remote', 'san francisco', 'new york'];
        for (const location of locationKeywords) {
            if (conversationText.includes(location)) {
                icpDetails.targetLocation = location;
                break;
            }
        }
        // Return ICP details if we found at least one piece of information
        if (Object.keys(icpDetails).length > 0) {
            return icpDetails;
        }
        return null;
    }
    static async generateLeadQualificationReason(lead, icpDetails, userContext) {
        // Fallback if OpenAI is not configured
        if (!openai || !process.env.OPENAI_API_KEY) {
            return {
                reason: `Strong potential match: ${lead.role} at ${lead.companyName} aligns with target profile for ${icpDetails.targetRole} in ${icpDetails.targetIndustry}`,
                interestRating: 7
            };
        }
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert lead qualifier. Based on the target ICP and lead information, provide:
            1. A qualification reason explaining why this lead is a good fit
            2. An interest rating from 1-10 (10 being perfect match)
            
            Return a JSON object with "reason" and "interestRating" fields.`
                    },
                    {
                        role: 'user',
                        content: `Target ICP:
            - Role: ${icpDetails.targetRole}
            - Industry: ${icpDetails.targetIndustry}
            - Location: ${icpDetails.targetLocation}
            - Company Size: ${icpDetails.companySize}
            
            Lead Information:
            - Name: ${lead.firstName} ${lead.lastName}
            - Role: ${lead.role}
            - Company: ${lead.companyName}
            - About: ${lead.aboutSummary}
            
            User Context: ${userContext.businessType} - ${userContext.goals}`
                    }
                ],
                max_tokens: 300,
                temperature: 0.3,
            });
            const content = response.choices[0]?.message?.content;
            if (content) {
                try {
                    const result = JSON.parse(content);
                    return {
                        reason: result.reason || 'Good potential match based on profile analysis.',
                        interestRating: Math.min(10, Math.max(1, result.interestRating || 5))
                    };
                }
                catch (parseError) {
                    console.error('Failed to parse qualification response:', parseError);
                    return {
                        reason: 'Potential lead based on profile match.',
                        interestRating: 5
                    };
                }
            }
            return {
                reason: 'Potential lead based on initial screening.',
                interestRating: 5
            };
        }
        catch (error) {
            console.error('OpenAI qualification error:', error);
            return {
                reason: 'Lead matches basic criteria.',
                interestRating: 5
            };
        }
    }
    static buildSystemPrompt(userContext, campaignContext) {
        return `You are a Lead Research Copilot, an AI assistant specialized in helping businesses find and qualify potential customers.

User Context:
- Business Type: ${userContext.businessType || 'Not specified'}
- Business Name: ${userContext.businessName || 'Not specified'}
- Goals: ${userContext.goals || 'Not specified'}

Campaign Context:
- Campaign Name: ${campaignContext.name}
- Description: ${campaignContext.description || 'Not provided'}
- Status: ${campaignContext.status}

Your Role:
1. Help users define their Ideal Customer Profile (ICP) through conversational questions
2. Guide them through the lead research process
3. Provide insights and recommendations for lead qualification
4. Be helpful, professional, and focused on generating qualified leads

Guidelines:
- Ask clarifying questions to better understand their target audience
- Provide specific, actionable advice
- Keep responses conversational but professional
- Focus on lead quality over quantity
- When ready to start research, clearly indicate the process is beginning

Current conversation context: The user is working on defining their ICP for this campaign.`;
    }
    static generateMockResponse(message, conversationHistory, userContext, campaignContext) {
        const input = message.toLowerCase();
        // Context-aware responses based on user input
        if (input.includes('marketing') || input.includes('cmo') || input.includes('director') || input.includes('manager')) {
            return `Great! I can see you're targeting marketing professionals. Let me help you refine this ICP:

**Target Profile Clarification:**
- **Specific Roles**: Marketing Directors, CMOs, VP Marketing, Marketing Managers?
- **Company Size**: Startups (1-50), Small (51-200), Mid-size (201-1000), or Enterprise (1000+)?
- **Industry Focus**: Technology, Healthcare, Finance, E-commerce, or any specific sector?
- **Geographic Location**: North America, Europe, specific cities, or global?

**Context from your business (${userContext.businessType || 'your company'}):**
${userContext.goals ? `Your goals: "${userContext.goals}"` : 'Please tell me more about what you\'re trying to achieve with these leads.'}

Once we nail down these details, I can start researching qualified leads that are most likely to be interested in what you offer.`;
        }
        if (input.includes('startup') || input.includes('small business') || input.includes('enterprise')) {
            return `Perfect! Company size is a crucial qualifier. 

**Follow-up questions:**
1. **Why this company size?** (budget considerations, decision-making process, growth stage alignment?)
2. **What industries** work best with companies of this size for your business?
3. **What roles** at these companies typically make purchasing decisions?
4. **Geographic preferences** - any specific regions or global?

Understanding the "why" behind your target criteria helps me find leads that are not just a match on paper, but actually likely to convert.`;
        }
        if (input.includes('start research') || input.includes('begin') || input.includes('ready') || input.includes('go ahead')) {
            return `Excellent! Based on our conversation, I'm ready to start the lead research process.

**Here's what I'll do:**
✅ Search LinkedIn for profiles matching your criteria
✅ Find and verify professional email addresses  
✅ Gather company information and recent activity
✅ Score each lead's likelihood to be interested (1-10 scale)
✅ Provide personalization data points for outreach

**Expected Results:**
- 20-50 high-quality leads
- Research time: 5-10 minutes
- Each lead will include qualification reasoning

Ready to start? Click the "🚀 Start Lead Research" button below to begin!`;
        }
        if (input.includes('saas') || input.includes('software') || input.includes('tech')) {
            return `SaaS/Technology targeting is my specialty! Here are some key considerations:

**SaaS Lead Research Strategy:**
- **Decision Makers**: Often multiple stakeholders (technical + business)
- **Company Growth Stage**: Growing companies often have budget + need for new tools
- **Tech Stack Compatibility**: Current tools they use can indicate fit
- **Funding/Revenue Signals**: Recent funding or growth can indicate buying power

**Questions to refine your ICP:**
1. What type of companies benefit most from your SaaS? (size, industry, growth stage)
2. Who typically champions your solution internally?
3. What pain points does your software solve?
4. Any integration requirements or technical considerations?

This context helps me find leads who are not just qualified, but actively experiencing the problems your software solves.`;
        }
        // Default response with helpful guidance
        return `I understand you're interested in "${message}". Let me help you develop this into a strong ICP.

**To find the best leads for "${campaignContext.name}", I need to understand:**

1. **Target Role/Title**: Who specifically makes the buying decision?
2. **Company Characteristics**: Size, industry, growth stage, location
3. **Pain Points**: What problems are they facing that you solve?
4. **Timing Indicators**: What signals suggest they're ready to buy?

${userContext.businessType ? `Given that you're a ${userContext.businessType}` : 'Based on your business'}, what type of companies typically get the most value from working with you?

The more specific we can get, the better I can find leads who are genuinely interested in what you offer.`;
    }
}
export default OpenAIService;
