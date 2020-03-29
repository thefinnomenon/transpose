import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import ElementDisplay from './ElementDisplay';
import { openLink, openShare, MetadataType } from '../utlities';
import Icon from 'react-native-vector-icons/EvilIcons';
import Icon2 from 'react-native-vector-icons/SimpleLineIcons';
import Icon3 from 'react-native-vector-icons/AntDesign';

import Button from './Button';

type Props = {
  metadata: MetadataType;
  links: { [key: string]: string };
  installedProviders: { [key: string]: boolean };
} & typeof defaultProps;

const defaultProps = Object.freeze({});

export const Results = ({ metadata, links, installedProviders }: Props) => {
  const spotify = links.spotify && installedProviders.spotify;
  const apple = links.apple && installedProviders.apple;
  return (
    <View style={styles.container}>
      <View style={styles.topContent}>
        <ElementDisplay metadata={metadata} />
      </View>
      <View style={styles.buttons}>
        <Button
          icon={ShareIcon}
          handlePress={() => openShare(metadata, links.transpose)}
        />
        <View style={styles.providerButtons}>
          {spotify && (
            <Button
              icon={SpotifyIcon}
              handlePress={() => openLink(links.spotify)}
            />
          )}
          {apple && (
            <Button
              icon={AppleIcon}
              handlePress={() => openLink(links.apple)}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const ShareIcon = (
  <Icon
    name={Platform.OS === 'ios' ? 'share-apple' : 'share-google'}
    size={53}
    color="#fff"
  />
);
const SpotifyIcon = <Icon2 name="social-spotify" size={40} color="#fff" />;
const AppleIcon = <Icon3 name="apple-o" size={40} color="#fff" />;

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    margin: 20,
  },
  providerButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});

Results.defaultProps = defaultProps;

export default Results;
