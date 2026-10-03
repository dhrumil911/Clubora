import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Navbar from './components/Navbar';
import MembersPage from './pages/MembersPage';
import BookingsPage from './pages/BookingsPage';
import ShopPage from './pages/ShopPage';
import BarPOSPage from './pages/BarPOSPage';
import CRMPage from './pages/CRMPage';
import DashboardPage from './pages/DashboardPage';
import PublicWebsitePage from './pages/PublicWebsitePage';

export default function App() {
  const [user, setUser] = useState({
    name: 'Sarah Front Desk',
    email: 'frontdesk@championsclub.com',
    role: 'FRONT_DESK'
  });

  useEffect(() => {
    // Auto login demo staff token
    autoLoginDemoUser();
  }, []);

  const autoLoginDemoUser = async () => {
    try {
      const res = await api.post('/auth/login', {
        email: 'frontdesk@championsclub.com',
        password: 'password123'
      });
      localStorage.setItem('clubora_token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      console.error('Auto login fallback:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clubora_token');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/members" replace />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/bar" element={<BarPOSPage />} />
            <Route path="/crm" element={<CRMPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/public" element={<PublicWebsitePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
