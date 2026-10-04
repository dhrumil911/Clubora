import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';

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
import InvoicesPage from './pages/InvoicesPage';
import StaffShiftsPage from './pages/StaffShiftsPage';
import TaxReportsPage from './pages/TaxReportsPage';
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
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center w-full">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-400 font-semibold">Loading Clubora Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans w-full">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-1 bg-zinc-950 text-white w-full flex flex-col min-w-0 max-w-full overflow-x-hidden">
          <Routes>
            {/* Task 1: Public Landing Page */}
            <Route path="/" element={<PublicLandingPage user={user} />} />

            {/* Unified Authentication Pages */}
            <Route
              path="/login"
              element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
            />
            <Route
              path="/signup"
              element={<MemberSignupPage onLoginSuccess={handleLoginSuccess} />}
            />

            {/* Dedicated Role Auth Pages */}
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

            {/* Bar Staff Login */}
            <Route
              path="/auth/bar/login"
              element={
                <LoginPage
                  role="BAR_STAFF"
                  title="Bar Staff Login"
                  subtitle="Access cafeteria bar order tabs & daily bar expenses tracker"
                  demoCredentials={{ email: 'bar@clubora.com', password: 'Bar@2026' }}
                  onLoginSuccess={handleLoginSuccess}
                />
              }
            />

            {/* Shop Staff Login */}
            <Route
              path="/auth/shop/login"
              element={
                <LoginPage
                  role="SHOP_STAFF"
                  title="Shop Staff Login"
                  subtitle="Access pro shop gear inventory POS & retail sales"
                  demoCredentials={{ email: 'shop@clubora.com', password: 'Shop@2026' }}
                  onLoginSuccess={handleLoginSuccess}
                />
              }
            />

            {/* Bar & Shop Combined Staff Login */}
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
                <ProtectedRoute user={user} allowedRoles={['BAR_SHOP_STAFF', 'BAR_STAFF', 'BAR', 'SHOP_STAFF', 'SHOP', 'OWNER']}>
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

            <Route
              path="/bar-cafe"
              element={
                <ProtectedRoute user={user} allowedRoles={['MEMBER', 'BAR_SHOP_STAFF', 'BAR_STAFF', 'BAR', 'SHOP_STAFF', 'SHOP', 'FRONT_DESK_STAFF', 'FRONT_DESK', 'OWNER']}>
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
                  <BookingsPage user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/shop"
              element={
                <ProtectedRoute user={user} allowedRoles={['MEMBER', 'BAR_SHOP_STAFF', 'SHOP_STAFF', 'SHOP', 'BAR', 'OWNER']}>
                  <ShopPage user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bar"
              element={
                <ProtectedRoute user={user} allowedRoles={['MEMBER', 'BAR_SHOP_STAFF', 'BAR_STAFF', 'BAR', 'OWNER']}>
                  <BarPOSPage user={user} />
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
              path="/invoices"
              element={
                <ProtectedRoute user={user} allowedRoles={['OWNER']}>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/shifts"
              element={
                <ProtectedRoute user={user} allowedRoles={['OWNER']}>
                  <StaffShiftsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute user={user} allowedRoles={['OWNER']}>
                  <TaxReportsPage />
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
    </ThemeProvider>
  );
}
