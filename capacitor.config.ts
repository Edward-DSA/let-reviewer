import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.edward.letreviewer',
  appName: 'LET Reviewer',
  webDir: 'out',
  // Load the live Vercel deployment inside the WebView
  server: {
    url: 'https://let-reviewer-virid.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0f1e',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // We handle splash screen ourselves
    },
  },
};

export default config;
