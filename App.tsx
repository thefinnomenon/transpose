import React, { useState } from 'react';
import Debug from 'debug';
Debug.enable('*');
const debug = Debug('transpose-main');
import Axios from 'axios';
import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  determineProviderFromLink,
  extractAppleLinkInfo,
  extractSpotifyLinkInfo,
} from './src/utlities';
import ElementDisplay, { IMetadata } from './src/components/ElementDisplay';
import ProviderButton from './src/components/ProviderButton';

const baseURL = 'http://2c2312ab.ngrok.io';

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

const App = () => {
  const [inputText, setInputText] = useState('');
  const [state, setState] = useState(State.WAITING);
  const [elementMetadata, setElementMetadata] = useState<IMetadata>();
  const [transposedLinks, setElementLinks] = useState<{
    [key: string]: string;
  }>({});

  const transpose = (link: string) => {
    const provider = determineProviderFromLink(link);
    if (!provider) {
      return;
    }

    debug('Transposing link %o', link);

    const { type, id } = providers[provider].extractLinkInfo(link);

    setState(State.LOADING);
    setInputText('');

    axios
      .get(`/transpose/${provider}/${type}/${id}`)
      .then(response => {
        const element = response.data;
        debug('Transpose Success: %o', element);
        setElementMetadata(element.metadata);
        setElementLinks(element.links);
        setState(State.DONE);
        //openLink(response.data);
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
          <View style={styles.topContent}>
            {elementMetadata && <ElementDisplay metadata={elementMetadata} />}
            {state === State.WAITING && (
              <TextInput
                style={styles.linkInput}
                placeholder="Paste link here to be Transposed!"
                placeholderTextColor="#808080"
                onChangeText={text => {
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
            {Object.keys(providers).map(providerID => (
              <ProviderButton
                key={providerID}
                title={providers[providerID].name}
                link={transposedLinks[providerID]}
              />
            ))}
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
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '15%',
  },
  linkInput: {
    height: 40,
    width: '80%',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
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
