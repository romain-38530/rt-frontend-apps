/**
 * Wrapper pour le ChatBot - client-side uniquement
 * Utilise useRouter de manière sécurisée côté client
 */

import { useRouter } from 'next/router';
import ChatBot from './ChatBot';
import type { ChatBotType } from './ChatBot';

// Mapping des pages vers les types de chatbots
const PAGE_CHATBOT_MAP: Record<string, ChatBotType> = {
  '/': 'planif-ia',
  '/affret-ia': 'planif-ia',
  '/orders': 'planif-ia',
  '/planning': 'quai-wms',
  '/borne-chauffeur': 'quai-wms',
  '/ecmr': 'quai-wms',
  '/rdv-transporteurs': 'routier',
  '/dashboard': 'planif-ia',
  '/scoring': 'planif-ia',
  '/chatbot': 'helpbot'
};

export default function ChatBotWrapper() {
  const router = useRouter();
  const currentPath = router.pathname;

  // Determiner le type de chatbot selon la page
  const chatBotType: ChatBotType = PAGE_CHATBOT_MAP[currentPath] || 'helpbot';

  // Ne pas afficher le chatbot sur la page de login
  if (currentPath === '/login') {
    return null;
  }

  return (
    <ChatBot
      type={chatBotType}
      userContext={{
        currentModule: currentPath.replace('/', '') || 'dashboard'
      }}
      onTransferToTechnician={(context) => {
        console.log('Transfert technicien:', context);
      }}
    />
  );
}
