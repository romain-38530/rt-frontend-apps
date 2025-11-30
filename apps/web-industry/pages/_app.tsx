import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import ChatBot from '../components/ChatBot';
import type { ChatBotType } from '../components/ChatBot';

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

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const currentPath = router.pathname;

  // Determiner le type de chatbot selon la page
  const chatBotType: ChatBotType = PAGE_CHATBOT_MAP[currentPath] || 'helpbot';

  // Ne pas afficher le chatbot sur la page de login
  const showChatBot = currentPath !== '/login';

  return (
    <>
      <Component {...pageProps} />
      {showChatBot && (
        <ChatBot
          type={chatBotType}
          userContext={{
            currentModule: currentPath.replace('/', '') || 'dashboard'
          }}
          onTransferToTechnician={(context) => {
            console.log('Transfert technicien:', context);
            // Integration avec le systeme de ticketing
          }}
        />
      )}
    </>
  );
}
