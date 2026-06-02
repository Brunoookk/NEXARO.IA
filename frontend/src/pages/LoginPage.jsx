import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, LogIn, Mail, User } from 'lucide-react';
import nexaroLogo from '../assets/nexaro-logo.svg';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const content = useMemo(() => {
    if (mode === 'register') {
      return {
        eyebrow: 'Crie sua conta',
        title: 'Comece sua area de estudos',
        description: 'Cadastre-se para organizar PDFs, conversas e resumos em um ambiente simples.',
        button: 'Criar conta',
      };
    }

    if (mode === 'forgot') {
      return {
        eyebrow: 'Recuperar acesso',
        title: 'Redefina sua senha',
        description: 'Informe seu e-mail para receber as instrucoes de recuperacao da conta.',
        button: 'Enviar instrucoes',
      };
    }

    return {
      eyebrow: 'Bem-vindo de volta',
      title: 'Acesse sua area de estudos',
      description: 'Continue organizando seus PDFs, conversas e planos de aprendizado em um unico lugar.',
      button: 'Entrar',
    };
  }, [mode]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (mode === 'forgot') {
      setMessage('Enviamos as instrucoes de recuperacao para o e-mail informado.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setMessage('As senhas precisam ser iguais para criar a conta.');
        return;
      }

      setMessage('Conta criada com sucesso. Entrando no Nexaro...');
      window.setTimeout(() => onLogin({ name, email, password }), 450);
      return;
    }

    onLogin({ email, password });
  };

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Acesso Nexaro">
        <div className="login-brand">
          <img src={nexaroLogo} alt="Nexaro" />
          <div>
            <strong>Nexaro</strong>
            <span>Estudos inteligentes</span>
          </div>
        </div>

        <div className="login-copy">
          {mode !== 'login' && (
            <button className="login-back" type="button" onClick={() => changeMode('login')}>
              <ArrowLeft size={17} />
              Voltar ao login
            </button>
          )}
          <span>{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="login-field">
              <span>Nome</span>
              <div>
                <User size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  required
                />
              </div>
            </label>
          )}

          <label className="login-field">
            <span>E-mail</span>
            <div>
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          {mode !== 'forgot' && (
            <label className="login-field">
              <span>Senha</span>
              <div>
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}

          {mode === 'register' && (
            <label className="login-field">
              <span>Confirmar senha</span>
              <div>
                <Lock size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}

          {mode === 'login' && (
            <div className="login-options">
              <label>
                <input type="checkbox" />
                <span>Lembrar acesso</span>
              </label>
              <button type="button" onClick={() => changeMode('forgot')}>Esqueci minha senha</button>
            </div>
          )}

          {mode === 'register' && (
            <label className="login-terms">
              <input type="checkbox" required />
              <span>Aceito os termos de uso e a politica de privacidade.</span>
            </label>
          )}

          {message && (
            <div className={`login-message ${message.includes('precisam') ? 'error' : ''}`}>
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          )}

          <button className="login-submit" type="submit">
            <LogIn size={19} />
            {content.button}
          </button>
        </form>

        {mode === 'login' && (
          <p className="login-register">
            Novo por aqui? <button type="button" onClick={() => changeMode('register')}>Criar conta</button>
          </p>
        )}

        {mode === 'register' && (
          <p className="login-register">
            Ja tem conta? <button type="button" onClick={() => changeMode('login')}>Entrar</button>
          </p>
        )}

        {mode === 'forgot' && (
          <p className="login-register">
            Lembrou a senha? <button type="button" onClick={() => changeMode('login')}>Voltar para entrar</button>
          </p>
        )}
      </section>

      <aside className="login-aside" aria-hidden="true">
        <div className="login-aside-content">
          <span>Plano Free</span>
          <h2>Seu ambiente para estudar com mais clareza.</h2>
          <div className="login-stats">
            <div>
              <strong>PDFs</strong>
              <span>Analise materiais</span>
            </div>
            <div>
              <strong>Chat</strong>
              <span>Tire duvidas</span>
            </div>
            <div>
              <strong>Resumos</strong>
              <span>Revise melhor</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
