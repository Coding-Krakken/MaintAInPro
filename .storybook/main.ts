import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async config => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
        '@/components': path.resolve(__dirname, '../src/components'),
        '@/pages': path.resolve(__dirname, '../src/pages'),
        '@/modules': path.resolve(__dirname, '../src/modules'),
        '@/hooks': path.resolve(__dirname, '../src/hooks'),
        '@/utils': path.resolve(__dirname, '../src/utils'),
        '@/types': path.resolve(__dirname, '../src/types'),
        '@/stores': path.resolve(__dirname, '../src/stores'),
        '@/services': path.resolve(__dirname, '../src/services'),
        '@/constants': path.resolve(__dirname, '../src/constants'),
        '@/assets': path.resolve(__dirname, '../src/assets'),
      };
    }
    return config;
  },
};

export default config;
