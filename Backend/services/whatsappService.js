// services/whatsappService.js - STABLE CONNECTION VERSION
const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.qrCode = '';
        this.connectionStatus = 'disconnected';
        this.initializationInProgress = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
    }

    async initialize() {
        // ✅ PREVENT MULTIPLE INITIALIZATIONS
        if (this.initializationInProgress) {
            console.log('⏳ WhatsApp initialization already in progress, skipping...');
            return;
        }

        // ✅ CHECK MAX RECONNECT ATTEMPTS
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached. Please restart manually.');
            this.connectionStatus = 'max_attempts_reached';
            return;
        }

        try {
            this.initializationInProgress = true;
            this.reconnectAttempts++;
            
            console.log(`🔄 Initializing WhatsApp service... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            // ✅ CLEAR PREVIOUS TIMEOUTS
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            
            const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
            
            const logger = P({ level: 'silent' });
            
            // ✅ IMPROVED SOCKET CONFIGURATION
            this.sock = makeWASocket({
                auth: state,
                logger: logger,
                browser: ["Rental Management", "Chrome", "1.0.0"],
                markOnlineOnConnect: false, // ✅ PREVENT AUTO ONLINE STATUS
                connectTimeoutMs: 20000, // ✅ SHORTER TIMEOUT
                defaultQueryTimeoutMs: 60000,
                retryRequestDelayMs: 2000,
                maxMsgRetryCount: 3,
                keepAliveIntervalMs: 30000,
            });

            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                console.log(`📡 Connection update: ${connection} (Attempt ${this.reconnectAttempts})`);
                
                if (qr && !this.qrCode) {
                    this.qrCode = qr;
                    console.log('\n🎉 QR CODE GENERATED!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('📲 SCAN THIS QR CODE WITH WHATSAPP (+91-9961964928):');
                    console.log('   1. Open WhatsApp on phone +91-9961964928');
                    console.log('   2. Go to Settings > Linked Devices'); 
                    console.log('   3. Tap "Link a Device"');
                    console.log('   4. Scan the QR code below:');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    
                    try {
                        const QRCode = require('qrcode-terminal');
                        QRCode.generate(qr, { small: true });
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('✅ QR Code displayed above - please scan it!');
                    } catch (qrError) {
                        console.error('❌ Failed to display QR code:', qrError.message);
                    }
                    
                    this.connectionStatus = 'waiting_for_qr';
                }
                
                if (connection === 'close') {
                    this.initializationInProgress = false;
                    
                    const statusCode = lastDisconnect?.error instanceof Boom 
                        ? lastDisconnect.error.output?.statusCode 
                        : null;
                    
                    console.log('❌ WhatsApp connection closed');
                    if (lastDisconnect?.error) {
                        console.log('   Reason:', lastDisconnect.error.message);
                        console.log('   Status Code:', statusCode);
                    }
                    
                    this.isConnected = false;
                    this.connectionStatus = 'disconnected';
                    this.qrCode = '';
                    
                    // ✅ IMPROVED RECONNECTION LOGIC
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut 
                        && statusCode !== DisconnectReason.banned
                        && this.reconnectAttempts < this.maxReconnectAttempts;
                    
                    if (shouldReconnect) {
                        const delay = Math.min(5000 * this.reconnectAttempts, 30000); // Progressive delay
                        console.log(`🔄 Will attempt to reconnect in ${delay/1000} seconds... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                        
                        this.reconnectTimeout = setTimeout(() => {
                            if (!this.isConnected && !this.initializationInProgress) {
                                this.initialize();
                            }
                        }, delay);
                    } else {
                        if (statusCode === DisconnectReason.loggedOut) {
                            console.log('⚠️  WhatsApp logged out. Need to scan QR code again.');
                            this.connectionStatus = 'logged_out';
                            this.reconnectAttempts = 0; // Reset for manual restart
                        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                            console.log('❌ Max reconnection attempts reached. Please restart service manually.');
                            this.connectionStatus = 'max_attempts_reached';
                        }
                    }
                    
                } else if (connection === 'connecting') {
                    console.log(`🔄 Connecting to WhatsApp... (Attempt ${this.reconnectAttempts})`);
                    this.connectionStatus = 'connecting';
                    
                } else if (connection === 'open') {
                    this.initializationInProgress = false;
                    this.reconnectAttempts = 0; // ✅ RESET ON SUCCESS
                    
                    console.log('🎉 WhatsApp connected successfully!');
                    console.log('📱 Ready to send automatic messages');
                    console.log('✅ Connection stable and ready for use');
                    
                    this.isConnected = true;
                    this.connectionStatus = 'connected';
                    this.qrCode = '';
                    
                    // ✅ CLEAR ANY PENDING RECONNECTION
                    if (this.reconnectTimeout) {
                        clearTimeout(this.reconnectTimeout);
                        this.reconnectTimeout = null;
                    }
                }
            });

            this.sock.ev.on('creds.update', saveCreds);

        } catch (error) {
            this.initializationInProgress = false;
            console.error('❌ WhatsApp service initialization error:', error.message);
            this.connectionStatus = 'error';
            
            // ✅ RETRY ON ERROR WITH DELAY
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                const delay = 5000;
                console.log(`🔄 Retrying initialization in ${delay/1000} seconds...`);
                this.reconnectTimeout = setTimeout(() => {
                    if (!this.isConnected) {
                        this.initialize();
                    }
                }, delay);
            }
        }
    }

    async sendMessage(phoneNumber, message) {
        if (!this.isConnected) {
            throw new Error('WhatsApp not connected. Please scan QR code first.');
        }

        try {
            let formattedNumber = phoneNumber.replace(/[^\d]/g, '');
            
            if (formattedNumber.length === 10) {
                formattedNumber = '91' + formattedNumber;
            }
            
            const jid = formattedNumber + '@s.whatsapp.net';
            
            console.log(`📤 Sending message to +${formattedNumber}...`);
            
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
            
            if (error.output?.statusCode === 401) {
                this.isConnected = false;
                this.connectionStatus = 'session_expired';
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
            hasQR: !!this.qrCode,
            initializing: this.initializationInProgress,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
        };
    }

    async disconnect() {
        try {
            // ✅ CLEAR TIMEOUTS
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            
            if (this.sock) {
                console.log('🔌 Disconnecting WhatsApp...');
                await this.sock.logout();
            }
            
            this.isConnected = false;
            this.connectionStatus = 'disconnected';
            this.qrCode = '';
            this.initializationInProgress = false;
            this.reconnectAttempts = 0;
            
            console.log('✅ WhatsApp disconnected successfully');
        } catch (error) {
            console.error('❌ Error disconnecting WhatsApp:', error.message);
        }
    }

    async start() {
        if (this.connectionStatus === 'max_attempts_reached') {
            console.log('🔄 Resetting reconnection attempts...');
            this.reconnectAttempts = 0;
        }
        
        if (!this.isConnected && !this.initializationInProgress) {
            console.log('🚀 Starting WhatsApp service...');
            await this.initialize();
        } else if (this.initializationInProgress) {
            console.log('⏳ WhatsApp service is already starting...');
        } else if (this.isConnected) {
            console.log('✅ WhatsApp service is already connected');
        }
    }

    // ✅ MANUAL RESET METHOD
    async reset() {
        console.log('🔄 Resetting WhatsApp service...');
        await this.disconnect();
        this.reconnectAttempts = 0;
        this.connectionStatus = 'disconnected';
        await this.start();
    }
}

const whatsappService = new WhatsAppService();
module.exports = whatsappService;
