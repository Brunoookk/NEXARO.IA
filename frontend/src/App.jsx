import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Bell,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Crown,
  Database,
  Download,
  FileText,
  Filter,
  Fingerprint,
  Globe2,
  History,
  Home,
  Image,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  Moon,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from './hooks/useChat';

const STORAGE = {
  theme: 'nexaro-theme',
  profile: 'nexaro-profile',
  settings: 'nexaro-settings',
  conversations: 'nexaro-conversations',
  saved: 'nexaro-saved',
};

const initialConversations = [
  {
    id: 'conv-1',
    title: 'Planejamento de automacoes',
    date: new Date().toISOString(),
    favorite: true,
    pinned: true,
    messages: [
      { role: 'user', content: 'Crie um plano de automacoes para atendimento.' },
      { role: 'assistant', content: 'Podemos estruturar funis, respostas inteligentes e analise de dados.' },
    ],
  },
  {
    id: 'conv-2',
    title: 'Resumo de contrato',
    date: new Date(Date.now() - 86400000).toISOString(),
    favorite: false,
    pinned: false,
    messages: [
      { role: 'user', content: 'Resuma os pontos importantes deste documento.' },
      { role: 'assistant', content: 'Identifiquei prazos, responsabilidades e clausulas de cancelamento.' },
    ],
  },
  {
    id: 'conv-3',
    title: 'Ideias para SaaS',
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    favorite: true,
    pinned: false,
    messages: [
      { role: 'user', content: 'Liste ideias de produto com IA.' },
      { role: 'assistant', content: 'Sugiro copilot operacional, analise de PDFs e CRM com IA.' },
    ],
  },
];

const initialSaved = [
  { id: 'save-1', type: 'Prompt', category: 'Prompts', title: 'Prompt para estrategia', content: 'Atue como consultor de estrategia e crie um plano claro com riscos e proximos passos.' },
  { id: 'save-2', type: 'Resposta', category: 'Programacao', title: 'Checklist de deploy', content: 'Build, variaveis de ambiente, logs, cache, dominio e teste final.' },
  { id: 'save-3', type: 'Prompt', category: 'Negocios', title: 'Analise de mercado', content: 'Analise concorrentes, ICP, proposta de valor e precificacao.' },
  { id: 'save-4', type: 'Resposta', category: 'Estudos', title: 'Metodo de estudo', content: 'Use ciclos de leitura, resumo ativo, revisao espacada e questoes.' },
];

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function groupConversation(dateValue) {
  const date = new Date(dateValue);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = startToday - new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days <= 7) return 'Ultimos 7 dias';
  return 'Ultimos 30 dias';
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="metric-card">
      <div className="metric-icon"><Icon size={18} /></div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function Pill({ children, tone = 'blue' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      <Icon size={26} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function App() {
  const chat = useChat();
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => readStorage(STORAGE.theme, 'dark'));
  const [profile, setProfile] = useState(() => readStorage(STORAGE.profile, {
    name: 'Bruno Trindade',
    email: 'bruno@nexaro.ai',
    photo: '',
    plan: 'Pro',
    createdAt: '03/06/2026',
  }));
  const [settings, setSettings] = useState(() => readStorage(STORAGE.settings, {
    language: 'pt-BR',
    notifications: true,
    securityAlerts: true,
    productUpdates: false,
  }));
  const [conversations, setConversations] = useState(() => readStorage(STORAGE.conversations, initialConversations));
  const [savedItems, setSavedItems] = useState(() => readStorage(STORAGE.saved, initialSaved));
  const [activeConversationId, setActiveConversationId] = useState(conversations[0]?.id || null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStorage(STORAGE.theme, theme);
  }, [theme]);

  useEffect(() => writeStorage(STORAGE.profile, profile), [profile]);
  useEffect(() => writeStorage(STORAGE.settings, settings), [settings]);
  useEffect(() => writeStorage(STORAGE.conversations, conversations), [conversations]);
  useEffect(() => writeStorage(STORAGE.saved, savedItems), [savedItems]);

  const activeConversation = conversations.find((item) => item.id === activeConversationId);
  const totalPrompts = conversations.reduce((total, item) => total + item.messages.filter((msg) => msg.role === 'user').length, 0) + chat.messages.filter((msg) => msg.role === 'user').length;

  const createConversation = () => {
    const next = {
      id: `conv-${Date.now()}`,
      title: 'Nova conversa',
      date: new Date().toISOString(),
      favorite: false,
      pinned: false,
      messages: [],
    };
    setConversations((items) => [next, ...items]);
    setActiveConversationId(next.id);
    setPage('chat');
  };

  const updateConversation = (id, patch) => {
    setConversations((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const deleteConversation = (id) => {
    setConversations((items) => items.filter((item) => item.id !== id));
    if (activeConversationId === id) setActiveConversationId(conversations.find((item) => item.id !== id)?.id || null);
  };

  const duplicateConversation = (id) => {
    const item = conversations.find((conv) => conv.id === id);
    if (!item) return;
    const copy = { ...item, id: `conv-${Date.now()}`, title: `${item.title} copia`, date: new Date().toISOString(), pinned: false };
    setConversations((items) => [copy, ...items]);
  };

  const exportConversations = () => {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nexaro-conversas.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importConversations = async (file) => {
    if (!file) return;
    const text = await file.text();
    const imported = JSON.parse(text);
    if (Array.isArray(imported)) setConversations(imported);
  };

  const saveCurrentAssistantMessage = () => {
    const last = [...chat.messages].reverse().find((msg) => msg.role === 'assistant' && msg.content);
    if (!last) return;
    setSavedItems((items) => [
      { id: `save-${Date.now()}`, type: 'Resposta', category: 'Prompts', title: 'Resposta salva', content: last.content },
      ...items,
    ]);
  };

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'chat', label: 'Chat IA', icon: MessageSquare },
    { id: 'history', label: 'Historico', icon: History },
    { id: 'saved', label: 'Favoritos', icon: Star },
    { id: 'settings', label: 'Configuracoes', icon: Settings },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguranca', icon: ShieldCheck },
    { id: 'terms', label: 'Termos', icon: FileText },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={20} /></div>
          <div>
            <strong>NEXARO IA</strong>
            <span>AI workspace</span>
          </div>
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu">
            <X size={18} />
          </button>
        </div>

        <button className="new-chat" onClick={createConversation}>
          <Plus size={18} />
          Nova conversa
        </button>

        <nav className="main-nav">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); setSidebarOpen(false); }}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <HistorySidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={(id) => { setActiveConversationId(id); setPage('chat'); setSidebarOpen(false); }}
          onToggleFavorite={(id) => updateConversation(id, { favorite: !conversations.find((item) => item.id === id)?.favorite })}
          onTogglePin={(id) => updateConversation(id, { pinned: !conversations.find((item) => item.id === id)?.pinned })}
        />

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'dark' ? 'Escuro' : 'Claro'}
          </button>
          <div className="mini-profile">
            <Avatar profile={profile} />
            <div>
              <strong>{profile.name}</strong>
              <span>Plano {profile.plan}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div>
            <span className="eyebrow">Plataforma Nexaro</span>
            <h1>{navigation.find((item) => item.id === page)?.label || 'NEXARO IA'}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setPage('settings')} aria-label="Configuracoes">
              <Settings size={18} />
            </button>
            <button className="icon-button" aria-label="Notificacoes">
              <Bell size={18} />
              {settings.notifications && <span className="notification-dot" />}
            </button>
            <Avatar profile={profile} />
          </div>
        </header>

        <div className="page-scroll">
          {page === 'dashboard' && (
            <DashboardPage
              conversations={conversations}
              savedItems={savedItems}
              totalPrompts={totalPrompts}
              onNavigate={setPage}
              onNewChat={createConversation}
            />
          )}
          {page === 'chat' && (
            <ChatWorkspace
              chat={chat}
              activeConversation={activeConversation}
              onSave={saveCurrentAssistantMessage}
              onExport={exportConversations}
            />
          )}
          {page === 'history' && (
            <HistoryPage
              conversations={conversations}
              search={historySearch}
              filter={historyFilter}
              onSearch={setHistorySearch}
              onFilter={setHistoryFilter}
              onRename={(id, title) => updateConversation(id, { title })}
              onDelete={deleteConversation}
              onDuplicate={duplicateConversation}
              onToggleFavorite={(id) => updateConversation(id, { favorite: !conversations.find((item) => item.id === id)?.favorite })}
              onTogglePin={(id) => updateConversation(id, { pinned: !conversations.find((item) => item.id === id)?.pinned })}
              onOpen={(id) => { setActiveConversationId(id); setPage('chat'); }}
            />
          )}
          {page === 'saved' && <SavedPage savedItems={savedItems} setSavedItems={setSavedItems} />}
          {page === 'settings' && (
            <SettingsPage
              theme={theme}
              setTheme={setTheme}
              settings={settings}
              setSettings={setSettings}
              profile={profile}
              setProfile={setProfile}
              onClear={() => { setConversations([]); chat.clearChat(); }}
              onExport={exportConversations}
              onImport={importConversations}
            />
          )}
          {page === 'profile' && <ProfilePage profile={profile} conversations={conversations} totalPrompts={totalPrompts} />}
          {page === 'security' && <SecurityPage />}
          {page === 'terms' && <TermsPage />}
        </div>
      </main>
    </div>
  );
}

function Avatar({ profile }) {
  return (
    <div className="avatar">
      {profile.photo ? <img src={profile.photo} alt={profile.name} /> : <span>{profile.name.slice(0, 1).toUpperCase()}</span>}
    </div>
  );
}

function HistorySidebar({ conversations, activeConversationId, onSelect, onToggleFavorite, onTogglePin }) {
  const grouped = useMemo(() => {
    return conversations
      .slice()
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.date) - new Date(a.date))
      .reduce((acc, item) => {
        const group = groupConversation(item.date);
        acc[group] = acc[group] || [];
        acc[group].push(item);
        return acc;
      }, {});
  }, [conversations]);

  return (
    <div className="history-sidebar">
      {['Hoje', 'Ontem', 'Ultimos 7 dias', 'Ultimos 30 dias'].map((group) => (
        grouped[group]?.length ? (
          <div className="history-group" key={group}>
            <span><Archive size={13} /> {group}</span>
            {grouped[group].map((item) => (
              <div className={`conversation-row ${item.id === activeConversationId ? 'active' : ''}`} key={item.id}>
                <button onClick={() => onSelect(item.id)}>
                  <MessageSquare size={14} />
                  <span>{item.title}</span>
                </button>
                <div className="row-actions">
                  <button onClick={() => onTogglePin(item.id)} title="Fixar">{item.pinned ? <Check size={13} /> : <ChevronDown size={13} />}</button>
                  <button onClick={() => onToggleFavorite(item.id)} title="Favoritar"><Star size={13} fill={item.favorite ? 'currentColor' : 'none'} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : null
      ))}
    </div>
  );
}

function DashboardPage({ conversations, savedItems, totalPrompts, onNavigate, onNewChat }) {
  const cards = [
    { icon: MessageSquare, title: 'Chat inteligente', text: 'Converse com a Nexaro IA em um ambiente seguro e organizado.', action: 'Abrir chat', page: 'chat' },
    { icon: History, title: 'Historico completo', text: 'Pesquise, fixe, duplique e organize conversas por periodo.', action: 'Ver historico', page: 'history' },
    { icon: Star, title: 'Mensagens salvas', text: 'Guarde prompts, respostas e colecoes por categoria.', action: 'Ver favoritos', page: 'saved' },
    { icon: Shield, title: 'Centro de seguranca', text: 'Controle 2FA, sessoes, dispositivos e alertas de login.', action: 'Gerenciar', page: 'security' },
  ];

  return (
    <div className="dashboard">
      <section className="hero-panel glass">
        <div>
          <Pill>Workspace premium</Pill>
          <h2>NEXARO IA para criar, estudar, automatizar e decidir com seguranca.</h2>
          <p>Uma plataforma profissional de IA com historico, favoritos, perfil, termos, seguranca e personalizacao de tema.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onNewChat}><Plus size={18} /> Nova conversa</button>
            <button className="secondary-button" onClick={() => onNavigate('settings')}><Settings size={18} /> Configurar</button>
          </div>
        </div>
        <div className="hero-status">
          <div><span>Status</span><strong>Operacional</strong></div>
          <div><span>Modelo</span><strong>Nexaro Core</strong></div>
          <div><span>Privacidade</span><strong>Protegida</strong></div>
        </div>
      </section>

      <div className="metrics-grid">
        <Metric icon={MessageSquare} label="Conversas" value={conversations.length} />
        <Metric icon={Sparkles} label="Prompts enviados" value={totalPrompts} />
        <Metric icon={Star} label="Itens salvos" value={savedItems.length} />
        <Metric icon={ClockIcon} label="Tempo de uso" value="18h" />
      </div>

      <section className="feature-grid">
        {cards.map(({ icon: Icon, title, text, action, page }) => (
          <button className="feature-card glass" key={title} onClick={() => onNavigate(page)}>
            <Icon size={22} />
            <strong>{title}</strong>
            <span>{text}</span>
            <em>{action}</em>
          </button>
        ))}
      </section>
    </div>
  );
}

function ClockIcon(props) {
  return <Calendar {...props} />;
}

function ChatWorkspace({ chat, activeConversation, onSave, onExport }) {
  const [text, setText] = useState('');
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const send = () => {
    if (!text.trim()) return;
    chat.sendMessage(text);
    setText('');
  };

  return (
    <div className="chat-layout">
      <section className="chat-main glass">
        <div className="chat-header">
          <div>
            <h2>{activeConversation?.title || 'Nova conversa'}</h2>
            <p>Converse com a Nexaro IA, envie PDFs e salve respostas importantes.</p>
          </div>
          <div className="inline-actions">
            <button className="small-button" onClick={onSave}><Star size={15} /> Salvar</button>
            <button className="small-button" onClick={onExport}><Download size={15} /> Exportar</button>
          </div>
        </div>

        <div className="message-list">
          {!chat.messages.length && (
            <EmptyState icon={Sparkles} title="Comece uma conversa" text="Pergunte sobre negocios, estudos, automacoes, codigo ou envie um PDF." />
          )}
          {chat.messages.map((msg) => (
            <div className={`message ${msg.role}`} key={msg.id}>
              <div className="message-avatar">{msg.role === 'user' ? 'U' : 'N'}</div>
              <div className="message-bubble">
                <span>{msg.role === 'user' ? 'Voce' : 'Nexaro'}</span>
                {msg.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown> : <div className="typing">Nexaro esta pensando...</div>}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {chat.pdfInfo && (
          <div className="pdf-strip">
            <FileText size={16} />
            <span>{chat.pdfInfo.filename} - {chat.pdfInfo.pages} paginas</span>
            <button onClick={chat.clearChat}><X size={14} /></button>
          </div>
        )}

        <div className="composer">
          <button onClick={() => fileRef.current?.click()} className="icon-button"><Paperclip size={18} /></button>
          <input ref={fileRef} type="file" accept=".pdf" hidden onChange={(event) => chat.handlePDFUpload(event.target.files?.[0])} />
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Pergunte qualquer coisa para a Nexaro..."
          />
          <button className={`icon-button ${chat.isListening ? 'danger' : ''}`} onClick={chat.isListening ? chat.stopListening : chat.startListening}>
            <Mic size={18} />
          </button>
          <button className="primary-button compact" onClick={send} disabled={chat.isLoading || !text.trim()}>
            Enviar
          </button>
        </div>
      </section>

      <aside className="context-panel glass">
        <h3>Contexto seguro</h3>
        <div className="security-list">
          <span><ShieldCheck size={16} /> Criptografia em transito</span>
          <span><Lock size={16} /> Dados privados por padrao</span>
          <span><Database size={16} /> Historico organizado localmente</span>
        </div>
        <h3>Prompts rapidos</h3>
        {['Crie um plano de estudos', 'Resuma este conteudo', 'Analise este codigo', 'Monte uma estrategia de vendas'].map((prompt) => (
          <button className="prompt-chip" key={prompt} onClick={() => setText(prompt)}>{prompt}</button>
        ))}
      </aside>
    </div>
  );
}

function HistoryPage({ conversations, search, filter, onSearch, onFilter, onRename, onDelete, onDuplicate, onToggleFavorite, onTogglePin, onOpen }) {
  const filtered = conversations.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.messages.some((msg) => msg.content.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || groupConversation(item.date) === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <section className="stack-page">
      <SectionHeader
        title="Historico de conversas"
        subtitle="Pesquise, filtre, renomeie, fixe, favorite, duplique ou exclua conversas."
        action={<Pill>{filtered.length} conversas</Pill>}
      />
      <div className="toolbar glass">
        <label className="search-field">
          <Search size={17} />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Pesquisar por palavra-chave" />
        </label>
        <label className="select-field">
          <Filter size={16} />
          <select value={filter} onChange={(event) => onFilter(event.target.value)}>
            <option value="all">Todos os periodos</option>
            <option value="Hoje">Hoje</option>
            <option value="Ontem">Ontem</option>
            <option value="Ultimos 7 dias">Ultimos 7 dias</option>
            <option value="Ultimos 30 dias">Ultimos 30 dias</option>
          </select>
        </label>
      </div>

      <div className="data-list">
        {filtered.map((item) => (
          <article className="data-row glass" key={item.id}>
            <button className="row-main" onClick={() => onOpen(item.id)}>
              <MessageSquare size={18} />
              <div>
                <input value={item.title} onClick={(event) => event.stopPropagation()} onChange={(event) => onRename(item.id, event.target.value)} />
                <span>{groupConversation(item.date)} - {item.messages.length} mensagens</span>
              </div>
            </button>
            <div className="row-menu">
              <button onClick={() => onTogglePin(item.id)} title="Fixar"><Archive size={16} fill={item.pinned ? 'currentColor' : 'none'} /></button>
              <button onClick={() => onToggleFavorite(item.id)} title="Favoritar"><Star size={16} fill={item.favorite ? 'currentColor' : 'none'} /></button>
              <button onClick={() => onDuplicate(item.id)} title="Duplicar"><Copy size={16} /></button>
              <button onClick={() => onDelete(item.id)} title="Excluir"><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SavedPage({ savedItems, setSavedItems }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const categories = ['Todos', 'Prompts', 'Automacoes', 'Programacao', 'Negocios', 'Estudos'];
  const filtered = savedItems.filter((item) => {
    const text = `${item.title} ${item.content} ${item.category}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === 'Todos' || item.category === category);
  });

  return (
    <section className="stack-page">
      <SectionHeader title="Mensagens salvas" subtitle="Prompts, respostas e colecoes importantes sempre a mao." />
      <div className="toolbar glass">
        <label className="search-field">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar favoritos" />
        </label>
        <button className="primary-button" onClick={() => setSavedItems((items) => [{ id: `save-${Date.now()}`, type: 'Prompt', category: 'Prompts', title: 'Novo prompt', content: 'Escreva seu prompt favorito aqui.' }, ...items])}>
          <Plus size={17} /> Nova colecao
        </button>
      </div>
      <div className="category-tabs">
        {categories.map((item) => (
          <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>
      <div className="saved-grid">
        {filtered.map((item) => (
          <article className="saved-card glass" key={item.id}>
            <div>
              <Pill>{item.category}</Pill>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </div>
            <div className="inline-actions">
              <button className="small-button"><Copy size={14} /> Copiar</button>
              <button className="small-button" onClick={() => setSavedItems((items) => items.filter((saved) => saved.id !== item.id))}><Trash2 size={14} /> Excluir</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SettingsPage({ theme, setTheme, settings, setSettings, profile, setProfile, onClear, onExport, onImport }) {
  const fileRef = useRef(null);
  const importRef = useRef(null);

  const handlePhoto = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfile({ ...profile, photo: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <section className="settings-grid">
      <SettingsPanel title="Aparencia" icon={Sparkles}>
        <div className="segmented">
          <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}><Moon size={16} /> Escuro</button>
          <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}><Sun size={16} /> Claro</button>
        </div>
        <p className="muted">Alternancia instantanea entre fundo azul escuro tecnologico e tema claro profissional.</p>
      </SettingsPanel>

      <SettingsPanel title="Preferencias" icon={Globe2}>
        <label className="form-row">
          <span>Idioma</span>
          <select value={settings.language} onChange={(event) => setSettings({ ...settings, language: event.target.value })}>
            <option value="pt-BR">Portugues</option>
            <option value="en-US">English</option>
            <option value="es-ES">Espanol</option>
          </select>
        </label>
        <Toggle label="Notificacoes" checked={settings.notifications} onChange={(checked) => setSettings({ ...settings, notifications: checked })} />
        <Toggle label="Alertas de seguranca" checked={settings.securityAlerts} onChange={(checked) => setSettings({ ...settings, securityAlerts: checked })} />
        <Toggle label="Novidades do produto" checked={settings.productUpdates} onChange={(checked) => setSettings({ ...settings, productUpdates: checked })} />
      </SettingsPanel>

      <SettingsPanel title="Conta" icon={User}>
        <label className="form-row">
          <span>Nome de exibicao</span>
          <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
        </label>
        <label className="form-row">
          <span>E-mail</span>
          <input value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
        </label>
        <input ref={fileRef} hidden type="file" accept="image/*" onChange={(event) => handlePhoto(event.target.files?.[0])} />
        <button className="secondary-button" onClick={() => fileRef.current?.click()}><Image size={17} /> Alterar foto</button>
        <button className="secondary-button"><User size={17} /> Gerenciar conta</button>
        <button className="danger-button"><Trash2 size={17} /> Excluir conta</button>
      </SettingsPanel>

      <SettingsPanel title="Dados" icon={Database}>
        <button className="secondary-button" onClick={onClear}><Trash2 size={17} /> Limpar historico</button>
        <button className="secondary-button" onClick={onExport}><Download size={17} /> Exportar conversas</button>
        <input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => onImport(event.target.files?.[0])} />
        <button className="secondary-button" onClick={() => importRef.current?.click()}><Upload size={17} /> Importar conversas</button>
      </SettingsPanel>
    </section>
  );
}

function SettingsPanel({ title, icon: Icon, children }) {
  return (
    <article className="settings-panel glass">
      <h3><Icon size={18} /> {title}</h3>
      {children}
    </article>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} type="button">
        <span />
      </button>
    </label>
  );
}

function ProfilePage({ profile, conversations, totalPrompts }) {
  return (
    <section className="profile-page">
      <div className="profile-hero glass">
        <Avatar profile={profile} />
        <div>
          <Pill>Plano {profile.plan}</Pill>
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
        </div>
      </div>
      <div className="metrics-grid">
        <Metric icon={Calendar} label="Cadastro" value={profile.createdAt} />
        <Metric icon={MessageSquare} label="Conversas" value={conversations.length} />
        <Metric icon={Sparkles} label="Prompts enviados" value={totalPrompts} />
        <Metric icon={ClockIcon} label="Tempo de uso" value="18h" />
      </div>
      <div className="profile-details glass">
        <h3>Resumo da conta</h3>
        <p>Perfil profissional com personalizacao, plano atual, uso da plataforma e controle de dados.</p>
      </div>
    </section>
  );
}

function SecurityPage() {
  const sessions = [
    { device: 'Windows - Chrome', location: 'Sao Paulo, BR', status: 'Atual' },
    { device: 'Android - Chrome', location: 'Sao Paulo, BR', status: 'Ativa' },
    { device: 'MacBook - Safari', location: 'Rio de Janeiro, BR', status: 'Encerrada' },
  ];
  const logins = [
    'Login aprovado com 2FA',
    'Senha alterada',
    'Novo dispositivo conectado',
    'Exportacao de conversas realizada',
  ];

  return (
    <section className="stack-page">
      <SectionHeader title="Seguranca" subtitle="Login seguro, recuperacao de senha, 2FA, sessoes e dispositivos conectados." />
      <div className="security-grid">
        {[
          { icon: Lock, title: 'Login seguro', text: 'Protecao por senha forte e validacao de sessao.' },
          { icon: KeyRound, title: 'Recuperacao de senha', text: 'Fluxo de redefinicao protegido por e-mail.' },
          { icon: Fingerprint, title: 'Autenticacao 2FA', text: 'Codigo temporario para proteger acessos sensiveis.' },
          { icon: Database, title: 'Criptografia de dados', text: 'Dados protegidos em transito e preparados para criptografia em repouso.' },
        ].map(({ icon: Icon, title, text }) => (
          <article className="security-card glass" key={title}>
            <Icon size={22} />
            <strong>{title}</strong>
            <p>{text}</p>
            <Toggle label="Ativo" checked onChange={() => {}} />
          </article>
        ))}
      </div>
      <div className="two-column">
        <article className="glass panel-list">
          <h3><Laptop size={18} /> Sessoes ativas</h3>
          {sessions.map((session) => (
            <div className="panel-row" key={`${session.device}-${session.status}`}>
              <div>
                <strong>{session.device}</strong>
                <span>{session.location}</span>
              </div>
              <Pill tone={session.status === 'Atual' ? 'green' : 'blue'}>{session.status}</Pill>
            </div>
          ))}
        </article>
        <article className="glass panel-list">
          <h3><History size={18} /> Historico de login</h3>
          {logins.map((item) => (
            <div className="panel-row" key={item}>
              <span>{item}</span>
              <small>Agora</small>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}

function TermsPage() {
  const sections = [
    ['Politica de Privacidade', 'A NEXARO IA trata informacoes com foco em transparencia, seguranca e controle pelo usuario.'],
    ['Termos de Uso', 'O uso da plataforma deve respeitar leis, direitos de terceiros e boas praticas profissionais.'],
    ['Politica de Cookies', 'Cookies podem ser utilizados para sessao, preferencias e melhoria da experiencia.'],
    ['Seguranca de Dados', 'Aplicamos controles de acesso, monitoramento e boas praticas para reduzir riscos.'],
    ['Direitos do Usuario', 'O usuario pode solicitar acesso, correcao, exportacao ou exclusao de dados.'],
    ['Responsabilidades do Usuario', 'O usuario deve proteger credenciais e revisar conteudos gerados antes de uso critico.'],
    ['Limitacoes da Plataforma', 'Respostas de IA podem conter imprecisoes e nao substituem aconselhamento profissional.'],
    ['Contato para suporte', 'Entre em contato pelo canal oficial de suporte da Nexaro para duvidas e solicitacoes.'],
  ];

  return (
    <section className="terms-page glass">
      <Pill>Documento profissional</Pill>
      <h2>Termos, privacidade e seguranca da NEXARO IA</h2>
      <div className="terms-grid">
        {sections.map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <footer>NEXARO IA respeita a privacidade e a seguranca dos seus usuarios. Nenhum dado e compartilhado sem autorizacao.</footer>
    </section>
  );
}

export default App;
