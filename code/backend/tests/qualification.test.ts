import { computeQualificationScore, QUALIFICATION_THRESHOLD, QualificationInput } from "../src/utils/qualification";

function baseProfile(overrides: Partial<QualificationInput> = {}): QualificationInput {
  return {
    avatarUrl: null,
    specialty: null,
    skills: [],
    bio: null,
    hourlyRate: null,
    yearsExperience: null,
    idDocumentUrl: null,
    phone: null,
    ...overrides,
  };
}

describe("computeQualificationScore", () => {
  it("scores an empty profile as 0", () => {
    const result = computeQualificationScore(baseProfile());
    expect(result.score).toBe(0);
    expect(result.qualifies).toBe(false);
  });

  it("scores a fully complete profile as 100", () => {
    const result = computeQualificationScore(
      baseProfile({
        avatarUrl: "/uploads/avatars/x.jpg",
        specialty: "Plumber",
        skills: ["pipe fitting", "leak repair", "installation"],
        bio: "A".repeat(60),
        hourlyRate: 15000,
        yearsExperience: 5,
        idDocumentUrl: "/uploads/id-documents/x.jpg",
        phone: "+255700000000",
      })
    );
    expect(result.score).toBe(100);
    expect(result.qualifies).toBe(true);
  });

  it("does not qualify below the threshold even when close", () => {
    // Missing only the ID document (20 points) -> 80, below the 90 threshold.
    const result = computeQualificationScore(
      baseProfile({
        avatarUrl: "/uploads/avatars/x.jpg",
        specialty: "Electrician",
        skills: ["wiring", "panel install", "troubleshooting"],
        bio: "A".repeat(60),
        hourlyRate: 20000,
        yearsExperience: 3,
        phone: "+255700000000",
      })
    );
    expect(result.score).toBe(80);
    expect(result.qualifies).toBe(false);
  });

  it("requires at least 3 skills for the skills item to count", () => {
    const twoSkills = computeQualificationScore(baseProfile({ skills: ["a", "b"] }));
    const threeSkills = computeQualificationScore(baseProfile({ skills: ["a", "b", "c"] }));
    expect(twoSkills.items.find((i) => i.key === "skills")!.complete).toBe(false);
    expect(threeSkills.items.find((i) => i.key === "skills")!.complete).toBe(true);
  });

  it("requires bio to be at least 50 characters", () => {
    const short = computeQualificationScore(baseProfile({ bio: "too short" }));
    const long = computeQualificationScore(baseProfile({ bio: "A".repeat(50) }));
    expect(short.items.find((i) => i.key === "bio")!.complete).toBe(false);
    expect(long.items.find((i) => i.key === "bio")!.complete).toBe(true);
  });

  it("all item weights sum to exactly 100", () => {
    const result = computeQualificationScore(baseProfile());
    const totalWeight = result.items.reduce((sum, item) => sum + item.weight, 0);
    expect(totalWeight).toBe(100);
  });

  it("exports a threshold of 90, matching the item's own value", () => {
    expect(QUALIFICATION_THRESHOLD).toBe(90);
  });
});
