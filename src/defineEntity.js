/**
 * Identity helper for entity JSON definitions.
 * TypeScript typings infer EntityOf composition from `components[].type`.
 *
 * @param {Object} definition Entity definition object.
 * @return {Object} The same definition (unchanged at runtime).
 */
export default function defineEntity (definition) {
    return definition;
}
