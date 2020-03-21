import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import ElementImage from './ElementImage';

type Props = {
  imageUrl: string;
  title: string;
  subtitle: string;
} & typeof defaultProps;

const defaultProps = Object.freeze({
  imageUrl:
    'https://is2-ssl.mzstatic.com/image/thumb/Music118/v4/fe/7f/0b/fe7f0b94-5fa7-06dd-acae-b65a7406822f/source/1200x1200bb.jpg',
});

export const ComponentName = ({ imageUrl, title, subtitle }: Props) => (
  <View style={styles.container}>
    <ElementImage uri={imageUrl} />
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
    marginTop: 12,
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
