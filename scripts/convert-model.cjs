// OBJ (v/vt faces) -> simplified, upright, unit-height GLB with embedded JPEG texture.
const fs = require("fs");
// Usage: node scripts/convert-model.cjs <model.obj> <texture.jpg> <out.glb> [targetTriangles=36000]
const [, , objPath, texPath, outPath, targetTris = "36000"] = process.argv;
const { MeshoptSimplifier } = require("meshoptimizer");

(async () => {
  await MeshoptSimplifier.ready;
  const text = fs.readFileSync(objPath, "utf8");
  const V = [], T = [];
  const keyToIdx = new Map();
  const pos = [], uv = [], idx = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("v ")) { const p = line.split(/\s+/); V.push(+p[1], +p[2], +p[3]); }
    else if (line.startsWith("vt ")) { const p = line.split(/\s+/); T.push(+p[1], +p[2]); }
    else if (line.startsWith("f ")) {
      const parts = line.trim().split(/\s+/).slice(1);
      const tri = parts.map((s) => {
        let i = keyToIdx.get(s);
        if (i === undefined) {
          const [vi, ti] = s.split("/").map((n) => parseInt(n, 10) - 1);
          i = pos.length / 3;
          // reorient: scan axis z -> y up
          pos.push(V[vi * 3], V[vi * 3 + 2], -V[vi * 3 + 1]);
          uv.push(T[ti * 2], 1 - T[ti * 2 + 1]);
          keyToIdx.set(s, i);
        }
        return i;
      });
      for (let k = 1; k + 1 < tri.length; k++) idx.push(tri[0], tri[k], tri[k + 1]);
    }
  }
  let positions = new Float32Array(pos), uvs = new Float32Array(uv), indices = new Uint32Array(idx);
  console.log("input verts", positions.length / 3, "tris", indices.length / 3);

  const target = Math.floor(Number(targetTris) * 3);
  const [simp, err] = MeshoptSimplifier.simplifyWithAttributes(indices, positions, 3, uvs, 2, [0.5, 0.5], null, target, 0.02);
  console.log("simplified tris", simp.length / 3, "error", err.toFixed(5));

  // compact unused vertices
  const remap = new Int32Array(positions.length / 3).fill(-1);
  const np = [], nu = [];
  const ni = new Uint32Array(simp.length);
  for (let k = 0; k < simp.length; k++) {
    const o = simp[k];
    if (remap[o] < 0) { remap[o] = np.length / 3; np.push(positions[o*3], positions[o*3+1], positions[o*3+2]); nu.push(uvs[o*2], uvs[o*2+1]); }
    ni[k] = remap[o];
  }
  positions = new Float32Array(np); uvs = new Float32Array(nu); indices = ni;
  const n = positions.length / 3;

  // center + scale to unit height
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) { const v = positions[i*3+a]; if (v < min[a]) min[a] = v; if (v > max[a]) max[a] = v; }
  const c = [0,1,2].map((a) => (min[a] + max[a]) / 2), s = 1 / (max[1] - min[1]);
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) positions[i*3+a] = (positions[i*3+a] - c[a]) * s;

  // smooth normals, averaged across UV seams by position
  const acc = new Map(), normals = new Float32Array(n * 3);
  const pk = (i) => `${positions[i*3].toFixed(5)},${positions[i*3+1].toFixed(5)},${positions[i*3+2].toFixed(5)}`;
  const face = (a, b, c2) => {
    const ax = positions[b*3]-positions[a*3], ay = positions[b*3+1]-positions[a*3+1], az = positions[b*3+2]-positions[a*3+2];
    const bx = positions[c2*3]-positions[a*3], by = positions[c2*3+1]-positions[a*3+1], bz = positions[c2*3+2]-positions[a*3+2];
    return [ay*bz-az*by, az*bx-ax*bz, ax*by-ay*bx];
  };
  for (let k = 0; k < indices.length; k += 3) {
    const f = face(indices[k], indices[k+1], indices[k+2]);
    for (let j = 0; j < 3; j++) { const key = pk(indices[k+j]); const a = acc.get(key) || [0,0,0]; a[0]+=f[0]; a[1]+=f[1]; a[2]+=f[2]; acc.set(key, a); }
  }
  for (let i = 0; i < n; i++) { const a = acc.get(pk(i)); const l = Math.hypot(a[0],a[1],a[2]) || 1; normals[i*3]=a[0]/l; normals[i*3+1]=a[1]/l; normals[i*3+2]=a[2]/l; }

  const pmin = [Infinity,Infinity,Infinity], pmax = [-Infinity,-Infinity,-Infinity];
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) { const v = positions[i*3+a]; pmin[a]=Math.min(pmin[a],v); pmax[a]=Math.max(pmax[a],v); }
  const idxArr = n < 65536 ? Uint16Array.from(indices) : indices;
  const img = fs.readFileSync(texPath);

  const chunks = []; let off = 0; const views = [];
  const add = (buf, target) => { const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength); const pad = (4 - (b.length % 4)) % 4; views.push({ buffer: 0, byteOffset: off, byteLength: b.length, ...(target ? { target } : {}) }); chunks.push(b, Buffer.alloc(pad)); off += b.length + pad; return views.length - 1; };
  const vPos = add(positions, 34962), vNor = add(normals, 34962), vUv = add(uvs, 34962), vIdx = add(idxArr, 34963), vImg = add(img);
  const bin = Buffer.concat(chunks);
  const gltf = {
    asset: { version: "2.0", generator: "naman-birthday convert.cjs" },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: "DietCokeCan" }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    materials: [{ name: "can", pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0.6, roughnessFactor: 0.35 } }],
    textures: [{ source: 0, sampler: 0 }], samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: vImg, mimeType: "image/jpeg" }],
    accessors: [
      { bufferView: vPos, componentType: 5126, count: n, type: "VEC3", min: pmin, max: pmax },
      { bufferView: vNor, componentType: 5126, count: n, type: "VEC3" },
      { bufferView: vUv, componentType: 5126, count: n, type: "VEC2" },
      { bufferView: vIdx, componentType: idxArr instanceof Uint16Array ? 5123 : 5125, count: indices.length, type: "SCALAR" },
    ],
    bufferViews: views, buffers: [{ byteLength: bin.length }],
  };
  let json = Buffer.from(JSON.stringify(gltf)); json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(outPath, Buffer.concat([header, jh, json, bh, bin]));
  console.log("verts", n, "size", (pmax[0]-pmin[0]).toFixed(3), (pmax[1]-pmin[1]).toFixed(3), (pmax[2]-pmin[2]).toFixed(3), "glb bytes", fs.statSync(outPath).size);
})();
