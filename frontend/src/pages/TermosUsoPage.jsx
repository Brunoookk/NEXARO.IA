import React from 'react';
import { AlertCircle, FileText, Lock, Mail, Scale, ShieldCheck } from 'lucide-react';

const sections = [
  {
    icon: Scale,
    title: 'Aceitação dos termos',
    text: 'Ao usar a Nexaro, você concorda com estes termos. Se não concordar com alguma condição, interrompa o uso do aplicativo.',
  },
  {
    icon: FileText,
    title: 'Uso da plataforma',
    text: 'A Nexaro oferece ferramentas de estudo, chat, leitura de PDFs e organização de conteúdos. O usuário é responsável pelas informações que envia e pelo modo como utiliza as respostas.',
  },
  {
    icon: AlertCircle,
    title: 'Limitações das respostas',
    text: 'As respostas podem conter erros ou interpretações incompletas. Use o conteúdo como apoio aos estudos, não como única fonte de decisão acadêmica, profissional, médica, jurídica ou financeira.',
  },
  {
    icon: Lock,
    title: 'Arquivos e dados',
    text: 'PDFs e mensagens enviados podem ser processados para gerar respostas. Evite enviar documentos sigilosos, dados sensíveis ou informações de terceiros sem autorização.',
  },
  {
    icon: ShieldCheck,
    title: 'Conduta do usuário',
    text: 'Não utilize a plataforma para atividades ilegais, abusivas, ofensivas, envio de malware, violação de direitos autorais ou tentativa de explorar falhas do sistema.',
  },
  {
    icon: Mail,
    title: 'Contato',
    text: 'Para dúvidas sobre estes termos, suporte ou solicitações relacionadas ao aplicativo, entre em contato pelo email nexarodev1@gmail.com.',
  },
];

export default function TermosUsoPage() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ background: '#07101f', color: '#fff', borderRadius: '18px', padding: '22px', marginBottom: '16px', boxShadow: '0 18px 42px rgba(7,16,31,0.14)' }}>
          <div style={{ color: '#8db4ff', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Nexaro</div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', letterSpacing: 0 }}>Termos de Uso</h2>
          <p style={{ color: '#b7c7df', fontSize: '14px', lineHeight: 1.6 }}>Última atualização: 02/06/2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sections.map(({ icon: Icon, title, text }, i) => (
            <section key={title} style={{ display: 'flex', gap: '14px', padding: '16px', background: 'var(--bg-1)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-md)', animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--r-sm)', background: 'var(--purple-mid)', border: '1px solid var(--border-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={19} color="var(--purple)" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '5px' }}>{title}</h3>
                <p style={{ color: 'var(--text-2)', fontSize: '13px', lineHeight: 1.65 }}>{text}</p>
              </div>
            </section>
          ))}
        </div>

        <p style={{ color: 'var(--text-3)', fontSize: '12px', lineHeight: 1.6, marginTop: '16px' }}>
          Estes termos são uma versão inicial para orientar o uso do aplicativo. Para uso comercial amplo, recomenda-se revisão jurídica.
        </p>
      </div>
    </div>
  );
}
