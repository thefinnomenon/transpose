/**
 * @format
 */

import { AppRegistry } from 'react-native';
import codePush from 'react-native-code-push';
import App from './App';
import { name as appName } from './app.json';

// Wrap App in CodePush functionality
const CodePushApp = codePush(App);

AppRegistry.registerComponent(appName, () => CodePushApp);
