import { parseConfig } from './parser.js';

const DEFAULT_OPTIONS = {
  moduleWidth: 120,
  moduleHeight: 250,
  portRadius: 5,
  knobRadius: 15,
  portSpacing: 20,
  knobSpacing: 30,
  padding: 20,
  backgroundColor: '#f5f5f5',
  moduleColor: '#e0e0e0',
  portColor: '#555',
  strokeWidth: 2
};

/**
 * Render a complete patch configuration as SVG
 * @param {Object} config - Patch configuration
 * @param {Object} options - Rendering options
 * @returns {string} SVG string
 */
export function renderPatch(config, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const validated = parseConfig(config);

  const elements = [];
  const portPositions = new Map();

  // Add extra padding at top if there's a title
  const titleHeight = validated.title ? 40 : 0;
  const topPadding = opts.padding + titleHeight;

  // Calculate canvas size
  let maxX = 0;
  let maxY = 0;

  validated.modules.forEach(module => {
    const x = module.position.x || 0;
    const y = module.position.y || 0;
    const w = module.width || opts.moduleWidth;
    const h = module.height || opts.moduleHeight;
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });

  const width = maxX + opts.padding * 2;
  const height = maxY + opts.padding + topPadding;

  // Render title if present
  if (validated.title) {
    elements.push(
      `<text x="${opts.padding}" y="${opts.padding + 20}" text-anchor="start" font-family="Arial" font-size="18" font-weight="bold" fill="#333">${escapeXml(validated.title)}</text>`
    );
  }

  // Render modules
  validated.modules.forEach(module => {
    const moduleX = module.position.x + opts.padding;
    const moduleY = module.position.y + topPadding;
    const moduleWidth = module.width || opts.moduleWidth;
    const moduleHeight = module.height || opts.moduleHeight;

    // Module background
    elements.push(
      `<rect x="${moduleX}" y="${moduleY}" width="${moduleWidth}" height="${moduleHeight}" ` +
      `fill="${opts.moduleColor}" stroke="#333" stroke-width="${opts.strokeWidth}" rx="5"/>`
    );

    // Module name
    elements.push(
      `<text x="${moduleX + moduleWidth / 2}" y="${moduleY + 20}" ` +
      `text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold">${escapeXml(module.name)}</text>`
    );

    // Render inputs (left side)
    module.inputs.forEach((input, i) => {
      const portX = moduleX;
      const portY = moduleY + 40 + i * opts.portSpacing;
      portPositions.set(`${module.name}:${input}`, { x: portX, y: portY });

      elements.push(
        `<circle cx="${portX}" cy="${portY}" r="${opts.portRadius}" fill="${opts.portColor}"/>`
      );
      elements.push(
        `<text x="${portX + 10}" y="${portY + 4}" font-family="Arial" font-size="10">${escapeXml(input)}</text>`
      );
    });

    // Render outputs (right side)
    module.outputs.forEach((output, i) => {
      const portX = moduleX + moduleWidth;
      const portY = moduleY + 40 + i * opts.portSpacing;
      portPositions.set(`${module.name}:${output}`, { x: portX, y: portY });

      elements.push(
        `<circle cx="${portX}" cy="${portY}" r="${opts.portRadius}" fill="${opts.portColor}"/>`
      );
      elements.push(
        `<text x="${portX - 10}" y="${portY + 4}" text-anchor="end" font-family="Arial" font-size="10">${escapeXml(output)}</text>`
      );
    });

    // Render knobs
    module.knobs.forEach((knob, i) => {
      // Use custom position if provided, otherwise calculate default position
      let knobX, knobY;
      if (knob.position) {
        knobX = moduleX + knob.position.x;
        knobY = moduleY + knob.position.y;
      } else {
        knobX = moduleX + moduleWidth / 2 + (i - (module.knobs.length - 1) / 2) * opts.knobSpacing;
        knobY = moduleY + moduleHeight - 40;
      }

      // Use custom radius if provided, otherwise use default
      const knobRadius = knob.radius !== undefined ? knob.radius : opts.knobRadius;

      // Knob circle
      elements.push(
        `<circle cx="${knobX}" cy="${knobY}" r="${knobRadius}" fill="#fff" stroke="#333" stroke-width="2"/>`
      );

      // Value ring and indicator
      let value = knob.value !== undefined ? knob.value : 0.5;
      let displayIndex;
      
      // For discrete positions: if value is an integer, treat as index; otherwise as 0-1 normalized
      if (knob.positions && Array.isArray(knob.positions)) {
        if (Number.isInteger(knob.value)) {
          // Integer value >= 1 = direct index
          displayIndex = knob.value;
          value = knob.value / (knob.positions.length - 1); // Normalize for visual display
        } else {
          // Float value or 0 = normalized (0-1)
          displayIndex = Math.round(value * (knob.positions.length - 1));
        }
      }
      
      if (value > 0) {
        // Ring starts at bottom (6 o'clock = 90°) and goes clockwise
        const ringRadius = knobRadius + 3;
        
        if (value >= 1.0) {
          // Full circle for value = 1.0
          elements.push(
            `<circle cx="${knobX}" cy="${knobY}" r="${ringRadius}" fill="none" stroke="#4CAF50" stroke-width="3"/>`
          );
        } else {
          // Arc for partial values
          const startAngle = 90;
          const endAngle = startAngle + (value * 360);
          
          // Convert to radians for calculations
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          // Calculate arc path
          const startX = knobX + Math.cos(startRad) * ringRadius;
          const startY = knobY + Math.sin(startRad) * ringRadius;
          const endX = knobX + Math.cos(endRad) * ringRadius;
          const endY = knobY + Math.sin(endRad) * ringRadius;
          
          // Determine if we need a large arc (> 180°)
          const largeArc = value > 0.5 ? 1 : 0;
          
          // Draw the arc
          elements.push(
            `<path d="M ${startX} ${startY} A ${ringRadius} ${ringRadius} 0 ${largeArc} 1 ${endX} ${endY}" ` +
            `fill="none" stroke="#4CAF50" stroke-width="3" stroke-linecap="round"/>`
          );
        }
      }
      
      // Knob indicator line - points to the end of the ring
      const angle = 90 + value * 360; // Start at 6 o'clock (90°), go clockwise
      const radians = (angle * Math.PI) / 180;
      const indicatorX = knobX + Math.cos(radians) * (knobRadius - 3);
      const indicatorY = knobY + Math.sin(radians) * (knobRadius - 3);

      elements.push(
        `<line x1="${knobX}" y1="${knobY}" x2="${indicatorX}" y2="${indicatorY}" stroke="#333" stroke-width="2"/>`
      );

      // Knob value above the halo
      const ringRadius = knobRadius + 3;
      let valueText;
      if (knob.positions && Array.isArray(knob.positions)) {
        // Discrete positions: show the label of the selected position
        valueText = escapeXml(knob.positions[displayIndex] || '');
      } else {
        // Continuous: show percentage
        valueText = (value * 100).toFixed(0);
      }
      elements.push(
        `<text x="${knobX}" y="${knobY - ringRadius - 4}" text-anchor="middle" font-family="Arial" font-size="9" fill="#666">${valueText}</text>`
      );

      // Knob label
      elements.push(
        `<text x="${knobX}" y="${knobY + knobRadius + 12}" text-anchor="middle" font-family="Arial" font-size="9">${escapeXml(knob.name)}</text>`
      );
    });
  });

  // Render connections
  validated.connections.forEach(conn => {
    const fromPos = portPositions.get(conn.from);
    const toPos = portPositions.get(conn.to);

    if (!fromPos || !toPos) {
      console.warn(`Connection ${conn.from} -> ${conn.to} references unknown port`);
      return;
    }

    // Create a curved path for the connection
    const midX = (fromPos.x + toPos.x) / 2;
    const path = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${fromPos.y}, ${midX} ${(fromPos.y + toPos.y) / 2} T ${toPos.x} ${toPos.y}`;

    elements.push(
      `<path d="${path}" fill="none" stroke="${conn.color}" stroke-width="2" opacity="0.7"/>`
    );
  });

  // Build final SVG
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${opts.backgroundColor}"/>
  ${elements.join('\n  ')}
</svg>`;
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
