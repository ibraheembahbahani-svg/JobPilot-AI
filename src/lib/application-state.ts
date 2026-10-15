import type { ApplicationStatus } from './types';

const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  saved: ['queued', 'withdrawn'], queued: ['needs_review', 'submitted', 'unknown', 'withdrawn'], needs_review: ['queued', 'submitted', 'rejected', 'withdrawn'],
  submitted: ['unknown', 'withdrawn'], unknown: ['needs_review', 'withdrawn'], rejected: [], withdrawn: []
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus) { return transitions[from].includes(to); }

export function transition(from: ApplicationStatus, to: ApplicationStatus) {
  if (!canTransition(from, to)) throw new Error(`Invalid application transition: ${from} -> ${to}`);
  return to;
}

export function submissionDisposition(input: { authorizedIntegration: boolean; userOptedIn: boolean; unknownAnswers: boolean; protectedQuestion: boolean; captchaOrMfa: boolean }) {
  if (!input.authorizedIntegration || !input.userOptedIn || input.unknownAnswers || input.protectedQuestion || input.captchaOrMfa) return 'needs_review' as const;
  return 'submitted' as const;
}
