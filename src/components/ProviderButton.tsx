import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
  title: string;
  onPress: () => void;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const ProviderButton = ({ title, onPress }: Props) => (
  <View style={styles.container}>
    <TouchableOpacity style={styles.shareButton} onPress={() => onPress()}>
      <Icon name="ios-share" size={30} color="#fff" />
    </TouchableOpacity>
    <TouchableOpacity style={styles.openButton} onPress={() => onPress()}>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  </View>
);

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
