import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen w-full bg-[#fafaf9] overflow-hidden font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
            {children}
        </div>
    );
};

export default Layout;
