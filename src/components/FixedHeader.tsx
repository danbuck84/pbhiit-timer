import type { ReactNode } from 'react';

interface FixedHeaderProps {
    title: ReactNode;
    leftAction?: ReactNode;
    rightActions?: ReactNode;
}

export default function FixedHeader({ title, leftAction, rightActions }: FixedHeaderProps) {
    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-lg mx-auto p-4 flex justify-between items-center h-16">
                    <div className="flex items-center gap-4">
                        {leftAction && (
                            <div className="flex-shrink-0">
                                {leftAction}
                            </div>
                        )}
                        <div className="font-bold text-xl dark:text-white truncate">
                            {title}
                        </div>
                    </div>
                    {rightActions && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {rightActions}
                        </div>
                    )}
                </div>
            </div>
            {/* Spacer to prevent content from being hidden behind the fixed header */}
            <div className="h-20"></div>
        </>
    );
}
