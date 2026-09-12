export const LIMITS = { title: 120, description: 2000, location: 160, notes: 5000, journalTitle: 160, journalText: 50000, displayName: 80 };

export const plainText = (html = '') => String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100;
}

export function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function validateTask(form) {
  const errors = {};
  const title = form.title.trim();
  if (!title) errors.title = 'Enter a task title.';
  else if (title.length > LIMITS.title) errors.title = `Keep the title under ${LIMITS.title} characters.`;
  if (form.description.length > LIMITS.description) errors.description = `Keep the description under ${LIMITS.description} characters.`;
  if (!validDate(form.date)) errors.date = 'Choose a valid date between 1900 and 2100.';
  if (!validTime(form.start_time)) errors.start_time = 'Choose a valid start time.';
  if (!validTime(form.end_time)) errors.end_time = 'Choose a valid end time.';
  if (validTime(form.start_time) && validTime(form.end_time) && form.end_time <= form.start_time) errors.end_time = 'End time must be later than start time.';
  if (form.location.length > LIMITS.location) errors.location = `Keep the location under ${LIMITS.location} characters.`;
  if (!['upcoming', 'in_progress', 'completed'].includes(form.status)) errors.status = 'Choose a valid status.';
  return errors;
}

export function validateJournal(entry) {
  const errors = {};
  const title = entry.title.trim();
  const content = plainText(entry.content);
  if (!title) errors.title = 'Enter a journal title.';
  else if (title.length > LIMITS.journalTitle) errors.title = `Keep the title under ${LIMITS.journalTitle} characters.`;
  if (!content) errors.content = 'Write something before saving this entry.';
  else if (content.length > LIMITS.journalText) errors.content = `Keep the entry under ${LIMITS.journalText.toLocaleString()} characters.`;
  return errors;
}

export function sanitizeRichText(html = '') {
  const documentNode = new DOMParser().parseFromString(String(html), 'text/html');
  documentNode.querySelectorAll('script, style, iframe, object, embed, form').forEach((node) => node.remove());
  documentNode.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      if (/^on/i.test(attribute.name) || (['href', 'src'].includes(attribute.name) && /^javascript:/i.test(attribute.value.trim()))) node.removeAttribute(attribute.name);
    });
  });
  return documentNode.body.innerHTML;
}

export const emailError = (value) => {
  const email = value.trim();
  if (!email) return 'Enter your email address.';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Enter a valid email address.';
  return '';
};

export const passwordError = (value) => {
  if (value.length < 8) return 'Use at least 8 characters.';
  if (value.length > 72) return 'Use no more than 72 characters.';
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) return 'Include uppercase, lowercase, and a number.';
  return '';
};
