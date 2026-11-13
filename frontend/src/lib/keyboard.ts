import type { KeyboardEvent } from "react"

/**
 * Handle an Enter keydown as a submit action, IME-safely.
 *
 * When an input method editor (Chinese, Japanese, Korean) is composing, the
 * key that confirms a candidate also produces an Enter keydown. Acting on it
 * submits a half-typed value. `isComposing` covers Chrome and Firefox; the
 * `keyCode === 229` fallback covers WebKit bug 165004, where Safari fires
 * `compositionend` before the confirming keydown and clears `isComposing`.
 *
 * @see https://web.dev/articles/ime-safe-enter-submit
 */
export function onEnterSubmit(
  event: KeyboardEvent<HTMLElement>,
  action: () => void
): void {
  if (event.key !== "Enter") return
  // Suppress the default action (newline in a textarea, implicit form submit).
  event.preventDefault()
  const native = event.nativeEvent
  if (native.isComposing || native.keyCode === 229) return
  action()
}
