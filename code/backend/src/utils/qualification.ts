// Upwork-style weighted profile-completeness score for technician (fundi)
// accounts. Deliberately a pure function of plain data (no Prisma import)
// so it's directly unit-testable and reusable from anywhere that has a
// user row in hand - the controller is the only thing that persists the
// result (User.qualificationScore).
//
// A technician must reach QUALIFICATION_THRESHOLD to appear in customer
// nearby-search results and be bookable (technician.controller.ts).

export const QUALIFICATION_THRESHOLD = 90;

export type QualificationInput = {
  avatarUrl: string | null;
  specialty: string | null;
  skills: string[];
  bio: string | null;
  hourlyRate: number | null;
  yearsExperience: number | null;
  idDocumentUrl: string | null;
  phone: string | null;
};

export type QualificationItem = {
  key: string;
  label: string;
  weight: number;
  complete: boolean;
};

export type QualificationResult = {
  score: number; // 0-100, sum of completed items' weights
  threshold: number;
  qualifies: boolean;
  items: QualificationItem[];
};

const MIN_BIO_LENGTH = 50;
const MIN_SKILLS_COUNT = 3;

// Weights sum to 100. Photo and ID verification are weighted heaviest
// since they're the two things a customer most directly relies on for
// trust/safety before letting a stranger into their home - the same
// reasoning Upwork/similar marketplaces use for identity-heavy weighting.
export function computeQualificationScore(profile: QualificationInput): QualificationResult {
  const items: QualificationItem[] = [
    { key: "photo", label: "Profile photo", weight: 15, complete: !!profile.avatarUrl },
    { key: "idDocument", label: "Government ID verification", weight: 20, complete: !!profile.idDocumentUrl },
    { key: "specialty", label: "Trade / specialty", weight: 10, complete: !!profile.specialty },
    { key: "skills", label: `At least ${MIN_SKILLS_COUNT} skills listed`, weight: 15, complete: profile.skills.length >= MIN_SKILLS_COUNT },
    { key: "bio", label: "Bio (at least 50 characters)", weight: 15, complete: (profile.bio?.length ?? 0) >= MIN_BIO_LENGTH },
    { key: "hourlyRate", label: "Hourly rate set", weight: 10, complete: profile.hourlyRate != null && profile.hourlyRate > 0 },
    { key: "yearsExperience", label: "Years of experience", weight: 5, complete: profile.yearsExperience != null && profile.yearsExperience >= 0 },
    { key: "phone", label: "Phone number", weight: 10, complete: !!profile.phone },
  ];

  const score = items.reduce((sum, item) => sum + (item.complete ? item.weight : 0), 0);

  return {
    score,
    threshold: QUALIFICATION_THRESHOLD,
    qualifies: score >= QUALIFICATION_THRESHOLD,
    items,
  };
}
