import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
const prisma = new PrismaClient();
// Get user campaigns
router.get('/', authenticateToken, async (req, res) => {
    try {
        const campaigns = await prisma.campaign.findMany({
            where: { userId: req.userId },
            include: {
                leads: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(campaigns);
    }
    catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({ error: 'Failed to get campaigns' });
    }
});
// Create new campaign
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, targetRole, targetIndustry, targetLocation, companySize, icpDetails } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Campaign name is required' });
        }
        const campaign = await prisma.campaign.create({
            data: {
                name,
                description,
                targetRole,
                targetIndustry,
                targetLocation,
                companySize,
                icpDetails,
                userId: req.userId
            }
        });
        res.status(201).json(campaign);
    }
    catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
});
// Get specific campaign with leads
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const campaign = await prisma.campaign.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId
            },
            include: {
                leads: {
                    orderBy: { interestRating: 'desc' }
                }
            }
        });
        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        res.json(campaign);
    }
    catch (error) {
        console.error('Get campaign error:', error);
        res.status(500).json({ error: 'Failed to get campaign' });
    }
});
// Update campaign status (for starting research, etc.)
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const campaign = await prisma.campaign.update({
            where: {
                id: req.params.id,
                userId: req.userId
            },
            data: { status }
        });
        res.json(campaign);
    }
    catch (error) {
        console.error('Update campaign status error:', error);
        res.status(500).json({ error: 'Failed to update campaign status' });
    }
});
export default router;
