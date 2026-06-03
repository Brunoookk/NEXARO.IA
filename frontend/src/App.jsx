import React, { useState } from 'react';
import { Home, MessageSquare, Mic, BookOpen, User, Bell, ArrowLeft, Zap } from 'lucide-react';
import { useChat } from './hooks/useChat';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import PDFsPage from './pages/PDFsPage';
import EstudosPage from './pages/EstudosPage';
import PerfilPage from './pages/PerfilPage';

const pageTitles = { home: null, chat: 'Chat', pdfs: 'Meus PDFs', estudos: 'Estudos', perfil: null };

export default function App() {
  const [page, setPage] = useState('home');
  const chat = useChat();

  const navItems = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'mic', icon: Mic, label: '', special: true },
    { id: 'estudos', icon: BookOpen, label: 'Estudos' },
    { id: 'perfil', icon: User, label: 'Perfil' },
  ];

  const handleNav = (id) => {
    if (id === 'mic') { chat.isListening ? chat.stopListening() : chat.startListening(); return; }
    setPage(id);
  };

  const title = pageTitles[page];
  const showBack = page !== 'home' && page !== 'perfil';

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-0)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow blobs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(130,80,255,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,160,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Desktop sidebar */}
      <aside style={{
        display: 'none',
        width: 'var(--sidebar-w)',
        flexShrink: 0,
        flexDirection: 'column',
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border-1)',
        padding: '24px 12px',
        zIndex: 1,
        '@media (min-width: 768px)': { display: 'flex' },
      }} className="desktop-sidebar">
        {/* Logo */}
        <div style={{ padding: '8px 12px 32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#8250ff,#a67fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(130,80,255,0.3)' }}>
            <Zap size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '-0.03em', background: 'linear-gradient(135deg,#fff,#a67fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nexaro</span>
        </div>
        {navItems.filter(n => n.id !== 'mic').map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setPage(id)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: 'var(--r-md)', marginBottom: '4px', background: page === id ? 'var(--purple-mid)' : 'none', color: page === id ? 'var(--purple-light)' : 'var(--text-3)', fontWeight: page === id ? 700 : 400, fontSize: '14px', transition: 'all 0.2s', border: `1px solid ${page === id ? 'var(--border-purple)' : 'transparent'}` }}
            onMouseEnter={e => { if (page !== id) { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--text-2)'; } }}
            onMouseLeave={e => { if (page !== id) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)'; } }}>
            <Icon size={18} /> {label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => chat.isListening ? chat.stopListening() : chat.startListening()}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: 'var(--r-md)', background: chat.isListening ? 'rgba(255,87,87,0.1)' : 'var(--purple-mid)', color: chat.isListening ? 'var(--red)' : 'var(--purple-light)', fontWeight: 700, fontSize: '14px', border: `1px solid ${chat.isListening ? 'rgba(255,87,87,0.3)' : 'var(--border-purple)'}`, animation: chat.isListening ? 'pulse 1s ease infinite' : 'none', transition: 'all 0.2s' }}>
          <Mic size={18} /> {chat.isListening ? 'Ouvindo...' : 'Falar por voz'}
        </button>
      </aside>

      {/* Main container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{ height: 'var(--nav-h)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border-1)', background: 'rgba(8,8,16,0.8)', backdropFilter: 'blur(16px)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {showBack ? (
              <button onClick={() => setPage('home')} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', borderRadius: 'var(--r-sm)' }}>
                <ArrowLeft size={20} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#8250ff,#a67fff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={14} color="#fff" />
                </div>
              </div>
            )}
            {title ? (
              <span style={{ fontWeight: 700, fontSize: '16px' }}>{title}</span>
            ) : (
              <span style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg,#fff,#a67fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nexaro</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {chat.isLoading && <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--purple)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />}
            {chat.isSpeaking && <span style={{ fontSize: '16px', animation: 'pulse 1s ease infinite' }}>🔊</span>}
            <button style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', borderRadius: 'var(--r-sm)', position: 'relative' }}>
              <Bell size={18} />
              <div style={{ position: 'absolute', top: '8px', right: '8px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--purple)' }} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {page === 'home' && <HomePage onNavigate={setPage} onStartChat={() => setPage('chat')} />}
          {page === 'chat' && <ChatPage chat={chat} />}
          {page === 'pdfs' && <PDFsPage chat={chat} onNavigate={setPage} />}
          {page === 'estudos' && <EstudosPage chat={chat} onNavigate={setPage} />}
          {page === 'perfil' && <PerfilPage onNavigate={setPage} />}
        </div>

        {/* Bottom nav (mobile) */}
        <nav style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderTop: '1px solid var(--border-1)', background: 'rgba(8,8,16,0.9)', backdropFilter: 'blur(16px)', flexShrink: 0, padding: '0 8px' }}>
          {navItems.map(({ id, icon: Icon, label, special }) => {
            const active = page === id;
            const isListeningMic = id === 'mic' && chat.isListening;
            return (
              <button key={id} onClick={() => handleNav(id)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '6px', position: 'relative' }}>
                {special ? (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isListeningMic ? 'rgba(255,87,87,0.2)' : 'linear-gradient(135deg,#8250ff,#a67fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isListeningMic ? '0 0 20px rgba(255,87,87,0.4)' : '0 0 24px rgba(130,80,255,0.5)', transform: 'translateY(-8px)', animation: isListeningMic ? 'glow 1s ease infinite' : 'none', transition: 'all 0.2s' }}>
                    <Icon size={20} color={isListeningMic ? 'var(--red)' : '#fff'} />
                  </div>
                ) : (
                  <>
                    <Icon size={20} color={active ? 'var(--purple-light)' : 'var(--text-4)'} />
                    {label && <span style={{ fontSize: '10px', fontWeight: active ? 700 : 400, color: active ? 'var(--purple-light)' : 'var(--text-4)' }}>{label}</span>}
                    {active && <div style={{ position: 'absolute', bottom: '2px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--purple)' }} />}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
