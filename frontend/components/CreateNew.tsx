import React, { useState, useMemo } from 'react';
import { SOFTWARE_TEMPLATES, SearchIcon } from '../constants';
import { SoftwareTemplate } from '../types';

interface CreateNewProps {
  onTemplateSelect: (template: SoftwareTemplate) => void;
}

const TemplateCard: React.FC<{ template: SoftwareTemplate, onSelect: () => void }> = ({ template, onSelect }) => (
  <button onClick={onSelect} className="bg-lt-base-200 dark:bg-base-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 text-left flex flex-col items-start h-full cursor-pointer">
    <div className="flex items-center mb-4">
      {template.icon}
      <h3 className="ml-4 font-bold text-lt-content-strong dark:text-white text-lg">{template.name}</h3>
    </div>
    <p className="text-sm text-lt-content dark:text-gray-400 flex-grow mb-4">{template.description}</p>
    <div className="flex flex-wrap gap-2">
      {template.tags.map(tag => (
        <span key={tag} className="inline-block px-2 py-1 text-xs leading-none bg-lt-base-300 dark:bg-base-300 text-lt-content-strong dark:text-gray-300 rounded-full font-semibold uppercase tracking-wide">{tag}</span>
      ))}
    </div>
  </button>
);

const CreateNew: React.FC<CreateNewProps> = ({ onTemplateSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const types = useMemo(() => {
    return ['All', ...Array.from(new Set(SOFTWARE_TEMPLATES.map(t => t.type)))];
  }, []);

  const filteredTemplates = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase().trim();
    let result = SOFTWARE_TEMPLATES;

    // 1. Filter by type
    if (activeFilter !== 'All') {
        result = result.filter(t => t.type === activeFilter);
    }

    // 2. Filter by search query
    if (lowercasedQuery) {
        result = result.filter(t =>
            t.name.toLowerCase().includes(lowercasedQuery) ||
            t.description.toLowerCase().includes(lowercasedQuery) ||
            t.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))
        );
    }
    
    return result;
  }, [searchQuery, activeFilter]);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-lt-base-100 dark:bg-base-100">
      <h1 className="text-3xl font-bold text-lt-content-strong dark:text-white mb-2">Marketplace</h1>
      <p className="text-lt-content-subtle dark:text-gray-400 mb-8">Choose a template to deploy from our marketplace.</p>
      
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-grow">
            <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-lt-content-subtle dark:text-gray-400" />
            <input 
              type="text" 
              placeholder="Search templates..." 
              className="bg-lt-base-200 dark:bg-base-200 border border-lt-base-300 dark:border-base-300 rounded-md py-2 pl-10 pr-4 w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-lt-brand-primary dark:focus:ring-brand-primary transition text-lt-content-strong dark:text-content placeholder-lt-content-subtle dark:placeholder-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex items-center space-x-2 flex-wrap">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 mb-2 ${
                  activeFilter === type
                  ? 'bg-lt-brand-primary dark:bg-brand-primary text-white shadow'
                  : 'bg-lt-base-200 dark:bg-base-200 text-lt-content-strong dark:text-gray-300 hover:bg-lt-base-300 dark:hover:bg-base-300 border border-lt-base-300 dark:border-base-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map(template => (
            <TemplateCard key={template.id} template={template} onSelect={() => onTemplateSelect(template)} />
          ))
        ) : (
          <p className="text-slate-500 col-span-full">No templates found matching your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default CreateNew;