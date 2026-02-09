/**
 * useLoadingMessages - Messages dynamiques multilingues pendant le chargement
 *
 * Affiche des messages techniques dans ~10 langues différentes avec
 * un système de phases aléatoires pour un rendu organique.
 *
 * Phases (ordre aléatoire, en boucle) :
 * - SLOW : messages lents (800-1200ms) — impression de calcul lourd
 * - BURST : messages très rapides (60-150ms) — activité intense
 * - PAUSE : arrêt temporaire (1500-3000ms) — attente réseau
 *
 * Technique UX: "Perceived Performance" - réduit la perception d'attente
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Messages multilingues - mélange de ~10 langues
 * Chaque message est affiché dans sa langue d'origine (pas traduit)
 */
const MULTILINGUAL_MESSAGES = [
  // Français
  'Connexion au réseau...',
  'Lecture du contrat...',
  'Calcul des shares...',
  'Validation du vault...',
  'Synchronisation...',
  'Signature requise...',
  'Préparation du batch...',
  'Estimation du gas...',
  'Vérification du protocole...',
  'Mise en cache...',
  // English
  'Reading contract data...',
  'Verifying RPC endpoint...',
  'Hashing transaction...',
  'Analyzing position...',
  'Calculating yield...',
  'Preparing state update...',
  'Validating nonce...',
  'Checking consensus...',
  'Block confirmation...',
  'Finalizing...',
  // Español
  'Conectando a la red...',
  'Verificando el contrato...',
  'Calculando participaciones...',
  'Sincronización en curso...',
  'Preparando transacción...',
  // Deutsch
  'Verbindung zum Netzwerk...',
  'Vertrag wird gelesen...',
  'Berechnung der Anteile...',
  'Gasabschätzung...',
  'Protokollvalidierung...',
  // Italiano
  'Connessione alla rete...',
  'Lettura del contratto...',
  'Calcolo delle quote...',
  'Sincronizzazione...',
  'Verifica della posizione...',
  // Português
  'Conectando à rede...',
  'Lendo contrato...',
  'Calculando participações...',
  'Preparando transação...',
  'Verificação do protocolo...',
  // 日本語
  'ネットワーク接続中...',
  'コントラクト読み込み中...',
  'シェア計算中...',
  'ブロック確認中...',
  'ガス見積もり中...',
  // 한국어
  '네트워크 연결 중...',
  '컨트랙트 읽는 중...',
  '해시 계산 중...',
  '블록 확인 중...',
  '프로토콜 검증 중...',
  // 中文
  '连接网络中...',
  '读取合约中...',
  '计算份额中...',
  '验证协议中...',
  '同步状态中...',
  // العربية
  '...الاتصال بالشبكة',
  '...قراءة العقد',
  '...التحقق من البروتوكول',
  '...حساب الحصص',
];

/**
 * Phases de timing
 */
type Phase = 'slow' | 'burst' | 'pause';

/** Nombre de messages à afficher dans chaque phase */
function getPhaseMessageCount(phase: Phase): number {
  switch (phase) {
    case 'slow':
      return 2 + Math.floor(Math.random() * 3); // 2-4 messages
    case 'burst':
      return 4 + Math.floor(Math.random() * 6); // 4-9 messages
    case 'pause':
      return 1; // 1 seul (on reste dessus)
  }
}

/** Délai entre messages selon la phase */
function getPhaseDelay(phase: Phase): number {
  switch (phase) {
    case 'slow':
      return 800 + Math.random() * 400; // 800-1200ms
    case 'burst':
      return 60 + Math.random() * 90; // 60-150ms
    case 'pause':
      return 1500 + Math.random() * 1500; // 1500-3000ms
  }
}

/**
 * Mélange un tableau (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Génère un ordre aléatoire de phases */
function getRandomPhases(): Phase[] {
  const phases: Phase[] = ['slow', 'burst', 'pause'];
  return shuffleArray(phases);
}

interface UseLoadingMessagesOptions {
  /** Activer/désactiver le défilement */
  isActive: boolean;
}

interface UseLoadingMessagesResult {
  /** Message actuel à afficher */
  currentMessage: string;
  /** Index du message (pour debug) */
  messageIndex: number;
}

/**
 * Hook pour afficher des messages de chargement multilingues avec phases dynamiques
 *
 * @example
 * ```tsx
 * const { currentMessage } = useLoadingMessages({ isActive: isLoading });
 * return <span>{currentMessage}</span>;
 * ```
 */
export function useLoadingMessages(
  options: UseLoadingMessagesOptions
): UseLoadingMessagesResult {
  const { isActive } = options;

  const [messageIndex, setMessageIndex] = useState(0);
  const [shuffledMessages, setShuffledMessages] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phase tracking
  const phaseRef = useRef<{
    phases: Phase[];
    phaseIndex: number;
    messagesInPhase: number;
    maxMessagesInPhase: number;
  }>({
    phases: getRandomPhases(),
    phaseIndex: 0,
    messagesInPhase: 0,
    maxMessagesInPhase: getPhaseMessageCount('slow'),
  });

  // Mélanger les messages au démarrage
  useEffect(() => {
    if (isActive) {
      setShuffledMessages(shuffleArray(MULTILINGUAL_MESSAGES));
      setMessageIndex(0);
      // Reset phases
      const phases = getRandomPhases();
      phaseRef.current = {
        phases,
        phaseIndex: 0,
        messagesInPhase: 0,
        maxMessagesInPhase: getPhaseMessageCount(phases[0]),
      };
    }
  }, [isActive]);

  // Avancer au message suivant
  const advanceMessage = useCallback(() => {
    setMessageIndex(prev => {
      const next = prev + 1;
      if (next >= shuffledMessages.length) {
        setShuffledMessages(shuffleArray(MULTILINGUAL_MESSAGES));
        return 0;
      }
      return next;
    });
  }, [shuffledMessages.length]);

  // Obtenir le délai actuel selon la phase
  const getNextDelay = useCallback((): number => {
    const state = phaseRef.current;
    const currentPhase = state.phases[state.phaseIndex];

    state.messagesInPhase++;

    // Phase terminée → passer à la suivante
    if (state.messagesInPhase >= state.maxMessagesInPhase) {
      state.phaseIndex = (state.phaseIndex + 1) % state.phases.length;
      state.messagesInPhase = 0;

      // Si on a fait le tour des 3 phases, générer un nouvel ordre
      if (state.phaseIndex === 0) {
        state.phases = getRandomPhases();
      }

      const newPhase = state.phases[state.phaseIndex];
      state.maxMessagesInPhase = getPhaseMessageCount(newPhase);
      return getPhaseDelay(newPhase);
    }

    return getPhaseDelay(currentPhase);
  }, []);

  // Timer pour changer de message
  useEffect(() => {
    if (!isActive || shuffledMessages.length === 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const scheduleNext = () => {
      const delay = getNextDelay();
      timeoutRef.current = setTimeout(() => {
        advanceMessage();
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive, shuffledMessages.length, advanceMessage, getNextDelay]);

  const currentMessage = shuffledMessages[messageIndex] || MULTILINGUAL_MESSAGES[0];

  return {
    currentMessage,
    messageIndex,
  };
}
