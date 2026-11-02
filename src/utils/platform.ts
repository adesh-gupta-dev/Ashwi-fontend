import { Platform, type KeyboardAvoidingViewProps } from 'react-native';

/** Android uses the native window's resize behavior; iOS needs padding. */
export function getKeyboardAvoidingProps(): Pick<KeyboardAvoidingViewProps, 'enabled' | 'behavior' | 'keyboardVerticalOffset'> {
  return {
    enabled: Platform.OS === 'ios',
    behavior: Platform.OS === 'ios' ? 'padding' : undefined,
    keyboardVerticalOffset: 0,
  };
}

export const keyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag';
