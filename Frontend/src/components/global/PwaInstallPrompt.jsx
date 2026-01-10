import React, { useState, useEffect } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

const PwaInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            const mobile = /android/i.test(userAgent) || (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) || window.innerWidth <= 768;
            return mobile;
        };

        const checkIOS = () => {
            return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        };

        const checkStandalone = () => {
            return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        };

        const mobile = checkMobile();
        const ios = checkIOS();
        const standalone = checkStandalone();

        setIsMobile(mobile);
        setIsIOS(ios);
        setIsStandalone(standalone);

        // For iOS, if it's mobile and not standalone, we show the hint
        if (ios && mobile && !standalone) {
            // Check if we've dismissed it recently (optional, but good practice)
            const dismissed = localStorage.getItem('pwa-ios-prompt-dismissed');
            if (!dismissed) {
                setIsVisible(true);
            }
        }

        // Listen for beforeinstallprompt (Android/Chrome)
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            if (mobile && !standalone) {
                setIsVisible(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for appinstalled
        window.addEventListener('appinstalled', (evt) => {
            console.log('App was installed');
            setIsVisible(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        if (isIOS) {
            localStorage.setItem('pwa-ios-prompt-dismissed', 'true');
        }
    };

    // Only show on mobile and if not already installed
    if (!isVisible || !isMobile || isStandalone) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] animate-fade-in-down">
            <div className="bg-[#086cbe] text-white p-3 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <FiDownload className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Install App</p>
                        <p className="text-xs opacity-90">
                            {isIOS
                                ? "Tap Share -> Add to Home Screen"
                                : "Access rentals faster from your home screen"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isIOS && (
                        <button
                            onClick={handleInstallClick}
                            className="bg-white text-[#086cbe] px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-100 transition-colors"
                        >
                            Install
                        </button>
                    )}
                    <button
                        onClick={handleDismiss}
                        className="p-1 hover:bg-white/10 rounded-full"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <style pwa-styles>{`
                @keyframes fade-in-down {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PwaInstallPrompt;
