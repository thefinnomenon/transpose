import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import ElementImage from './ElementImage';

type Props = {
  type: string;
  imageUrl: string;
  title: string;
  subtitle: string;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const ComponentName = ({ type, imageUrl, title, subtitle }: Props) => (
  <View style={styles.container}>
    <ElementImage uri={imageUrl} type={type} />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#080808',
    fontSize: 24,
    marginTop: 20,
    marginBottom: 6,
  },
  subtitle: {
    color: '#282828',
    fontWeight: '300',
    fontSize: 20,
  },
});

ComponentName.defaultProps = defaultProps;

export default ComponentName;
