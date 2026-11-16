# Report for @pixi/sound: looping music collapses after pause/resume

**Related:** [pixijs/sound#275](https://github.com/pixijs/sound/issues/275), fix attempt in v6.0.2 / [#289](https://github.com/pixijs/sound/pull/289)

## Summary

When a looping full-file (or sprite) sound is paused and resumed via `sound.pauseAll()` / `sound.resumeAll()` (or the equivalent `context.paused` + `refreshPaused()` path used by window blur auto-pause), playback can collapse into a short loop of whatever was near the playhead—often about a second of audio repeating.

We hit this in a SpringRoll + Pixi game: Chrome tab blur/focus → background music stuck looping a single second.

## Cause

`WebAudioInstance.refreshPaused()` stops the `AudioBufferSourceNode` on pause, then on resume calls `play()` again with:

```ts
start: this._elapsed % this._duration
```

Historically `play()` also assigned that `start` to `source.loopStart`. After resume, the loop region became `[playhead, end]` (or `[playhead, bufferEnd]`), so the track only looped its tail.

v6.0.2 remembers `_loopRegionStart` and seeks inside that region on resume. That helps, but the pause path still tears down and rebuilds every source. Engines that already own pause (SpringRoll visibility / container focus) should not need that rebuild on desktop Chromium, and any remaining edge case in the rebuild path still risks bad loops.

## Suggested library fixes

1. **Keep loop region and end explicit on the source**  
   When `end` is `null`/`undefined`, set `source.loopEnd` to the buffer duration (or leave both `loopStart`/`loopEnd` at `0` so Web Audio uses the full buffer). Today `this._source.loopEnd = end` assigns `null` → `0` while `loopStart` may be non-zero, which is easy to get wrong.

2. **Document the app-owned-pause path**  
   If the host already pauses on blur/visibility (`disableAutoPause = true` + its own pause), prefer `audioContext.suspend()` / `resume()` over `pauseAll()` / `resumeAll()` when the goal is only to silence audio. Suspend keeps buffer sources and their `loopStart`/`loopEnd` intact. Reserve stop-and-rebuild for cases that actually need it (e.g. some mobile `interrupted` contexts), if those still require it.

3. **Avoid double pause managers**  
   Auto-pause on `window` blur plus an app calling `pauseAll`/`resumeAll` on the same focus cycle races `_pausedOnBlur` and can pause or resume instances twice. Apps that own pause should set `disableAutoPause = true` (we do). Docs could state that clearly next to `pauseAll`.

## Workaround we shipped (Platypus)

- Keep `sound.disableAutoPause = true` (app/SpringRoll owns pause).
- On SpringRoll `state.pause`, call `audioContext.suspend()` / `resume()` instead of `sound.pauseAll()` / `resumeAll()` when WebAudio is active.
- Fall back to `pauseAll`/`resumeAll` only for the HTML Audio legacy path.

## Repro (pre-fix / rebuild path)

1. Play a long looping file with `{ loop: true }` (no sprite required).
2. Let it play past the first few seconds.
3. `sound.pauseAll()` then `sound.resumeAll()` (or blur/focus with auto-pause enabled).
4. Listen: loop jumps / repeats a short slice near where pause happened instead of the full track.

Expected: same full-file (or sprite) loop region as before pause; resume only changes the playhead offset inside that region.
