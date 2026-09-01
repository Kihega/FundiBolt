import { mergeOtpDigits } from "../otpPaste";

describe("mergeOtpDigits", () => {
  const empty6 = ["", "", "", "", "", ""];

  it("fills all cells when the full code is pasted at the start", () => {
    const { values, nextFocusIndex } = mergeOtpDigits(empty6, "123456", 0, 6);
    expect(values.join("")).toBe("123456");
    expect(nextFocusIndex).toBe(-1); // complete - blur/dismiss keyboard
  });

  it("handles a single digit typed normally, advancing focus by one", () => {
    const { values, nextFocusIndex } = mergeOtpDigits(empty6, "1", 0, 6);
    expect(values[0]).toBe("1");
    expect(nextFocusIndex).toBe(1);
  });

  it("does not advance focus past the last cell when typing the final digit", () => {
    const partial = ["1", "2", "3", "4", "5", ""];
    const { values, nextFocusIndex } = mergeOtpDigits(partial, "6", 5, 6);
    expect(values.join("")).toBe("123456");
    expect(nextFocusIndex).toBe(-1);
  });

  it("clears a cell on backspace without moving focus", () => {
    const partial = ["1", "2", "3", "", "", ""];
    const { values, nextFocusIndex } = mergeOtpDigits(partial, "", 2, 6);
    expect(values[2]).toBe("");
    expect(nextFocusIndex).toBe(2);
  });

  it("distributes a partial paste starting mid-way and focuses the next empty cell", () => {
    const { values, nextFocusIndex } = mergeOtpDigits(empty6, "456", 3, 6);
    expect(values).toEqual(["", "", "", "4", "5", "6"]);
    expect(nextFocusIndex).toBe(-1); // reached the end of the array
  });

  it("strips non-digit characters from pasted text", () => {
    const { values } = mergeOtpDigits(empty6, "12-34 56", 0, 6);
    expect(values.join("")).toBe("123456");
  });

  it("ignores digits beyond the available cell count", () => {
    const { values, nextFocusIndex } = mergeOtpDigits(empty6, "123456789", 0, 6);
    expect(values.join("")).toBe("123456");
    expect(nextFocusIndex).toBe(-1);
  });
});
