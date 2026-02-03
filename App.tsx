
import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, UserRole } from './types';
import LoginScreen from './pages/LoginScreen';
import Dashboard from './pages/Dashboard';
import RFQDetail from './pages/RFQDetail';
import CreateRFQ from './pages/CreateRFQ';
import CreateQuote from './pages/CreateQuote';
import SellerRFQs from './pages/SellerRFQs';
import ResearchHub from './pages/ResearchHub';
import BottomNav from './components/BottomNav';
import { Layout } from './components/Layout';

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'rfqs' | 'intel' | 'profile' | 'rfq-detail' | 'create-rfq' | 'create-quote'>('home');
  const [activeRfqId, setActiveRfqId] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase text-[10px] tracking-[0.4em] text-gray-400">Booting XB2BX...</div>;

  if (!user) return <LoginScreen onLogin={login} />;

  const navigateToRfq = (id: number) => {
    setActiveRfqId(id);
    setCurrentView('rfq-detail');
  };

  const navigateToQuote = (id: number) => {
    setActiveRfqId(id);
    setCurrentView('create-quote');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Dashboard 
          user={user} 
          onSelectRfq={navigateToRfq} 
          onAction={() => setCurrentView(user.role === UserRole.BUYER ? 'create-rfq' : 'rfqs')} 
          onIntel={() => setCurrentView('intel')}
        />;
      case 'rfqs':
        return user.role === UserRole.BUYER ? 
          <Dashboard user={user} onSelectRfq={navigateToRfq} onAction={() => setCurrentView('create-rfq')} onIntel={() => setCurrentView('intel')} /> : 
          <SellerRFQs onSelectRfq={navigateToRfq} onQuoteRfq={navigateToQuote} />;
      case 'intel':
        return <ResearchHub onBack={() => setCurrentView('home')} />;
      case 'rfq-detail':
        return activeRfqId ? <RFQDetail rfqId={activeRfqId} user={user} onBack={() => setCurrentView('home')} onQuote={() => navigateToQuote(activeRfqId)} /> : null;
      case 'create-rfq':
        return <CreateRFQ onBack={() => setCurrentView('home')} onSuccess={() => setCurrentView('home')} />;
      case 'create-quote':
        return activeRfqId ? <CreateQuote rfqId={activeRfqId} onBack={() => setCurrentView('rfqs')} onSuccess={() => setCurrentView('rfqs')} /> : null;
      case 'profile':
        return (
          <div className="p-4 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 uppercase italic">
                {user.name.charAt(0)}
              </div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter">{user.name}</h2>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">{user.email}</p>
              <span className="mt-4 px-4 py-1.5 bg-red-50 text-red-700 text-[9px] font-black rounded-full uppercase tracking-[0.2em] border border-red-100">
                {user.role} Authority
              </span>
            </div>
            <button 
              onClick={logout}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl active:scale-95 transition-transform text-[10px] uppercase tracking-widest"
            >
              Sign Out Securely
            </button>
          </div>
        );
      default:
        return <Dashboard user={user} onSelectRfq={navigateToRfq} onAction={() => {}} onIntel={() => {}} />;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <Layout>
        <main className="pb-24 pt-4 px-4 max-w-lg mx-auto min-h-screen">
          {renderView()}
        </main>
        <BottomNav currentView={currentView} setCurrentView={setCurrentView} role={user.role} />
      </Layout>
    </AuthContext.Provider>
  );
};

export default App;
