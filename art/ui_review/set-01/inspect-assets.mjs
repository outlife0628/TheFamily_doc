// Read-only PNG inspection with built-in Node modules; does not edit image pixels.
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';

function inspect(bytes){
  const pieces=[];let width,height,depth,type,interlace;
  for(let offset=8;offset<bytes.length;){
    const length=bytes.readUInt32BE(offset),tag=bytes.toString('ascii',offset+4,offset+8),part=bytes.subarray(offset+8,offset+8+length);
    if(tag==='IHDR'){width=part.readUInt32BE(0);height=part.readUInt32BE(4);depth=part[8];type=part[9];interlace=part[12];}
    if(tag==='IDAT')pieces.push(part);
    offset+=length+12;
  }
  if(depth!==8||type!==6||interlace!==0)return {width,height,depth,colorType:type,interlace,alphaInspection:'unsupported encoding'};
  const inflated=inflateSync(Buffer.concat(pieces)),stride=width*4;
  let previous=new Uint8Array(stride),offset=0,minA=255,maxA=0,zero=0,partial=0,nonzero=0,redPixels=0,centerAlpha;
  let left=width,top=height,right=-1,bottom=-1;
  let visibleLeft=width,visibleTop=height,visibleRight=-1,visibleBottom=-1;
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){
    const filter=inflated[offset++],row=new Uint8Array(stride);
    for(let i=0;i<stride;i++){
      const a=i>=4?row[i-4]:0,b=previous[i],c=i>=4?previous[i-4]:0;
      const predictor=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);
      row[i]=(inflated[offset++]+predictor)&255;
    }
    for(let x=0;x<width;x++){
      const i=x*4,a=row[i+3];minA=Math.min(minA,a);maxA=Math.max(maxA,a);
      if(a===0)zero++;else{
        nonzero++;if(a<255)partial++;
        left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
        if(a>=128){visibleLeft=Math.min(visibleLeft,x);visibleTop=Math.min(visibleTop,y);visibleRight=Math.max(visibleRight,x);visibleBottom=Math.max(visibleBottom,y);}
        if(a>=128&&row[i]>180&&row[i]>row[i+1]*1.7&&row[i]>row[i+2]*1.7)redPixels++;
      }
      if(x===Math.floor(width/2)&&y===Math.floor(height/2))centerAlpha=a;
    }
    previous=row;
  }
  return {width,height,depth,colorType:type,alphaMin:minA,alphaMax:maxA,transparentPixels:zero,partialAlphaPixels:partial,nonzeroPixels:nonzero,centerAlpha,contentBounds:[left,top,right+1,bottom+1],visibleBoundsAtAlpha128:[visibleLeft,visibleTop,visibleRight+1,visibleBottom+1],saturatedRedPixelsAtAlpha128:redPixels};
}
const directory=new URL('./',import.meta.url),results=[];
for(const file of (await readdir(directory)).filter(name=>name.endsWith('.png')).sort()){
  const bytes=await readFile(new URL(file,directory));
  results.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),...inspect(bytes)});
}
await writeFile(new URL('asset-inspection.json',directory),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
