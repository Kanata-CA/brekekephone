import { mdiRecord } from '@mdi/js';
import { Thumbnail, View } from 'native-base';
import React from 'react';
import { StyleSheet } from 'react-native';

import SvgIcon from '../components-shared/SvgIcon';

const st = StyleSheet.create({
  status: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});

class Avatar extends React.Component {
  render() {
    const p = this.props;
    return (
      <View>
        <Thumbnail source={{ uri: p.source }} />
        {p.online && (
          <View style={st.status}>
            <SvgIcon path={mdiRecord} color="#74bf53" />
          </View>
        )}
        {p.offline && (
          <View style={st.status}>
            <SvgIcon path={mdiRecord} color="#8a8a8f" />
          </View>
        )}
        {p.busy && (
          <View style={st.status}>
            <SvgIcon path={mdiRecord} color="#FF2D55" />
          </View>
        )}
      </View>
    );
  }
}

export default Avatar;
