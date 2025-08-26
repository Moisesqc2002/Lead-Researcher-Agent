import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import OpenAIService from '../services/openai.js';
import LeadResearchService from '../services/lead-research.js';
const router = express.Router();
const prisma = new PrismaClient();
// Send message to copilot
router.post('/chat/:campaignId', authenticateToken, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { message, conversationHistory } = req.body;
        // Get campaign and user context
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                userId: req.userId
            }
        });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        // Generate AI response
        const aiResponse = await OpenAIService.generateCopilotResponse(message, conversationHistory || [], user, campaign);
        // Try to extract ICP details from conversation
        const updatedHistory = [...(conversationHistory || []),
            { type: 'user', content: message },
            { type: 'assistant', content: aiResponse }
        ];
        const icpDetails = await OpenAIService.extractICPFromConversation(updatedHistory);
        // Update campaign with extracted ICP details if found
        if (icpDetails && (icpDetails.targetRole || icpDetails.targetIndustry)) {
            await prisma.campaign.update({
                where: { id: campaignId },
                data: {
                    targetRole: icpDetails.targetRole || campaign.targetRole,
                    targetIndustry: icpDetails.targetIndustry || campaign.targetIndustry,
                    targetLocation: icpDetails.targetLocation || campaign.targetLocation,
                    companySize: icpDetails.companySize || campaign.companySize,
                    icpDetails: icpDetails
                }
            });
        }
        res.json({
            response: aiResponse,
            icpExtracted: !!icpDetails,
            icpDetails: icpDetails
        });
    }
    catch (error) {
        console.error('Copilot chat error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});
// Start lead research for a campaign
router.post('/research/:campaignId', authenticateToken, async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: campaignId,
                userId: req.userId
            }
        });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        // Update campaign status to researching
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'RESEARCHING' }
        });
        // Start the research process in background using advanced service
        setImmediate(async () => {
            try {
                await conductLeadResearch(campaignId, campaign, req.userId);
            }
            catch (error) {
                console.error('Background research failed:', error);
                await prisma.campaign.update({
                    where: { id: campaignId },
                    data: { status: 'FAILED' }
                });
            }
        });
        res.json({ message: 'Lead research started', status: 'RESEARCHING' });
    }
    catch (error) {
        console.error('Research start error:', error);
        res.status(500).json({ error: 'Failed to start research' });
    }
});
// Conduct advanced lead research process
async function conductLeadResearch(campaignId, campaign, userId) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Use ICP details from campaign or extract from conversation
        let icpDetails = campaign.icpDetails;
        if (!icpDetails) {
            // Create basic ICP from campaign fields
            icpDetails = {
                targetRole: campaign.targetRole || 'Marketing Director',
                targetIndustry: campaign.targetIndustry || 'Technology',
                targetLocation: campaign.targetLocation || 'North America',
                companySize: campaign.companySize || 'Mid-size'
            };
        }
        // Conduct research using the advanced service
        const researched_leads = await LeadResearchService.conductResearch({
            campaignId,
            icpDetails,
            userContext: user,
            targetCount: 25
        });
        // Save leads to database
        await LeadResearchService.saveLeadsToDatabase(campaignId, researched_leads);
        // Update campaign status to completed
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED' }
        });
        console.log(`Advanced research completed for campaign ${campaignId}: ${researched_leads.length} leads found`);
    }
    catch (error) {
        console.error('Advanced research error:', error);
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'FAILED' }
        });
    }
}
export default router;
