import React from 'react';
import Link from 'next/link';
import {
  PortalIcon, CreateIcon, CatalogIcon, HelpIcon, DashboardIcon
} from '../constants';
import { User } from '../types';

interface NavItemProps {
    icon: React.ReactNode, 
    label: string, 
    active?: boolean,
    href: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, href }) => (
    <Link href={href} className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors text-left ${active ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
        {icon}
        <span className="ml-3">{label}</span>
    </Link>
);

interface SidebarProps {
    user: User;
    activeView: 'dashboard' | 'my-services' | 'marketplace';
    setView: (view: 'dashboard' | 'my-services' | 'marketplace') => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setView, onLogout }) => {
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <aside className="w-72 bg-[#0B1A2C] text-white flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <PortalIcon className="w-8 h-8 text-cyan-400" />
        <h1 className="ml-3 text-lg font-semibold">My IDP</h1>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-4 py-4 space-y-2">
            <NavItem 
                icon={<DashboardIcon className="w-5 h-5" />} 
                label="Dashboard" 
                active={activeView === 'dashboard'} 
                href="/dashboard?tab=dashboard"
            />
            <NavItem 
                icon={<CreateIcon className="w-5 h-5" />} 
                label="Marketplace" 
                active={activeView === 'marketplace'} 
                href="/dashboard?tab=marketplace"
            />
            <NavItem 
                icon={<CatalogIcon className="w-5 h-5" />} 
                label="My Services" 
                active={activeView === 'my-services'} 
                href="/dashboard?tab=my-services"
            />
        </nav>

        <div className="px-4 py-4 mt-auto border-t border-slate-700">
            <a href="#" className="flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700 hover:text-white">
                <HelpIcon className="w-5 h-5" />
                <span className="ml-3">Help</span>
            </a>
            <div className="flex items-center justify-between mt-2 px-4 py-2">
                <div className="flex items-center">
                    <div className="w-9 h-9 bg-pink-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {getInitials(user.name)}
                    </div>
                    <span className="ml-3 text-sm font-medium">{user.name}</span>
                </div>
                <button onClick={onLogout} className="text-slate-400 hover:text-white text-sm font-semibold">
                    Logout
                </button>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;