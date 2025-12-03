import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Builder from './pages/Builder';
import ActiveWorkout from './pages/ActiveWorkout';
import History from './pages/History';
import RankingPage from './pages/RankingPage';
import type { Program } from './types';
import { DataProvider } from './context/DataContext';
import About from './pages/About';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import GlobalWorkouts from './pages/GlobalWorkouts';

type View = 'home' | 'builder' | 'active' | 'history' | 'ranking' | 'about' | 'profile' | 'global';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>('home');
  const [activeProgram, setActiveProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | undefined>(undefined);

  const handleStart = (program: Program) => {
    setActiveProgram(program);
    setView('active');
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setView('builder');
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
  if (!user) return <Login />;

  if (view === 'active' && activeProgram) {
    return <ActiveWorkout program={activeProgram} onComplete={() => setView('history')} onExit={() => setView('home')} />;
  }

  if (view === 'builder') {
    return (
      <Layout currentView="builder" onNavigate={(v) => setView(v as View)}>
        <Builder onNavigate={(v) => setView(v as View)} editProgram={editingProgram} />
      </Layout>
    );
  }

  if (view === 'history') {
    return (
      <Layout currentView="history" onNavigate={(v) => setView(v as View)}>
        <History />
      </Layout>
    );
  }

  if (view === 'ranking') {
    return (
      <Layout currentView="ranking" onNavigate={(v) => setView(v as View)}>
        <RankingPage />
      </Layout>
    );
  }

  if (view === 'about') {
    return (
      <Layout currentView="about" onNavigate={(v) => setView(v as View)}>
        <About />
      </Layout>
    );
  }

  if (view === 'profile') {
    return (
      <Layout currentView="profile" onNavigate={(v) => setView(v as View)}>
        <Profile onNavigate={(v) => setView(v as View)} />
      </Layout>
    );
  }

  if (view === 'global') {
    return (
      <Layout currentView="global" onNavigate={(v) => setView(v as View)}>
        <GlobalWorkouts onNavigate={(v) => setView(v as View)} />
      </Layout>
    );
  }

  return (
    <Layout currentView="home" onNavigate={(v) => setView(v as View)}>
      <Home onStart={handleStart} onNavigate={(v) => setView(v as View)} onEdit={handleEdit} />
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
