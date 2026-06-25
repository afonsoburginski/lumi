module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 usa o plugin do worklets, que DEVE ser o último da lista.
    plugins: ['react-native-worklets/plugin'],
  };
};
