import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, MessageSquare, Star, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'trinn-ia-hidden-favorites';

const defaultFavorites = [
  { id: 'resumos', title: 'Gerar resumos', desc: 'Atalho para pedir resumos de conteúdos e PDFs.', icon: BookOpen, color: '#00e5a0', page: 'estudos' },
  { id: 'pdfs', title: 'Conversar com PDFs', desc: 'Envie um PDF e pergunte sobre o conteúdo.', icon: FileText, color: '#ff5757', page: 'pdfs' },
  { id: 'chat', title: 'Chat principal', desc: 'Tire dúvidas, crie textos e peça explicações.', icon: MessageSquare, color: '#135bdb', page: 'chat' },
];

export default function FavoritosPage({ onNavigate }) {
  const [hiddenIds, setHiddenIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenIds));
  }, [hiddenIds]);

  const favorites = defaultFavorites.filter(item => !hiddenIds.includes(item.id));

  const removeFavorite = (id) => {
    setHiddenIds(prev => [...new Set([...prev, id])]);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px', letterSpacing: 0 }}>Favoritos</h2>
      <p style={{ color: 'var(--text-3)', fontSize: '13px', marginBottom: '22px' }}>Seus atalhos mais usados ficam aqui.</p>

      {favorites.length === 0 ? (
        <div style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-3)', textAlign: 'center' }}>
          <div style={{ width: '58px', height: '58px', borderRadius: 'var(--r-md)', background: 'var(--bg-3)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={24} color="var(--amber)" />
          </div>
          <div>
            <div style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Nenhum favorito salvo</div>
            <div style={{ fontSize: '13px', lineHeight: 1.5 }}>Use os atalhos do app e salve o que você mais acessa.</div>
          </div>
          <button onClick={() => setHiddenIds([])} style={{ marginTop: '4px', padding: '10px 14px', borderRadius: 'var(--r-full)', background: 'var(--purple-mid)', border: '1px solid var(--border-purple)', color: 'var(--purple-light)', fontWeight: 700, fontSize: '13px' }}>
            Restaurar favoritos
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {favorites.map(({ id, title, desc, icon: Icon, color, page }, i) => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
              <button onClick={() => onNavigate(page)} style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, textAlign: 'left' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: 'var(--r-sm)', background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.45 }}>{desc}</div>
                </div>
              </button>
              <button onClick={() => removeFavorite(id)} style={{ color: 'var(--text-4)', padding: '6px' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
