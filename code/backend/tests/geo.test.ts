import { haversineDistanceKm } from "../src/utils/geo";

describe("haversineDistanceKm", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineDistanceKm(-6.7924, 39.2083, -6.7924, 39.2083)).toBeCloseTo(0, 6);
  });

  it("matches the known great-circle distance between two real cities", () => {
    // Dar es Salaam (-6.7924, 39.2083) to Nairobi (-1.2921, 36.8219).
    // Verified independently (Python's math.sin/cos/atan2 against the
    // same formula, same exact coordinates): ~666.39km. Asserting a
    // tight range around that verified value rather than a round-number
    // "commonly cited" figure, which turned out to be wrong for these
    // specific coordinates.
    const distance = haversineDistanceKm(-6.7924, 39.2083, -1.2921, 36.8219);
    expect(distance).toBeGreaterThan(660);
    expect(distance).toBeLessThan(672);
  });

  it("is symmetric regardless of point order", () => {
    const a = haversineDistanceKm(-6.7924, 39.2083, -1.2921, 36.8219);
    const b = haversineDistanceKm(-1.2921, 36.8219, -6.7924, 39.2083);
    expect(a).toBeCloseTo(b, 9);
  });

  it("scales roughly linearly for small north-south offsets (~111km per degree of latitude)", () => {
    const distance = haversineDistanceKm(0, 0, 1, 0);
    expect(distance).toBeGreaterThan(110);
    expect(distance).toBeLessThan(112);
  });
});
