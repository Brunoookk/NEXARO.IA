import React from 'react';
import { Home, MessageSquare, BookOpen, User, Settings, History, Star, HelpCircle, LogOut, ChevronRight, Crown } from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Início', page: 'home' },
  { icon: MessageSquare, label: 'Chat', page: 'chat' },
  { icon: BookOpen, label: 'Meus PDFs', page: 'pdfs' },
  { icon: BookOpen, label: 'Estudos', page: 'estudos' },
  { icon: History, label: 'Histórico', page: null },
  { icon: Star, label: 'Favoritos', page: null },
  { icon: Settings, label: 'Configurações', page: null },
  { icon: HelpCircle, label: 'Ajuda e suporte', page: null },
];

export default function PerfilPage({ onNavigate }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 100px' }}>
      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', animation: 'fadeUp 0.3s ease' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#8250ff,#a67fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 0 24px rgba(130,80,255,0.4)' }}>
          🧑
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>Nexaro</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Plano Free</div>
        </div>
      </div>

      {/* Upgrade banner */}
      <button style={{ width: '100%', padding: '14px 16px', background: 'linear-gradient(135deg,rgba(130,80,255,0.15),rgba(130,80,255,0.05))', border: '1px solid var(--border-purple)', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', animation: 'fadeUp 0.3s ease 0.05s both', transition: 'all 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(130,80,255,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(130,80,255,0.15),rgba(130,80,255,0.05))'}>
        <Crown size={16} color="var(--amber)" />
        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--purple-light)' }}>Upgrade para Premium</span>
      </button>

      {/* Menu */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-lg)', overflow: 'hidden', animation: 'fadeUp 0.3s ease 0.1s both' }}>
        {menuItems.map(({ icon: Icon, label, page }, i) => (
          <button key={label} onClick={() => page && onNavigate(page)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: i < menuItems.length - 1 ? '1px solid var(--border-1)' : 'none', transition: 'background 0.15s', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Icon size={18} color="var(--text-3)" />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{label}</span>
            <ChevronRight size={15} color="var(--text-4)" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', marginTop: '10px', background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-lg)', color: 'var(--red)', transition: 'all 0.2s', animation: 'fadeUp 0.3s ease 0.15s both' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,87,87,0.06)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-2)'}>
        <LogOut size={18} />
        <span style={{ fontSize: '14px', fontWeight: 600 }}>Sair</span>
      </button>
    </div>
  );
}
