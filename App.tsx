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
import Main from './src/components/Main';
import LinkInput from './src/components/LinkInput';

enum State {
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
  url: string;
};

const App = (props: any) => {
  const [inputText, setInputText] = useState(initState.inputText);
  const [state, setState] = useState(initState.state);
  const [method, setMethod] = useState(initState.method);
  const [metadata, setMetadata] = useState<MetadataType>(initState.metadata);
  const [links, setLinks] = useState<{ [key: string]: string }>(
    initState.links,
  );

  // Check if launched via deep link and register deep link listener
  // Note:
  //  this also includes iOS shares since I had to use a workaround
  //  of launching the app via a deep link from the share sheet
  useEffect(() => {
    Linking.getInitialURL()
      .then(url => {
        debug('Initial URL: %o', url);
        handleLink(url, 'DEEPLINK');
      })
      .catch(error => debug('Get Initial URL Error: %O', error));

    const handleLinkingEvent = ({ url }: { url: string }) => {
      debug('Linking Event: %o', url);
      handleLink(url, 'DEEPLINK');
    };

    Linking.addEventListener('url', handleLinkingEvent);
    return () => {
      Linking.removeEventListener('url', handleLinkingEvent);
    };
  }, []);

  // Check if launched via Android share and handle
  useEffect(() => {
    debug('App Launched with props: ', props);
    if (props.url) {
      setMethod('Share');
      handleLink(props.url, 'Share');
    }
  }, [props.url]);

  // Check if link and if so handle it accordingly
  const handleLink = async (link: string | null, source: string) => {
    if (!link) {
      return;
    }
    const linkInfo = checkLinkAndExtractInfo(link);
    let element;
    switch (linkInfo?.provider) {
      case 'transpose':
        debug('Resolving link from %o\n %o', source, link);
        setState(State.LOADING);
        element = await resolveTranspose(linkInfo.id);
        break;
      case 'spotify':
      case 'apple':
        debug('Transposing link from %o\n %o', source, link);
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
    setMethod('LinkInput');
    handleLink(text, 'LinkInput');
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {state !== State.LOADING && (
            <Header
              showBackButton={state === State.DONE && method === 'LinkInput'}
              showCloseButton={state === State.DONE && method === 'Share'}
              onBackPress={handleBackPress}
              onClosePress={handleClosePress}
            />
          )}
          <View style={styles.topContent}>
            {state === State.DONE && <Main metadata={metadata} links={links} />}
            {state === State.WAITING && (
              <LinkInput
                inputText={inputText}
                handleOnChangeText={handleOnChangeText}
              />
            )}
            {state === State.LOADING && (
              <ActivityIndicator size="large" color="#101010" />
            )}
          </View>
        </View>
      </SafeAreaView>
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
  topContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttons: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '80%',
  },
});

export default App;
