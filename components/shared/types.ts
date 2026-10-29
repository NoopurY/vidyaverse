export type InstitutionDetail = {
  institution: {
    _id: string;
    aicteId: string;
    name: string;
    state: string;
    district?: string;
    region: string;
    type: string;
    address?: string;
    isDegreeAwarding: boolean;
    contactPhone?: string;
    webhookUrl?: string;
    hasApiCredentials: boolean;
    apiClientId?: string;
    programs: { programId: string; name: string; level: string; discipline: string; approvedIntake: number; supernumeraryApproved: Record<string, number> }[];
    riskScore: number;
    riskReasons: string[];
    complianceScore: number;
    badge: "green" | "amber" | "red";
    accreditation?: { nba?: boolean; naacGrade?: string };
  };
  metrics: { intake: number; enrolled: number; fillPct: number; seatsRemaining: number; openFlags: number; placementRate: number; higherRate: number; graduates: number; placed: number; higher: number; enrolledBy: Record<string, number> };
  ledger: { programId: string; seatType: string; approved: number; consumed: number; remaining: number }[];
  issues: IssueRow[];
  issueCounts: Record<string, number>;
  audit: { _id: string; seq: number; actor: string; role: string; action: string; timestamp: string; hash: string }[];
  pending: { openIssues: number; transfers: number; counsellingMismatches: number; grievances: number; uploadsAwaitingApproval: number };
  alerts: { _id: string; message: string; severity: string; createdAt: string; status: string }[];
};

export type IssueRow = {
  _id: string;
  type: string;
  severity: "high" | "medium" | "low";
  studentApaar?: string;
  institutionId?: string;
  institutionName?: string;
  rowNumber?: number;
  field?: string;
  details: string;
  fixHint?: string;
  status: string;
  createdAt: string;
  meta?: { name?: string; dob?: string; score?: number; candidateApaar?: string };
  candidate?: { name: string; dob: string; institution?: string; apaarId: string };
};
