export type WorkArrangement = 'remote' | 'hybrid' | 'onsite';
export type ApplicationStatus = 'saved' | 'queued' | 'needs_review' | 'submitted' | 'unknown' | 'rejected' | 'withdrawn';

export type Job = {
  id: string; source: string; sourceUrl: string; externalId: string; title: string; company: string;
  location: string; arrangement: WorkArrangement; salaryMin?: number; salaryMax?: number;
  skills: string[]; description: string; postedAt: string; expiresAt?: string;
};

export type Profile = {
  targetRoles: string[]; locations: string[]; salaryMin?: number; workAuthorization?: string;
  sponsorshipNeeded?: boolean; skills: string[]; consentedAt?: string;
};

export type MatchResult = { score: number; reasons: string[]; gaps: string[]; confidence: 'high' | 'medium' | 'low' };

export type ApplicationEvent = { type: string; at: string; detail: string };
export type Application = { id: string; job: Job; status: ApplicationStatus; events: ApplicationEvent[]; receiptUrl?: string; };
