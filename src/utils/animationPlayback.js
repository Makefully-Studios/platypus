/**
 * Parse a Spine/sprite animation playback spec.
 *
 * Supported forms:
 *   "run"
 *   "jump_trick@1.2"      // start at 1.2s
 *   "jump_short@0.5*2"    // start at 0.5s, play at 2× speed
 *   "spin*0.5"            // play at half speed from the start
 *
 * Trailing `!` (RenderAnimator follow-through) should be stripped before calling.
 *
 * @param {String} spec
 * @return {{name: String, startTime: Number, timeScale: Number}}
 */
export const parseAnimationPlayback = (spec) => {
    let
        name = typeof spec === 'string' ? spec : '',
        startTime = 0,
        timeScale = 1;

    if (!name) {
        return {name, startTime, timeScale};
    }

    const
        at = name.indexOf('@');

    if (at >= 0) {
        const
            rest = name.substring(at + 1);

        name = name.substring(0, at);

        const
            star = rest.indexOf('*');

        if (star >= 0) {
            startTime = parseFloat(rest.substring(0, star)) || 0;
            timeScale = parseFloat(rest.substring(star + 1)) || 1;
        } else {
            startTime = parseFloat(rest) || 0;
        }
    } else {
        const
            star = name.indexOf('*');

        if (star >= 0) {
            timeScale = parseFloat(name.substring(star + 1)) || 1;
            name = name.substring(0, star);
        }
    }

    return {name, startTime, timeScale};
};

/**
 * Base animation name with playback suffixes (`@`, `*`) and optional `!` removed.
 *
 * @param {String} spec
 * @return {String}
 */
export const animationBaseName = (spec) => {
    if (typeof spec !== 'string') {
        return spec;
    }

    return parseAnimationPlayback(spec.endsWith('!') ? spec.slice(0, -1) : spec).name;
};
