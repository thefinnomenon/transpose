import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

type Props = {
  uri: string;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const ElementImage = ({ uri }: Props) => (
  <View style={styles.shadow}>
    <Image style={styles.image} source={{ uri }} />
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
    elevation: 5,
  },
  image: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 10,
  },
});

ElementImage.defaultProps = defaultProps;

export default ElementImage;
