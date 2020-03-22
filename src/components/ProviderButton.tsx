import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/EvilIcons';

type Props = {
  title: string;
  link: string;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const ProviderButton = ({ title, link }: Props) => (
  <View style={styles.container}>
    <TouchableOpacity
      style={styles.shareButton}
      disabled={link == null}
      onPress={() => console.log('Share link: %o', link)}>
      <Icon
        name={Platform.OS === 'ios' ? 'share-apple' : 'share-google'}
        size={40}
        color="#fff"
      />
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.openButton}
      disabled={link == null}
      onPress={() => openLink(link)}>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  </View>
);

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
  container: {
    flexDirection: 'row',
    width: '90%',
    aspectRatio: 4.8,
    backgroundColor: '#808080',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 2,
    borderRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareButton: {
    flex: 2,
    borderRightWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openButton: {
    flex: 7,
  },
  title: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 24,
  },
});

ProviderButton.defaultProps = defaultProps;

export default ProviderButton;
