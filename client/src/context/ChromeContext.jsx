// ChromeContext — lets a full-bleed page (error / offline) tell App to drop the
// global Navbar + Footer, even when the page is the catch-all 404 whose URL is
// unknown ahead of time (so pathname-prefix hiding can't reach it).
//
// App owns the boolean and passes the setter down. A page calls useHideChrome()
// once; the hook hides chrome on mount and restores it on unmount. useLayoutEffect
// flips the flag before paint, so the navbar never visibly flashes.
import { createContext, useContext, useLayoutEffect } from 'react';

export const ChromeContext = createContext({ setChromeHidden: () => {} });

export function useHideChrome() {
  const { setChromeHidden } = useContext(ChromeContext);
  useLayoutEffect(() => {
    setChromeHidden(true);
    return () => setChromeHidden(false);
  }, [setChromeHidden]);
}

export default ChromeContext;
