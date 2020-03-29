import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import ElementImage from './ElementImage';
import { MetadataType } from '../utlities';
import normalize from '../utlities/responsive';

type Props = {
  metadata: MetadataType;
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const ComponentName = ({ metadata }: Props) => {
  const { type, images } = metadata;
  let title,
    subtitle = '';

  switch (type) {
    case 'track':
      title = metadata.track;
      subtitle = metadata.artist;
      break;
    case 'artist':
      title = metadata.artist;
      break;
    case 'album':
      title = metadata.album;
      subtitle = metadata.artist;
  }

  return (
    <View style={styles.container}>
      <ElementImage uri={images[1]} type={type} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#080808',
    fontSize: normalize(24),
    marginTop: normalize(10),
    marginBottom: normalize(2),
  },
  subtitle: {
    color: '#282828',
    fontWeight: '300',
    fontSize: normalize(20),
  },
});

ComponentName.defaultProps = defaultProps;

export default ComponentName;
