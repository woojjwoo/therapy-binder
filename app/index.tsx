import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../src/theme/colors';

/**
 * Root index — shown briefly while _layout.tsx determines
 * which group to redirect to (auth or main).
 */
export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={Colors.earthBrown} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
