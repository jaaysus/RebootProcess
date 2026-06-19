import fs from 'fs';
import path from 'path';

const faces = ['FACE A', 'FACE B'];
const criticalities = ['SC', 'CC', 'None'];
const moduleTypes = ['Common', 'PHEV', 'BEV', 'MHEV'];

const descriptions = [
  'Take the circuit from the kit',
  'Insert the circuit into the cavity',
  'Seal the circuit with the tool',
  'Twist the paired cores evenly',
  'Route the circuit along the path',
  'Insert the terminal until locked',
  'Take the wire and check length',
  'Seal the connector after insertion',
  'Twist the cores to spec',
  'Route the harness through guides',
  'Insert the circuit into FACE A',
  'Take the circuit and align it',
  'Seal the entry point fully',
  'Twist the pair to the mark',
  'Route the cable bundle safely',
  'Insert the terminal into cavity',
  'Take the circuit and measure length',
  'Seal the cavity using the tool',
  'Twist the cores and inspect',
  'Route the circuit away from edges',
  'Insert the circuit into FACE B',
  'Take the wire and check class',
  'Seal the connector properly',
  'Twist the pairs to length',
  'Route the harness along board',
  'Insert the terminal and test pull',
  'Take the circuit from shelving',
  'Seal the wire with approved seal',
  'Twist the cores carefully',
  'Route the circuit through sleeve',
  'Insert the circuit correctly',
  'Take the wire and verify ID',
  'Seal the cavity after check',
  'Twist the wires along marking',
  'Route the harness and secure ties',
  'Insert the terminal fully',
  'Take the circuit and check reference',
  'Seal the connector interface',
  'Twist the pairs without damage',
  'Route the circuit using sample',
  'Insert the circuit in position',
  'Take the wire and inspect insulation',
  'Seal the entry point with seal',
  'Twist the pairs with tension',
  'Route the harness to next station',
  'Insert the terminal and check fit',
  'Take the circuit and confirm module',
  'Seal the connector as instructed',
  'Twist the cores to marking',
  'Route the harness for next step'
];

const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function generateSteps() {
  const stepCount = randomBetween(4, 9);
  const steps = [];

  for (let i = 1; i <= stepCount; i++) {
    steps.push({
      id: i,
      face: randomChoice(faces),
      circuit: `CIRCUIT_${Math.floor(Math.random() * 1000)}`,
      description: randomChoice(descriptions),
      colour: `${randomChoice(['BK','WH','GN','YE','BU','VT','GY','OG'])}/${randomChoice(['BK','WH','GN','YE','BU','VT','GY','OG'])}/${randomChoice(['BK','WH','GN','YE','BU','VT','GY','OG'])}`,
      core: `Core ${Math.ceil(Math.random() * 3)}`,
      twist: `TW${Math.floor(Math.random() * 300)}`,
      connector1: `C3C${Math.floor(Math.random() * 1000)}A`,
      cavity1: `${Math.ceil(Math.random() * 60)}`,
      connector2: `C3C${Math.floor(Math.random() * 1000)}B`,
      cavity2: `${Math.ceil(Math.random() * 60)}`,
      section: `${(Math.random() * 0.5 + 0.2).toFixed(2)}`,
      length: `${Math.floor(Math.random() * 3000 + 500)}`,
      jlrClass: randomChoice(criticalities)
    });
  }

  return steps;
}

function generateLineStations(preAssemblyCount, cellCount) {
  const stations = [];

  for (let i = 1; i <= preAssemblyCount; i++) {
    stations.push({
      station: `PreAssembly ${i}`,
      module: randomChoice(moduleTypes),
      insertionTool: 'Manual',
      shelving: `KIT ${i}-PA`,
      steps: generateSteps()
    });
  }

  for (let i = 1; i <= cellCount; i++) {
    stations.push({
      station: `Cell ${i}`,
      module: randomChoice(moduleTypes),
      insertionTool: 'Manual',
      shelving: `KIT C${i}`,
      steps: generateSteps()
    });
  }

  return stations;
}

const linesData = {
  L461: {
    stations: generateLineStations(15, 17)
  },
  L460: {
    stations: generateLineStations(14, 19)
  }
};

// Make sure the data folder exists
const dataFolder = path.join(process.cwd(), 'src/data');
if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder);
}

// Export as a React-ready JS file
const filePath = path.join(dataFolder, 'harnessData.js');
const fileContent = `export const harnessData = ${JSON.stringify(linesData, null, 2)};`;

fs.writeFileSync(filePath, fileContent);

console.log('data/harnessData.js created successfully!');
