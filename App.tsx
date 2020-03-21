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
  Linking,
} from 'react-native';
import { determineProviderFromLink } from './src/utlities';
import ElementDisplay from './src/components/ElementDisplay';
import ProviderButton from './src/components/ProviderButton';

const baseURL = 'http://f1cf0b07.ngrok.io';

enum State {
  WAITING,
  LOADING,
  DONE,
}

const axios = Axios.create({
  baseURL,
});

const providers: { [key: string]: { name: string; icon: string } } = {
  spotify: {
    name: 'Spotify',
    icon: '',
  },
  apple: {
    name: 'Apple Music',
    icon: '',
  },
};

const App = () => {
  const [link, setLink] = useState('');
  const [state, setState] = useState(State.WAITING);
  const [elementInfo, setElementInfo] = useState({
    imageUrl: '',
    title: '',
    subtitle: '',
  });
  const [transposedLinks, setTransposedLinks] = useState<{
    [key: string]: string;
  }>({
    spotify:
      'https://open.spotify.com/track/2TpZlmChocrfeL5J6ed70t?si=1JWq_So9TM6XR2TmEsr_KA',
  });

  const transpose = (link: string) => {
    const provider = determineProviderFromLink(link);

    if (!provider) {
      return;
    }

    let destProvider = '';

    if (provider === 'spotify') {
      destProvider = 'apple';
    } else {
      destProvider = 'spotify';
    }

    debug('Transposing link from %o to %o: \n%o', provider, destProvider, link);
    setState(State.LOADING);

    axios
      .post('/convert', {
        link,
        destProviderID: destProvider,
      })
      .then(function(response) {
        debug('Transpose Success: %o', response.data);
        const transposedLink = response.data;
        setTransposedLinks({
          ...transposedLinks,
          [destProvider]: transposedLink,
        });
        setLink('');
        setState(State.DONE);
        openLink(response.data);
      })
      .catch(function(error) {
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
            {state === State.DONE && (
              <ElementDisplay
                imageUrl={elementInfo.imageUrl}
                title={elementInfo.title}
                subtitle={elementInfo.subtitle}
              />
            )}
            {state === State.WAITING && (
              <TextInput
                style={styles.linkInput}
                placeholder="Paste link here to be Transposed!"
                placeholderTextColor="#808080"
                onChangeText={text => {
                  setLink(text);
                  transpose(text);
                }}
                value={link}
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
                onPress={() => console.log(transposedLinks[providerID])}
              />
            ))}
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
        return Linking.openURL(link);
      }
    })
    .catch(err => console.error('An error occurred', err));
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
