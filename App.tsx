import React, { useState, useEffect } from 'react';
import Debug from 'debug';
Debug.enable('*');
const debug = Debug('transpose-main');
import ShareExtension from './ShareExtension';
import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  View,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  checkLinkAndExtractInfo,
  openShare,
  transpose,
  resolveTranspose,
  MetadataType,
  Element,
  ElementType,
} from './src/utlities';
import Header from './src/components/Header';
import Results from './src/components/Results';
import LinkInput from './src/components/LinkInput';
import SplashScreen from './src/components/SplashScreen';

const App = (props: any) => {
  const [url, setURL] = useState<string | null>(null);
  const [method, setMethod] = useState('');
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

  const isDone = isInitialized && hasTimeHasPassed;

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {!isDone && <SplashScreen />}
        {isDone && <Main url={url} method={method ? method : 'Input'} />}
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
};

const Main = (props: Props) => {
  const { method } = props;
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
    handleLink(text, 'Input');
  };

  return (
    <>
      <View style={styles.container}>
        {state === State.INITIALIZING && <SplashScreen />}
        {state === State.WAITING && (
          <LinkInput
            inputText={inputText}
            handleOnChangeText={handleOnChangeText}
          />
        )}
        {state === State.LOADING && (
          <ActivityIndicator size="large" color="#101010" />
        )}
        {state === State.DONE && (
          <>
            <Header
              showBackButton={state === State.DONE && method === 'Input'}
              showCloseButton={state === State.DONE && method === 'Share'}
              onBackPress={handleBackPress}
              onClosePress={handleClosePress}
            />
            <Results metadata={metadata} links={links} />
          </>
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
});

export default App;
