import { defineConfig } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';

export default defineConfig([
  // Bundle for background.js
  {
    input: 'background.js',
    output: {
      file: 'dist/background.bundle.js',
      format: 'iife',
      name: 'Background',
    },
    plugins: [nodeResolve()],
  },
  // Bundle for sidepanel/settings.js
  {
    input: 'sidepanel/settings.js',
    output: {
      file: 'dist/sidepanel/settings.bundle.js',
      format: 'iife',
      name: 'SettingsPanel',
    },
    plugins: [nodeResolve()],
  },
]);
