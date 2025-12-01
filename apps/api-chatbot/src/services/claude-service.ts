import Anthropic from '@anthropic-ai/sdk';

// System prompts par type de bot
const BOT_PROMPTS = {
  'helpbot': `Tu es RT HelpBot, assistant support technique pour la plateforme RT Technologie.

Tu assistes les utilisateurs avec:
- Problèmes techniques (ERP, API, intégrations)
- Questions sur les fonctionnalités
- Bugs et erreurs
- Formation et onboarding
- Diagnostics automatisés

Capacités:
- Accès aux articles de la base de connaissances
- Lancer des diagnostics système
- Créer des tickets si nécessaire
- Escalader vers technicien si problème complexe

Sois clair, précis et professionnel. Si tu ne peux pas résoudre, recommande le transfert vers un technicien.`,

  'planif-ia': `Tu es l'Assistant Planif'IA pour industriels et logisticiens.

Tu aides avec:
- Planification de chargements et livraisons
- Optimisation des tournées
- Gestion des créneaux horaires
- Coordination avec transporteurs
- Suivi des opérations

Utilise les données de planning-api et tracking-api pour donner des réponses précises.`,

  'routier': `Tu es l'Assistant Routier pour transporteurs.

Tu assistes avec:
- Gestion des tournées
- Suivi des commandes de transport
- Documents de transport (CMR, BL)
- Communication avec expéditeurs/destinataires
- Optimisation des itinéraires

Utilise orders-api, documents-api et ecmr-api.`,

  'quai-wms': `Tu es l'Assistant Quai & WMS pour logisticiens.

Tu aides avec:
- Gestion des quais de chargement
- Planning des opérations de quai
- Réception et expédition
- Gestion palettes (EPAL, EUR)
- Suivi WMS

Utilise planning-api, palettes-api et tracking-api.`,

  'livraisons': `Tu es l'Assistant Livraisons pour destinataires.

Tu assistes avec:
- Suivi des livraisons attendues
- Gestion des créneaux de réception
- Notifications en temps réel
- Confirmation de livraison
- Gestion des anomalies

Utilise tracking-api, notifications-api et planning-api.`,

  'expedition': `Tu es l'Assistant Expédition pour fournisseurs et expéditeurs.

Tu aides avec:
- Création de commandes de transport
- Suivi des expéditions
- Génération de documents
- Communication avec transporteurs
- Gestion des enlèvements

Utilise orders-api, documents-api et tracking-api.`,

  'freight-ia': `Tu es l'Assistant Freight IA pour transitaires et commissionnaires.

Tu assistes avec:
- Calcul du taux de remplissage
- Scoring des transporteurs
- Optimisation affretement
- Suivi multi-transporteurs
- Facturation et billing

Utilise affret-ia-api-v4, scoring-api et billing-api.`,

  'copilote': `Tu es le Copilote Chauffeur pour conducteurs.

Tu aides avec:
- Navigation et itinéraires
- Informations sur les livraisons
- Documents de transport
- Communication avec dispatching
- Statut temps réel

Utilise tracking-api, orders-api et documents-api pour assistance temps réel.`,
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ConversationContext {
  userId: string;
  userRole?: string;
  companyId?: string;
  previousInteractions?: number;
  relatedData?: any;
}

interface ClaudeResponse {
  content: string;
  suggestedActions: string[];
  shouldTransfer: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  detectedIntent?: string;
  confidence?: number;
  relatedArticles?: string[];
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateResponse(
  botType: keyof typeof BOT_PROMPTS,
  messages: Message[],
  context?: ConversationContext
): Promise<ClaudeResponse> {
  try {
    const systemPrompt = BOT_PROMPTS[botType];

    // Ajouter contexte utilisateur au system prompt
    let enhancedSystemPrompt = systemPrompt;
    if (context) {
      enhancedSystemPrompt += `\n\nContexte utilisateur:
- User ID: ${context.userId}
- Rôle: ${context.userRole || 'non spécifié'}
- Entreprise: ${context.companyId || 'non spécifié'}
- Interactions précédentes: ${context.previousInteractions || 0}`;
    }

    // Convertir messages au format Claude
    const claudeMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'assistant' : msg.role,
      content: msg.content,
    })) as Anthropic.MessageParam[];

    const startTime = Date.now();

    // Appeler Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: enhancedSystemPrompt,
      messages: claudeMessages,
    });

    const responseTime = Date.now() - startTime;

    // Extraire le contenu
    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Analyser la réponse pour détecter besoin de transfert
    const shouldTransfer = detectTransferNeed(content, context?.previousInteractions || 0);
    const priority = detectPriority(content);
    const suggestedActions = extractSuggestedActions(content);
    const detectedIntent = detectIntent(messages[messages.length - 1]?.content || '');

    return {
      content,
      suggestedActions,
      shouldTransfer,
      priority,
      detectedIntent,
      confidence: 0.85,
      relatedArticles: [],
    };
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error('Failed to generate AI response');
  }
}

function detectTransferNeed(content: string, interactionCount: number): boolean {
  // Transférer automatiquement après 3 interactions si non résolu
  if (interactionCount >= 3) {
    return true;
  }

  // Détecter mots-clés indiquant besoin d'escalade
  const escalationKeywords = [
    'technicien',
    'expert',
    'urgent',
    'ne fonctionne pas',
    'erreur critique',
    'ne peux pas résoudre',
    'problème persistant',
    'toujours le problème',
  ];

  const lowerContent = content.toLowerCase();
  return escalationKeywords.some(keyword => lowerContent.includes(keyword));
}

function detectPriority(content: string): 'low' | 'medium' | 'high' | 'urgent' {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('urgent') || lowerContent.includes('critique') || lowerContent.includes('production down')) {
    return 'urgent';
  }
  if (lowerContent.includes('important') || lowerContent.includes('bloqué') || lowerContent.includes('ne fonctionne pas')) {
    return 'high';
  }
  if (lowerContent.includes('problème') || lowerContent.includes('erreur')) {
    return 'medium';
  }

  return 'low';
}

function extractSuggestedActions(content: string): string[] {
  const actions: string[] = [];

  // Extraire actions suggérées basées sur le contenu
  if (content.includes('article') || content.includes('documentation')) {
    actions.push('view_knowledge_base');
  }
  if (content.includes('diagnostic')) {
    actions.push('run_diagnostic');
  }
  if (content.includes('ticket') || content.includes('technicien')) {
    actions.push('create_ticket');
  }
  if (content.includes('FAQ')) {
    actions.push('view_faq');
  }

  return actions;
}

function detectIntent(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('erreur') || lowerMessage.includes('bug') || lowerMessage.includes('ne fonctionne pas')) {
    return 'technical_issue';
  }
  if (lowerMessage.includes('comment') || lowerMessage.includes('?')) {
    return 'how_to';
  }
  if (lowerMessage.includes('suivi') || lowerMessage.includes('où') || lowerMessage.includes('status')) {
    return 'tracking';
  }
  if (lowerMessage.includes('créer') || lowerMessage.includes('nouveau')) {
    return 'create_action';
  }

  return 'general_inquiry';
}

export async function generateContextualResponse(
  botType: keyof typeof BOT_PROMPTS,
  userMessage: string,
  conversationHistory: Message[],
  context?: ConversationContext
): Promise<ClaudeResponse> {
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userMessage },
  ];

  return generateResponse(botType, messages, context);
}
