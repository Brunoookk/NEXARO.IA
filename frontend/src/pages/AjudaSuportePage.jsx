import React from 'react';
import { Bug, HelpCircle, Mail, MessageCircle, ShieldCheck } from 'lucide-react';

const supportEmail = 'nexarodev1@gmail.com';

const topics = [
  { icon: Bug, title: 'Reportar problema', desc: 'Conte o que aconteceu e em qual tela.' },
  { icon: HelpCircle, title: 'Dúvida de uso', desc: 'Peça ajuda sobre PDFs, chat ou estudos.' },
  { icon: ShieldCheck, title: 'Conta e acesso', desc: 'Solicite suporte sobre perfil, plano ou login.' },
];

export default function AjudaSuportePage() {
  const subject = encodeURIComponent('Suporte Nexaro');
  const body = encodeURIComponent('Olá, preciso de ajuda com a Nexaro.\n\nDescreva aqui o que aconteceu:');
  const mailto = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px', letterSpacing: 0 }}>Ajuda e suporte</h2>
      <p style={{ color: 'var(--text-3)', fontSize: '13px', marginBottom: '22px' }}>Fale com o suporte ou escolha o tipo de ajuda.</p>

      <a href={mailto} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--purple-mid)', border: '1px solid var(--border-purple)', borderRadius: 'var(--r-md)', marginBottom: '18px', animation: 'fadeUp 0.3s ease both' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-sm)', background: 'rgba(130,80,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Mail size={21} color="var(--purple-light)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '3px' }}>Enviar email</div>
          <div style={{ fontSize: '12px', color: 'var(--purple-light)', overflowWrap: 'anywhere' }}>{supportEmail}</div>
        </div>
      </a>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {topics.map(({ icon: Icon, title, desc }, i) => (
          <a key={title} href={`${mailto}&body=${encodeURIComponent(`Olá, preciso de ajuda com: ${title}\n\nDescreva aqui o que aconteceu:`)}`}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
            <div style={{ width: '42px', height: '42px', borderRadius: 'var(--r-sm)', background: 'var(--green-dim)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} color="var(--green)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.45 }}>{desc}</div>
            </div>
            <MessageCircle size={16} color="var(--text-4)" />
          </a>
        ))}
      </div>
    </div>
  );
}
