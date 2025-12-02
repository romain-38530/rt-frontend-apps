/**
 * Page Assistant Quai & WMS IA - Portail Logisticien
 * Integration complete avec Claude IA - Assistant specialise logistique
 *
 * Fonctionnalites:
 * - Suivi des commandes en cours
 * - Gestion documentaire (CMR, POD, factures)
 * - Tarifs et cotations
 * - Tracking GPS et ETA
 * - Support technique
 * - Escalade vers support
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
    actions?: any[];
    data?: any;
  };
}

interface Conversation {
  conversationId: string;
  chatbotType: string;
  status: string;
  messages: Message[];
  createdAt: string;
}

export default function ChatbotPage() {
  const router = useRouter();
  // L'API Chatbot IA est dans le bundle subscriptions-contracts (via CloudFront HTTPS)
  const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://de1913kh0ya48.cloudfront.net';

  const [activeTab, setActiveTab] = useState<'chat' | 'orders' | 'documents' | 'tracking'>('chat');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

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

  // Demarrer une conversation avec l'Assistant Quai & WMS
  const startConversation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall('/chatbot/conversations', 'POST', {
        chatbotType: 'QUAI_WMS', // Assistant specialise logistique
        userId: 'current-user',
        userName: 'Logisticien',
        userEmail: 'logisticien@example.com',
        context: {
          currentPage: 'chatbot',
          userAgent: navigator.userAgent
        }
      });
      setCurrentConversation(result.data);
      setSuccess('Conversation demarree avec l\'Assistant Quai & WMS IA');
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

      if (result.data?.botResponse) {
        setCurrentConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, result.data.botResponse]
        } : null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Actions rapides
  const quickAction = async (action: string) => {
    if (!currentConversation) {
      await startConversation();
    }
    setInput(action);
    setTimeout(() => sendMessage(), 100);
  };

  // Charger les conversations
  const loadConversations = async () => {
    try {
      const result = await apiCall('/chatbot/conversations?chatbotType=ROUTIER');
      setConversations(result.data || []);
    } catch (err: any) {
      console.error('Erreur chargement:', err);
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

  // Fermer la conversation
  const closeConversation = async () => {
    if (!currentConversation) return;
    try {
      await apiCall(`/chatbot/conversations/${currentConversation.conversationId}/close`, 'POST', {});
      setCurrentConversation(null);
      loadConversations();
    } catch (err: any) {
      setError(err.message);
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
  }, [router]);

  // Styles
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#0c4a6e',
    fontFamily: 'system-ui, sans-serif',
    color: 'white'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#0284c7' : 'rgba(255,255,255,0.1)',
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
    backgroundColor: '#0284c7',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  };

  const quickActionStyle: React.CSSProperties = {
    padding: '10px 16px',
    backgroundColor: 'rgba(2, 132, 199, 0.3)',
    color: 'white',
    border: '1px solid rgba(2, 132, 199, 0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12px',
    textAlign: 'left' as const
  };

  return (
    <>
      <Head>
        <title>Assistant Quai & WMS IA - Logisticien | SYMPHONI.A</title>
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
              Assistant Quai & WMS IA
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>
              Chat
            </button>
            <button style={tabStyle(activeTab === 'orders')} onClick={() => setActiveTab('orders')}>
              Mes Commandes
            </button>
            <button style={tabStyle(activeTab === 'documents')} onClick={() => setActiveTab('documents')}>
              Documents
            </button>
            <button style={tabStyle(activeTab === 'tracking')} onClick={() => setActiveTab('tracking')}>
              Tracking
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
                    <div style={{ fontSize: '64px' }}>T</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Assistant Quai & WMS IA</h2>
                    <p style={{ opacity: 0.7, textAlign: 'center', maxWidth: '400px' }}>
                      Votre assistant intelligent pour la gestion de vos transports, documents et suivi en temps reel.
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
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Assistant Quai & WMS</div>
                      </div>
                      <button onClick={closeConversation} style={{ ...buttonStyle, backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px 12px', fontSize: '12px' }}>
                        Fermer
                      </button>
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
                            backgroundColor: msg.type === 'user' ? '#0284c7' : 'rgba(255,255,255,0.1)',
                            whiteSpace: 'pre-wrap'
                          }}>
                            <div>{msg.content}</div>
                            {msg.metadata?.suggestions && msg.metadata.suggestions.length > 0 && (
                              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {msg.metadata.suggestions.map((sug, i) => (
                                  <button key={i} onClick={() => setInput(sug)} style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(2, 132, 199, 0.3)',
                                    border: '1px solid rgba(2, 132, 199, 0.5)',
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
                        placeholder="Posez votre question..."
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

              {/* Panel lateral - Actions rapides */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={cardStyle}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Actions rapides</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => quickAction('Voir mes commandes en cours')} style={quickActionStyle}>
                      Commandes en cours
                    </button>
                    <button onClick={() => quickAction('Documents a transmettre')} style={quickActionStyle}>
                      Documents en attente
                    </button>
                    <button onClick={() => quickAction('Position de mes vehicules')} style={quickActionStyle}>
                      Tracking vehicules
                    </button>
                    <button onClick={() => quickAction('Mes prochaines livraisons')} style={quickActionStyle}>
                      Livraisons du jour
                    </button>
                    <button onClick={() => quickAction('Demander une cotation')} style={quickActionStyle}>
                      Nouvelle cotation
                    </button>
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Aide</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => quickAction('Comment telecharger un CMR?')} style={quickActionStyle}>
                      Telecharger CMR
                    </button>
                    <button onClick={() => quickAction('Signaler un retard')} style={quickActionStyle}>
                      Signaler retard
                    </button>
                    <button onClick={() => quickAction('Contacter le support')} style={quickActionStyle}>
                      Support technique
                    </button>
                  </div>
                </div>

                {/* Historique */}
                {conversations.length > 0 && (
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Historique</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {conversations.slice(0, 3).map(conv => (
                        <button
                          key={conv.conversationId}
                          onClick={() => resumeConversation(conv.conversationId)}
                          style={{
                            padding: '8px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer',
                            textAlign: 'left' as const
                          }}
                        >
                          #{conv.conversationId.slice(-6)} - {new Date(conv.createdAt).toLocaleDateString('fr-FR')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Orders */}
          {activeTab === 'orders' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Mes Commandes</h2>
              <p style={{ opacity: 0.7, marginBottom: '24px' }}>
                Demandez a l'assistant pour obtenir des informations sur vos commandes.
              </p>
              <button onClick={() => { setActiveTab('chat'); quickAction('Liste de mes commandes en cours'); }} style={buttonStyle}>
                Demander a l'assistant
              </button>
            </div>
          )}

          {/* Tab: Documents */}
          {activeTab === 'documents' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Documents</h2>
              <p style={{ opacity: 0.7, marginBottom: '24px' }}>
                Gerez vos CMR, POD et autres documents de transport.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setActiveTab('chat'); quickAction('Documents en attente de signature'); }} style={buttonStyle}>
                  Documents a signer
                </button>
                <button onClick={() => { setActiveTab('chat'); quickAction('Telecharger mes CMR du jour'); }} style={{ ...buttonStyle, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  Telecharger CMR
                </button>
              </div>
            </div>
          )}

          {/* Tab: Tracking */}
          {activeTab === 'tracking' && (
            <div style={cardStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Tracking</h2>
              <p style={{ opacity: 0.7, marginBottom: '24px' }}>
                Suivez vos vehicules et livraisons en temps reel.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setActiveTab('chat'); quickAction('Position actuelle de mes vehicules'); }} style={buttonStyle}>
                  Localiser vehicules
                </button>
                <button onClick={() => router.push('/tracking')} style={{ ...buttonStyle, backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  Ouvrir Tracking complet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
