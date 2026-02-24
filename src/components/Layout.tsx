import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    theme?: 'light' | 'dark';
    focusMode?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, theme = 'light', focusMode = false }) => {
    const baseClasses = theme === 'dark'
        ? 'bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-100'
        : 'bg-slate-100 text-slate-900 selection:bg-teal-100 selection:text-teal-900';

    return (
        <div
            data-theme={theme}
            className={`flex h-screen w-full overflow-hidden font-sans ${baseClasses} ${focusMode ? 'lg:pr-0' : ''}`}
            style={{ colorScheme: theme }}
        >
            {children}
        </div>
    );
};

export default Layout;
