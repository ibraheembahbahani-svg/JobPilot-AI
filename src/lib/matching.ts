import type { Job, MatchResult, Profile } from './types';

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function scoreJob(job: Job, profile: Profile): MatchResult {
  const title = normalize(job.title);
  const roleHits = profile.targetRoles.filter((role) => title.includes(normalize(role))).length;
  const skillHits = job.skills.filter((skill) => profile.skills.some((candidate) => normalize(candidate) === normalize(skill))).length;
  const locationHit = profile.locations.length === 0 || profile.locations.some((location) => normalize(job.location || '').includes(normalize(location)));
  const salaryHit = !profile.salaryMin || !job.salaryMax || job.salaryMax >= profile.salaryMin;
  const reasons: string[] = [];
  const gaps: string[] = [];
  if (roleHits) reasons.push(`Title aligns with ${roleHits} target role${roleHits > 1 ? 's' : ''}`); else gaps.push('Title is not an exact target-role match');
  if (skillHits) reasons.push(`${skillHits} profile skill${skillHits > 1 ? 's' : ''} matched`); else gaps.push('No listed skills matched the profile');
  if (locationHit) reasons.push('Location preference is compatible'); else gaps.push('Location preference may not fit');
  if (salaryHit) reasons.push('Compensation meets the configured floor'); else gaps.push('Compensation may be below the configured floor');
  const score = Math.min(100, Math.round(roleHits * 25 + (skillHits / Math.max(job.skills.length, 1)) * 40 + (locationHit ? 20 : 0) + (salaryHit ? 15 : 0)));
  return { score, reasons, gaps, confidence: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low' };
}
