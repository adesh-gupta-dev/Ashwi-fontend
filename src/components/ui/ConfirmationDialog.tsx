import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { AppButton } from './AppButton';

type Props = { visible: boolean; onCancel: () => void; onConfirm: () => void };

/** React Native Alert has no browser dialog implementation. */
export function ConfirmationDialog({ visible, onCancel, onConfirm }: Props) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Cancel deletion" style={StyleSheet.absoluteFill} onPress={onCancel} />
        <ScrollView style={[styles.dialog, { backgroundColor: colors.surfaceContainer }]} contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.onSurface }]}>Delete user?</Text>
          <Text style={{ color: colors.onSurfaceVariant }}>This removes the user's access. Continue?</Text>
          <View style={styles.actions}>
            <AppButton label="Cancel" variant="secondary" onPress={onCancel} />
            <AppButton label="Delete" onPress={onConfirm} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  dialog: { flexGrow: 0, width: '100%', maxWidth: 420, maxHeight: '90%', borderRadius: 20 },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 22, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
