import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'passkeyPOC',
  webDir: 'dist',
  bundledWebRuntime: false,
    server: {
    url: 'https://9ead-110-227-204-245.ngrok-free.app/', // Remove or comment this line
  },
};

export default config;
