import { getPasswordStrength, PASSWORD_STRENGTH_LABELS } from "../passwordStrength";

describe("getPasswordStrength", () => {
  it("scores common/breached passwords as Very Weak regardless of length", () => {
    expect(PASSWORD_STRENGTH_LABELS[getPasswordStrength("password")]).toBe("Very Weak");
    expect(PASSWORD_STRENGTH_LABELS[getPasswordStrength("qwerty123")]).toBe("Very Weak");
    expect(PASSWORD_STRENGTH_LABELS[getPasswordStrength("12345678")]).toBe("Very Weak");
  });

  it("penalizes repeated character runs", () => {
    expect(PASSWORD_STRENGTH_LABELS[getPasswordStrength("aaaaaaaa")]).toBe("Very Weak");
  });

  it("penalizes sequential runs", () => {
    expect(PASSWORD_STRENGTH_LABELS[getPasswordStrength("abcd1234")]).toBe("Very Weak");
  });

  it("scores a reasonable everyday password as Good, not Strong", () => {
    // length>=8, has digit, has special char, but no upper+lower mix and
    // no length>=12 bonus.
    expect(PASSWORD_STRENGTH_LABELS[getPasswordStrength("cosmas@123")]).toBe("Good");
  });

  it("scores a long, mixed-case, symbol-containing password as Strong", () => {
    expect(PASSWORD_STRENGTH_LABELS[getPasswordStrength("Tz9#mK2vL8pQ")]).toBe("Strong");
    expect(PASSWORD_STRENGTH_LABELS[getPasswordStrength("MyDog$Loves2Run")]).toBe("Strong");
  });

  it("treats anything under 6 characters as Very Weak", () => {
    expect(getPasswordStrength("Ab1!")).toBe(0);
  });

  it("never returns a score outside 0-4", () => {
    const samples = ["", "a", "aaaaaaaaaaaaaaaaaaaa", "P@ssw0rd123!ExtraLongTail99"];
    for (const s of samples) {
      const score = getPasswordStrength(s);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(4);
    }
  });
});
