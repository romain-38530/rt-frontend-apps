/**
 * Page Assistant Routier IA - Portail Transporteur
 * Integration complete Chatbot API avec Claude IA (24 endpoints)
 *
 * Endpoints:
 * - POST /chatbot/conversations - Demarrer une conversation
 * - GET /chatbot/conversations - Lister les conversations
 * - GET /chatbot/conversations/:id - Obtenir une conversation
 * - POST /chatbot/conversations/:id/messages - Envoyer un message
 * - POST /chatbot/conversations/:id/close - Fermer une conversation
 * - POST /chatbot/conversations/:id/feedback - Soumettre un feedback
 * - POST /chatbot/conversations/:id/escalate - Escalader vers technicien
 * - POST /chatbot/conversations/:id/diagnostic - Lancer un diagnostic
 * - GET /chatbot/tickets - Lister les tickets
 * - GET /chatbot/tickets/:id - Obtenir un ticket
 * - GET /chatbot/knowledge - Rechercher base de connaissances
 * - GET /chatbot/faq - Lister les FAQs
 * - GET /chatbot/stats - Statistiques
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';

// Types
interface Message {
  messageId: string;
  type: 'user' | 'bot' | 'technician';
  content: string;
  timestamp: string;
  metadata?: {
    suggestions?: string[];
    articles?: any[];
    diagnostic?: any;
    requiresEscalation?: boolean;
    priority?: string;
  };
}

interface Conversation {
  conversationId: string;
  chatbotType: string;
  status: string;
  priority: string;
  category: string;
  module: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Ticket {
  ticketId: string;
  conversationId: string;
  priority: string;
  status: string;
  assignedTo?: string;
  slaDeadline?: string;
  createdAt: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  module: string;
}

interface KnowledgeArticle {
  articleId: string;
  title: string;
  summary: string;
  content: string;
  category: string;
}

export default function ChatbotPage() {
  const router = useRouter();
  // L'API Chatbot IA est dans le bundle subscriptions-contracts
  const apiUrl = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'http://rt-subscriptions-api-prod.eba-pwrpmmxu.eu-central-1.elasticbeanstalk.com';

  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'tickets' | 'knowledge' | 'faq'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper API call
  const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
    const token = getAuthToken();
    const url = `${apiUrl}/api${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erreur ${response.status}`);
    }

    return data;
  };

  // Demarrer une nouvelle conversation
  const startConversation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall('/chatbot/conversations', 'POST', {
        chatbotType: 'ROUTIER',
        userId: 'current-user',
        userName: 'Utilisateur',
        userEmail: 'user@example.com'
      });
      setCurrentConversation(result.data);
      setActiveTab('chat');
      setSuccess('Conversation demarree avec HelpBot IA');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer un message
  const sendMessage = async () => {
    if (!input.trim() || !currentConversation) return;

    const userMessage: Message = {
      messageId: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setCurrentConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null);

    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiCall(`/chatbot/conversations/${currentConversation.conversationId}/messages`, 'POST', {
        content: input
      });

      // Ajouter la reponse du bot
      if (result.data?.botResponse) {
        setCurrentConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, result.data.botResponse],
          priority: result.data.analysis?.priority || prev.priority,
          category: result.data.analysis?.category || prev.category
        } : null);
      }

      // Si escalade recommandee
      if (result.data?.analysis?.requiresEscalation || result.data?.escalation) {
        setSuccess('Votre demande a ete escaladee vers un technicien');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Escalader vers technicien
  const escalateConversation = async () => {
    if (!currentConversation) return;

    setIsLoading(true);
    setError(null);
    try {
      await apiCall(`/chatbot/conversations/${currentConversation.conversationId}/escalate`, 'POST', {
        reason: 'Demande utilisateur'
      });
      setSuccess('Conversation escaladee vers un technicien. Vous serez contacte sous peu.');
      loadConversations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Lancer un diagnostic
  const runDiagnostic = async (diagnosticType: string) => {
    if (!currentConversation) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall(`/chatbot/conversations/${currentConversation.conversationId}/diagnostic`, 'POST', {
        diagnosticType
      });

      // Ajouter le resultat du diagnostic comme message
      const diagMessage: Message = {
        messageId: Date.now().toString(),
        type: 'bot',
        content: `Diagnostic ${diagnosticType} termine:\n${JSON.stringify(result.data?.result || result.data, null, 2)}`,
        timestamp: new Date().toISOString(),
        metadata: { diagnostic: result.data }
      };

      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, diagMessage]
      } : null);

      setSuccess('Diagnostic termine');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fermer la conversation
  const closeConversation = async () => {
    if (!currentConversation) return;

    setIsLoading(true);
    try {
      await apiCall(`/chatbot/conversations/${currentConversation.conversationId}/close`, 'POST', {});
      setSuccess('Conversation fermee');
      setCurrentConversation(null);
      loadConversations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Soumettre un feedback
  const submitFeedback = async (rating: number) => {
    if (!currentConversation) return;

    try {
      await apiCall(`/chatbot/conversations/${currentConversation.conversationId}/feedback`, 'POST', {
        rating,
        comment: rating >= 4 ? 'Satisfait' : 'Peut mieux faire'
      });
      setSuccess('Merci pour votre feedback!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Charger les conversations
  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const result = await apiCall('/chatbot/conversations');
      setConversations(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les tickets
  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const result = await apiCall('/chatbot/tickets');
      setTickets(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les FAQs
  const loadFAQs = async () => {
    setIsLoading(true);
    try {
      const result = await apiCall('/chatbot/faq');
      setFaqs(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement FAQs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Rechercher dans la base de connaissances
  const searchKnowledge = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const result = await apiCall(`/chatbot/knowledge?q=${encodeURIComponent(searchQuery)}`);
      setKnowledgeArticles(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Reprendre une conversation
  const resumeConversation = async (conversationId: string) => {
    setIsLoading(true);
    try {
      const result = await apiCall(`/chatbot/conversations/${conversationId}`);
      setCurrentConversation(result.data);
      setActiveTab('chat');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  // Chargement initial
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadConversations();
    loadFAQs();
  }, [router]);

  // Helper pour couleur de priorite
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#ef4444';
      case 'IMPORTANT': return '#f59e0b';
      default: return '#10b981';
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#1e1b4b',
    fontFamily: 'system-ui, sans-serif',
    color: 'white'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#7c3aed' : 'rgba(255,255,255,0.1)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.1)'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'white'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  };

  return (
    <>
      <Head>
        <title>Assistant Routier IA - Transporteur | SYMPHONI.A</title>
      </Head>

      <div style={containerStyle}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '8px 16px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'white',
                fontWeight: '600'
              }}
            >
              Retour
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
              Assistant Routier IA - Aide Transport
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>
              Chat
            </button>
            <button style={tabStyle(activeTab === 'history')} onClick={() => { setActiveTab('history'); loadConversations(); }}>
              Historique
            </button>
            <button style={tabStyle(activeTab === 'tickets')} onClick={() => { setActiveTab('tickets'); loadTickets(); }}>
              Tickets
            </button>
            <button style={tabStyle(activeTab === 'faq')} onClick={() => { setActiveTab('faq'); loadFAQs(); }}>
              FAQ
            </button>
            <button style={tabStyle(activeTab === 'knowledge')} onClick={() => setActiveTab('knowledge')}>
              Base de connaissances
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ margin: '16px 24px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '8px' }}>
            Erreur: {error}
          </div>
        )}
        {success && (
          <div style={{ margin: '16px 24px', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', borderRadius: '8px' }}>
            {success}
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>

          {/* Tab: Chat */}
          {activeTab === 'chat' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
              {/* Zone de chat */}
              <div style={{ ...cardStyle, height: '600px', display: 'flex', flexDirection: 'column' }}>
                {!currentConversation ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '64px' }}>IA</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Assistant Routier IA</h2>
                    <p style={{ opacity: 0.7, textAlign: 'center', maxWidth: '400px' }}>
                      Assistant intelligent avec detection automatique de priorite, diagnostics et escalade vers techniciens.
                    </p>
                    <button onClick={startConversation} style={buttonStyle} disabled={isLoading}>
                      {isLoading ? 'Demarrage...' : 'Demarrer une conversation'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Header conversation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <div>
                        <div style={{ fontWeight: '700' }}>Conversation #{currentConversation.conversationId.slice(-6)}</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          Priorite: <span style={{ color: getPriorityColor(currentConversation.priority) }}>{currentConversation.priority || 'STANDARD'}</span>
                          {currentConversation.category && ` | ${currentConversation.category}`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={closeConversation} style={{ ...buttonStyle, backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px 12px', fontSize: '12px' }}>
                          Fermer
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                      {currentConversation.messages.map((msg, idx) => (
                        <div key={msg.messageId || idx} style={{
                          marginBottom: '12px',
                          display: 'flex',
                          justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                          <div style={{
                            maxWidth: '80%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            backgroundColor: msg.type === 'user' ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                            whiteSpace: 'pre-wrap'
                          }}>
                            <div>{msg.content}</div>
                            {msg.metadata?.suggestions && msg.metadata.suggestions.length > 0 && (
                              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {msg.metadata.suggestions.map((sug, i) => (
                                  <button key={i} onClick={() => setInput(sug)} style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(124, 58, 237, 0.3)',
                                    border: '1px solid rgba(124, 58, 237, 0.5)',
                                    borderRadius: '16px',
                                    color: 'white',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}>
                                    {sug}
                                  </button>
                                ))}
                              </div>
                            )}
                            <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>
                              {new Date(msg.timestamp).toLocaleTimeString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="Decrivez votre probleme..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <button onClick={sendMessage} style={buttonStyle} disabled={isLoading || !input.trim()}>
                        {isLoading ? '...' : 'Envoyer'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Panel lateral */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Actions rapides */}
                <div style={cardStyle}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Actions rapides</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => runDiagnostic('api')} style={{ ...buttonStyle, backgroundColor: 'rgba(59, 130, 246, 0.3)', fontSize: '12px', padding: '10px' }} disabled={!currentConversation || isLoading}>
                      Diagnostic API
                    </button>
                    <button onClick={() => runDiagnostic('erp')} style={{ ...buttonStyle, backgroundColor: 'rgba(59, 130, 246, 0.3)', fontSize: '12px', padding: '10px' }} disabled={!currentConversation || isLoading}>
                      Diagnostic ERP
                    </button>
                    <button onClick={() => runDiagnostic('server')} style={{ ...buttonStyle, backgroundColor: 'rgba(59, 130, 246, 0.3)', fontSize: '12px', padding: '10px' }} disabled={!currentConversation || isLoading}>
                      Diagnostic Serveur
                    </button>
                    <button onClick={escalateConversation} style={{ ...buttonStyle, backgroundColor: 'rgba(239, 68, 68, 0.3)', fontSize: '12px', padding: '10px' }} disabled={!currentConversation || isLoading}>
                      Escalader vers Technicien
                    </button>
                  </div>
                </div>

                {/* Feedback */}
                {currentConversation && (
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Votre avis</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button key={rating} onClick={() => submitFeedback(rating)} style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: 'none',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}>
                          {rating <= 2 ? ':(' : rating <= 3 ? ':|' : ':)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQs rapides */}
                <div style={cardStyle}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Questions frequentes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {faqs.slice(0, 3).map(faq => (
                      <div key={faq.id} style={{
                        padding: '8px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }} onClick={() => { setInput(faq.question); if (!currentConversation) startConversation(); }}>
                        {faq.question}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: History */}
          {activeTab === 'history' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Historique des conversations</h2>
              {conversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                  Aucune conversation
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {conversations.map(conv => (
                    <div key={conv.conversationId} style={{
                      padding: '16px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>#{conv.conversationId.slice(-6)}</div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {new Date(conv.createdAt).toLocaleDateString('fr-FR')} | {conv.status} |
                          <span style={{ color: getPriorityColor(conv.priority) }}> {conv.priority}</span>
                        </div>
                      </div>
                      <button onClick={() => resumeConversation(conv.conversationId)} style={{ ...buttonStyle, padding: '8px 16px', fontSize: '12px' }}>
                        Reprendre
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Tickets */}
          {activeTab === 'tickets' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Mes tickets</h2>
              {tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                  Aucun ticket
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tickets.map(ticket => (
                    <div key={ticket.ticketId} style={{
                      padding: '16px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: '600' }}>Ticket #{ticket.ticketId.slice(-6)}</div>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: ticket.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {ticket.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                        Priorite: <span style={{ color: getPriorityColor(ticket.priority) }}>{ticket.priority}</span>
                        {ticket.assignedTo && ` | Assigne a: ${ticket.assignedTo}`}
                      </div>
                      {ticket.slaDeadline && (
                        <div style={{ fontSize: '12px', marginTop: '4px', color: '#fbbf24' }}>
                          SLA: {new Date(ticket.slaDeadline).toLocaleString('fr-FR')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: FAQ */}
          {activeTab === 'faq' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Questions frequentes</h2>
              {faqs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                  Aucune FAQ disponible
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {faqs.map(faq => (
                    <div key={faq.id} style={{
                      padding: '16px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>{faq.question}</div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>{faq.answer}</div>
                      <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>
                        {faq.category} | {faq.module}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Knowledge */}
          {activeTab === 'knowledge' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Base de connaissances</h2>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchKnowledge()}
                />
                <button onClick={searchKnowledge} style={buttonStyle} disabled={isLoading}>
                  Rechercher
                </button>
              </div>

              {knowledgeArticles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                  Entrez un terme de recherche
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {knowledgeArticles.map(article => (
                    <div key={article.articleId} style={{
                      padding: '16px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>{article.title}</div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>{article.summary}</div>
                      <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>
                        {article.category}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
