import { Share } from 'react-native';

export function formatReport(rows: Array<[string, string | number]>) {
  return rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

export async function exportReport(rows: Array<[string, string | number]>) {
  const result = await Share.share({ title: 'Ashwi report', message: formatReport(rows) });
  return result.action !== Share.dismissedAction;
}
