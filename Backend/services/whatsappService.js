// services/whatsappService.js - ULTRAMSG COMPLETE SETUP
const axios = require('axios');

class WhatsAppService {
    constructor() {
        // ✅ YOUR COMPLETE ULTRAMSG CREDENTIALS
        this.instanceId = 'instance145086';                    // ✅ Your instance
        this.token = 'wpaqeqfx896rji54';                       // ✅ Your token
        this.apiUrl = 'https://api.ultramsg.com/instance145086'; // ✅ Your API URL
        
        this.isConnected = true;  // Ready for API calls
        this.connectionStatus = 'configured';
        
        console.log('✅ UltraMsg WhatsApp API fully configured!');
        console.log('🆔 Instance: instance145086');
        console.log('🔑 Token: wpaq... (configured)');
        console.log('💰 Plan: FREE (1000 messages/month)');
    }

    async sendMessage(phoneNumber, message) {
        try {
            // Format phone number for India (+91)
            let formattedNumber = phoneNumber.replace(/[^\d]/g, '');
            if (formattedNumber.length === 10) {
                formattedNumber = '91' + formattedNumber;
            }
            
            console.log(`📤 Sending UltraMsg WhatsApp bill to +${formattedNumber}...`);
            console.log(`🔗 API: ${this.apiUrl}/messages/chat`);
            
            // UltraMsg API call
            const response = await axios.post(`${this.apiUrl}/messages/chat`, {
                to: formattedNumber,
                body: message,
                priority: 1,
                referenceId: `edasserikkudiyil_${Date.now()}`
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                params: {
                    token: this.token
                },
                timeout: 30000
            });
            
            console.log('📡 UltraMsg API Response:', response.data);
            
            // Check if message sent successfully
            if (response.data.sent === 'true' || response.data.sent === true) {
                console.log(`✅ WhatsApp bill sent successfully via UltraMsg!`);
                console.log(`   Message ID: ${response.data.id}`);
                console.log(`   Customer: +${formattedNumber}`);
                console.log(`   Provider: UltraMsg FREE`);
                
                return {
                    success: true,
                    messageId: response.data.id,
                    timestamp: Date.now(),
                    phoneNumber: formattedNumber,
                    provider: 'ultramsg_free',
                    instance: this.instanceId,
                    cost: 'FREE'
                };
            } else {
                const errorMsg = response.data.error || response.data.message || 'Unknown error';
                throw new Error(`UltraMsg send failed: ${errorMsg}`);
            }
            
        } catch (error) {
            console.error(`❌ UltraMsg WhatsApp Error:`, error.message);
            
            if (error.response) {
                console.error('   API Status:', error.response.status);
                console.error('   API Response:', error.response.data);
                
                // Handle specific UltraMsg errors
                if (error.response.status === 401) {
                    throw new Error('UltraMsg: Invalid token. Please check your credentials.');
                } else if (error.response.status === 402) {
                    throw new Error('UltraMsg: Monthly limit reached (1000 free messages used).');
                } else if (error.response.status === 400) {
                    const apiError = error.response.data.error || error.response.data.message;
                    if (apiError && apiError.includes('not_connected')) {
                        throw new Error('WhatsApp not connected to UltraMsg. Please connect your WhatsApp (+91-9961964928) in dashboard.');
                    } else {
                        throw new Error(`UltraMsg API Error: ${apiError}`);
                    }
                } else {
                    throw new Error(`UltraMsg HTTP ${error.response.status}: ${error.response.data.error || error.message}`);
                }
            } else if (error.code === 'ECONNABORTED') {
                throw new Error('UltraMsg API timeout. Please try again.');
            } else {
                throw new Error(`Network Error: ${error.message}`);
            }
        }
    }

    // Test connection with UltraMsg
    async testConnection() {
        try {
            const response = await axios.get(`${this.apiUrl}/instance/status`, {
                params: { token: this.token },
                timeout: 10000
            });
            
            return {
                success: true,
                status: response.data.accountStatus || 'active',
                phone: response.data.phone || 'not_connected_yet',
                messagesUsed: response.data.messagesUsed || 0,
                messagesLimit: response.data.messagesLimit || 1000
            };
        } catch (error) {
            console.error('UltraMsg connection test failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            status: this.connectionStatus,
            provider: 'ultramsg',
            instance: this.instanceId,
            plan: 'FREE',
            monthlyLimit: '1000 messages',
            apiUrl: this.apiUrl,
            tokenLength: this.token.length,
            expiresOn: '2025-10-07'
        };
    }

    async start() {
        try {
            console.log('🚀 Starting UltraMsg WhatsApp API service...');
            console.log(`📊 Instance: ${this.instanceId}`);
            console.log(`🔗 API URL: ${this.apiUrl}`);
            console.log(`🔑 Token: ${this.token.substring(0, 4)}...${this.token.substring(this.token.length-4)}`);
            
            // Test connection
            const connectionTest = await this.testConnection();
            
            if (connectionTest.success) {
                console.log('✅ UltraMsg API connection successful!');
                console.log(`📱 WhatsApp Status: ${connectionTest.phone || 'Ready to connect'}`);
                console.log(`💰 Messages Used: ${connectionTest.messagesUsed}/${connectionTest.messagesLimit}`);
                console.log('🎯 Ready to send automatic WhatsApp bills!');
                
                if (connectionTest.phone === 'not_connected_yet') {
                    console.log('');
                    console.log('📋 NEXT STEP: Connect Your WhatsApp');
                    console.log('   1. Go to UltraMsg dashboard');
                    console.log('   2. Click on instance145086');
                    console.log('   3. Connect WhatsApp +91-9961964928');
                    console.log('   4. Scan QR code once');
                    console.log('   5. Start sending automatic bills!');
                }
                
                return true;
            } else {
                console.error('❌ UltraMsg connection test failed:', connectionTest.error);
                throw new Error(connectionTest.error);
            }
            
        } catch (error) {
            console.error('❌ UltraMsg startup failed:', error.message);
            this.isConnected = false;
            this.connectionStatus = 'error';
            throw error;
        }
    }

    async disconnect() {
        console.log('ℹ️  UltraMsg WhatsApp service stopped');
        return true;
    }

    async restart() {
        console.log('🔄 Restarting UltraMsg WhatsApp service...');
        return await this.start();
    }
}

const whatsappService = new WhatsAppService();
module.exports = whatsappService;
