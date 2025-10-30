import React from 'react';
import Link from 'next/link';
import {
  PortalIcon, CreateIcon, CatalogIcon, HelpIcon, DashboardIcon
} from '../constants';
import ThemeSwitcher from './ThemeSwitcher';

interface NavItemProps {
    icon: React.ReactNode, 
    label: string, 
    active?: boolean,
    href: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, href }) => {
  const commonClasses = 'flex items-center px-4 py-3 text-lt-content-subtle dark:text-gray-300 hover:bg-lt-base-300 dark:hover:bg-base-300 hover:text-lt-content-strong dark:hover:text-white rounded-lg transition-colors duration-200';
  const activeClasses = 'bg-lt-brand-primary dark:bg-brand-primary text-white dark:text-white';

  return (
    <Link href={href} className={`${commonClasses} ${active ? activeClasses : ''}`}>
      {icon}
      <span className="ml-3">{label}</span>
    </Link>
  );
};

interface SidebarProps {
    user: any;
    activeView: 'dashboard' | 'my-services' | 'marketplace';
    setView: (view: 'dashboard' | 'my-services' | 'marketplace') => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setView, onLogout }) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-lt-base-200 dark:bg-base-200 p-4 hidden md:flex md:flex-col">
      <div className="flex items-center mb-10">
        <PortalIcon className="w-8 h-8 text-lt-brand-secondary dark:text-brand-secondary" />
        <h1 className="ml-2 text-xl font-bold text-lt-content-strong dark:text-white">IDP Platform</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        <NavItem 
            icon={<DashboardIcon className="w-5 h-5" />} 
            label="Overview" 
            active={activeView === 'dashboard'} 
            href="/dashboard?tab=dashboard"
        />
        <NavItem 
            icon={<CreateIcon className="w-5 h-5" />} 
            label="My Services" 
            active={activeView === 'my-services'} 
            href="/dashboard?tab=my-services"
        />
        <NavItem 
            icon={<CatalogIcon className="w-5 h-5" />} 
            label="Marketplace" 
            active={activeView === 'marketplace'} 
            href="/dashboard?tab=marketplace"
        />
      </nav>
      <div className="mt-auto space-y-2">
        <ThemeSwitcher />
        <div className="p-4 bg-lt-base-300 dark:bg-base-300 rounded-lg text-center">
          <p className="text-sm text-lt-content-subtle dark:text-content">Found an issue?</p>
          <a href="#" className="text-sm font-semibold text-lt-brand-secondary dark:text-brand-secondary hover:underline">Report a bug</a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
