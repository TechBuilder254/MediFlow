export function getAuthErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback
  if (typeof err === 'string') return err
  if (err instanceof Error && err.message) return err.message

  if (typeof err === 'object' && err !== null) {
    const authErr = err as { message?: string; msg?: string; error_description?: string }
    if (authErr.message) return authErr.message
    if (authErr.msg) return authErr.msg
    if (authErr.error_description) return authErr.error_description
  }

  return fallback
}
