import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Bell,
  Calendar,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
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
  Paperclip,
  Plus,
  Search,
  Settings,
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
import nexaroLogo from './assets/nexaro-logo.svg';
import { api, getAuthToken, setAuthToken, streamChat } from './utils/api';

const emptySettings = {
  theme: 'dark',
  language: 'pt-BR',
  notifications: true,
  security_alerts: true,
  product_updates: false,
};

function App() {
  const [token, setToken] = useState(getAuthToken());
  const [authMode, setAuthMode] = useState('login');
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(emptySettings);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyGroup, setHistoryGroup] = useState('');
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme || 'dark';
  }, [settings.theme]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    bootstrap();
  }, [token]);

  async function bootstrap() {
    setLoading(true);
    setError('');
    try {
      const me = await api.me();
      setUser(me.user);
      setSettings(me.settings);
      await Promise.all([loadConversations(), loadSaved(), loadDashboard(), loadSessions()]);
    } catch (err) {
      setAuthToken('');
      setToken('');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversations(params = {}) {
    const data = await api.listConversations(params);
    setConversations(data);
    return data;
  }

  async function loadConversation(id) {
    const data = await api.getConversation(id);
    setActiveConversation(data);
    return data;
  }

  async function loadSaved(params = {}) {
    const data = await api.listSaved(params);
    setSavedItems(data);
  }

  async function loadDashboard() {
    const data = await api.dashboard();
    setDashboard(data);
    setUser(data.user);
    setSettings(data.settings);
  }

  async function loadSessions() {
    const data = await api.listSessions();
    setSessions(data);
  }

  async function run(action, successMessage) {
    setError('');
    setNotice('');
    try {
      const result = await action();
      if (successMessage) setNotice(successMessage);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleAuth(payload) {
    const method = authMode === 'register' ? api.register : api.login;
    const data = await run(() => method(payload));
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setSettings(data.settings);
    setWelcome(true);
    setTimeout(() => setWelcome(false), 2600);
  }

  async function logout() {
    await api.logout().catch(() => {});
    setAuthToken('');
    setToken('');
    setUser(null);
    setConversations([]);
    setActiveConversation(null);
  }

  async function createConversation() {
    const created = await run(() => api.createConversation({ title: 'Nova conversa' }));
    setActiveConversation(created);
    await loadConversations();
    setPage('chat');
    return created;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    let conversation = activeConversation;
    if (!conversation) {
      conversation = await api.createConversation({ title: 'Nova conversa' });
      setActiveConversation(conversation);
    }
    const tempUser = { id: `temp-user-${Date.now()}`, role: 'user', content: text };
    const tempAssistant = { id: `temp-assistant-${Date.now()}`, role: 'assistant', content: '' };
    setActiveConversation((current) => ({ ...conversation, messages: [...(current?.messages || []), tempUser, tempAssistant] }));
    await streamChat(conversation.id, text, (event) => {
      if (event.token) {
        setActiveConversation((current) => ({
          ...current,
          messages: current.messages.map((msg) => (msg.id === tempAssistant.id ? { ...msg, content: msg.content + event.token } : msg)),
        }));
      }
      if (event.error) setError(event.error);
    });
    await loadConversation(conversation.id);
    await loadConversations();
    await loadDashboard();
  }

  const nav = [
    ['dashboard', 'Dashboard', Home],
    ['chat', 'Chat IA', MessageSquare],
    ['history', 'Historico', History],
    ['saved', 'Mensagens salvas', Star],
    ['settings', 'Configuracoes', Settings],
    ['profile', 'Perfil', User],
    ['security', 'Seguranca', ShieldCheck],
    ['terms', 'Termos', FileText],
  ];

  if (loading) return <LoadingScreen />;
  if (!token || !user) return <AuthScreen mode={authMode} setMode={setAuthMode} onSubmit={handleAuth} error={error} setError={setError} />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><img src={nexaroLogo} alt="NEXARO IA" /></div>
          <div><strong>NEXARO IA</strong><span>Workspace seguro</span></div>
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <button className="new-chat" onClick={createConversation}><Plus size={18} /> Nova conversa</button>
        <nav className="main-nav">
          {nav.map(([id, label, Icon]) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); setSidebarOpen(false); }}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <SidebarHistory conversations={conversations} activeId={activeConversation?.id} onOpen={async (id) => { await loadConversation(id); setPage('chat'); setSidebarOpen(false); }} />
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => run(async () => {
            const next = settings.theme === 'dark' ? 'light' : 'dark';
            const updated = await api.updateSettings({ theme: next });
            setSettings(updated);
          })}>{settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} {settings.theme === 'dark' ? 'Escuro' : 'Claro'}</button>
          <div className="mini-profile"><Avatar user={user} /><div><strong>{user.name}</strong><span>{user.email}</span></div></div>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div><span className="eyebrow">NEXARO IA</span><h1>{nav.find(([id]) => id === page)?.[1]}</h1></div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => setPage('settings')}><Settings size={18} /></button>
            <button className="icon-button" onClick={() => settings.notifications && setNotice('Nao ha novas notificacoes.')}><Bell size={18} /></button>
            <button className="icon-button" onClick={logout}><LogOut size={18} /></button>
            <Avatar user={user} />
          </div>
        </header>
        {(error || notice) && <Toast type={error ? 'error' : 'success'} text={error || notice} onClose={() => { setError(''); setNotice(''); }} />}
        {welcome && <WelcomeOverlay name={user.name} />}
        <div className="page-scroll">
          {page === 'dashboard' && <DashboardPage dashboard={dashboard} user={user} savedCount={savedItems.length} onNew={createConversation} />}
          {page === 'chat' && <ChatPage conversation={activeConversation} onSend={sendMessage} onUpload={async (file) => {
            const conversation = activeConversation || await createConversation();
            const id = conversation?.id;
            if (id) await run(() => api.uploadPDF(id, file), 'PDF anexado com sucesso.');
            if (id) await loadConversation(id);
          }} onSave={async (message) => {
            await run(() => api.createSaved({ title: message.content.slice(0, 80), category: 'Geral', content: message.content, message_id: message.id }), 'Mensagem salva.');
            await loadSaved();
          }} />}
          {page === 'history' && <HistoryPage conversations={conversations} query={historyQuery} group={historyGroup} setQuery={setHistoryQuery} setGroup={setHistoryGroup} refresh={async () => loadConversations({ q: historyQuery, date_group: historyGroup })} onOpen={async (id) => { await loadConversation(id); setPage('chat'); }} onUpdate={async (id, patch) => { await run(() => api.updateConversation(id, patch)); await loadConversations(); }} onDelete={async (id) => { await run(() => api.deleteConversation(id), 'Conversa excluida.'); if (activeConversation?.id === id) setActiveConversation(null); await loadConversations(); }} onDuplicate={async (id) => { await run(() => api.duplicateConversation(id), 'Conversa duplicada.'); await loadConversations(); }} />}
          {page === 'saved' && <SavedPage items={savedItems} reload={loadSaved} onDelete={async (id) => { await run(() => api.deleteSaved(id), 'Item removido.'); await loadSaved(); }} />}
          {page === 'settings' && <SettingsPage settings={settings} user={user} setUser={setUser} setSettings={setSettings} run={run} reload={bootstrap} logout={logout} />}
          {page === 'profile' && <ProfilePage user={user} dashboard={dashboard} />}
          {page === 'security' && <SecurityPage sessions={sessions} reload={loadSessions} />}
          {page === 'terms' && <TermsPage />}
        </div>
      </main>
    </div>
  );
}

function AuthScreen({ mode, setMode, onSubmit, error, setError }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const isReset = mode === 'reset';

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (isReset) {
      if (!resetToken) {
        const data = await api.forgotPassword(resetEmail);
        setResetToken(data.reset_token || '');
        setError(data.reset_token ? 'Token gerado para ambiente local. Defina a nova senha.' : 'Se o e-mail existir, enviaremos instrucoes.');
      } else {
        await api.resetPassword({ token: resetToken, password: newPassword });
        setMode('login');
      }
      return;
    }
    await onSubmit(form);
  }

  return (
    <main className="auth-page">
      <form className="auth-card glass" onSubmit={submit}>
        <div className="brand auth-brand"><div className="brand-mark"><img src={nexaroLogo} alt="NEXARO IA" /></div><div><strong>NEXARO IA</strong><span>Acesso seguro</span></div></div>
        <h1>{mode === 'register' ? 'Criar conta' : isReset ? 'Recuperar senha' : 'Entrar'}</h1>
        {mode === 'register' && <label>Nome<input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
        {isReset ? (
          <>
            <label>E-mail<input required type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} /></label>
            {resetToken && <label>Nova senha<input required minLength={8} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>}
          </>
        ) : (
          <>
            <label>E-mail<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Senha<div className="password-field"><input required minLength={mode === 'register' ? 8 : 1} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          </>
        )}
        {error && <p className="auth-error">{error}</p>}
        <button className="primary-button">{isReset && !resetToken ? 'Enviar instrucao' : isReset ? 'Alterar senha' : mode === 'register' ? 'Cadastrar' : 'Entrar'}</button>
        <div className="auth-links">
          <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Ja tenho conta' : 'Criar conta'}</button>
          <button type="button" onClick={() => setMode('reset')}>Recuperar senha</button>
        </div>
      </form>
    </main>
  );
}

function DashboardPage({ dashboard, user, savedCount, onNew }) {
  const stats = dashboard?.user?.stats || user?.stats || {};
  return (
    <section className="dashboard">
      <div className="hero-panel glass">
        <div><span className="pill">Produto operacional</span><h2>Ambiente real da NEXARO IA</h2><p>Seus dados, historico, configuracoes e mensagens salvas sao carregados do backend autenticado.</p><div className="hero-actions"><button className="primary-button" onClick={onNew}><Plus size={18} /> Nova conversa</button></div></div>
        <div className="hero-status"><div><span>Ultimo acesso</span><strong>{formatDate(user.last_access_at)}</strong></div><div><span>Sessoes ativas</span><strong>{dashboard?.active_sessions ?? 0}</strong></div><div><span>Itens salvos</span><strong>{savedCount}</strong></div></div>
      </div>
      <div className="metrics-grid"><Metric icon={MessageSquare} label="Conversas" value={stats.total_conversations ?? 0} /><Metric icon={FileText} label="Mensagens" value={stats.total_messages ?? 0} /><Metric icon={Sparkles} label="Prompts" value={stats.total_prompts ?? 0} /><Metric icon={Star} label="Salvos" value={savedCount} /></div>
    </section>
  );
}

function ChatPage({ conversation, onSend, onUpload, onSave }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);
  const messages = conversation?.messages || [];
  async function submit() {
    if (!text.trim() || sending) return;
    setSending(true);
    await onSend(text).finally(() => setSending(false));
    setText('');
  }
  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onresult = (event) => setText(event.results[0][0].transcript);
    recognition.start();
  }
  return (
    <div className="chat-layout single">
      <section className="chat-main glass">
        <div className="chat-header"><div><h2>{conversation?.title || 'Conversa'}</h2><p>{conversation ? 'Historico real carregado do banco de dados.' : 'Crie uma conversa para iniciar.'}</p></div></div>
        <div className="message-list">
          {!messages.length && <EmptyState icon={MessageSquare} title="Nenhuma mensagem" text="Envie a primeira mensagem para criar historico real." />}
          {messages.map((msg) => <div className={`message ${msg.role}`} key={msg.id}><div className="message-avatar">{msg.role === 'user' ? 'U' : 'N'}</div><div className="message-bubble"><span>{msg.role === 'user' ? 'Voce' : 'Nexaro'}</span><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>{msg.role === 'assistant' && msg.id && !msg.id.startsWith?.('temp') && <button className="small-button" onClick={() => onSave(msg)}><Star size={14} /> Salvar</button>}</div></div>)}
        </div>
        {conversation?.pdf_filename && <div className="pdf-strip"><FileText size={16} /><span>{conversation.pdf_filename} - {conversation.pdf_pages} paginas</span></div>}
        <div className="composer"><button className="icon-button" onClick={() => fileRef.current?.click()}><Paperclip size={18} /></button><input hidden ref={fileRef} type="file" accept=".pdf" onChange={(e) => onUpload(e.target.files?.[0])} /><textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} aria-label="Mensagem" /><button className="icon-button" onClick={startVoice}><Mic size={18} /></button><button disabled={sending || !text.trim()} className="primary-button compact" onClick={submit}>{sending ? 'Enviando' : 'Enviar'}</button></div>
      </section>
    </div>
  );
}

function HistoryPage({ conversations, query, group, setQuery, setGroup, refresh, onOpen, onUpdate, onDelete, onDuplicate }) {
  useEffect(() => { refresh().catch(() => {}); }, [query, group]);
  return <section className="stack-page"><SectionHeader title="Historico real" subtitle="Dados carregados do banco de dados do usuario autenticado." /><div className="toolbar glass"><label className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar conversas" /></label><label className="select-field"><Filter size={16} /><select value={group} onChange={(e) => setGroup(e.target.value)}><option value="">Todos</option><option>Hoje</option><option>Ontem</option><option>Ultimos 7 dias</option><option>Ultimos 30 dias</option></select></label></div><div className="data-list">{!conversations.length && <EmptyState icon={History} title="Sem conversas" text="O historico sera preenchido automaticamente ao usar o chat." />}{conversations.map((item) => <article className="data-row glass" key={item.id}><button className="row-main" onClick={() => onOpen(item.id)}><MessageSquare size={18} /><div><input value={item.title} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdate(item.id, { title: e.target.value })} /><span>{formatDate(item.updated_at)} - {item.message_count} mensagens</span></div></button><div className="row-menu"><button onClick={() => onUpdate(item.id, { pinned: !item.pinned })}><Archive size={16} fill={item.pinned ? 'currentColor' : 'none'} /></button><button onClick={() => onUpdate(item.id, { favorite: !item.favorite })}><Star size={16} fill={item.favorite ? 'currentColor' : 'none'} /></button><button onClick={() => onDuplicate(item.id)}><Copy size={16} /></button><button onClick={() => onDelete(item.id)}><Trash2 size={16} /></button></div></article>)}</div></section>;
}

function SavedPage({ items, reload, onDelete }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  useEffect(() => { reload({ q, category }).catch(() => {}); }, [q, category]);
  const categories = useMemo(() => [...new Set(items.map((item) => item.category))], [items]);
  return <section className="stack-page"><SectionHeader title="Mensagens salvas" subtitle="Somente mensagens salvas por voce aparecem aqui." /><div className="toolbar glass"><label className="search-field"><Search size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar salvos" /></label><label className="select-field"><Filter size={16} /><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Todas</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="saved-grid">{!items.length && <EmptyState icon={Star} title="Nada salvo" text="Salve respostas reais do chat para criar sua biblioteca." />}{items.map((item) => <article className="saved-card glass" key={item.id}><div><span className="pill">{item.category}</span><h3>{item.title}</h3><p>{item.content}</p></div><button className="small-button" onClick={() => onDelete(item.id)}><Trash2 size={14} /> Remover</button></article>)}</div></section>;
}

function SettingsPage({ settings, user, setUser, setSettings, run, reload, logout }) {
  const [profile, setProfile] = useState({ name: user.name, avatar_url: user.avatar_url || '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const importRef = useRef(null);
  async function importFile(file) {
    if (!file) return;
    const data = JSON.parse(await file.text());
    await api.importConversations(Array.isArray(data) ? data : []);
    await reload();
  }
  async function updateSettings(patch) {
    const updated = await api.updateSettings(patch);
    setSettings(updated);
  }
  return <section className="settings-grid"><Panel title="Aparencia" icon={Settings}><div className="segmented"><button className={settings.theme === 'dark' ? 'active' : ''} onClick={() => run(() => updateSettings({ theme: 'dark' }))}><Moon size={16} /> Escuro</button><button className={settings.theme === 'light' ? 'active' : ''} onClick={() => run(() => updateSettings({ theme: 'light' }))}><Sun size={16} /> Claro</button></div><label className="form-row"><span>Idioma</span><select value={settings.language} onChange={(e) => run(() => updateSettings({ language: e.target.value }))}><option value="pt-BR">Portugues</option><option value="en-US">English</option><option value="es-ES">Espanol</option></select></label><Toggle label="Notificacoes" checked={settings.notifications} onChange={(v) => run(() => updateSettings({ notifications: v }))} /></Panel><Panel title="Conta" icon={User}><label className="form-row"><span>Nome</span><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label><label className="form-row"><span>Foto URL/base64</span><input value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} /></label><button className="secondary-button" onClick={() => run(async () => { const updated = await api.updateMe(profile); setUser(updated); }, 'Perfil atualizado.')}><Image size={17} /> Salvar perfil</button></Panel><Panel title="Senha" icon={KeyRound}><input aria-label="Senha atual" type="password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} /><input aria-label="Nova senha" type="password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} /><button className="secondary-button" onClick={() => run(() => api.changePassword(passwords), 'Senha alterada.')}><Lock size={17} /> Alterar senha</button></Panel><Panel title="Dados" icon={Download}><button className="secondary-button" onClick={() => run(async () => { const data = await api.exportConversations(); downloadJson('nexaro-conversas.json', data); })}><Download size={17} /> Exportar conversas</button><input hidden ref={importRef} type="file" accept="application/json" onChange={(e) => run(() => importFile(e.target.files?.[0]), 'Conversas importadas.')} /><button className="secondary-button" onClick={() => importRef.current?.click()}><Upload size={17} /> Selecionar arquivo</button><button className="danger-button" onClick={() => run(async () => { await api.deleteAccount(); await logout(); }, 'Conta excluida.')}><Trash2 size={17} /> Excluir conta</button></Panel></section>;
}

function ProfilePage({ user, dashboard }) {
  const stats = dashboard?.user?.stats || user.stats || {};
  return <section className="profile-page"><div className="profile-hero glass"><Avatar user={user} /><div><span className="pill">Plano {user.plan}</span><h2>{user.name}</h2><p>{user.email}</p></div></div><div className="metrics-grid"><Metric icon={Calendar} label="Cadastro" value={formatDate(user.created_at)} /><Metric icon={MessageSquare} label="Conversas" value={stats.total_conversations ?? 0} /><Metric icon={FileText} label="Mensagens" value={stats.total_messages ?? 0} /><Metric icon={Sparkles} label="Prompts" value={stats.total_prompts ?? 0} /></div></section>;
}

function SecurityPage({ sessions }) {
  return <section className="stack-page"><SectionHeader title="Seguranca" subtitle="Sessoes persistentes reais registradas no backend." /><div className="two-column"><article className="glass panel-list"><h3><Laptop size={18} /> Sessoes</h3>{!sessions.length && <EmptyState icon={Laptop} title="Sem sessoes" text="As sessoes aparecem apos login." />}{sessions.map((s) => <div className="panel-row" key={s.id}><div><strong>{s.user_agent || 'Dispositivo nao identificado'}</strong><span>{s.ip_address || 'IP indisponivel'}</span></div><span className="pill">{s.is_active ? 'Ativa' : 'Encerrada'}</span></div>)}</article><article className="glass panel-list"><h3><ShieldCheck size={18} /> Protecoes</h3><div className="panel-row"><span>Senhas com hash PBKDF2</span><Check size={18} /></div><div className="panel-row"><span>Tokens persistidos com hash</span><Check size={18} /></div><div className="panel-row"><span>Rotas protegidas por Bearer token</span><Check size={18} /></div></article></div></section>;
}

function TermsPage() {
  return <section className="terms-page glass"><span className="pill">Documento oficial</span><h2>Termos, privacidade e seguranca</h2><div className="terms-grid">{['Politica de Privacidade', 'Termos de Uso', 'Politica de Cookies', 'Seguranca de Dados', 'Direitos do Usuario', 'Responsabilidades do Usuario', 'Limitacoes da Plataforma', 'Contato para suporte'].map((title) => <article key={title}><h3>{title}</h3><p>Consulte este item nas politicas oficiais da NEXARO IA disponibilizadas ao usuario autenticado.</p></article>)}</div><footer>NEXARO IA respeita a privacidade e a seguranca dos seus usuarios. Nenhum dado e compartilhado sem autorizacao.</footer></section>;
}

function SidebarHistory({ conversations, activeId, onOpen }) {
  const grouped = conversations.reduce((acc, conv) => {
    const group = groupDate(conv.updated_at || conv.created_at);
    acc[group] = acc[group] || [];
    acc[group].push(conv);
    return acc;
  }, {});
  return <div className="history-sidebar">{['Hoje', 'Ontem', 'Ultimos 7 dias', 'Ultimos 30 dias'].map((group) => grouped[group]?.length ? <div className="history-group" key={group}><span>{group}</span>{grouped[group].map((conv) => <div className={`conversation-row ${activeId === conv.id ? 'active' : ''}`} key={conv.id}><button onClick={() => onOpen(conv.id)}><MessageSquare size={14} /><span>{conv.title}</span></button></div>)}</div> : null)}</div>;
}

function Avatar({ user }) { return <div className="avatar">{user.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : <span>{user.name?.slice(0, 1)?.toUpperCase()}</span>}</div>; }
function Metric({ icon: Icon, label, value }) { return <div className="metric-card"><div className="metric-icon"><Icon size={18} /></div><div><strong>{value}</strong><span>{label}</span></div></div>; }
function SectionHeader({ title, subtitle }) { return <div className="section-header"><div><h2>{title}</h2><p>{subtitle}</p></div></div>; }
function EmptyState({ icon: Icon, title, text }) { return <div className="empty-state"><Icon size={26} /><strong>{title}</strong><span>{text}</span></div>; }
function Panel({ title, icon: Icon, children }) { return <article className="settings-panel glass"><h3><Icon size={18} /> {title}</h3>{children}</article>; }
function Toggle({ label, checked, onChange }) { return <label className="toggle-row"><span>{label}</span><button type="button" className={`switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><span /></button></label>; }
function Toast({ type, text, onClose }) { return <div className={`toast ${type}`}><span>{text}</span><button onClick={onClose}><X size={16} /></button></div>; }
function WelcomeOverlay({ name }) { return <div className="welcome-overlay"><div className="welcome-card glass"><div className="welcome-orbit"><img src={nexaroLogo} alt="NEXARO IA" /></div><span>Bem-vindo</span><strong>{name}</strong><p>Sua plataforma NEXARO IA esta pronta.</p></div></div>; }
function LoadingScreen() { return <div className="auth-page"><div className="empty-state glass"><Sparkles size={28} /><strong>Carregando NEXARO IA</strong><span>Validando sessao segura.</span></div></div>; }
function formatDate(value) { return value ? new Date(value).toLocaleString('pt-BR') : 'Sem registro'; }
function groupDate(value) { const date = value ? new Date(value) : new Date(); const today = new Date(); const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()); const compare = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const diff = Math.floor((start - compare) / 86400000); if (diff <= 0) return 'Hoje'; if (diff === 1) return 'Ontem'; if (diff <= 7) return 'Ultimos 7 dias'; return 'Ultimos 30 dias'; }
function downloadJson(filename, data) { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }

export default App;
