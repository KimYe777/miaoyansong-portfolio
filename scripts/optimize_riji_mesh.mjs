import { readFile, writeFile } from 'node:fs/promises';
import { MeshoptSimplifier } from 'meshoptimizer';

const source = process.argv[2];
const target = process.argv[3];
if (!source || !target) throw new Error('Usage: node optimize_riji_mesh.mjs source.glb target.glb');

const input = await readFile(source);
if (input.toString('utf8', 0, 4) !== 'glTF') throw new Error('Not a binary glTF file');
const jsonLength = input.readUInt32LE(12);
const json = JSON.parse(input.toString('utf8', 20, 20 + jsonLength));
const binHeader = 20 + jsonLength;
const binLength = input.readUInt32LE(binHeader);
const binary = input.subarray(binHeader + 8, binHeader + 8 + binLength);
const primitive = json.meshes[0].primitives[0];

const componentCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const readAccessor = (index, Type) => {
  const accessor = json.accessors[index];
  const view = json.bufferViews[accessor.bufferView];
  const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const count = accessor.count * componentCount[accessor.type];
  return new Type(binary.buffer, binary.byteOffset + offset, count);
};

const positions = readAccessor(primitive.attributes.POSITION, Float32Array);
const normals = readAccessor(primitive.attributes.NORMAL, Float32Array);
const uvs = readAccessor(primitive.attributes.TEXCOORD_0, Float32Array);
const originalIndices = readAccessor(primitive.indices, Uint32Array);
const indices = new Uint32Array(originalIndices);

await MeshoptSimplifier.ready;
const targetIndexCount = Math.floor(Math.min(indices.length * 0.135, 600000) / 3) * 3;
const [simplified, error] = MeshoptSimplifier.simplify(indices, positions, 3, targetIndexCount, 0.02, ['LockBorder', 'Permissive']);
const compactIndices = new Uint32Array(simplified);
const [remap, vertexCount] = MeshoptSimplifier.compactMesh(compactIndices);
const compactPositions = new Float32Array(vertexCount * 3);
const compactNormals = new Float32Array(vertexCount * 3);
const compactUvs = new Float32Array(vertexCount * 2);
const missing = 0xffffffff;
for (let oldIndex = 0; oldIndex < remap.length; oldIndex++) {
  const newIndex = remap[oldIndex];
  if (newIndex === missing) continue;
  compactPositions.set(positions.subarray(oldIndex * 3, oldIndex * 3 + 3), newIndex * 3);
  compactNormals.set(normals.subarray(oldIndex * 3, oldIndex * 3 + 3), newIndex * 3);
  compactUvs.set(uvs.subarray(oldIndex * 2, oldIndex * 2 + 2), newIndex * 2);
}

const chunks = [];
let offset = 0;
const addChunk = (data) => {
  const pad = (4 - (offset % 4)) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; }
  const start = offset;
  const chunk = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  chunks.push(chunk);
  offset += chunk.length;
  return { start, length: chunk.length };
};
const positionChunk = addChunk(compactPositions);
const normalChunk = addChunk(compactNormals);
const uvChunk = addChunk(compactUvs);
const indexChunk = addChunk(compactIndices);

const imageChunks = json.images.map((image) => {
  const view = json.bufferViews[image.bufferView];
  return addChunk(binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength));
});

const positionAccessor = json.accessors[primitive.attributes.POSITION];
const normalAccessor = json.accessors[primitive.attributes.NORMAL];
const uvAccessor = json.accessors[primitive.attributes.TEXCOORD_0];
const indexAccessor = json.accessors[primitive.indices];
positionAccessor.count = vertexCount;
normalAccessor.count = vertexCount;
uvAccessor.count = vertexCount;
indexAccessor.count = compactIndices.length;
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (let index = 0; index < compactPositions.length; index += 3) {
  for (let axis = 0; axis < 3; axis++) {
    min[axis] = Math.min(min[axis], compactPositions[index + axis]);
    max[axis] = Math.max(max[axis], compactPositions[index + axis]);
  }
}
positionAccessor.min = min;
positionAccessor.max = max;
json.bufferViews = [
  { buffer: 0, byteOffset: positionChunk.start, byteLength: positionChunk.length, target: 34962 },
  { buffer: 0, byteOffset: normalChunk.start, byteLength: normalChunk.length, target: 34962 },
  { buffer: 0, byteOffset: uvChunk.start, byteLength: uvChunk.length, target: 34962 },
  { buffer: 0, byteOffset: indexChunk.start, byteLength: indexChunk.length, target: 34963 },
  ...imageChunks.map((chunk) => ({ buffer: 0, byteOffset: chunk.start, byteLength: chunk.length })),
];
json.images.forEach((image, index) => { image.bufferView = index + 4; });

const newBinary = Buffer.concat(chunks);
json.buffers[0].byteLength = newBinary.length;
let jsonBuffer = Buffer.from(JSON.stringify(json));
const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
if (jsonPadding) jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);
const binaryPadding = (4 - (newBinary.length % 4)) % 4;
const paddedBinary = binaryPadding ? Buffer.concat([newBinary, Buffer.alloc(binaryPadding)]) : newBinary;
const output = Buffer.alloc(12 + 8 + jsonBuffer.length + 8 + paddedBinary.length);
output.write('glTF', 0);
output.writeUInt32LE(2, 4);
output.writeUInt32LE(output.length, 8);
output.writeUInt32LE(jsonBuffer.length, 12);
output.writeUInt32LE(0x4e4f534a, 16);
jsonBuffer.copy(output, 20);
const outputBinHeader = 20 + jsonBuffer.length;
output.writeUInt32LE(paddedBinary.length, outputBinHeader);
output.writeUInt32LE(0x004e4942, outputBinHeader + 4);
paddedBinary.copy(output, outputBinHeader + 8);
await writeFile(target, output);

process.stdout.write(JSON.stringify({
  sourceVertices: positionAccessor.count + (positions.length / 3 - vertexCount),
  sourceTriangles: originalIndices.length / 3,
  vertices: vertexCount,
  triangles: compactIndices.length / 3,
  error,
  bytes: output.length,
}, null, 2));
