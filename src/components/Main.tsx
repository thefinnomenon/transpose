import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MetadataType } from 'App';
import ElementDisplay from './ElementDisplay';
import { openLink, openShare } from '../../src/utlities';
import Button from './Button';

type Props = {
  metadata: MetadataType;
  links: { [key: string]: string };
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const Main = ({ metadata, links }: Props) => (
  <View style={styles.container}>
    <View style={styles.topContent}>
      <ElementDisplay metadata={metadata} />
    </View>
    <View style={styles.buttons}>
      <View>
        <Button
          title="OPEN SPOTIFY"
          handlePress={() => openLink(links.spotify)}
        />
        <Button
          title="OPEN APPLE MUSIC"
          handlePress={() => openLink(links.apple)}
        />
        <Button
          title="SHARE"
          handlePress={() => openShare(metadata, links.transpose)}
        />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContent: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '5%',
  },
  buttons: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '80%',
  },
});

Main.defaultProps = defaultProps;

export default Main;
