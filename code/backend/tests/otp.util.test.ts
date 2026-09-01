import { generateOtp } from "../src/utils/otp";

describe("generateOtp", () => {
  it("defaults to a 6-digit code", () => {
    expect(generateOtp()).toHaveLength(6);
  });

  it("respects a custom length", () => {
    expect(generateOtp(4)).toHaveLength(4);
    expect(generateOtp(8)).toHaveLength(8);
  });

  it("only contains digits", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateOtp(6)).toMatch(/^[0-9]{6}$/);
    }
  });

  it("is not a fixed/hardcoded value across calls", () => {
    const codes = new Set(Array.from({ length: 25 }, () => generateOtp(6)));
    // 25 independently random 6-digit codes collapsing to 2 or fewer
    // unique values would indicate a hardcoded or non-random generator.
    expect(codes.size).toBeGreaterThan(2);
  });
});
