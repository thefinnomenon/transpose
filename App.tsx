import React, { useState, useEffect } from 'react';
import Debug from 'debug';
Debug.enable('*');
const debug = Debug('transpose-main');
import Axios from 'axios';
import Share from 'react-native-share';
import ShareExtension from './ShareExtension';

import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  determineProviderFromLink,
  extractAppleLinkInfo,
  extractSpotifyLinkInfo,
} from './src/utlities';
import Header from './src/components/Header';
import ElementDisplay from './src/components/ElementDisplay';
import ProviderButton from './src/components/ProviderButton';

const baseURL = 'http://2c2312ab.ngrok.io';

export type ElementType = 'track' | 'artist' | 'album';

export type MetadataType = {
  type: ElementType;
  images: string[];
  track: string;
  artist: string;
  album: string;
};

export type Element = {
  metadata: MetadataType;
  links: { [key: string]: string };
};

enum State {
  WAITING,
  LOADING,
  DONE,
}

const axios = Axios.create({
  baseURL,
});

const providers: {
  [key: string]: { name: string; icon: string; extractLinkInfo: Function };
} = {
  spotify: {
    name: 'Spotify',
    icon: '',
    extractLinkInfo: extractSpotifyLinkInfo,
  },
  apple: {
    name: 'Apple Music',
    icon: '',
    extractLinkInfo: extractAppleLinkInfo,
  },
};

const initState = {
  inputText: '',
  state: State.WAITING,
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
  const [metadata, setMetadata] = useState<MetadataType>(initState.metadata);
  const [links, setLinks] = useState<{ [key: string]: string }>(
    initState.links,
  );

  const handleOpenURL = ({ url }: { url: string }) => {
    debug('Handle Open URL: %o', url);
    transpose(url);
  };

  const handleBackPress = () => {
    setInputText(initState.inputText);
    setMetadata(initState.metadata);
    setLinks(initState.links);
    setState(initState.state);
  };

  const handleSettingsPress = () => {
    debug('Open settings modal');
  };

  // Check if launched via share
  useEffect(() => {
    debug('App Launched with props: ', props);
    ShareExtension.data().then((data: { value: string; type: string }) => {
      debug('Share Extension Data: %o', data);
    });
    if (props.url) {
      transpose(props.url);
    }
  }, [props.url]);

  // // Check if launched via deep link and
  // // register deep link listener
  // useEffect(() => {
  //   Linking.getInitialURL()
  //     .then(url => handleOpenURL({ url: `${url}` }))
  //     .catch(error => debug('Get Initial URL Error: %O', error));

  //   Linking.addEventListener('url', handleOpenURL);
  //   return () => {
  //     Linking.removeEventListener('url', handleOpenURL);
  //   };
  // }, []);

  const transpose = (link: string) => {
    const provider = determineProviderFromLink(link);
    if (!provider) {
      return;
    }

    debug('Transposing link %o', link);
    const { type, id } = providers[provider].extractLinkInfo(link);
    setState(State.LOADING);

    axios
      .get(`/transpose/${provider}/${type}/${id}`)
      .then(async response => {
        const element: Element = response.data;
        debug('Transpose Success: %o', element);
        setMetadata(element.metadata);
        setLinks(element.links);
        await Image.prefetch(element.metadata.images[1]);
        debug('Prefetched Image!');
        setState(State.DONE);
        setTimeout(
          () => openShare(element.metadata, element.links.transpose),
          1500,
        );
      })
      .catch(error => {
        debug('Transpose Error: %o', error);
        setState(State.WAITING);
      });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {state !== State.LOADING && (
            <Header
              showBackButton={state === State.DONE}
              onBackPress={handleBackPress}
              onSettingsPress={handleSettingsPress}
            />
          )}
          <View style={styles.topContent}>
            {state === State.DONE && <ElementDisplay metadata={metadata} />}
            {state === State.WAITING && (
              <TextInput
                style={styles.linkInput}
                placeholder="Paste link here to be Transposed!"
                placeholderTextColor="#808080"
                onChangeText={text => {
                  debug('ONCHANGETEXT: %o', text);
                  setInputText(text);
                  transpose(text);
                }}
                value={inputText}
              />
            )}
            {state === State.LOADING && (
              <ActivityIndicator size="large" color="#101010" />
            )}
          </View>
          <View style={styles.buttons}>
            {state === State.DONE && (
              <View>
                <ProviderButton
                  key="transpose"
                  title="Transpose"
                  link={links.transpose}
                  metadata={metadata}
                  handleShare={openShare}
                  handleOpen={openLink}
                />
                {Object.keys(providers).map(providerID => (
                  <ProviderButton
                    key={providerID}
                    title={providers[providerID].name}
                    link={links[providerID]}
                    metadata={metadata}
                    handleShare={openShare}
                    handleOpen={openLink}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const openLink = (link: string) => {
  Linking.canOpenURL(link)
    .then(supported => {
      if (!supported) {
        console.log("Can't handle url: " + link);
      } else {
        Linking.openURL(link);
      }
    })
    .catch(err => console.error('An error occurred', err));
};

const openShare = (metadata: MetadataType, link: string) => {
  const message = formatMessage(metadata);
  Share.open({
    url: link,
    message,
    title: message,
    subject: `Checkout this ${metadata.type}!`,
  })
    .then(res => {
      debug(res);
      ShareExtension.close();
    })
    .catch(err => {
      debug(err);
    });
};

const formatMessage = ({ type, album, artist, track }: MetadataType) => {
  switch (type) {
    case 'track':
      return `${artist} - ${track}`;
    case 'artist':
      return artist;
    case 'album':
      return `${artist} - ${album}`;
  }
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
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '5%',
  },
  linkInput: {
    height: 40,
    width: 300, //'80%',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    textAlign: 'center',
    color: '#101010',
  },
  buttons: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '80%',
  },
});

export default App;
