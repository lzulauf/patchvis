# PatchVis

A JavaScript library for rendering modular synthesizer patch configurations from YAML to SVG.

## Installation

Node.js/npm is required. Install dependencies with:

```bash
npm install
```

## Building

### Using npm

Build the library:

```bash
npm run build
```

### Using Docker

If you don't have Node.js installed, you can build using Docker:

```powershell
# Build and extract dist files
.\docker-build.ps1 -Build

# Or build and serve the example
.\docker-build.ps1 -Serve
# Then open http://localhost:8080/example/

# Manual commands:
docker build -t patchvis-builder .
docker create --name patchvis-temp patchvis-builder
docker cp patchvis-temp:/app/dist ./dist
docker rm patchvis-temp
```

This creates three output formats in the `dist/` directory:
- `index.js` - CommonJS format
- `index.mjs` - ES module format
- `index.min.js` - UMD format (browser-ready, minified)

## Usage

### Basic Example

```javascript
import { generateSVGFromConfig } from 'patchvis';
import yaml from 'js-yaml';

const yamlConfig = `
modules:
  - name: VCO
    position:
      x: 0
      y: 0
    outputs:
      - saw
      - square
    knobs:
      - name: freq
        position: 0.7

  - name: VCF
    position:
      x: 200
      y: 0
    inputs:
      - in
    outputs:
      - out
    knobs:
      - name: cutoff
        position: 0.5

connections:
  - from: VCO:saw
    to: VCF:in
    color: "#ff6b6b"
`;

const config = yaml.load(yamlConfig);
const svg = generateSVGFromConfig(config);
console.log(svg); // SVG string
```

### YAML Configuration Format

```yaml
modules:
  - name: ModuleName        # Required: module identifier
    type: oscillator        # Optional: module type for categorization
    position:               # Optional: defaults to {x: 0, y: 0}
      x: 0
      y: 0
    inputs:                 # Optional: list of input port names
      - in1
      - in2
    outputs:                # Optional: list of output port names
      - out1
      - out2
    knobs:                  # Optional: list of knobs
      - name: knobName      # Knob label
        position: 0.5       # Value 0.0 to 1.0 (knob rotation)

connections:
  - from: Module1:output1   # Format: ModuleName:portName
    to: Module2:input1
    color: "#ff6b6b"        # Optional: connection color
```

### Options

You can customize rendering with options:

```javascript
const options = {
  moduleWidth: 120,
  moduleHeight: 200,
  portRadius: 5,
  knobRadius: 15,
  backgroundColor: '#f5f5f5',
  moduleColor: '#e0e0e0'
};

const config = yaml.load(yamlConfig);
const svg = generateSVGFromConfig(config, options);
```

### Running the Example

1. Build the library: `npm run build`
2. Open `example/index.html` in a browser to see a live demonstration

## API

### `generateSVGFromConfig(config, options)`

Generate SVG from a JavaScript configuration object.

- **config** (object): Configuration object
- **options** (object): Optional rendering options
- **Returns**: SVG string

### `parseConfig(config)`

Validate and normalize a configuration object.

- **config** (object): Raw configuration
- **Returns**: Validated configuration object

## Development

Watch mode for development:

```bash
npm run dev
```

## License

MIT
