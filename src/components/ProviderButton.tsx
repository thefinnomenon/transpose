import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const ProviderButton = ({ title, onPress }: Props) => (
  <TouchableOpacity style={styles.container} onPress={() => onPress()}>
    <Text style={styles.title}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
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
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 24,
  },
});

ProviderButton.defaultProps = defaultProps;

export default ProviderButton;
