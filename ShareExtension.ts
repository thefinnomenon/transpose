/**
 * This exposes the native ShareExtension module as a JS module.
 *
 * data(): Retrieve data from share Intent
 * close(): Closes share Activity
 *
 */
import { NativeModules } from 'react-native';
export default NativeModules.ShareExtension;
