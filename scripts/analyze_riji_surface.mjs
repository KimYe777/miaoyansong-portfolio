import { readFile } from 'node:fs/promises';

const source = process.argv[2];
if (!source) throw new Error('Usage: node analyze_riji_surface.mjs model.glb');
const minimumBandY = Number(process.argv[3] ?? -0.02);
const maximumBandY = Number(process.argv[4] ?? 0.31);

const input = await readFile(source);
const jsonLength = input.readUInt32LE(12);
const json = JSON.parse(input.toString('utf8', 20, 20 + jsonLength));
const binaryHeader = 20 + jsonLength;
const binaryLength = input.readUInt32LE(binaryHeader);
const binary = input.subarray(binaryHeader + 8, binaryHeader + 8 + binaryLength);
const primitive = json.meshes[0].primitives[0];
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const arrays = { 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };

function accessor(index) {
  const item = json.accessors[index];
  const view = json.bufferViews[item.bufferView];
  const Type = arrays[item.componentType];
  const offset = (view.byteOffset || 0) + (item.byteOffset || 0);
  return new Type(binary.buffer, binary.byteOffset + offset, item.count * components[item.type]);
}

const positions = accessor(primitive.attributes.POSITION);
const normals = accessor(primitive.attributes.NORMAL);
const worldBounds = {
  min: [Infinity, Infinity, Infinity],
  max: [-Infinity, -Infinity, -Infinity],
};
for (let index = 0; index < positions.length; index += 3) {
  const world = [positions[index], -positions[index + 2], positions[index + 1]];
  world.forEach((value, axis) => {
    worldBounds.min[axis] = Math.min(worldBounds.min[axis], value);
    worldBounds.max[axis] = Math.max(worldBounds.max[axis], value);
  });
}
const center = worldBounds.min.map((value, axis) => (value + worldBounds.max[axis]) / 2);
const screenCandidates = [];
for (let index = 0; index < positions.length; index += 3) {
  const x = positions[index] - center[0];
  const y = -positions[index + 2] - center[1];
  const z = positions[index + 1] - center[2];
  const nx = normals[index];
  const ny = -normals[index + 2];
  const nz = normals[index + 1];
  if (Math.abs(x) <= 0.36 && y >= minimumBandY && y <= maximumBandY && nz >= 0.45) {
    screenCandidates.push({ x, y, z, nx, ny, nz });
  }
}

const bands = [];
for (let start = minimumBandY; start < maximumBandY; start += 0.03) {
  const points = screenCandidates.filter((point) => point.y >= start && point.y < start + 0.03);
  if (!points.length) continue;
  const values = (key) => points.map((point) => point[key]);
  const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  bands.push({
    y: `${start.toFixed(2)}..${(start + 0.03).toFixed(2)}`,
    count: points.length,
    xMin: Math.min(...values('x')).toFixed(3),
    xMax: Math.max(...values('x')).toFixed(3),
    zMin: Math.min(...values('z')).toFixed(3),
    zMax: Math.max(...values('z')).toFixed(3),
    zAvg: average(values('z')).toFixed(3),
    normal: [average(values('nx')), average(values('ny')), average(values('nz'))].map((value) => value.toFixed(3)).join(','),
  });
}

console.table(bands);
console.log({ worldBounds, center });
