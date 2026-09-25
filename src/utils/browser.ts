import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Safely opens external URLs either inside the Capacitor Chrome Custom Tab / In-App Browser
 * on Android, or via window.open on the web.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({
        url,
        windowName: '_blank',
        presentationStyle: 'popover',
        toolbarColor: '#020617',
      });
      return;
    }
  } catch (error) {
    console.warn('Capacitor Browser failed, falling back to window.open:', error);
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
