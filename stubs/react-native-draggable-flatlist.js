// Stub for react-native-draggable-flatlist — not available in Expo Go
const React = require('react');
const { FlatList } = require('react-native');

function DraggableFlatList(props) {
  return React.createElement(FlatList, props);
}

DraggableFlatList.displayName = 'DraggableFlatList';

module.exports = DraggableFlatList;
module.exports.default = DraggableFlatList;
module.exports.ScaleDecorator = ({ children }) => children;
module.exports.ShadowDecorator = ({ children }) => children;
module.exports.OpacityDecorator = ({ children }) => children;
module.exports.NestableScrollContainer = ({ children }) => children;
module.exports.NestableDraggableFlatList = DraggableFlatList;
