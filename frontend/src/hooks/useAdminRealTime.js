import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useAdminRealTime = (dataType, refreshCallback) => {
  const { socket, isAdmin } = useAuth();

  const setupRealTimeListeners = useCallback(() => {
    if (!socket || !isAdmin()) return;

    // Listen for general admin data updates
    socket.on('admin-data-update', (updateData) => {
      if (updateData.type === dataType || updateData.type === 'all') {
        console.log(`Real-time update received for ${dataType}:`, updateData);
        if (refreshCallback) {
          refreshCallback(updateData);
        }
      }
    });

    // Listen for specific data type updates
    const eventName = `admin-${dataType}-update`;
    socket.on(eventName, (updateData) => {
      console.log(`Specific real-time update for ${dataType}:`, updateData);
      if (refreshCallback) {
        refreshCallback(updateData);
      }
    });

    // Listen for new data creation
    socket.on(`admin-${dataType}-created`, (newData) => {
      console.log(`New ${dataType} created:`, newData);
      if (refreshCallback) {
        refreshCallback({ action: 'created', data: newData });
      }
    });

    // Listen for data deletion
    socket.on(`admin-${dataType}-deleted`, (deletedData) => {
      console.log(`${dataType} deleted:`, deletedData);
      if (refreshCallback) {
        refreshCallback({ action: 'deleted', data: deletedData });
      }
    });

    // Listen for data updates/edits
    socket.on(`admin-${dataType}-updated`, (updatedData) => {
      console.log(`${dataType} updated:`, updatedData);
      if (refreshCallback) {
        refreshCallback({ action: 'updated', data: updatedData });
      }
    });

    return () => {
      socket.off('admin-data-update');
      socket.off(eventName);
      socket.off(`admin-${dataType}-created`);
      socket.off(`admin-${dataType}-deleted`);
      socket.off(`admin-${dataType}-updated`);
    };
  }, [socket, isAdmin, dataType, refreshCallback]);

  useEffect(() => {
    const cleanup = setupRealTimeListeners();
    return cleanup;
  }, [setupRealTimeListeners]);

  // Function to broadcast admin updates (for when current admin makes changes)
  const broadcastUpdate = useCallback((action, data) => {
    if (socket && isAdmin()) {
      socket.emit('admin-action', {
        type: dataType,
        action,
        data,
        timestamp: new Date()
      });
    }
  }, [socket, isAdmin, dataType]);

  return { broadcastUpdate };
};

export default useAdminRealTime; 