import React, { useEffect, useState } from 'react';
import { Bell, Mic, Moon, Volume2 } from 'lucide-react';

const STORAGE_KEY = 'trinn-ia-settings';

const defaultSettings = {
  notifications: true,
  voiceInput: true,
  autoRead: false,
  darkTheme: false,
};

const options = [
  { key: 'notifications', icon: Bell, title: 'Notificações', desc: 'Mostrar avisos importantes do aplicativo.' },
  { key: 'voiceInput', icon: Mic, title: 'Entrada por voz', desc: 'Habilitar comandos e perguntas por voz.' },
  { key: 'autoRead', icon: Volume2, title: 'Ler respostas', desc: 'Preparar leitura das respostas do assistente.' },
  { key: 'darkTheme', icon: Moon, title: 'Tema escuro', desc: 'Usar uma interface escura para estudar à noite.' },
];

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.darkTheme ? 'dark' : 'light';
    window.dispatchEvent(new CustomEvent('nexaro-settings-change', { detail: settings }));
  }, [settings]);

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px', letterSpacing: 0 }}>Configurações</h2>
      <p style={{ color: 'var(--text-3)', fontSize: '13px', marginBottom: '22px' }}>Ajuste preferências rápidas da Nexaro.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {options.map(({ key, icon: Icon, title, desc }, i) => (
          <button key={key} onClick={() => toggle(key)}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', textAlign: 'left', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--r-sm)', background: 'var(--purple-mid)', border: '1px solid var(--border-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} color="var(--purple-light)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.45 }}>{desc}</div>
            </div>
            <div style={{ width: '44px', height: '26px', borderRadius: 'var(--r-full)', padding: '3px', background: settings[key] ? 'var(--purple)' : 'var(--bg-5)', border: `1px solid ${settings[key] ? 'var(--border-purple)' : 'var(--border-2)'}`, transition: 'all 0.2s', flexShrink: 0 }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transform: settings[key] ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
