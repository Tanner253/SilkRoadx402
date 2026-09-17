import { mkdirSync, writeFileSync } from 'node:fs';
import { BufferGeometry, BufferAttribute, MeshStandardMaterial } from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Offline, smooth implicit sculpt. The client only downloads the finished mesh.
const size = 112, extent = 2.8;
const sculpt = new MarchingCubes(size, new MeshStandardMaterial(), false, false, 180000);
sculpt.isolation = 0;
const mix = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k / 4; };
function ellipsoid(x,y,z,cx,cy,cz,rx,ry,rz) {
  x-=cx;y-=cy;z-=cz;
  const k0=Math.hypot(x/rx,y/ry,z/rz), k1=Math.hypot(x/(rx*rx),y/(ry*ry),z/(rz*rz));
  return k1 > 0 ? k0*(k0-1)/k1 : -Math.min(rx,ry,rz);
}
function box(x,y,z,rx,ry,rz,r=0) {
  const a=Math.abs(x)-rx,b=Math.abs(y)-ry,c=Math.abs(z)-rz;
  return Math.hypot(Math.max(a,0),Math.max(b,0),Math.max(c,0))+Math.min(Math.max(a,b,c),0)-r;
}
function field(x,y,z) {
  let d=ellipsoid(x,y,z,0,0,0,1.48,1.08,.94);
  d=mix(d,ellipsoid(x,y,z,-1.10,.22,0,.83,.77,.76),.38);
  d=mix(d,ellipsoid(x,y,z,-1.78,.04,0,.49,.34,.51),.22);
  // A softly flattened muzzle, with real recessed nostrils.
  d=Math.max(d,-2.13-x);
  for(const side of [-1,1]) {
    for(const leg of [-.87,.84]) d=mix(d,ellipsoid(x,y,z,leg,-.98,side*.56,.30,.48,.29),.22);
    // Tilted ear forms smoothly fused into the head.
    const ex=x+1.03, ey=y-1.01, ez=z-side*.51;
    const tiltedY=ey*.83+ez*side*.55, tiltedZ=-ey*side*.55+ez*.83;
    d=mix(d,ellipsoid(ex,tiltedY,tiltedZ,0,0,0,.31,.40,.16),.16);
    d=Math.max(d,-ellipsoid(x,y,z,-2.115,.065,side*.205,.14,.095,.07));
  }
  // Through-slot aligned to coin thickness. Interior is naturally occluded.
  d=Math.max(d,-box(x-.05,y-1.08,z,.39,.27,.045,.035));
  return Math.max(d, -1.40-y);
}
for(let z=0;z<size;z++) for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
  sculpt.field[x+y*size+z*size*size]=-field((x/size*2-1)*extent,(y/size*2-1)*extent,(z/size*2-1)*extent);
}
sculpt.update();
const raw=new BufferGeometry();
raw.setAttribute('position',new BufferAttribute(sculpt.geometry.attributes.position.array.slice(0,sculpt.count*3),3));
raw.setAttribute('normal',new BufferAttribute(sculpt.geometry.attributes.normal.array.slice(0,sculpt.count*3),3));
raw.scale(extent,extent,extent);raw.normalizeNormals();
const geo=mergeVertices(raw,0.0001);geo.computeBoundingBox();
const arrays=[geo.attributes.position.array,geo.attributes.normal.array,geo.index.array];
let offset=0;
const views=arrays.map(a=>{const v={buffer:0,byteOffset:offset,byteLength:a.byteLength};offset+=Math.ceil(a.byteLength/4)*4;return v;});
const bin=Buffer.alloc(offset);arrays.forEach((a,i)=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).copy(bin,views[i].byteOffset));
const doc={asset:{version:'2.0',generator:'OpenFund implicit ceramic sculpt'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:'CeramicPig'}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1},indices:2}]}],buffers:[{byteLength:bin.length}],bufferViews:views,accessors:[{bufferView:0,componentType:5126,count:geo.attributes.position.count,type:'VEC3',min:geo.boundingBox.min.toArray(),max:geo.boundingBox.max.toArray()},{bufferView:1,componentType:5126,count:geo.attributes.normal.count,type:'VEC3'},{bufferView:2,componentType:geo.index.array instanceof Uint32Array?5125:5123,count:geo.index.count,type:'SCALAR'}]};
const json=Buffer.from(JSON.stringify(doc));const padded=Buffer.alloc(Math.ceil(json.length/4)*4,0x20);json.copy(padded);
const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+padded.length+8+bin.length,8);
const chunk=(b,type)=>{const h=Buffer.alloc(8);h.writeUInt32LE(b.length,0);h.writeUInt32LE(type,4);return Buffer.concat([h,b]);};
mkdirSync('public/models',{recursive:true});writeFileSync('public/models/openfund-pig.glb',Buffer.concat([header,chunk(padded,0x4e4f534a),chunk(bin,0x004e4942)]));
console.log({vertices:geo.attributes.position.count,triangles:geo.index.count/3,bytes:header.readUInt32LE(8)});
