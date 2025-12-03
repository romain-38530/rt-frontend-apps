import { useState, useRef, useEffect } from 'react';

// Types de chatbots disponibles
export type ChatBotType =
  | 'helpbot'           // RT HelpBot - Support technique transverse
  | 'planif-ia'         // Assistant Planif'IA - Industriels
  | 'routier'           // Assistant Routier - Transporteurs
  | 'quai-wms'          // Assistant Quai & WMS - Logisticiens
  | 'livraisons'        // Assistant Livraisons - Destinataires
  | 'expedition'        // Assistant Expedition - Fournisseurs
  | 'freight-ia'        // Assistant Freight IA - Transitaires
  | 'copilote';         // Copilote Chauffeur - Conducteurs

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: { name: string; url: string; type: string }[];
  priority?: 1 | 2 | 3;
  actions?: { label: string; action: string }[];
}

interface ChatBotProps {
  type: ChatBotType;
  userContext?: {
    userId?: string;
    companyId?: string;
    role?: string;
    currentModule?: string;
    currentOrderId?: string;
  };
  onTransferToTechnician?: (context: any) => void;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

const CHATBOT_CONFIG: Record<ChatBotType, {
  name: string;
  icon: string;
  description: string;
  welcomeMessage: string;
  quickActions: string[];
}> = {
  'helpbot': {
    name: 'RT HelpBot',
    icon: '🤖',
    description: 'Support technique 24/7',
    welcomeMessage: 'Bonjour ! Je suis RT HelpBot, votre assistant support technique. Comment puis-je vous aider ?',
    quickActions: ['Probleme technique', 'Question API', 'Demander un technicien']
  },
  'planif-ia': {
    name: 'Assistant Planif\'IA',
    icon: '🏭',
    description: 'Pour les industriels',
    welcomeMessage: 'Bienvenue ! Je suis votre assistant pour la planification. Je peux vous aider avec l\'integration ERP, le parametrage transporteurs et l\'activation d\'Affret.IA.',
    quickActions: ['Connecter mon ERP', 'Activer Affret.IA', 'Gerer transporteurs']
  },
  'routier': {
    name: 'Assistant Routier',
    icon: '🚛',
    description: 'Pour les transporteurs',
    welcomeMessage: 'Bonjour ! Je suis l\'Assistant Routier. Je vous accompagne pour vos grilles tarifaires, RDV et tracking.',
    quickActions: ['Integrer grilles tarifaires', 'Prendre un RDV', 'Deposer POD']
  },
  'quai-wms': {
    name: 'Assistant Quai & WMS',
    icon: '📦',
    description: 'Pour les logisticiens',
    welcomeMessage: 'Bienvenue ! Je gere le planning quai, les creneaux et l\'integration WMS. Que souhaitez-vous faire ?',
    quickActions: ['Planning quais', 'Gerer creneaux', 'Integration WMS']
  },
  'livraisons': {
    name: 'Assistant Livraisons',
    icon: '📬',
    description: 'Pour les destinataires',
    welcomeMessage: 'Bonjour ! Je suis la pour vous aider avec vos RDV, documents et suivi de livraisons.',
    quickActions: ['Gerer mes RDV', 'Voir documents', 'Suivi temps reel']
  },
  'expedition': {
    name: 'Assistant Expedition',
    icon: '📤',
    description: 'Pour les fournisseurs',
    welcomeMessage: 'Bienvenue ! Je vous accompagne dans la gestion de vos expeditions et le suivi des prises en charge.',
    quickActions: ['Nouvelle expedition', 'Suivi prises en charge', 'Contacter transporteur']
  },
  'freight-ia': {
    name: 'Assistant Freight IA',
    icon: '🌍',
    description: 'Pour les transitaires',
    welcomeMessage: 'Bonjour ! Je suis specialise dans les offres import/export et la gestion des acheminements.',
    quickActions: ['Offres import/export', 'Pre-acheminement', 'Post-acheminement']
  },
  'copilote': {
    name: 'Copilote Chauffeur',
    icon: '🚚',
    description: 'Assistant mobile conducteurs',
    welcomeMessage: 'Bonjour conducteur ! Je suis votre copilote. Pret a vous assister pour vos missions.',
    quickActions: ['Activer mission', 'Deposer documents', 'Signature electronique']
  }
};

export default function ChatBot({
  type,
  userContext,
  onTransferToTechnician,
  position = 'bottom-right',
  primaryColor = '#667eea'
}: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const [showCategories, setShowCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = CHATBOT_CONFIG[type];
  const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://de1913kh0ya48.cloudfront.net';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Message de bienvenue
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: config.welcomeMessage,
        timestamp: new Date(),
        actions: config.quickActions.map(action => ({ label: action, action }))
      }]);
    }
  }, [isOpen, config]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      attachments: attachments.map(f => ({ name: f.name, url: URL.createObjectURL(f), type: f.type }))
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsLoading(true);
    setInteractionCount(prev => prev + 1);

    try {
      const response = await fetch(`${apiUrl}/api/v1/chat/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: content,
          context: {
            ...userContext,
            interactionCount: interactionCount + 1,
            category: selectedCategory,
            conversationHistory: messages.slice(-10).map(m => ({
              role: m.role,
              content: m.content
            }))
          },
          attachments: attachments.map(f => f.name)
        })
      });

      if (response.ok) {
        const data = await response.json();

        const assistantMessage: Message = {
          id: `msg-${Date.now()}-resp`,
          role: 'assistant',
          content: data.response || data.message,
          timestamp: new Date(),
          priority: data.priority,
          actions: data.suggestedActions
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Transfert automatique apres 3 interactions sans resolution
        if (data.shouldTransfer || (interactionCount >= 3 && data.unresolved)) {
          handleTransferToTechnician();
        }
      } else {
        // Fallback reponse
        simulateResponse(content);
      }
    } catch (error) {
      console.log('Using fallback response');
      simulateResponse(content);
    }

    setIsLoading(false);
  };

  const simulateResponse = (userInput: string) => {
    const lowerInput = userInput.toLowerCase();
    let response = '';
    let actions: { label: string; action: string }[] = [];
    let priority: 1 | 2 | 3 = 3;

    // Detection de mots-cles pour priorisation
    if (lowerInput.includes('urgent') || lowerInput.includes('bloque') || lowerInput.includes('impossible')) {
      priority = 1;
      response = 'Je comprends l\'urgence de votre situation. ';
    } else if (lowerInput.includes('erreur') || lowerInput.includes('probleme')) {
      priority = 2;
      response = 'Je vais vous aider a resoudre ce probleme. ';
    }

    // Reponses contextuelles selon le type de bot
    if (type === 'helpbot') {
      if (lowerInput.includes('api') || lowerInput.includes('erp')) {
        response += 'Pour les problemes d\'API ERP, je peux effectuer un diagnostic. Voulez-vous que je verifie le statut de votre connexion ?';
        actions = [{ label: 'Lancer diagnostic API', action: 'diagnostic_api' }, { label: 'Contacter technicien', action: 'transfer' }];
      } else if (lowerInput.includes('technicien') || lowerInput.includes('humain')) {
        response += 'Je vais transferer votre demande a un technicien. Temps d\'attente estime : 5 minutes.';
        actions = [{ label: 'Confirmer transfert', action: 'transfer' }];
        setTimeout(() => handleTransferToTechnician(), 2000);
      } else {
        response += 'Je suis la pour vous aider. Pouvez-vous me decrire votre probleme plus en detail ?';
        actions = [{ label: 'Probleme technique', action: 'tech' }, { label: 'Question utilisation', action: 'usage' }, { label: 'Transfert technicien', action: 'transfer' }];
      }
    } else if (type === 'planif-ia') {
      if (lowerInput.includes('erp') || lowerInput.includes('integration')) {
        response += 'Pour connecter votre ERP, allez dans Parametres > Integrations > ERP. Je peux vous guider etape par etape.';
        actions = [{ label: 'Guide integration', action: 'guide_erp' }, { label: 'Verifier connexion', action: 'check_erp' }];
      } else if (lowerInput.includes('affret')) {
        response += 'Pour activer Affret.IA, rendez-vous dans le module AFFRET.IA depuis le dashboard. Je peux vous expliquer les fonctionnalites.';
        actions = [{ label: 'Aller a Affret.IA', action: 'goto_affret' }, { label: 'En savoir plus', action: 'info_affret' }];
      } else {
        response += 'Je peux vous aider avec l\'integration ERP, le parametrage transporteurs ou l\'activation d\'Affret.IA. Que souhaitez-vous faire ?';
      }
    } else if (type === 'quai-wms') {
      if (lowerInput.includes('quai') || lowerInput.includes('planning')) {
        response += 'Le module Planning Quais permet de gerer vos sites, quais et creneaux. Voulez-vous acceder au planning ?';
        actions = [{ label: 'Ouvrir Planning', action: 'goto_planning' }, { label: 'Creer un site', action: 'create_site' }];
      } else if (lowerInput.includes('wms')) {
        response += 'L\'integration WMS permet de synchroniser vos stocks et mouvements. Quel WMS utilisez-vous ?';
        actions = [{ label: 'SAP WM', action: 'wms_sap' }, { label: 'Oracle WMS', action: 'wms_oracle' }, { label: 'Autre', action: 'wms_other' }];
      }
    } else {
      response += `Je suis ${config.name}. Comment puis-je vous aider aujourd'hui ?`;
    }

    const assistantMessage: Message = {
      id: `msg-${Date.now()}-resp`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      priority,
      actions
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleTransferToTechnician = () => {
    const transferMessage: Message = {
      id: `msg-${Date.now()}-transfer`,
      role: 'system',
      content: '🔄 Transfert vers un technicien en cours... Temps d\'attente estime : 5 minutes. Votre contexte a ete transmis.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, transferMessage]);

    if (onTransferToTechnician) {
      onTransferToTechnician({
        conversationHistory: messages,
        userContext,
        botType: type,
        priority: 1
      });
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === 'transfer') {
      handleTransferToTechnician();
    } else if (action.startsWith('goto_')) {
      // Navigation actions
      const target = action.replace('goto_', '');
      window.location.href = `/${target}`;
    } else {
      sendMessage(action);
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const positionStyles = position === 'bottom-right'
    ? { right: '24px', bottom: '24px' }
    : { left: '24px', bottom: '24px' };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          ...positionStyles,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          zIndex: 1000,
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? '✕' : config.icon}
      </button>

      {/* Fenetre de chat */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          ...positionStyles,
          bottom: '100px',
          width: '380px',
          height: '550px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '20px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 999,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '32px' }}>{config.icon}</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '16px' }}>{config.name}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>{config.description}</div>
            </div>
            <div style={{
              marginLeft: 'auto',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00D084',
              boxShadow: '0 0 10px #00D084'
            }} />
          </div>

          {/* Categories (premiere interaction) */}
          {showCategories && messages.length <= 1 && (
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                Selectionnez une categorie :
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Question', 'Probleme technique', 'Demande urgente'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowCategories(false);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: selectedCategory === cat ? primaryColor : 'rgba(255,255,255,0.1)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`
                    : msg.role === 'system'
                    ? 'rgba(255,184,0,0.2)'
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  border: msg.role === 'system' ? '1px solid #FFB800' : 'none'
                }}>
                  {msg.priority === 1 && (
                    <div style={{ fontSize: '11px', color: '#FF6B6B', fontWeight: '600', marginBottom: '4px' }}>
                      🚨 URGENT
                    </div>
                  )}
                  {msg.content}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {msg.attachments.map((att, i) => (
                        <div key={i} style={{
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          📎 {att.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions suggrees */}
                {msg.actions && msg.actions.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {msg.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action.action)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = primaryColor;
                          e.currentTarget.style.borderColor = primaryColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>
                  {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{
                display: 'flex',
                gap: '6px',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '16px',
                width: 'fit-content'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite 0.2s' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite 0.4s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {attachments.map((file, i) => (
                <div key={i} style={{
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  📎 {file.name}
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileAttach}
              style={{ display: 'none' }}
              multiple
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              📎
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
              placeholder="Ecrivez votre message..."
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '24px',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() && attachments.length === 0}
              style={{
                width: '40px',
                height: '40px',
                background: inputValue.trim() || attachments.length > 0
                  ? `linear-gradient(135deg, ${primaryColor} 0%, #764ba2 100%)`
                  : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                color: 'white',
                cursor: inputValue.trim() || attachments.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '18px'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}
