export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowlisted(email: string) {
  const list = adminEmails();
  if (!list.length) return email.toLowerCase() === 'eileen@example.com';
  return list.includes(email.trim().toLowerCase());
}
