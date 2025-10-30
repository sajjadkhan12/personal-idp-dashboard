import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

const ThemeSwitcher: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center px-4 py-3 text-lt-content-subtle dark:text-gray-300 hover:bg-lt-base-300 dark:hover:bg-base-300 hover:text-lt-content-strong dark:hover:text-white rounded-lg transition-colors duration-200 w-full"
    >
      {theme === 'dark' ? (
        <SunIcon className="w-5 h-5 mr-3" />
      ) : (
        <MoonIcon className="w-5 h-5 mr-3" />
      )}
      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
};

export default ThemeSwitcher;


