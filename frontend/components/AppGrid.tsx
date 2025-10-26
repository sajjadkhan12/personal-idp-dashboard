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
  const [localComponents, setLocalComponents] = useState<SoftwareComponent[]>(components);
  const componentsRef = useRef(components);
  
  // Keep ref updated with latest components and sync local state
  useEffect(() => {
    componentsRef.current = components;
    setLocalComponents(components);
  }, [components]);

  // Update component status immediately when destroy is initiated
  const handleConfirmDelete = async () => {
    if (componentToDelete) {
      setDeletingComponentId(componentToDelete.id);
      
      // Immediately update the local component state to show "Destroying" status
      setLocalComponents(prevComponents =>
        prevComponents.map(comp =>
          comp.id === componentToDelete.id
            ? { ...comp, isDestroying: true, terraformStatus: 'applying' as const }
            : comp
        )
      );
      
      // Set up a check to clear deleting state if component disappears
      const checkInterval = setInterval(() => {
        if (!componentsRef.current.find(c => c.id === componentToDelete.id)) {
          setDeletingComponentId(null);
          clearInterval(checkInterval);
        }
      }, 1000);
      
      // Clean up after 30 seconds to prevent memory leak
      setTimeout(() => clearInterval(checkInterval), 30000);
    }
  };

  const handleDeleteClick = (component: SoftwareComponent) => {
    setComponentToDelete(component);
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
    if (deletingComponentId && !components.find(c => c.id === deletingComponentId)) {
      // Component was removed from the list, clear deleting state
      setDeletingComponentId(null);
      setComponentToDelete(null);
    }
  }, [components, deletingComponentId]);
  
  return (
    <>
      <div className="space-y-4">
        {localComponents.map(component => (
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