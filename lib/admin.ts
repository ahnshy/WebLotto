export const ADMIN_EMAILS = new Set([
  'ahnshy@gmail.com',
  'ahnshy6@gmail.com'
]);

export function isAdminEmail(email?: string | null) {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

export function stringifyError(error: unknown) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const candidate = error as Record<string, unknown>;
    const orderedKeys = ['name', 'code', 'message', 'details', 'hint', 'error', 'status', 'statusText', 'stack'];
    const parts = orderedKeys
      .map((key) => candidate[key])
      .filter((value) => value !== undefined && value !== null && String(value).trim().length > 0)
      .map((value) => String(value));

    if (parts.length > 0) {
      return parts.join(' | ');
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return String(error ?? '');
}
