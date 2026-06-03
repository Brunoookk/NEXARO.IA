import React from 'react';
import { FileText, BookOpen, Brain, Code2, Zap } from 'lucide-react';

const tools = [
  { icon: FileText, label: 'PDFs', desc: 'Converse com seus PDFs', color: '#8250ff' },
  { icon: BookOpen, label: 'Resumos', desc: 'Gere resumos automáticos', color: '#00e5a0' },
  { icon: Brain, label: 'Mapas mentais', desc: 'Organize ideias visualmente', color: '#ff8c57' },
  { icon: Code2, label: 'Programação', desc: 'Suporte em código e lógica', color: '#57b4ff' },
];

export default function HomePage({ onNavigate }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 100px' }}>
      {/* Hero */}
      <div style={{ marginBottom: '28px', animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '26px' }}>👋</span>
          <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Fala, Nexaro!
          </h1>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: '15px' }}>Como posso te ajudar hoje?</p>
      </div>

      {/* Quick chat input */}
      <button
        onClick={() => onNavigate('chat')}
        style={{
          width: '100%', padding: '16px 18px',
          background: 'var(--bg-3)',
          border: '1px solid var(--border-purple)',
          borderRadius: 'var(--r-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '28px',
          boxShadow: '0 0 30px rgba(130,80,255,0.1)',
          transition: 'all 0.2s',
          animation: 'fadeUp 0.4s ease 0.05s both',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(130,80,255,0.6)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-purple)'}
      >
        <span style={{ color: 'var(--text-3)', fontSize: '15px' }}>Pergunte qualquer coisa...</span>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'var(--purple)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(130,80,255,0.4)',
        }}>
          <Zap size={16} color="#fff" />
        </div>
      </button>

      {/* Tools */}
      <div style={{ animation: 'fadeUp 0.4s ease 0.1s both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Ferramentas</h2>
          <button style={{ fontSize: '13px', color: 'var(--purple-light)', fontWeight: 500 }}>Ver todas</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {tools.map(({ icon: Icon, label, desc, color }) => (
            <button
              key={label}
              onClick={() => label === 'PDFs' ? onNavigate('pdfs') : onNavigate('estudos')}
              style={{
                background: 'var(--bg-3)', border: '1px solid var(--border-2)',
                borderRadius: 'var(--r-md)', padding: '16px',
                textAlign: 'left', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.background = 'var(--bg-4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.background = 'var(--bg-3)'; }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: 'var(--r-sm)',
                background: color + '18', border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '10px',
              }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.4 }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
