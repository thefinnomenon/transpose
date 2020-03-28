/**
 * This exposes the native ShareExtension module as a JS module.
 *
 * data(): Retrieve data from share Intent
 * close(): Closes share Activity
 *
 */
import { NativeModules, Platform } from 'react-native';

let ShareExtension = { close: () => {} };
if (Platform.OS === 'android') {
  ShareExtension = NativeModules.ShareExtension;
}

export default ShareExtension;
