import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>The Therapy Binder</Text>
        <Text style={styles.subtitle}>Week 1 — Encryption module ✅</Text>
        <Text style={styles.body}>21 / 21 tests passing</Text>
        <Text style={styles.note}>Onboarding flow coming next.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#3D2B1F', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#7A5C48', textAlign: 'center' },
  body: { fontSize: 18, color: '#7CAE8E', fontWeight: '600' },
  note: { fontSize: 14, color: '#7A5C48', textAlign: 'center', marginTop: 8 },
});
