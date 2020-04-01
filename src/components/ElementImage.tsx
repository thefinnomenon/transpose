import React from 'react';
import { Platform, Dimensions, StyleSheet, View, Image } from 'react-native';

type Props = {
  type: string;
  uri: string;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const ElementImage = ({ type, uri }: Props) => (
  <View style={Platform.OS === 'ios' ? styles.shadow : null}>
    <Image
      style={type === 'artist' ? styles.circleImage : styles.squareImage}
      source={{ uri }}
      resizeMode="stretch"
    />
  </View>
);

// Drop shadows w/ borderRadius don't work on Android
// so we will only use them for iOS for now...
// https://github.com/facebook/react-native/issues/26544
const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    borderRadius: Math.round(Dimensions.get('window').width / 2),
    backgroundColor: 'transparent',
    elevation: 7,
  },
  squareImage: {
    width: '80%',
    maxHeight: 600,
    aspectRatio: 1,
    borderRadius: 10,
  },
  circleImage: {
    width: '80%',
    maxHeight: 600,
    aspectRatio: 1,
    borderRadius: Math.round(Dimensions.get('window').width / 2),
  },
});

ElementImage.defaultProps = defaultProps;

export default ElementImage;
