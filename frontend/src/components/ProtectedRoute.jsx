import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    // Unauthenticated user -> redirect to unified login portal
    return <Navigate to="/login" replace />;
  }

  const uRole = (user.role || '').toUpperCase();

  // Check role authorization
  const isAuthorized = allowedRoles.some(role => {
    const r = role.toUpperCase();
    if (r === uRole) return true;
    if (r === 'FRONT_DESK_STAFF' && (uRole === 'FRONT_DESK' || uRole === 'FRONT_DESK_STAFF')) return true;
    if (r === 'BAR_SHOP_STAFF' && (uRole === 'BAR' || uRole === 'BAR_SHOP_STAFF')) return true;
    if (r === 'OWNER' && uRole === 'OWNER') return true;
    if (r === 'MEMBER' && uRole === 'MEMBER') return true;
    return false;
  });

  if (!isAuthorized) {
    // Role mismatch -> redirect non-owners to their designated role dashboard
    switch (uRole) {
      case 'FRONT_DESK_STAFF':
      case 'FRONT_DESK':
        return <Navigate to="/front-desk" replace />;
      case 'BAR_SHOP_STAFF':
      case 'BAR':
        return <Navigate to="/bar-shop" replace />;
      case 'MEMBER':
        return <Navigate to="/member" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
}
