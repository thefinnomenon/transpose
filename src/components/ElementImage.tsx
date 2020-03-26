import React from 'react';
import { Dimensions, StyleSheet, View, Image } from 'react-native';

type Props = {
  type: string;
  uri: string;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const ElementImage = ({ type, uri }: Props) => (
  <View style={styles.shadow}>
    <Image
      style={type === 'artist' ? styles.circleImage : styles.squareImage}
      source={{ uri }}
      resizeMode="stretch"
    />
  </View>
);

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
    elevation: 5,
  },
  squareImage: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  circleImage: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: Math.round(Dimensions.get('window').width / 2),
  },
});

ElementImage.defaultProps = defaultProps;

export default ElementImage;
