// Fix: Implement the AppGrid component.
import React, { useState, useEffect, useRef } from 'react';
import { SoftwareComponent, User } from '../types';
import AppCard from './AppCard';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface AppGridProps {
  components: SoftwareComponent[];
  onComponentDeleted: () => void;
  user: User;
}

const AppGrid: React.FC<AppGridProps> = ({ components, onComponentDeleted, user }) => {
  const [componentToDelete, setComponentToDelete] = useState<SoftwareComponent | null>(null);
  const [deletingComponentId, setDeletingComponentId] = useState<string | null>(null);
  const componentsRef = useRef(components);
  
  // Keep ref updated with latest components
  useEffect(() => {
    componentsRef.current = components;
  }, [components]);

  const handleDeleteClick = (component: SoftwareComponent) => {
    setComponentToDelete(component);
  };

  const handleConfirmDelete = async () => {
    if (componentToDelete) {
      setDeletingComponentId(componentToDelete.id);
      // Don't clear deleting state yet - let the modal handle it
      // Keep button disabled until destroy completes
      
      // Set up a check to clear deleting state if component disappears
      const checkInterval = setInterval(() => {
        if (!componentsRef.current.find(c => c.id === componentToDelete.id)) {
          console.log('Component disappeared from list, clearing deleting state');
          setDeletingComponentId(null);
          clearInterval(checkInterval);
        }
      }, 1000);
      
      // Clean up after 30 seconds to prevent memory leak
      setTimeout(() => clearInterval(checkInterval), 30000);
    }
  };
  
  const handleDestroyComplete = () => {
    // Just close the modal, keep button disabled until component is removed from list
    setComponentToDelete(null);
  };

  const cancelDelete = () => {
    setComponentToDelete(null);
  };
  
  // When the component being deleted is removed from the list, clear the deleting state
  useEffect(() => {
    console.log('AppGrid useEffect triggered, components count:', components.length, 'deletingComponentId:', deletingComponentId);
    if (deletingComponentId && !components.find(c => c.id === deletingComponentId)) {
      // Component was removed from the list, clear deleting state
      console.log('Component removed from list (useEffect), clearing deleting state');
      setDeletingComponentId(null);
      setComponentToDelete(null);
    }
  }, [components, deletingComponentId]);
  
  return (
    <>
      <div className="space-y-4">
        {components.map(component => (
          <AppCard 
            key={component.id} 
            component={component} 
            onDeleteClick={() => handleDeleteClick(component)} 
            user={user}
            isDeleting={deletingComponentId === component.id}
          />
        ))}
      </div>
      {componentToDelete && (
        <DeleteConfirmationModal 
          component={componentToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={cancelDelete}
          onDestroyComplete={handleDestroyComplete}
        />
      )}
    </>
  );
};

export default AppGrid;