export function formatVnd(value?: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value ?? 0)} VND`
}

export function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function formatMonth(year: number, month: number) {
  return `${String(month).padStart(2, '0')}/${year}`
}

