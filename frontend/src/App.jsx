import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public & Auth Pages
import PublicLandingPage from './pages/PublicLandingPage';
import LoginPage from './pages/auth/LoginPage';
import MemberSignupPage from './pages/auth/MemberSignupPage';

// Dashboards
import OwnerDashboardPage from './pages/dashboards/OwnerDashboardPage';
import FrontDeskDashboardPage from './pages/dashboards/FrontDeskDashboardPage';
import BarShopDashboardPage from './pages/dashboards/BarShopDashboardPage';
import MemberDashboardPage from './pages/dashboards/MemberDashboardPage';

// Modules
import MembersPage from './pages/MembersPage';
import BookingsPage from './pages/BookingsPage';
import ShopPage from './pages/ShopPage';
import BarPOSPage from './pages/BarPOSPage';
import CRMPage from './pages/CRMPage';
import DashboardPage from './pages/DashboardPage';
import PublicWebsitePage from './pages/PublicWebsitePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    const token = localStorage.getItem('clubora_token');
    if (token) {
      try {
        const res = await api.get('/auth/profile');
        setUser(res.data);
      } catch (err) {
        console.error('Session validation error:', err);
        localStorage.removeItem('clubora_token');
        setUser(null);
      }
    }
    setAuthLoading(false);
  };

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('clubora_token');
    setUser(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-semibold">Loading Clubora Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-1">
          <Routes>
            {/* Task 1: Public Landing Page */}
            <Route path="/" element={<PublicLandingPage />} />

            {/* Task 5 & Task 12: Authentication Pages */}
            <Route
              path="/auth/member/login"
              element={
                <LoginPage
                  role="MEMBER"
                  title="Member Login"
                  subtitle="Sign in to your Champions Club Member Account"
                  demoCredentials={{ email: 'david.gold@example.com', password: 'password123' }}
                  onLoginSuccess={handleLoginSuccess}
                />
              }
            />

            {/* Task 4: Member Signup */}
            <Route
              path="/auth/member/signup"
              element={<MemberSignupPage onLoginSuccess={handleLoginSuccess} />}
            />

            {/* Task 5: Front Desk Staff Login */}
            <Route
              path="/auth/front-desk/login"
              element={
                <LoginPage
                  role="FRONT_DESK_STAFF"
                  title="Front Desk Staff Login"
                  subtitle="Access member directory, court scheduler & visitor CRM"
                  demoCredentials={{ email: 'frontdesk@clubora.com', password: 'Frontdesk@2026' }}
                  onLoginSuccess={handleLoginSuccess}
                />
              }
            />

            {/* Task 5: Bar / Shop Staff Login */}
            <Route
              path="/auth/bar-shop/login"
              element={
                <LoginPage
                  role="BAR_SHOP_STAFF"
                  title="Bar & Shop Staff Login"
                  subtitle="Access gear inventory POS & bar cafeteria order tabs"
                  demoCredentials={{ email: 'barshop@clubora.com', password: 'Barshop@2026' }}
                  onLoginSuccess={handleLoginSuccess}
                />
              }
            />

            {/* Task 5 & Task 6: Owner Login */}
            <Route
              path="/auth/owner/login"
              element={
                <LoginPage
                  role="OWNER"
                  title="Club Owner Login"
                  subtitle="Access executive financial analytics & staff shift scheduling"
                  demoCredentials={{ email: 'owner@clubora.com', password: 'Clubora@2026' }}
                  onLoginSuccess={handleLoginSuccess}
                />
              }
            />

            {/* Task 3 & Task 9: Role-Based Dashboard Routes */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute user={user} allowedRoles={['OWNER']}>
                  <OwnerDashboardPage user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/front-desk"
              element={
                <ProtectedRoute user={user} allowedRoles={['FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER']}>
                  <FrontDeskDashboardPage user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bar-shop"
              element={
                <ProtectedRoute user={user} allowedRoles={['BAR_SHOP_STAFF', 'BAR', 'OWNER']}>
                  <BarShopDashboardPage user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/member"
              element={
                <ProtectedRoute user={user} allowedRoles={['MEMBER', 'OWNER']}>
                  <MemberDashboardPage user={user} />
                </ProtectedRoute>
              }
            />

            {/* Preserved Feature Routes */}
            <Route
              path="/members"
              element={
                <ProtectedRoute user={user} allowedRoles={['FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER']}>
                  <MembersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookings"
              element={
                <ProtectedRoute user={user} allowedRoles={['MEMBER', 'FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER']}>
                  <BookingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/shop"
              element={
                <ProtectedRoute user={user} allowedRoles={['MEMBER', 'BAR_SHOP_STAFF', 'BAR', 'OWNER']}>
                  <ShopPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bar"
              element={
                <ProtectedRoute user={user} allowedRoles={['BAR_SHOP_STAFF', 'BAR', 'OWNER']}>
                  <BarPOSPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/crm"
              element={
                <ProtectedRoute user={user} allowedRoles={['FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER']}>
                  <CRMPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute user={user} allowedRoles={['OWNER']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="/public" element={<PublicWebsitePage />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
