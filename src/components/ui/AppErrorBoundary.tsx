import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { consoleTerminal } from '@/utils/consoleTerminal';

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    consoleTerminal('app.render', { error, componentStack: info.componentStack });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>Let's try that again.</Text>
        <Text style={styles.description}>Ashwi couldn't display this screen. You can reload the workspace below.</Text>
        <Pressable accessibilityRole="button" onPress={() => this.setState({ failed: false })} style={styles.button}>
          <Text style={styles.label}>Try again</Text>
        </Pressable>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16, backgroundColor: '#faf8ff' },
  title: { fontSize: 24, fontWeight: '600', textAlign: 'center', color: '#131b2e' },
  description: { maxWidth: 420, textAlign: 'center', fontSize: 16, color: '#454652' },
  button: { minHeight: 48, padding: 16, borderRadius: 12, backgroundColor: '#3a388b' },
  label: { color: '#ffffff', fontWeight: '600' },
});
