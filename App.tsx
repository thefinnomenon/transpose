import React, { useState, useEffect, useRef } from 'react';
import Debug from 'debug';
Debug.enable('*');
const debug = Debug('transpose-main');
const { name: APP_NAME, version: APP_VERSION } = require('./package.json');
import codePush from 'react-native-code-push';
import * as Sentry from '@sentry/react-native';
import ShareExtension from './ShareExtension';
import LottieView from 'lottie-react-native';
import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  View,
  Image,
  Linking,
  Animated,
} from 'react-native';
import {
  checkLinkAndExtractInfo,
  transpose,
  resolveTranspose,
  MetadataType,
  ElementType,
} from './src/utlities';
import Header from './src/components/Header';
import Results from './src/components/Results';
import LinkInput from './src/components/LinkInput';
import SplashScreen from './src/components/SplashScreen';
import normalize from './src/utlities/responsive';

debug(
  // @ts-ignore
  `${APP_NAME}@${APP_VERSION} (${process.env.NODE_ENV})`,
);

Sentry.init({
  dsn: 'https://0dce81deaa69439db31d5b7ed0e40653@sentry.io/5183048',
  release: `${APP_NAME}@${APP_VERSION}`,
});

codePush.getUpdateMetadata().then(update => {
  if (update) {
    debug(
      'CodePush Update: %o',
      `${update.appVersion}-codepush:${update.label}`,
    );
    Sentry.setRelease(update.appVersion + '-codepush:' + update.label);
  }
});

const App = (props: any) => {
  const [state, setState] = useState(State.INITIALIZING);
  const [url, setURL] = useState<string | null>(null);
  const [method, setMethod] = useState('');
  const [installedProviders, setInstalledProviders] = useState<{
    [key: string]: boolean;
  }>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasTimeHasPassed, setTimeHasPassed] = useState(false);

  // Set Timer to ensure minimum time SplashScreen is shown
  useEffect(() => {
    setTimeout(() => setTimeHasPassed(true), 3000);
  }, []);

  // Check if launched via Android share and handle
  useEffect(() => {
    debug('App Launched with props: ', props);
    if (props.url) {
      setURL(props.url);
      setMethod('Share');
    }
  }, [props.url]);

  // Check if launched via deep link
  // Note:
  //  includes iOS shares since I had to use a workaround
  //  of launching the app via a deep link from the share sheet
  useEffect(() => {
    Linking.getInitialURL()
      .then(url => {
        debug('Initial URL: %o', url);
        if (url) {
          setURL(url);
          setMethod('Link');
        }
        setIsInitialized(true);
      })
      .catch(error => debug('Get Initial URL Error: %O', error));

    const handleLinkingEvent = ({ url }: { url: string }) => {
      debug('Linking Event: %o', url);
      setURL(url);
      setMethod('Link');
    };

    Linking.addEventListener('url', handleLinkingEvent);
    return () => {
      Linking.removeEventListener('url', handleLinkingEvent);
    };
  }, []);

  // Check which providers are installed
  useEffect(() => {
    debug('Checking Installed Providers');
    async function checkInstalledProviders() {
      const providers: { [key: string]: boolean } = {};
      try {
        providers.spotify = await Linking.canOpenURL('spotify://');
      } catch (e) {}
      try {
        providers.apple = await Linking.canOpenURL('music://');
      } catch (e) {}
      setInstalledProviders(providers);
      debug('Installed Providers: %O', providers);
    }
    checkInstalledProviders();
  }, []);

  const isDone = isInitialized && hasTimeHasPassed && installedProviders;

  // Handle fade out & in
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const mainOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isDone) {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setState(State.DONE);
        Animated.timing(mainOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isDone]);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {state === State.INITIALIZING && (
          <Animated.View style={{ flex: 1, opacity: splashOpacity }}>
            <SplashScreen />
          </Animated.View>
        )}
        {state === State.DONE && (
          <Animated.View style={{ flex: 1, opacity: mainOpacity }}>
            <Main
              url={url}
              method={method ? method : 'Input'}
              installedProviders={{}}
            />
          </Animated.View>
        )}
      </SafeAreaView>
    </>
  );
};

enum State {
  INITIALIZING,
  WAITING,
  LOADING,
  DONE,
}

const initState = {
  inputText: '',
  state: State.WAITING,
  method: '',
  metadata: {
    type: 'track' as ElementType,
    images: [''],
    track: '',
    artist: '',
    album: '',
  },
  links: {},
};

type Props = {
  url: string | null;
  method: string;
  installedProviders: { [key: string]: boolean };
};

const Main = (props: Props) => {
  const { method, installedProviders } = props;
  const [inputText, setInputText] = useState(initState.inputText);
  const [state, setState] = useState(props.url ? State.LOADING : State.WAITING);
  const [metadata, setMetadata] = useState<MetadataType>(initState.metadata);
  const [links, setLinks] = useState<{ [key: string]: string }>(
    initState.links,
  );

  // Check if url in props is valid and handle
  useEffect(() => {
    debug('Main props: ', props);
    if (props.url) {
      handleLink(props.url);
    } else {
      setState(State.WAITING);
    }
  }, [props.url]);

  // Check if link and if so handle it accordingly
  const handleLink = async (link: string | null) => {
    if (!link) {
      return;
    }
    const linkInfo = checkLinkAndExtractInfo(link);
    let element;
    switch (linkInfo?.provider) {
      case 'transpose':
        debug('Resolving link from %o\n %o', method, link);
        setState(State.LOADING);
        element = await resolveTranspose(linkInfo.id);
        break;
      case 'spotify':
      case 'apple':
        debug('Transposing link from %o\n %o', method, link);
        setState(State.LOADING);
        element = await transpose({ ...linkInfo });
        break;
      default:
        debug('Unsupported Provider');
        return;
    }

    if (!element) {
      debug('Transposing or Resolving Failed.');
      setState(State.WAITING);
      return;
    }

    debug('Successfully retrieved element: %O', element);
    await Image.prefetch(element.metadata.images[1]);
    debug('Prefetched Image!');
    setMetadata(element.metadata);
    setLinks(element.links);
    setState(State.DONE);
  };

  // On back press, set state back to initial state
  const handleBackPress = () => {
    setInputText(initState.inputText);
    setMetadata(initState.metadata);
    setLinks(initState.links);
    setState(initState.state);
  };

  // On close press, close app (only for Share launch)
  const handleClosePress = () => {
    ShareExtension.close();
  };

  // On text change, update input text & check if valid link
  const handleOnChangeText = (text: string) => {
    setInputText(text);
    handleLink(text);
  };

  // Handle fade out & in
  const linkInputOpacity = useRef(new Animated.Value(1)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    switch (state) {
      case State.WAITING:
        Animated.timing(linkInputOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        break;
      case State.LOADING:
        Animated.timing(loaderOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        break;
      case State.DONE:
        Animated.timing(resultsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        linkInputOpacity.setValue(0);
    }
  }, [state]);

  return (
    <>
      <View style={styles.container}>
        {state === State.WAITING && (
          <Animated.View style={{ flex: 1, opacity: linkInputOpacity }}>
            <LinkInput
              inputText={inputText}
              handleOnChangeText={handleOnChangeText}
            />
          </Animated.View>
        )}
        {state === State.LOADING && (
          <Animated.View style={{ opacity: loaderOpacity }}>
            <LottieView
              style={styles.loader}
              source={require('./resources/loader.json')}
              autoPlay
              loop
            />
          </Animated.View>
        )}
        {state === State.DONE && (
          <Animated.View
            style={{ width: '100%', height: '100%', opacity: resultsOpacity }}>
            <Header
              showBackButton={state === State.DONE && method === 'Input'}
              showCloseButton={state === State.DONE && method === 'Share'}
              onBackPress={handleBackPress}
              onClosePress={handleClosePress}
            />
            <Results
              metadata={metadata}
              links={links}
              installedProviders={installedProviders}
            />
          </Animated.View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    width: normalize(100),
  },
});

export default App;
