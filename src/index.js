import { renderPatch } from './renderer.js';

/**
 * Parse YAML configuration from object and generate SVGgenerate SVG
 * @param {Object} config - Configuration object
 * @param {Object} options - Rendering options
 * @returns {string} SVG string
 */
export function generateSVGFromConfig(config, options = {}) {
  return renderPatch(config, options);
}

export { renderPatch } from './renderer.js';
export { parseConfig } from './parser.js';
