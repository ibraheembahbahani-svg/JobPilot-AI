import { describe, expect, it } from 'vitest';
import { scoreJob } from './matching';
import type { Job, Profile } from './types';
const job: Job = { id:'1', source:'test', sourceUrl:'https://example.com', externalId:'1', title:'Data Science Intern', company:'Test', location:'Dallas, TX', arrangement:'hybrid', salaryMin:50000, salaryMax:70000, skills:['Python','SQL'], description:'', postedAt:new Date().toISOString() };
const profile: Profile = { targetRoles:['Data Science Intern'], locations:['Dallas'], salaryMin:55000, skills:['Python','SQL'] };
describe('scoreJob', () => { it('returns interpretable high match reasons', () => { const result=scoreJob(job,profile); expect(result.score).toBe(100); expect(result.reasons).toContain('2 profile skills matched'); expect(result.gaps).toHaveLength(0); }); it('reports location and salary gaps', () => { const result=scoreJob({...job,location:'Seattle',salaryMax:40000},{...profile,locations:['Dallas']}); expect(result.gaps).toContain('Location preference may not fit'); expect(result.gaps).toContain('Compensation may be below the configured floor'); }); });
