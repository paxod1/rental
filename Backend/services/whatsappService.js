// services/whatsappService.js - FIXED VERSION
const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino'); // Add pino logger

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.qrCode = '';
        this.connectionStatus = 'disconnected';
        // Don't initialize immediately - wait for manual call
    }

    async initialize() {
        try {
            console.log('🔄 Initializing WhatsApp service...');
            
            const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
            
            // ✅ FIXED: Proper logger configuration
            const logger = P({ level: 'silent' }); // Silent logger to reduce noise
            
            this.sock = makeWASocket({
                auth: state,
                // ✅ REMOVED: printQRInTerminal (deprecated)
                logger: logger,
                browser: ["Rental Management", "Chrome", "1.0.0"], // Custom browser info
                markOnlineOnConnect: true,
                defaultQueryTimeoutMs: 60000,
            });

            // ✅ FIXED: Handle connection updates properly
            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (qr) {
                    this.qrCode = qr;
                    console.log('\n📱 QR CODE GENERATED!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('📲 SCAN THIS QR CODE WITH YOUR WHATSAPP:');
                    console.log('   1. Open WhatsApp on your phone (+91-9961964928)');
                    console.log('   2. Go to Settings > Linked Devices');
                    console.log('   3. Tap "Link a Device"');
                    console.log('   4. Scan the QR code displayed below');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    
                    // Display QR code in terminal (manual)
                    const QRCode = require('qrcode-terminal');
                    QRCode.generate(qr, { small: true });
                    
                    this.connectionStatus = 'waiting_for_qr';
                }
                
                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    console.log('❌ WhatsApp connection closed');
                    if (lastDisconnect?.error) {
                        console.log('   Reason:', lastDisconnect.error.message);
                    }
                    
                    this.isConnected = false;
                    this.connectionStatus = 'disconnected';
                    this.qrCode = '';
                    
                    if (shouldReconnect) {
                        console.log('🔄 Attempting to reconnect in 3 seconds...');
                        setTimeout(() => this.initialize(), 3000);
                    } else {
                        console.log('⚠️  WhatsApp logged out. Please scan QR code again.');
                        this.connectionStatus = 'logged_out';
                    }
                } else if (connection === 'connecting') {
                    console.log('🔄 Connecting to WhatsApp...');
                    this.connectionStatus = 'connecting';
                } else if (connection === 'open') {
                    console.log('✅ WhatsApp connected successfully!');
                    console.log('📱 Ready to send messages automatically');
                    this.isConnected = true;
                    this.connectionStatus = 'connected';
                    this.qrCode = '';
                }
            });

            // ✅ FIXED: Handle credential updates
            this.sock.ev.on('creds.update', saveCreds);

        } catch (error) {
            console.error('❌ WhatsApp service initialization error:', error.message);
            this.connectionStatus = 'error';
        }
    }

    async sendMessage(phoneNumber, message) {
        if (!this.isConnected) {
            throw new Error('WhatsApp not connected. Please scan QR code first.');
        }

        try {
            // Format phone number (remove + and ensure country code)
            let formattedNumber = phoneNumber.replace(/[^\d]/g, '');
            
            // Add country code if not present
            if (formattedNumber.length === 10) {
                formattedNumber = '91' + formattedNumber; // India country code
            }
            
            const jid = formattedNumber + '@s.whatsapp.net';
            
            console.log(`📤 Sending message to +${formattedNumber}...`);
            
            // Send message
            const result = await this.sock.sendMessage(jid, { 
                text: message 
            });
            
            console.log(`✅ Message sent successfully to +${formattedNumber}`);
            console.log(`   Message ID: ${result.key.id}`);
            
            return {
                success: true,
                messageId: result.key.id,
                timestamp: result.messageTimestamp || Date.now(),
                phoneNumber: formattedNumber
            };
            
        } catch (error) {
            console.error(`❌ Failed to send message to ${phoneNumber}:`, error.message);
            
            // Handle specific error types
            if (error.output?.statusCode === 401) {
                throw new Error('WhatsApp session expired. Please scan QR code again.');
            } else if (error.output?.statusCode === 404) {
                throw new Error('Phone number not found on WhatsApp.');
            } else {
                throw new Error(`Failed to send WhatsApp message: ${error.message}`);
            }
        }
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            status: this.connectionStatus,
            qrCode: this.qrCode,
            hasQR: !!this.qrCode
        };
    }

    async disconnect() {
        try {
            if (this.sock) {
                console.log('🔌 Disconnecting WhatsApp...');
                await this.sock.logout();
                this.isConnected = false;
                this.connectionStatus = 'disconnected';
                this.qrCode = '';
                console.log('✅ WhatsApp disconnected successfully');
            }
        } catch (error) {
            console.error('❌ Error disconnecting WhatsApp:', error.message);
        }
    }

    // Manual start method
    async start() {
        if (this.connectionStatus === 'disconnected' || this.connectionStatus === 'error') {
            await this.initialize();
        }
    }
}

// Create singleton instance (but don't start automatically)
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
