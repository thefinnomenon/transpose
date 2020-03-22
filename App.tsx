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
  const [inputText, setInputText] = useState('');
  const [state, setState] = useState(State.WAITING);
  const [elementInfo, setElementInfo] = useState({
    id: '',
    type: '',
    imageUrl: '',
    title: '',
    subtitle: '',
  });
  const [transposedLinks, setTransposedLinks] = useState<{
    [key: string]: string;
  }>({});

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
        const element = response.data;
        setElementInfo({
          id: element.id,
          type: element.type,
          imageUrl: element.images[0].url,
          title: element.title,
          subtitle: element.artist,
        });
        setTransposedLinks({
          ...transposedLinks,
          [destProvider]: element.link,
        });
        setInputText('');
        setState(State.DONE);
        //openLink(response.data);
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
                type={elementInfo.type}
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
