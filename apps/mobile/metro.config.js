// Metro configurado para monorepo (bun workspaces).
// Permite ao app resolver pacotes do workspace (ex.: @lumi/shared) e o node_modules da raiz.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Observar a raiz do monorepo (para mudanças em packages/*)
config.watchFolders = [workspaceRoot];

// 2. Resolver módulos a partir do app e da raiz
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Evitar resolução hierárquica ambígua de versões duplicadas
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
