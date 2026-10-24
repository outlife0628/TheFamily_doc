import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base=process.env.FAMILY_PREVIEW_URL||'http://127.0.0.1:8080';
const resources=[['/','html'],['/styles.css','css'],['/app.js','javascript'],['/components.js','javascript'],['/field.js','javascript'],['/model.mjs','javascript'],['/commands.mjs','javascript'],['/spatial.mjs','javascript'],['/data/review_data.json','json'],['/assets/world_map_source.png','image/png']];
const results=[];
for(const [path,type] of resources){
  const r=await fetch(base+path),bytes=await r.arrayBuffer();
  const entry={path,status:r.status,type:r.headers.get('content-type'),bytes:bytes.byteLength};
  results.push(entry);assert.equal(r.status,200);assert.ok(entry.type?.includes(type));assert.ok(entry.bytes>0);
}
await writeFile(new URL('./http-results.json',import.meta.url),JSON.stringify({base,resources:results},null,2));
console.log(`HTTP resources: ${results.length}/${resources.length} returned 200 with expected MIME types.`);
