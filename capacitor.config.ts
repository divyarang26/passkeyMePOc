import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'passkeyPOC',
  webDir: 'dist',
  bundledWebRuntime: false,
    server: {
    url: 'https://802a-2409-40c4-342-ddf8-c7bf-5f59-5f7b-b395.ngrok-free.app', // Remove or comment this line
  },

};

export default config;
