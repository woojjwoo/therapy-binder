const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Stub out packages not available in Expo Go
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-html-to-pdf': path.resolve(__dirname, 'stubs/react-native-html-to-pdf.js'),
  'react-native-draggable-flatlist': path.resolve(__dirname, 'stubs/react-native-draggable-flatlist.js'),
};

module.exports = config;
