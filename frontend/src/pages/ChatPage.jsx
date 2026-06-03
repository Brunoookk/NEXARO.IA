import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, Mic, MicOff, Paperclip, Volume2, VolumeX, Copy, Check, Bot, X, FileText } from 'lucide-react';

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');
  return (
    <div style={{ borderRadius: 'var(--r-sm)', overflow: 'hidden', marginBlock: '10px', border: '1px solid var(--border-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a12', padding: '8px 14px' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text-3)' }}>{language || 'code'}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: copied ? 'var(--green)' : 'var(--text-3)', fontSize: '11px', transition: 'color 0.2s' }}>
          {copied ? <Check size={11} /> : <Copy size={11} />}{copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <SyntaxHighlighter language={language} style={oneDark}
        customStyle={{ margin: 0, background: '#0a0a12', fontSize: '12px', padding: '14px', lineHeight: 1.7 }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

const mdComponents = {
  code({ inline, className, children }) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? <CodeBlock language={match[1]}>{children}</CodeBlock>
      : <code style={{ fontFamily: 'var(--mono)', fontSize: '12px', background: 'rgba(130,80,255,0.15)', padding: '2px 6px', borderRadius: '4px', color: 'var(--purple-light)' }}>{children}</code>;
  },
  p: ({ children }) => <p style={{ marginBottom: '8px', lineHeight: 1.75 }}>{children}</p>,
  ul: ({ children }) => <ul style={{ paddingLeft: '18px', marginBottom: '8px' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '18px', marginBottom: '8px' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '3px', lineHeight: 1.7 }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--text-1)' }}>{children}</strong>,
  h1: ({ children }) => <h1 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px', letterSpacing: '-0.02em' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>{children}</h3>,
  blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid var(--purple)', paddingLeft: '14px', color: 'var(--text-2)', marginBlock: '10px', fontStyle: 'italic' }}>{children}</blockquote>,
};

function Message({ msg, onSpeak, isSpeaking }) {
  const isUser = msg.role === 'user';
  if (msg.role === 'system') return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
      <div style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,229,160,0.2)', color: 'var(--green)', padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FileText size={12} /> {msg.content.replace(/\*\*/g, '')}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-end', animation: 'fadeUp 0.3s ease' }}>
      {!isUser && (
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #8250ff, #a67fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(130,80,255,0.3)' }}>
          <Bot size={15} color="#fff" />
        </div>
      )}
      <div style={{ maxWidth: '78%' }}>
        {!isUser && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.05em' }}>Nexaro</div>}
        <div style={{
          padding: '12px 16px',
          background: isUser ? 'var(--purple)' : 'var(--bg-3)',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          border: isUser ? 'none' : '1px solid var(--border-2)',
          fontSize: '14px', lineHeight: 1.75,
          boxShadow: isUser ? '0 4px 20px rgba(130,80,255,0.3)' : '0 2px 12px rgba(0,0,0,0.3)',
          position: 'relative',
        }}>
          {msg.content === '' ? (
            <div style={{ display: 'flex', gap: '4px', padding: '2px 0' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--purple-light)', animation: 'pulse 1.2s ease infinite', animationDelay: `${i*0.2}s` }} />)}
            </div>
          ) : isUser ? (
            <span>{msg.content}</span>
          ) : (
            <div style={{ paddingBottom: msg.content && !msg.error ? '18px' : '0' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{msg.content}</ReactMarkdown>
            </div>
          )}
          {!isUser && msg.content && !msg.error && (
            <button onClick={() => onSpeak(msg.content)}
              style={{ position: 'absolute', bottom: '6px', right: '8px', color: isSpeaking ? 'var(--purple-light)' : 'var(--text-4)', transition: 'color 0.2s', padding: '2px' }}>
              {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage({ chat }) {
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat.messages]);

  const handleSend = () => {
    if (!text.trim() || chat.isLoading) return;
    chat.sendMessage(text.trim()); setText('');
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleFile = (f) => { if (f?.type === 'application/pdf') chat.handlePDFUpload(f); };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {chat.messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '40px 20px', animation: 'fadeUp 0.5s ease' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#8250ff,#a67fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(130,80,255,0.4)', animation: 'glow 3s ease infinite' }}>
              <Bot size={28} color="#fff" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>Como posso ajudar?</h2>
              <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Envie uma mensagem, PDF ou use sua voz</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '360px' }}>
              {['Explique machine learning', 'Crie um script Python', 'Resuma este PDF', 'Me ajude a estudar'].map(s => (
                <button key={s} onClick={() => chat.sendMessage(s)}
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-md)', padding: '10px 12px', color: 'var(--text-2)', fontSize: '12px', textAlign: 'left', lineHeight: 1.4, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-purple)'; e.currentTarget.style.color = 'var(--text-1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {chat.messages.map(msg => <Message key={msg.id} msg={msg} onSpeak={chat.isSpeaking ? chat.stopSpeaking : chat.speakMessage} isSpeaking={chat.isSpeaking} />)}
        <div ref={bottomRef} />
      </div>

      {/* PDF badge */}
      {chat.pdfInfo && (
        <div style={{ margin: '0 16px 8px', padding: '8px 12px', background: 'var(--green-dim)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={14} color="var(--green)" />
          <span style={{ fontSize: '12px', color: 'var(--green)', flex: 1, fontFamily: 'var(--mono)' }}>{chat.pdfInfo.filename} · {chat.pdfInfo.pages}p</span>
          <button onClick={() => chat.clearChat()} style={{ color: 'var(--text-3)' }}><X size={14} /></button>
        </div>
      )}

      {/* Input */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        style={{ padding: '8px 16px 20px', borderTop: `1px solid ${dragging ? 'var(--purple)' : 'var(--border-1)'}`, transition: 'border-color 0.2s' }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', background: 'var(--bg-3)', border: `1px solid ${dragging ? 'var(--border-purple)' : 'var(--border-2)'}`, borderRadius: 'var(--r-xl)', padding: '10px 12px', transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          <button onClick={() => fileRef.current?.click()} style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexShrink: 0, borderRadius: 'var(--r-sm)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
            <Paperclip size={18} />
          </button>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
          <textarea ref={textRef} value={text}
            onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            onKeyDown={handleKey}
            placeholder={chat.isListening ? '🎙️ Ouvindo...' : 'Digite sua mensagem...'}
            rows={1}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: chat.isListening ? 'var(--purple-light)' : 'var(--text-1)', fontSize: '14px', lineHeight: '1.6', resize: 'none', padding: '6px 0', maxHeight: '120px', overflowY: 'auto' }}
          />
          <button onClick={chat.isListening ? chat.stopListening : chat.startListening}
            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: chat.isListening ? 'var(--red)' : 'var(--text-3)', flexShrink: 0, background: chat.isListening ? 'rgba(255,87,87,0.1)' : 'none', borderRadius: 'var(--r-sm)', animation: chat.isListening ? 'pulse 1s ease infinite' : 'none', transition: 'all 0.2s' }}>
            {chat.isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button onClick={handleSend} disabled={!text.trim() || chat.isLoading}
            style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: text.trim() && !chat.isLoading ? 'var(--purple)' : 'var(--bg-5)', color: '#fff', transition: 'all 0.2s', boxShadow: text.trim() && !chat.isLoading ? '0 0 20px rgba(130,80,255,0.4)' : 'none' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
