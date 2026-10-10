import type { FieldError, FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'

/**
 * Validate a React Hook Form payload with the Zod already declared in this package.
 * @hookform/resolvers is not present in the offline lockfile.
 */
export function zodFormResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return async (values) => {
    const parsed = schema.safeParse(values)
    if (parsed.success) {
      return { values: parsed.data, errors: {} }
    }
    const errors: Record<string, FieldError> = {}
    for (const issue of parsed.error.issues) {
      const name = issue.path.map(String).join('.')
      if (!name || errors[name]) continue
      errors[name] = { type: issue.code, message: issue.message }
    }
    return { values: {}, errors: errors as FieldErrors<T> }
  }
}
