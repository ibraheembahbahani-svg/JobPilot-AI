import { describe, expect, it } from 'vitest';
import { submissionDisposition, transition } from './application-state';
describe('application safety gates', () => { it('routes unknown answers to review', () => expect(submissionDisposition({authorizedIntegration:true,userOptedIn:true,unknownAnswers:true,protectedQuestion:false,captchaOrMfa:false})).toBe('needs_review')); it('refuses direct invalid transitions', () => expect(() => transition('saved','submitted')).toThrow()); it('allows a reviewed item to submit', () => expect(transition('needs_review','submitted')).toBe('submitted')); });
