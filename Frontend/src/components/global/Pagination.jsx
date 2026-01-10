import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    maxVisiblePages = 5,
}) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (totalPages <= 1) return null;

    // Adjust max visible pages for mobile
    const effectiveMaxVisible = isMobile ? 3 : maxVisiblePages;

    const getPageNumbers = () => {
        const pages = [];
        const half = Math.floor(effectiveMaxVisible / 2);

        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + effectiveMaxVisible - 1);

        if (end - start + 1 < effectiveMaxVisible) {
            start = Math.max(1, end - effectiveMaxVisible + 1);
        }

        // Add first page and ellipsis if needed
        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push("...");
        }

        // Add visible pages
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Add ellipsis and last page if needed
        if (end < totalPages) {
            if (end < totalPages - 1) pages.push("...");
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className={`flex w-full items-center ${isMobile ? 'flex-col gap-4' : 'justify-between'} py-4 mt-8 border-t border-gray-100`}>
            {/* Page info on the left */}
            <div className={`${isMobile ? 'text-center' : 'text-left'}`}>
                <p className="text-sm font-medium text-gray-500">
                    Page {currentPage} of {totalPages}
                </p>
            </div>

            {/* Pagination buttons on the right */}
            <div className={`flex items-center ${isMobile ? 'justify-between w-full' : 'space-x-2'}`}>
                {/* Prev Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 bg-white transition-all shadow-sm"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1.5">
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === "number" && onPageChange(page)}
                            disabled={page === "..."}
                            className={`flex items-center justify-center rounded-lg text-sm font-semibold transition-all w-9 h-9
                  ${page === currentPage
                                    ? "bg-[#086cbe] text-white shadow-md shadow-blue-100"
                                    : page === "..."
                                        ? "cursor-default text-gray-400 border-none"
                                        : "border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 bg-white transition-all shadow-sm"
                >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
            </div>
        </div>
    );
}
