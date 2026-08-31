// Pure helper for OtpInput's paste/autofill/typing handling, kept separate
// from the component so it can be unit tested without rendering React
// Native. Handles both single-digit typing and multi-digit paste/autofill
// the same way: non-digit characters are stripped, then the digits are
// written into consecutive cells starting at startIndex.
//
// nextFocusIndex is the cell that should receive focus next, or -1 if the
// code is now fully filled and the keyboard should be dismissed instead.

export type OtpMergeResult = {
  values: string[];
  nextFocusIndex: number; // -1 means "blur, the code is complete"
};

export function mergeOtpDigits(currentValues: string[], pastedText: string, startIndex: number, length: number): OtpMergeResult {
  const digits = pastedText.replace(/[^0-9]/g, "");
  const values = [...currentValues];

  if (digits.length === 0) {
    // Backspace / cleared this cell - stay put, don't move focus.
    values[startIndex] = "";
    return { values, nextFocusIndex: startIndex };
  }

  let cursor = startIndex;
  for (let i = 0; i < digits.length && cursor < length; i++, cursor++) {
    values[cursor] = digits[i];
  }

  const nextFocusIndex = cursor >= length ? -1 : cursor;
  return { values, nextFocusIndex };
}
