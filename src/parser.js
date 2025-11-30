/**
 * Parse and validate configuration
 * @param {Object} config - Raw configuration object
 * @returns {Object} Validated configuration
 */
export function parseConfig(config) {
  // Parse module definitions (templates)
  const definitions = {};
  if (config.definitions) {
    for (const [defName, defConfig] of Object.entries(config.definitions)) {
      definitions[defName] = {
        type: defConfig.type || defName,
        inputs: defConfig.inputs || [],
        outputs: defConfig.outputs || [],
        knobs: defConfig.knobs || [],
        width: defConfig.width,
        height: defConfig.height
      };
    }
  }

  // Parse module instances
  if (!config.modules || !Array.isArray(config.modules)) {
    throw new Error('Configuration must have a "modules" array');
  }

  const validatedModules = config.modules.map((module, index) => {
    if (!module.name) {
      throw new Error(`Module at index ${index} must have a "name" property`);
    }

    // If module references a definition, use it as base
    let baseModule = {};
    if (module.definition && definitions[module.definition]) {
      baseModule = { ...definitions[module.definition] };
    }

    // Handle knobs - instance can be a map of knob_name: value or {value, position}
    let knobs = baseModule.knobs || [];
    if (module.knobs) {
      if (Array.isArray(module.knobs)) {
        // Old format: array of {name, value, position}
        knobs = module.knobs;
      } else {
        // New format: map of knob_name: value or {value, position, radius}
        knobs = (baseModule.knobs || []).map(knob => {
          const knobConfig = module.knobs[knob.name];
          
          // If knobConfig is a simple number, it's just the value
          if (typeof knobConfig === 'number') {
            return {
              name: knob.name,
              value: knobConfig,
              position: knob.position,
              radius: knob.radius,
              positions: knob.positions
            };
          }
          
          // If it's an object, it can have value, position, and/or radius
          if (typeof knobConfig === 'object' && knobConfig !== null) {
            return {
              name: knob.name,
              value: knobConfig.value !== undefined ? knobConfig.value : knob.value,
              position: knobConfig.position || knob.position,
              radius: knobConfig.radius !== undefined ? knobConfig.radius : knob.radius,
              positions: knob.positions
            };
          }
          
          // Otherwise use default from definition
          return {
            name: knob.name,
            value: knob.value,
            position: knob.position,
            radius: knob.radius,
            positions: knob.positions
          };
        });
      }
    }

    return {
      name: module.name,
      type: module.definition || baseModule.type || 'default',
      position: module.position || { x: 0, y: 0 },
      inputs: module.inputs || baseModule.inputs || [],
      outputs: module.outputs || baseModule.outputs || [],
      knobs: knobs,
      width: module.width || baseModule.width,
      height: module.height || baseModule.height
    };
  });

  const connections = (config.connections || []).map((conn, index) => {
    if (!conn.from || !conn.to) {
      throw new Error(`Connection at index ${index} must have "from" and "to" properties`);
    }
    return {
      from: conn.from,
      to: conn.to,
      color: conn.color || '#333'
    };
  });

  return {
    title: config.title,
    definitions: definitions,
    modules: validatedModules,
    connections: connections,
    options: config.options || {}
  };
}
