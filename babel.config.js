module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-includes the react-native-worklets plugin
    // (required by Reanimated 4) when reanimated is installed.
    presets: ["babel-preset-expo"],
  };
};
