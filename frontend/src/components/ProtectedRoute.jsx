import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, allowedRoles, children }) {
  if (!user) {
    // Unauthenticated user -> redirect to login
    return <Navigate to="/auth/member/login" replace />;
  }

  const uRole = user.role;

  // Check role authorization
  const isAuthorized = allowedRoles.some(role => {
    if (role === uRole) return true;
    if (role === 'FRONT_DESK_STAFF' && (uRole === 'FRONT_DESK' || uRole === 'FRONT_DESK_STAFF')) return true;
    if (role === 'BAR_SHOP_STAFF' && (uRole === 'BAR' || uRole === 'BAR_SHOP_STAFF')) return true;
    if (role === 'OWNER' && uRole === 'OWNER') return true;
    if (role === 'MEMBER' && uRole === 'MEMBER') return true;
    return false;
  });

  // Owner super-admin access allowed to all dashboards
  if (uRole === 'OWNER') {
    return children;
  }

  if (!isAuthorized) {
    // Role mismatch -> redirect to user's designated role dashboard
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
