/**
 * Deep-clones plain JSON-like definitions (level pieces, entity templates, etc.)
 * without sharing nested arrays or objects with the source.
 *
 * @method cloneDefinition
 * @param {*} definition
 * @return {*}
 */
export function cloneDefinition (definition) {
    return structuredClone(definition);
}
