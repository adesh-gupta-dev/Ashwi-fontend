import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { consoleTerminal } from '@/utils/consoleTerminal';

let isConfigured = false;
let isPermissionGranted = false;

async function configureNotifications() {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return false;
  }

  if (!isConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('ashwi-default', {
        name: 'Ashwi',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200, 200],
        lightColor: '#3f51b5',
      });
    }

    isConfigured = true;
  }

  if (!isPermissionGranted) {
    const current = await Notifications.getPermissionsAsync();
    if (current.status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      isPermissionGranted = requested.status === 'granted';
    } else {
      isPermissionGranted = true;
    }
  }

  return isPermissionGranted;
}

export async function bootstrapNotifications() {
  try {
    return await configureNotifications();
  } catch (error) {
    consoleTerminal('notifications.configure', error, 'warn');
    return false;
  }
}

export async function sendLocalNotification(title: string, body: string) {
  try {
    const hasPermission = await bootstrapNotifications();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: false },
      trigger: null,
    });
    return true;
  } catch (error) {
    consoleTerminal('notifications.schedule', error, 'warn');
    return false;
  }
}
