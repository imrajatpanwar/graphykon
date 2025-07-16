import React from 'react';
import { ReactComponent as BlueTickIcon } from '../image/Blue Tick.svg';
import { ReactComponent as GoldenTickIcon } from '../image/Golden Tick.svg';
import { ReactComponent as GrayTickIcon } from '../image/Gray Tick.svg';

const VerificationTick = ({ user, size = 24, showTooltip = true }) => {
  if (!user) return null;

  const getVerificationTick = () => {
    // Check for Golden Tick (Premium users)
    if (user.verification?.isPremium || user.premiumSubscription?.isActive) {
      return {
        Component: GoldenTickIcon,
        title: 'Premium Verified',
        color: '#FFD700',
        description: 'This user has an active premium subscription'
      };
    }

    // Check for Blue Tick (Admins)
    if (user.verification?.isBlueVerified || user.isAdmin) {
      return {
        Component: BlueTickIcon,
        title: 'Admin Verified',
        color: '#1D9BF0',
        description: 'This user is verified as an admin'
      };
    }

    // Check for Gray Tick (Special verification)
    if (user.verification?.isGrayVerified) {
      return {
        Component: GrayTickIcon,
        title: 'Verified',
        color: '#9D9D9D',
        description: 'This user has been verified by an admin'
      };
    }

    return null;
  };

  const tickData = getVerificationTick();
  
  if (!tickData) return null;

  const { Component, title, description } = tickData;

  return (
    <span 
      className="verification-tick"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        marginLeft: '4px',
        cursor: showTooltip ? 'help' : 'default'
      }}
      title={showTooltip ? `${title} - ${description}` : ''}
    >
      <Component 
        width={size} 
        height={size} 
        style={{
          filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.1))`,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />
    </span>
  );
};

export default VerificationTick; 