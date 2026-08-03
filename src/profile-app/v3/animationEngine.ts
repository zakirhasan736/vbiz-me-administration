export type V3AnimationPreset =
  'dynamic' | 'flip-left' | 'flip-right' | 'slide-left' | 'slide-right' | 'slide-top' | 'slide-bottom' | 'fade' | 'zoom'

export type V3AnimationProps = {
  initial: Record<string, number | string>
  animate: Record<string, number | string>
  exit: Record<string, number | string>
  transition: Record<string, unknown>
  style?: Record<string, string | number>
}

/** No-op animation — used on first paint to avoid blocking content with motion work. */
export const STATIC_ANIMATION_PROPS: V3AnimationProps = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 },
  transition: { duration: 0 },
}

export function getV3AnimationProps(
  tab: string,
  preset: V3AnimationPreset,
  duration: number,
  isMobile: boolean
): V3AnimationProps {
  const flipAngle = isMobile ? 45 : 85

  if (preset === 'dynamic') {
    switch (tab) {
      case 'home':
        return {
          initial: { opacity: 0, y: -40, rotateX: 0, rotateY: 0 },
          animate: { opacity: 1, y: 0, rotateX: 0, rotateY: 0 },
          exit: { opacity: 0, y: 50, rotateX: 0, rotateY: 0 },
          transition: { duration, ease: [0.16, 1, 0.3, 1] },
        }
      case 'about':
      case 'services':
      case 'gallery':
      case 'reviews':
        return {
          initial: { opacity: 0, rotateY: flipAngle, x: isMobile ? 40 : 150, scale: 0.94 },
          animate: { opacity: 1, rotateY: 0, x: 0, scale: 1 },
          exit: { opacity: 0, rotateY: -flipAngle, x: isMobile ? -40 : -150, scale: 0.94 },
          transition: { duration, ease: [0.16, 1, 0.3, 1] },
          style: { transformOrigin: 'right center', perspective: '1200px' },
        }
      case 'mission':
      case 'additional':
      case 'videos':
      case 'certificates':
        return {
          initial: { opacity: 0, rotateY: -flipAngle, x: isMobile ? -40 : -150, scale: 0.94 },
          animate: { opacity: 1, rotateY: 0, x: 0, scale: 1 },
          exit: { opacity: 0, rotateY: flipAngle, x: isMobile ? 40 : 150, scale: 0.94 },
          transition: { duration, ease: [0.16, 1, 0.3, 1] },
          style: { transformOrigin: 'left center', perspective: '1200px' },
        }
      case 'faq':
      case 'public-cards':
        return {
          initial: { opacity: 0, y: isMobile ? 60 : 140, rotateX: isMobile ? 12 : 20, scale: 0.96 },
          animate: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
          exit: { opacity: 0, y: isMobile ? -60 : -140, rotateX: isMobile ? -12 : -20, scale: 0.96 },
          transition: { duration, ease: [0.16, 1, 0.3, 1] },
          style: { transformOrigin: 'center bottom', perspective: '1200px' },
        }
      case 'calendar':
      case 'blog':
      case 'explainer':
        return {
          initial: { opacity: 0, y: isMobile ? -60 : -140, rotateX: isMobile ? -12 : -20, scale: 0.96 },
          animate: { opacity: 1, y: 0, rotateX: 0, scale: 1 },
          exit: { opacity: 0, y: isMobile ? 60 : 140, rotateX: isMobile ? 12 : 20, scale: 0.96 },
          transition: { duration, ease: [0.16, 1, 0.3, 1] },
          style: { transformOrigin: 'center top', perspective: '1200px' },
        }
      default:
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -20 },
          transition: { duration, ease: 'easeOut' },
        }
    }
  }

  switch (preset) {
    case 'flip-left':
      return {
        initial: { opacity: 0, rotateY: -flipAngle, x: isMobile ? -60 : -200, scale: 0.94 },
        animate: { opacity: 1, rotateY: 0, x: 0, scale: 1 },
        exit: { opacity: 0, rotateY: flipAngle, x: isMobile ? 60 : 200, scale: 0.94 },
        transition: { duration, ease: [0.16, 1, 0.3, 1] },
        style: { transformOrigin: 'left center', perspective: '1200px' },
      }
    case 'flip-right':
      return {
        initial: { opacity: 0, rotateY: flipAngle, x: isMobile ? 60 : 200, scale: 0.94 },
        animate: { opacity: 1, rotateY: 0, x: 0, scale: 1 },
        exit: { opacity: 0, rotateY: -flipAngle, x: isMobile ? -60 : -200, scale: 0.94 },
        transition: { duration, ease: [0.16, 1, 0.3, 1] },
        style: { transformOrigin: 'right center', perspective: '1200px' },
      }
    case 'slide-left':
      return {
        initial: { opacity: 0, x: isMobile ? -120 : -400, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: isMobile ? 120 : 400, scale: 0.98 },
        transition: { duration, ease: [0.16, 1, 0.3, 1] },
      }
    case 'slide-right':
      return {
        initial: { opacity: 0, x: isMobile ? 120 : 400, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: isMobile ? -120 : -400, scale: 0.98 },
        transition: { duration, ease: [0.16, 1, 0.3, 1] },
      }
    case 'slide-top':
      return {
        initial: { opacity: 0, y: isMobile ? -100 : -350, rotateX: -10 },
        animate: { opacity: 1, y: 0, rotateX: 0 },
        exit: { opacity: 0, y: isMobile ? 100 : 350, rotateX: 10 },
        transition: { duration, ease: [0.16, 1, 0.3, 1] },
      }
    case 'slide-bottom':
      return {
        initial: { opacity: 0, y: isMobile ? 100 : 350, rotateX: 10 },
        animate: { opacity: 1, y: 0, rotateX: 0 },
        exit: { opacity: 0, y: isMobile ? -100 : -350, rotateX: -10 },
        transition: { duration, ease: [0.16, 1, 0.3, 1] },
      }
    case 'fade':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration, ease: 'easeInOut' },
      }
    case 'zoom':
      return {
        initial: { opacity: 0, scale: 0.85 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.08 },
        transition: { duration, ease: [0.16, 1, 0.3, 1] },
      }
    default:
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration },
      }
  }
}
