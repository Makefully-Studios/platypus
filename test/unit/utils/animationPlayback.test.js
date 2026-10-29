import {describe, expect, it} from 'vitest';
import {animationBaseName, parseAnimationPlayback} from '../../../src/utils/animationPlayback.js';

describe('animationPlayback', () => {
    describe('parseAnimationPlayback', () => {
        it('returns defaults for a plain animation name', () => {
            expect(parseAnimationPlayback('run')).toEqual({
                name: 'run',
                startTime: 0,
                timeScale: 1
            });
        });

        it('parses @startTime', () => {
            expect(parseAnimationPlayback('jump_trick@1.2')).toEqual({
                name: 'jump_trick',
                startTime: 1.2,
                timeScale: 1
            });
        });

        it('parses @startTime*timeScale', () => {
            expect(parseAnimationPlayback('jump_short@0.5*2')).toEqual({
                name: 'jump_short',
                startTime: 0.5,
                timeScale: 2
            });
        });

        it('parses *timeScale alone', () => {
            expect(parseAnimationPlayback('spin*0.5')).toEqual({
                name: 'spin',
                startTime: 0,
                timeScale: 0.5
            });
        });

        it('treats invalid numeric suffixes as defaults', () => {
            expect(parseAnimationPlayback('run@')).toEqual({
                name: 'run',
                startTime: 0,
                timeScale: 1
            });
            expect(parseAnimationPlayback('run*')).toEqual({
                name: 'run',
                startTime: 0,
                timeScale: 1
            });
            expect(parseAnimationPlayback('run@x*y')).toEqual({
                name: 'run',
                startTime: 0,
                timeScale: 1
            });
        });

        it('returns empty defaults for non-string input', () => {
            expect(parseAnimationPlayback(null)).toEqual({
                name: '',
                startTime: 0,
                timeScale: 1
            });
            expect(parseAnimationPlayback(undefined)).toEqual({
                name: '',
                startTime: 0,
                timeScale: 1
            });
        });
    });

    describe('animationBaseName', () => {
        it('strips playback suffixes', () => {
            expect(animationBaseName('jump_trick@1.2')).toBe('jump_trick');
            expect(animationBaseName('jump_short@0.5*2')).toBe('jump_short');
            expect(animationBaseName('spin*0.5')).toBe('spin');
        });

        it('strips follow-through bang before parsing', () => {
            expect(animationBaseName('land!')).toBe('land');
            expect(animationBaseName('jump_short@0.5*2!')).toBe('jump_short');
        });

        it('passes through plain names and non-strings', () => {
            expect(animationBaseName('run')).toBe('run');
            expect(animationBaseName(null)).toBe(null);
        });
    });
});
