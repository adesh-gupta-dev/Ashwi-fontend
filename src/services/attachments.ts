import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

export type PendingAttachment = {
  id: string;
  kind: 'image' | 'file';
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
};

function createAttachmentId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function pickImageAttachment() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    allowsMultipleSelection: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  return {
    id: createAttachmentId('image'),
    kind: 'image' as const,
    uri: asset.uri,
    name: asset.fileName || 'Selected image',
    mimeType: asset.mimeType || 'image/jpeg',
    size: asset.fileSize ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
  };
}

export async function pickDocumentAttachment() {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  return {
    id: createAttachmentId('file'),
    kind: 'file' as const,
    uri: asset.uri,
    name: asset.name || 'Selected file',
    mimeType: asset.mimeType || null,
    size: asset.size ?? null,
  };
}
