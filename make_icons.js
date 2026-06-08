// make_icons.js — DarkShield icon generator
// Shield with eye design — red/dark theme
// Run: node make_icons.js

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.join(__dirname, 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function writePng(size, pixelFn) {
  const w = size, h = size;
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixelFn(x / (w - 1), y / (h - 1));
      const i = y * (1 + w * 4) + 1 + x * 4;
      raw[i]=r; raw[i+1]=g; raw[i+2]=b; raw[i+3]=a;
    }
  }
  function u32be(n) { const b=Buffer.alloc(4); b.writeUInt32BE(n); return b; }
  function crc32(buf) { let c=0xFFFFFFFF; for(const b of buf){c^=b;for(let i=0;i<8;i++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);} return(c^0xFFFFFFFF)>>>0; }
  function chunk(type,data) { const t=Buffer.from(type,'ascii'); return Buffer.concat([u32be(data.length),t,data,u32be(crc32(Buffer.concat([t,data])))]); }
  const ihdr = Buffer.concat([u32be(w),u32be(h),Buffer.from([8,6,0,0,0])]);
  const idat = zlib.deflateSync(raw,{level:9});
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',idat),chunk('IEND',Buffer.alloc(0))]);
}

const lerp  = (a,b,t) => a+(b-a)*t;
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const dist  = (x1,y1,x2,y2) => Math.sqrt((x1-x2)**2+(y1-y2)**2);
function lerpRGB(c1,c2,t) { return [Math.round(lerp(c1[0],c2[0],t)),Math.round(lerp(c1[1],c2[1],t)),Math.round(lerp(c1[2],c2[2],t))]; }

function distToSeg(px,py,ax,ay,bx,by) {
  const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;
  if(len2===0)return dist(px,py,ax,ay);
  const t=clamp(((px-ax)*dx+(py-ay)*dy)/len2,0,1);
  return dist(px,py,ax+t*dx,ay+t*dy);
}

function roundedRect(nx,ny,x,y,w,h,r) {
  const qx=Math.abs(nx-(x+w/2))-w/2+r;
  const qy=Math.abs(ny-(y+h/2))-h/2+r;
  return Math.sqrt(Math.max(qx,0)**2+Math.max(qy,0)**2)+Math.min(Math.max(qx,qy),0)-r;
}

// Shield SDF
function shieldSdf(nx, ny) {
  // Shield: rounded top, pointed bottom
  const cx = 0.5, cy = 0.46;
  const dx = nx - cx, dy = ny - cy;
  // Top half: rounded rect
  const topSdf = roundedRect(nx, ny, 0.14, 0.10, 0.72, 0.55, 0.18);
  // Bottom: triangle point
  const bl = distToSeg(nx,ny, 0.14,0.60, 0.50,0.88);
  const br = distToSeg(nx,ny, 0.86,0.60, 0.50,0.88);
  const bb = distToSeg(nx,ny, 0.14,0.60, 0.86,0.60);
  const triInside = (nx > 0.14 && nx < 0.86 && ny > 0.60) ? -Math.min(bl,br,bb) : Math.min(bl,br,bb);
  return Math.min(topSdf, triInside);
}

function pixel(nx, ny) {
  const bgSdf = roundedRect(nx,ny, 0.04,0.04, 0.92,0.92, 0.20);
  if (bgSdf > 0) return [0,0,0,0];

  const RED   = [239,68,68];
  const DKRED = [127,29,29];
  const WHITE = [255,240,240];
  const BG    = [10,6,20];

  // Background gradient
  const bgGrad = clamp(dist(nx,ny,0.3,0.35)*1.8,0,1);
  let [r,g,b] = lerpRGB([20,8,8],[8,4,14],bgGrad);
  let a = 255;

  // Inner edge glow
  const edgeDist = -bgSdf;
  if (edgeDist < 0.04) {
    const eg = 1 - edgeDist/0.04;
    [r,g,b] = lerpRGB([r,g,b],[120,20,20],eg*0.25);
  }

  // Shield
  const sSdf = shieldSdf(nx, ny);
  if (sSdf < 0.005) {
    // Shield fill — gradient
    const sg = clamp(dist(nx,ny,0.5,0.3)*2.0,0,1);
    [r,g,b] = lerpRGB([200,30,30],[120,10,10],sg);
  }
  // Shield glow
  if (sSdf > 0.005 && sSdf < 0.04) {
    const t = (sSdf-0.005)/0.035;
    [r,g,b] = lerpRGB([r,g,b],RED,(1-t*t)*0.6);
  }
  // Shield inner highlight (top-left)
  if (sSdf < -0.01) {
    const hd = dist(nx,ny,0.32,0.22);
    if (hd < 0.12) {
      const hi = (1-hd/0.12)*0.3;
      [r,g,b] = lerpRGB([r,g,b],WHITE,hi);
    }
  }

  // Eye in center of shield
  if (sSdf < -0.02) {
    const ex=0.50, ey=0.46;
    const ed = dist(nx,ny,ex,ey);
    // Eye white (ellipse)
    const exScale = (nx-ex)*1.8, eyScale = (ny-ey)*1.0;
    const eyeDist = Math.sqrt(exScale*exScale+eyScale*eyScale);
    if (eyeDist < 0.18) {
      const t = eyeDist/0.18;
      [r,g,b] = lerpRGB(WHITE,[180,20,20],t*t*0.3);
    }
    // Pupil
    if (ed < 0.07) {
      const pt = ed/0.07;
      [r,g,b] = lerpRGB([8,4,14],[40,5,5],pt);
    }
    // Pupil highlight
    if (dist(nx,ny,ex-0.02,ey-0.025)<0.025) {
      const ht=(1-dist(nx,ny,ex-0.02,ey-0.025)/0.025);
      [r,g,b] = lerpRGB([r,g,b],WHITE,ht*0.7);
    }
    // Eyelashes
    const lashD = Math.min(
      distToSeg(nx,ny,ex-0.14,ey-0.04,ex-0.08,ey+0.01),
      distToSeg(nx,ny,ex+0.14,ey-0.04,ex+0.08,ey+0.01),
      distToSeg(nx,ny,ex,ey-0.13,ex,ey-0.07)
    );
    if (lashD < 0.012) {
      [r,g,b] = lerpRGB(WHITE,RED,lashD/0.012);
    }
  }

  return [clamp(r,0,255),clamp(g,0,255),clamp(b,0,255),a];
}

[16,32,48,128].forEach(size => {
  const buf = writePng(size, pixel);
  const out = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(out, buf);
  console.log(`✅ icons/icon${size}.png — ${buf.length} bytes`);
});

console.log('\n🛡️ DarkShield icons ready! Load extension in chrome://extensions');
