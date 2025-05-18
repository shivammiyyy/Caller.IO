import * as React from "react"

const MOBILE_BREAKPOINT = 768;

/**
 * Custom hook to detect if viewport width is less than mobile breakpoint.
 * Handles SSR and cross-browser matchMedia event listener API.
 * @returns {boolean} isMobile
 */
export function useIsMobile() {
  const isClient = typeof window !== 'undefined' && typeof window.matchMedia === 'function';

  const getIsMobile = React.useCallback(() => {
    if (!isClient) return false;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
  }, [isClient]);

  const [isMobile, setIsMobile] = React.useState(getIsMobile);

  React.useEffect(() => {
    if (!isClient) return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const listener = (event) => {
      setIsMobile(event.matches);
    };

    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', listener);
    } else {
      // Safari and older
      mql.addListener(listener);
    }

    // Cleanup
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', listener);
      } else {
        mql.removeListener(listener);
      }
    };
  }, [isClient, getIsMobile]);

  return isMobile;
}
