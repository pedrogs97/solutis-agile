/**
 * Recursively removes empty objects and empty string values from an object
 * while preserving boolean values (including false)
 *
 * @param obj - The object to clean
 * @returns The cleaned object with empty fields removed, or undefined if the entire object is empty
 */
export const cleanEmptyFields = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return undefined
  }

  if (obj instanceof Date) {
    return obj
  }

  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map(cleanEmptyFields)
      .filter((item) => item !== undefined)
    return cleanedArray.length > 0 ? cleanedArray : undefined
  }

  if (typeof obj === 'object') {
    const cleaned: any = {}
    let hasNonEmptyValue = false

    for (const [key, value] of Object.entries(obj)) {
      // Skip boolean false values and keep them
      if (typeof value === 'boolean') {
        cleaned[key] = value
        hasNonEmptyValue = true
        continue
      }

      // Skip empty strings
      if (value === '') {
        continue
      }

      const cleanedValue = cleanEmptyFields(value)
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue
        hasNonEmptyValue = true
      }
    }

    return hasNonEmptyValue ? cleaned : undefined
  }

  // For primitive values, return undefined if empty string, otherwise return the value
  return obj === '' ? undefined : obj
}
