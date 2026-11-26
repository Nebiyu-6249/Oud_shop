/** Joins short phrases with the comma of the locale: "، " in Arabic. */
export function joinList(parts: (string | false | null | undefined)[], locale: string): string {
  return parts.filter(Boolean).join(locale === "ar" ? "، " : ", ");
}
