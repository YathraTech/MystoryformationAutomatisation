export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+33')) {
    const rest = cleaned.slice(3);
    return `+33 ${rest.replace(/(.{1})(.{2})(.{2})(.{2})(.{2})/, '$1 $2 $3 $4 $5')}`;
  }
  return cleaned.replace(/(.{2})(.{2})(.{2})(.{2})(.{2})/, '$1 $2 $3 $4 $5');
}
