import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { consoleTerminal } from '@/utils/consoleTerminal';

async function runHaptic(action: () => Promise<void>) {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return;
  }

  try {
    await action();
  } catch (error) {
    consoleTerminal('haptics.unavailable', error, 'warn');
  }
}

export function triggerPress() {
  return runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function triggerSuccess() {
  return runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function triggerError() {
  return runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
