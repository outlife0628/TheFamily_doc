import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex').toUpperCase();
const baseline=JSON.parse(await readFile(new URL('./original-files-baseline.json',import.meta.url),'utf8'));
const problems=[];
for(const item of baseline){
  try{if(hash(await readFile(item.Path))!==item.Sha256)problems.push(item.Path);}
  catch{problems.push(item.Path);}
}
const source=await readFile(new URL('../../reference/world/world_map_source.png',import.meta.url));
const copied=await readFile(new URL('../../prototype/movement/assets/world_map_source.png',import.meta.url));
const mapBytesIdentical=source.equals(copied);
const result={originalFiles:baseline.length,unchanged:baseline.length-problems.length,problems,mapBytesIdentical,mapSha256:hash(source)};
await writeFile(new URL('./preservation-results.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(problems.length||!mapBytesIdentical)process.exitCode=1;
