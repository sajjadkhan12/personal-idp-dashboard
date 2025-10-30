import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { User } from '../types';

interface StickyHeaderProps {
    user: User;
    onLogout?: () => void;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({ user, onLogout }) => {
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:4000/api/logout');
            if (onLogout) {
                onLogout();
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <header className="bg-lt-base-200 dark:bg-base-200 h-16 flex-shrink-0 flex items-center justify-end px-4 sm:px-6 md:px-8 border-b border-lt-base-300 dark:border-base-300">
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 rounded-full p-1 hover:bg-lt-base-300 dark:hover:bg-base-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lt-brand-primary dark:focus:ring-offset-base-200 dark:focus:ring-brand-secondary"
                >
                    <img 
                        src={user.avatarUrl || user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`} 
                        alt={user.name} 
                        className="w-9 h-9 rounded-full" 
                    />
                    <span className="hidden sm:inline text-sm font-medium text-lt-content-strong dark:text-white">{user.name}</span>
                    <svg className="w-4 h-4 text-lt-content-subtle dark:text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-xl z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
                        <div className="py-1">
                            <a href="#" className="block px-4 py-2 text-sm text-lt-content dark:text-content hover:bg-lt-base-300 dark:hover:bg-base-300 transition-colors duration-150">View Profile</a>
                            <a href="#" className="block px-4 py-2 text-sm text-lt-content dark:text-content hover:bg-lt-base-300 dark:hover:bg-base-300 transition-colors duration-150">Settings</a>
                            <div className="border-t border-lt-base-300 dark:border-base-300 my-1"></div>
                            <button 
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-lt-base-300 dark:hover:bg-base-300 transition-colors duration-150"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default StickyHeader;
