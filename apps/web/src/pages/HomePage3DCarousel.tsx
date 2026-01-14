import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FounderHomeCard } from '../components/founder';
import { FounderExpandedView } from '../components/founder';
import { useFoundersForHomePage, type FounderForHomePage, type TopTotem } from '../hooks';
import '../carousel-3d.css';

/**
 * FrontCardOverlay - Card frontale avec effet glass HORS du contexte 3D
 * Workaround pour backdrop-filter qui ne fonctionne pas avec preserve-3d
 * Bug Chromium: https://issues.chromium.org/issues/323735424
 */
interface FrontCardOverlayProps {
  founder: FounderForHomePage | null;
  topTotems: TopTotem[];
  onSelect: (founderId: string) => void;
  selectedFounderId: string | null;
}

function FrontCardOverlay({ founder, topTotems, onSelect, selectedFounderId }: FrontCardOverlayProps) {
  // Cacher l'overlay si un founder est sélectionné (panneaux ouverts)
  if (!founder || selectedFounderId) return null;

  return (
    <div className="front-card-overlay">
      <div className="front-card-glass">
        <FounderHomeCard
          founder={founder}
          onSelect={onSelect}
          isSelected={founder.id === selectedFounderId}
          isFront={true}
          topTotems={topTotems}
        />
      </div>
    </div>
  );
}

/**
 * Calcule la distance d'une card au centre (position frontale) sur un cercle
 * Retourne une valeur entre 0 et quantity/2
 */
function getDistanceFromFront(position: number, frontPosition: number, quantity: number): number {
  const diff = Math.abs(position - frontPosition);
  // Sur un cercle, la distance max est quantity/2
  return Math.min(diff, quantity - diff);
}

/**
 * Calcule l'angle de flip basé sur la distance au centre
 * Transition progressive sur 5 cartes (positions 3-7)
 * - Distance 0-2 : 0° (face visible)
 * - Distance 3 : 36°
 * - Distance 4 : 72°
 * - Distance 5 : 108°
 * - Distance 6 : 144°
 * - Distance 7+ : 180° (dos visible)
 */
function getFlipAngle(distance: number): number {
  if (distance <= 2) return 0;
  if (distance === 3) return 36;
  if (distance === 4) return 72;
  if (distance === 5) return 108;
  if (distance === 6) return 144;
  return 180;
}

/**
 * FlippableCard - Card avec deux faces (front/back) et flip progressif
 */
interface FlippableCardProps {
  founder: FounderForHomePage;
  topTotems: TopTotem[];
  flipAngle: number;
  isFront: boolean;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function FlippableCard({ founder, topTotems, flipAngle, isFront, isSelected, onClick }: FlippableCardProps) {
  // Calculer l'opacité basée sur l'angle pour une transition fluide
  // Entre 70° et 110°, on fait une transition progressive
  const getFrontOpacity = (angle: number) => {
    if (angle <= 70) return 1;
    if (angle >= 110) return 0;
    return 1 - (angle - 70) / 40; // Transition linéaire de 70° à 110°
  };

  const getBackOpacity = (angle: number) => {
    if (angle <= 70) return 0;
    if (angle >= 110) return 1;
    return (angle - 70) / 40; // Transition linéaire de 70° à 110°
  };

  const frontOpacity = getFrontOpacity(flipAngle);
  const backOpacity = getBackOpacity(flipAngle);

  return (
    <div
      className="card-flipper"
      style={{
        width: '430px',
        height: '600px',
        position: 'relative',
        perspective: '2000px'
      }}
      onClick={onClick}
    >
      {/* Container qui tourne */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${flipAngle}deg)`,
          transition: 'transform 0.6s ease-out'
        }}
      >
        {/* Face avant - Contenu founder */}
        <div
          className="card-face card-front"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            opacity: frontOpacity,
            transition: 'opacity 0.3s ease-out',
            pointerEvents: frontOpacity > 0.5 ? 'auto' : 'none'
          }}
        >
          <FounderHomeCard
            founder={founder}
            onSelect={() => {}}
            isSelected={isSelected}
            isFront={isFront}
            topTotems={topTotems}
          />
        </div>

        {/* Face arrière - Image INTUITION */}
        <div
          className="card-face card-back"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            opacity: backOpacity,
            transition: 'opacity 0.3s ease-out',
            pointerEvents: backOpacity > 0.5 ? 'auto' : 'none',
            background: `url(${import.meta.env.BASE_URL}Backcard_1.png) center center / cover no-repeat`,
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        />
      </div>
    </div>
  );
}

/**
 * HomePage3DCarousel - Version avec carrousel 3D unique et scroll snap
 * 2 écrans: Hero+Stats puis Carrousel uniquement
 */
export function HomePage3DCarousel() {
  const { t } = useTranslation();
  const { founders, loading, error, stats, topTotemsMap } = useFoundersForHomePage();
  const [searchParams, setSearchParams] = useSearchParams();

  // État de rotation du carrousel unique (en degrés)
  const [carouselRotation, setCarouselRotation] = useState(0);

  // Ref pour la section carrousel (pour bloquer le scroll natif)
  const carouselSectionRef = useRef<HTMLDivElement>(null);

  // Ref pour le timeout d'auto-centrage
  const autoCenterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref pour stocker la rotation actuelle (évite les problèmes de closure stale)
  const carouselRotationRef = useRef(carouselRotation);

  // Garder la ref synchronisée avec le state
  useEffect(() => {
    carouselRotationRef.current = carouselRotation;
  }, [carouselRotation]);

  // Délai avant auto-centrage (en ms) - ajustable
  const AUTO_CENTER_DELAY = 400;

  // Get selected founder from URL param
  const selectedFounderId = searchParams.get('founder');

  // Find the selected founder object
  const selectedFounder = useMemo<FounderForHomePage | null>(() => {
    if (!selectedFounderId || founders.length === 0) return null;
    return founders.find(f => f.id === selectedFounderId) || null;
  }, [selectedFounderId, founders]);

  // Select a founder (updates URL)
  const selectFounder = useCallback((founderId: string) => {
    setSearchParams({ founder: founderId });
  }, [setSearchParams]);

  // Close the expanded view (removes URL param)
  const closeExpandedView = useCallback(() => {
    searchParams.delete('founder');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedFounder) {
        closeExpandedView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFounder, closeExpandedView]);

  // Calculer quelle card est face à nous (position 1-based)
  const getFrontCardPosition = useCallback((rotation: number, quantity: number): number => {
    if (quantity === 0) return 1;

    const anglePerItem = 360 / quantity;
    const normalizedRotation = ((-rotation % 360) + 360) % 360;
    const frontIndex = Math.round(normalizedRotation / anglePerItem) % quantity;

    return frontIndex + 1; // Position 1-based
  }, []);

  const frontCardPosition = getFrontCardPosition(carouselRotation, founders.length);

  // Founder actuellement en face (pour l'overlay avec backdrop-filter)
  const frontFounder = useMemo(() => {
    if (founders.length === 0) return null;
    return founders[frontCardPosition - 1] || null;
  }, [founders, frontCardPosition]);

  // TopTotems du founder frontal
  const frontFounderTotems = useMemo(() => {
    if (!frontFounder) return [];
    return topTotemsMap.get(frontFounder.name) || [];
  }, [frontFounder, topTotemsMap]);

  // Fonction pour centrer automatiquement sur la card la plus proche
  const snapToNearestCard = useCallback(() => {
    if (founders.length === 0) return;

    const anglePerItem = 360 / founders.length;
    // Utiliser la ref pour obtenir la valeur actuelle
    const currentRotation = carouselRotationRef.current;
    // Calculer l'angle de la card la plus proche
    const normalizedRotation = currentRotation % 360;
    const nearestCardIndex = Math.round(-normalizedRotation / anglePerItem);
    const targetRotation = -nearestCardIndex * anglePerItem;

    // Appliquer seulement si différent (évite les re-renders inutiles)
    if (Math.abs(currentRotation - targetRotation) > 0.5) {
      setCarouselRotation(targetRotation);
    }
  }, [founders.length]);

  // Ref pour le touch swipe
  const touchStartXRef = useRef<number>(0);
  const touchLastXRef = useRef<number>(0);

  // Handler pour faire tourner le carrousel avec la molette ET le swipe tactile
  useEffect(() => {
    const carouselSection = carouselSectionRef.current;

    // === WHEEL (souris/trackpad) ===
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.04;
      setCarouselRotation(prev => prev + delta);

      if (autoCenterTimeoutRef.current) {
        clearTimeout(autoCenterTimeoutRef.current);
      }
      autoCenterTimeoutRef.current = setTimeout(() => {
        snapToNearestCard();
      }, AUTO_CENTER_DELAY);
    };

    // === TOUCH (mobile/tablette) ===
    const handleTouchStart = (e: TouchEvent) => {
      touchStartXRef.current = e.touches[0].clientX;
      touchLastXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Empêche le scroll de la page
      const currentX = e.touches[0].clientX;
      const deltaX = touchLastXRef.current - currentX;
      touchLastXRef.current = currentX;

      // Sensibilité du swipe (ajustée pour 42 cards)
      const sensitivity = 0.15;
      setCarouselRotation(prev => prev + deltaX * sensitivity);

      if (autoCenterTimeoutRef.current) {
        clearTimeout(autoCenterTimeoutRef.current);
      }
    };

    const handleTouchEnd = () => {
      // Auto-centrage après le swipe
      autoCenterTimeoutRef.current = setTimeout(() => {
        snapToNearestCard();
      }, AUTO_CENTER_DELAY);
    };

    // Ajouter les event listeners
    if (carouselSection) {
      carouselSection.addEventListener('wheel', handleWheel, { passive: false });
      carouselSection.addEventListener('touchstart', handleTouchStart, { passive: true });
      carouselSection.addEventListener('touchmove', handleTouchMove, { passive: false });
      carouselSection.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (carouselSection) {
        carouselSection.removeEventListener('wheel', handleWheel);
        carouselSection.removeEventListener('touchstart', handleTouchStart);
        carouselSection.removeEventListener('touchmove', handleTouchMove);
        carouselSection.removeEventListener('touchend', handleTouchEnd);
      }
      if (autoCenterTimeoutRef.current) {
        clearTimeout(autoCenterTimeoutRef.current);
      }
    };
  }, [loading, snapToNearestCard]);

  // Handler pour clic sur une card
  const handleCardClick = useCallback((position: number, quantity: number, founderId: string) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();

      // Vérifier si cette card est déjà face à nous
      const isFrontCard = position === frontCardPosition;

      // Si la card est déjà face à nous → ouvrir les panneaux
      if (isFrontCard) {
        selectFounder(founderId);
        return;
      }

      // Sinon → faire la rotation pour mettre cette card en face
      const anglePerItem = 360 / quantity;
      const itemAngle = (position - 1) * anglePerItem;
      const normalizedCurrent = ((carouselRotation % 360) + 360) % 360;
      const targetRotation = carouselRotation - (normalizedCurrent + itemAngle);

      setCarouselRotation(targetRotation);
    };
  }, [carouselRotation, frontCardPosition, selectFounder]);

  return (
    <div className="carousel-page-container">
      {/* ÉCRAN 1: Hero + Stats */}
      <section className="carousel-screen hero-screen">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center pt-20 pb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {t('homePage.title')}
              <span className="block text-slate-400 mt-2">{t('homePage.subtitle')}</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {t('homePage.description')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-20">
            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-bold text-slate-400">{stats.totalFounders}</div>
              <div className="text-white/60">{t('homePage.stats.founders')}</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-bold text-slate-400">{stats.foundersWithAtoms}</div>
              <div className="text-white/60">{t('homePage.stats.onChain')}</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-bold text-slate-400">{stats.totalProposals}</div>
              <div className="text-white/60">{t('homePage.stats.proposals')}</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-4xl font-bold text-slate-400">{stats.foundersWithTotems}</div>
              <div className="text-white/60">{t('homePage.stats.withTotem')}</div>
            </div>
          </div>

          {/* Indicateur scroll down */}
          <div className="text-center animate-bounce">
            <span className="text-white/50 text-sm">Scroll pour voir les founders</span>
            <div className="text-white/30 text-2xl">↓</div>
          </div>
        </div>
      </section>

      {/* ÉCRAN 2: Carrousel uniquement */}
      <section className="carousel-screen carousel-section" ref={carouselSectionRef}>
        {error && (
          <div className="glass-card p-6 text-center text-red-400 absolute top-4 left-1/2 -translate-x-1/2">
            {t('homePage.loadingError')} : {error.message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className='banner-fullscreen'>
              <div
                className='slider'
                style={{
                  '--quantity': founders.length,
                  transform: `rotateY(${carouselRotation}deg)`
                } as React.CSSProperties}
              >
                {founders.map((founder, index) => {
                  const position = index + 1;
                  const distance = getDistanceFromFront(position, frontCardPosition, founders.length);
                  const flipAngle = getFlipAngle(distance);
                  const isFront = position === frontCardPosition;

                  return (
                    <div
                      key={founder.id}
                      className={`item ${isFront ? 'is-front' : ''}`}
                      style={{ '--position': position } as React.CSSProperties}
                    >
                      <FlippableCard
                        founder={founder}
                        topTotems={topTotemsMap.get(founder.name) || []}
                        flipAngle={flipAngle}
                        isFront={isFront}
                        isSelected={founder.id === selectedFounderId}
                        onClick={handleCardClick(position, founders.length, founder.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overlay avec backdrop-filter HORS du contexte 3D */}
            <FrontCardOverlay
              founder={frontFounder}
              topTotems={frontFounderTotems}
              onSelect={selectFounder}
              selectedFounderId={selectedFounderId}
            />
          </>
        )}
      </section>

      {/* Expanded Founder View (when a founder is selected) */}
      {selectedFounder && (
        <FounderExpandedView
          founder={selectedFounder}
          onClose={closeExpandedView}
        />
      )}
    </div>
  );
}
