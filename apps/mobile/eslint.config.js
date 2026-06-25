// Flat config (ESLint 9). Base do Expo + desativa regras que conflitam com o Prettier.
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  prettier,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'android/*', 'ios/*', 'expo-env.d.ts'],
  },
  // Regras novas do React Compiler são agressivas: mantemos como aviso (não bloqueiam).
  {
    rules: {
      'react/display-name': 'off',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Código vendido pela BNA UI (nós o possuímos, mas não impomos nossas regras estritas).
  {
    files: ['src/components/ui/**', 'src/hooks/useColorScheme*'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-duplicates': 'off',
    },
  },
];
