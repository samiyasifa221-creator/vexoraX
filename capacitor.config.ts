import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.samiyasifa.vexorax',
  appName: 'VexoraX',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow local development and secure API endpoints
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#020617',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;
