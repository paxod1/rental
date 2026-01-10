import React from 'react';
import { FiPackage } from 'react-icons/fi';

const InitialPageLoader = () => {
    return (
        <div className="fixed top-16 bottom-20 sm:bottom-0 left-0 right-0 z-40 bg-white flex flex-col items-center justify-center">
            <div className="relative mb-8">
                {/* Main Icon Container with Glow */}
                <div className="relative animate-bounce-subtle">
                    <div className="absolute inset-0 bg-[#086cbe] opacity-20 blur-2xl rounded-full transform scale-150"></div>
                    <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-blue-50">
                        <FiPackage className="w-16 h-16 text-[#086cbe]" />

                        {/* Shimmer line across the icon */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shimmer"></div>
                        </div>
                    </div>
                </div>

                {/* Decorative dots */}
                <div className="absolute -top-4 -right-4 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -left-6 w-3 h-3 bg-blue-300 rounded-full animate-pulse delay-150"></div>
            </div>

            <div className="text-center animate-fade-in-up">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                    Edasserikkudiyil
                </h1>
                <div className="flex items-center justify-center gap-3">
                    <div className="h-[2px] w-8 bg-[#086cbe]/30 rounded-full"></div>
                    <span className="text-[#086cbe] font-semibold tracking-widest uppercase text-sm">
                        Rentals
                    </span>
                    <div className="h-[2px] w-8 bg-[#086cbe]/30 rounded-full"></div>
                </div>

                {/* Loading Progress Bar */}
                <div className="mt-8 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-auto">
                    <div className="h-full bg-[#086cbe] rounded-full w-2/3 animate-[progress_1.5s_ease-in-out_infinite]"></div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes progress {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(250%); width: 30%; }
        }
      `}} />
        </div>
    );
};

export default InitialPageLoader;
