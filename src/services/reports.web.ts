export async function exportReport(rows: Array<[string, string | number]>) {
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ashwi-summary.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
