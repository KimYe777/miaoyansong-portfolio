import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { MeshoptSimplifier } from 'meshoptimizer';

const require = createRequire(import.meta.url);
const sharp = require('C:/Users/gnosn/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const inputPath = 'C:/Users/gnosn/Downloads/218bb8c011eadcf4884c226ce6a0c98f.glb';
const outputPath = path.resolve('public/assets/models/nightcare-optimized.glb');
const targetIndices = 600_000;

const align4 = (value) => (value + 3) & ~3;
const componentBytes = { 5125: 4, 5126: 4 };
const typeSize = { SCALAR: 1, VEC2: 2, VEC3: 3 };

function parseGlb(buffer) {
  if (buffer.toString('utf8', 0, 4) !== 'glTF') throw new Error('Input is not a GLB file');
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).trim());
  const binHeader = 20 + align4(jsonLength);
  const binLength = buffer.readUInt32LE(binHeader);
  return { json, bin: buffer.subarray(binHeader + 8, binHeader + 8 + binLength) };
}

function readAccessor(json, bin, index) {
  const accessor = json.accessors[index];
  const view = json.bufferViews[accessor.bufferView];
  const offset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const length = accessor.count * typeSize[accessor.type];
  if (view.byteStride) throw new Error('Interleaved accessors are not supported by this optimizer');
  if (accessor.componentType === 5126) {
    return new Float32Array(bin.buffer, bin.byteOffset + offset, length).slice();
  }
  if (accessor.componentType === 5125) {
    return new Uint32Array(bin.buffer, bin.byteOffset + offset, length).slice();
  }
  throw new Error(`Unsupported accessor component type ${accessor.componentType}`);
}

function remapAttribute(source, itemSize, remap, uniqueCount) {
  const output = new Float32Array(uniqueCount * itemSize);
  for (let oldIndex = 0; oldIndex < remap.length; oldIndex += 1) {
    const newIndex = remap[oldIndex];
    if (newIndex === 0xffffffff) continue;
    for (let component = 0; component < itemSize; component += 1) {
      output[newIndex * itemSize + component] = source[oldIndex * itemSize + component];
    }
  }
  return output;
}

function minMaxVec3(array) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < array.length; index += 3) {
    for (let component = 0; component < 3; component += 1) {
      min[component] = Math.min(min[component], array[index + component]);
      max[component] = Math.max(max[component], array[index + component]);
    }
  }
  return { min, max };
}

function padBuffer(buffer) {
  const padded = Buffer.alloc(align4(buffer.length));
  buffer.copy(padded);
  return padded;
}

function makeGlb(json, binary) {
  const jsonBuffer = Buffer.from(JSON.stringify(json));
  const paddedJson = Buffer.alloc(align4(jsonBuffer.length), 0x20);
  jsonBuffer.copy(paddedJson);
  const paddedBin = padBuffer(binary);
  const output = Buffer.alloc(12 + 8 + paddedJson.length + 8 + paddedBin.length);
  output.write('glTF', 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(paddedJson.length, 12);
  output.write('JSON', 16);
  paddedJson.copy(output, 20);
  const binHeader = 20 + paddedJson.length;
  output.writeUInt32LE(paddedBin.length, binHeader);
  output.write('BIN\0', binHeader + 4);
  paddedBin.copy(output, binHeader + 8);
  return output;
}

await MeshoptSimplifier.ready;
const input = await fs.readFile(inputPath);
const { json, bin } = parseGlb(input);
const primitive = json.meshes[0].primitives[0];
const positions = readAccessor(json, bin, primitive.attributes.POSITION);
const normals = readAccessor(json, bin, primitive.attributes.NORMAL);
const texcoords = readAccessor(json, bin, primitive.attributes.TEXCOORD_0);
const indices = readAccessor(json, bin, primitive.indices);

const [simplifiedIndices, simplificationError] = MeshoptSimplifier.simplify(
  indices,
  positions,
  3,
  targetIndices,
  0.004,
  ['Prune'],
);
const [remap, uniqueCount] = MeshoptSimplifier.compactMesh(simplifiedIndices);
const compactPositions = remapAttribute(positions, 3, remap, uniqueCount);
const compactNormals = remapAttribute(normals, 3, remap, uniqueCount);
const compactTexcoords = remapAttribute(texcoords, 2, remap, uniqueCount);

const optimizedImages = [];
for (const image of json.images) {
  const view = json.bufferViews[image.bufferView];
  const source = bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  const metadata = await sharp(source).metadata();
  const maxDimension = image.name?.includes('normal') ? 1536 : 2048;
  const resized = await sharp(source)
    .resize({ width: maxDimension, height: maxDimension, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
    .toBuffer();
  optimizedImages.push({ image, buffer: resized, original: `${metadata.width}x${metadata.height}` });
}

const chunks = [];
const bufferViews = [];
let byteOffset = 0;
const addView = (buffer, target) => {
  const padded = padBuffer(buffer);
  const index = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset, byteLength: buffer.length, ...(target ? { target } : {}) });
  chunks.push(padded);
  byteOffset += padded.length;
  return index;
};

const positionView = addView(Buffer.from(compactPositions.buffer), 34962);
const normalView = addView(Buffer.from(compactNormals.buffer), 34962);
const texcoordView = addView(Buffer.from(compactTexcoords.buffer), 34962);
const indexView = addView(Buffer.from(simplifiedIndices.buffer), 34963);
const imageViews = optimizedImages.map(({ buffer }) => addView(buffer));
const bounds = minMaxVec3(compactPositions);

json.bufferViews = bufferViews;
json.accessors = [
  { bufferView: positionView, componentType: 5126, count: uniqueCount, type: 'VEC3', min: bounds.min, max: bounds.max },
  { bufferView: normalView, componentType: 5126, count: uniqueCount, type: 'VEC3' },
  { bufferView: texcoordView, componentType: 5126, count: uniqueCount, type: 'VEC2' },
  { bufferView: indexView, componentType: 5125, count: simplifiedIndices.length, type: 'SCALAR' },
];
primitive.attributes = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
primitive.indices = 3;
json.images.forEach((image, index) => {
  image.bufferView = imageViews[index];
  image.mimeType = 'image/png';
});
json.buffers = [{ byteLength: byteOffset }];
json.asset.generator = 'Codex NightCare web optimizer';

const output = makeGlb(json, Buffer.concat(chunks));
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, output);

console.log(JSON.stringify({
  inputBytes: input.length,
  outputBytes: output.length,
  originalTriangles: indices.length / 3,
  outputTriangles: simplifiedIndices.length / 3,
  originalVertices: positions.length / 3,
  outputVertices: uniqueCount,
  simplificationError,
  images: optimizedImages.map(({ image, buffer, original }) => ({ name: image.name, original, bytes: buffer.length })),
}, null, 2));
