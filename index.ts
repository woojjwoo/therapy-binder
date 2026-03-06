// Polyfill Buffer globally — required by bip39 and other crypto libs in Hermes
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
