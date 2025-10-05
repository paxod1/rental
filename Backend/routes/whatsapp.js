// routes/whatsapp.js - ADD RESTART ROUTE
const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');

// Get WhatsApp connection status
router.get('/status', (req, res) => {
    const status = whatsappService.getConnectionStatus();
    res.json(status);
});

// ✅ ADD RESTART ROUTE
router.post('/restart', async (req, res) => {
    try {
        console.log('🔄 Restarting WhatsApp service...');
        console.log('📱 Generating new QR code...');
        
        // Disconnect if connected
        if (whatsappService.isConnected) {
            await whatsappService.disconnect();
        }
        
        // Start service to generate QR
        await whatsappService.start();
        
        res.json({
            success: true,
            message: 'WhatsApp service restarted. Check terminal for QR code!'
        });
    } catch (error) {
        console.error('❌ Failed to restart WhatsApp:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to restart WhatsApp service'
        });
    }
});

// Send bill via WhatsApp
router.post('/send-bill', async (req, res) => {
    try {
        const { phoneNumber, billText, customerName, rentalId } = req.body;

        if (!phoneNumber || !billText) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and bill text are required'
            });
        }

        // Check WhatsApp connection
        if (!whatsappService.isConnected) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp not connected. Please scan QR code in terminal.',
                needsQR: true,
                status: whatsappService.getConnectionStatus()
            });
        }

        // Send message automatically
        const result = await whatsappService.sendMessage(phoneNumber, billText);
        
        // Log for audit trail
        console.log(`📱 Bill sent automatically:`);
        console.log(`   Customer: ${customerName}`);
        console.log(`   Phone: ${phoneNumber}`);
        console.log(`   Rental ID: ${rentalId}`);
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Timestamp: ${new Date(result.timestamp * 1000).toISOString()}`);
        
        res.json({
            success: true,
            message: 'Bill sent successfully via WhatsApp!',
            messageId: result.messageId,
            timestamp: result.timestamp,
            phoneNumber: phoneNumber
        });
        
    } catch (error) {
        console.error('❌ WhatsApp API Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send WhatsApp bill',
            error: error.message
        });
    }
});

// Disconnect WhatsApp
router.post('/disconnect', async (req, res) => {
    try {
        await whatsappService.disconnect();
        res.json({
            success: true,
            message: 'WhatsApp disconnected successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect WhatsApp'
        });
    }
});

module.exports = router;
