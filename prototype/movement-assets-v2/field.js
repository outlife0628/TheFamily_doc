// Hand-drawn Canvas review space with independent pixel sprites.
// This projection is a browser demonstration, not a Godot scene or Map Tool output.
export class FieldScene {
  constructor(canvas, actors, { stop = false, position = { x: 960, y: 735 }, onNear = () => {} } = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.actors = actors;
    this.stop = stop; this.onNear = onNear; this.keys = new Set();
    this.player = { ...position }; this.last = 0; this.running = true;
    this.history = Array.from({length: 80}, () => ({ ...position }));
    this.background = document.createElement('canvas'); this.background.width = 1920; this.background.height = 1080;
    this.drawBackground(this.background.getContext('2d'));
    this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
  }
  destroy() { this.running = false; cancelAnimationFrame(this.raf); this.keys.clear(); }
  clearKeys() { this.keys.clear(); }
  path(c, points, color, stroke) {
    c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath();
    c.fillStyle = color; c.fill(); if (stroke) { c.strokeStyle = stroke; c.stroke(); }
  }
  building(c, x, y, w, d, h, color, roof, floors = 3) {
    const p = this.path.bind(this);
    // Ground footprint uses x/y as front-left corner.
    c.save(); c.shadowColor = '#10232666'; c.shadowBlur = 25; c.shadowOffsetY = 20;
    p(c, [[x,y],[x+w,y+35],[x+w+d*.75,y-d*.45],[x+d*.75,y-d*.8]], '#17252a55');
    c.restore();
    p(c, [[x,y],[x+w,y+35],[x+w,y-h+35],[x,y-h]], color, '#3c4140');
    p(c, [[x+w,y+35],[x+w+d*.75,y-d*.45],[x+w+d*.75,y-h-d*.45],[x+w,y-h+35]], '#5d6865', '#3c4140');
    p(c, [[x-14,y-h],[x+w,y-h+43],[x+w+d*.75+14,y-h-d*.45],[x+d*.35,y-h-d*.8-52]], roof, '#303d3e');
    p(c, [[x-14,y-h],[x+d*.35,y-h-d*.8-52],[x+d*.37,y-h-18]], '#8b7c65');
    // Thin cornices, vertical structure, repeated warm windows.
    for(let level=0;level<floors;level++) {
      const yy=y-h+68+level*(h-65)/floors;
      c.strokeStyle='#d0b99066'; c.lineWidth=3; c.beginPath();c.moveTo(x,yy+32);c.lineTo(x+w,yy+67);c.stroke();
      for(let k=0;k<Math.max(2,Math.floor(w/62));k++) {
        const wx=x+25+k*58, wy=yy+(wx-x)/w*35;
        c.fillStyle='#394e50';c.fillRect(wx-3,wy-4,30,44);
        c.fillStyle=(k+level)%3===0?'#e7c688':'#b6c3b0'; c.fillRect(wx,wy,23,35);
        c.fillStyle='#495b58';c.fillRect(wx+10,wy,3,35);c.fillRect(wx,wy+15,23,3);
      }
    }
    c.fillStyle='#394c4d';c.fillRect(x+w*.4,y-67,46,82);
    c.strokeStyle='#b29c79';c.lineWidth=4;c.strokeRect(x+w*.4,y-67,46,82);
    c.fillStyle='#bea780'; c.fillRect(x+w*.4+35,y-24,5,5);
    // Chimney with soft steam.
    c.fillStyle='#586564';c.fillRect(x+w*.65,y-h-70,23,66);
    c.fillStyle='#d6d4bf55';
    for(let n=0;n<5;n++){c.beginPath();c.ellipse(x+w*.65+8+n*10,y-h-85-n*22,18+n*6,13+n*4,.3,0,Math.PI*2);c.fill();}
  }
  lamp(c, x, y) {
    c.save();c.strokeStyle='#344d4d';c.lineWidth=6;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-115);c.bezierCurveTo(x,y-145,x+30,y-145,x+31,y-121);c.stroke();
    c.fillStyle='#31484a';c.fillRect(x-10,y-5,20,8);c.fillRect(x+19,y-124,24,27);
    c.fillStyle='#f0d69a';c.fillRect(x+23,y-119,16,17);
    const g=c.createRadialGradient(x+31,y-110,1,x+31,y-110,80);g.addColorStop(0,'#edca7430');g.addColorStop(1,'#edca7400');c.fillStyle=g;c.fillRect(x-50,y-190,160,160);c.restore();
  }
  tree(c,x,y,size=1) {
    c.fillStyle='#546052';c.fillRect(x-7*size,y-90*size,14*size,90*size);
    for(let n=0;n<7;n++){c.fillStyle=['#4d6b5b','#587865','#69826a'][n%3];c.beginPath();c.ellipse(x+Math.sin(n*2)*35*size,y-90*size+Math.cos(n)*23*size,43*size,37*size,0,0,Math.PI*2);c.fill();}
  }
  drawBackground(c) {
    if (this.stop) { this.drawRoadBackground(c); return; }
    const sky=c.createLinearGradient(0,0,0,1080);sky.addColorStop(0,'#8ba7a5');sky.addColorStop(.38,'#d3cfad');sky.addColorStop(1,'#657e73');c.fillStyle=sky;c.fillRect(0,0,1920,1080);
    // Far silhouettes and hills, no canonical city geometry.
    this.path(c,[[0,410],[0,245],[150,210],[235,255],[390,160],[560,260],[730,185],[950,245],[1180,155],[1450,238],[1710,150],[1920,235],[1920,500]],'#88978a');
    c.globalAlpha=.45;
    for(let i=0;i<22;i++){let x=i*94-30,y=310+(i%4)*12,h=80+(i%5)*26;c.fillStyle='#647f79';c.fillRect(x,y-h,65,h+160);this.path(c,[[x-8,y-h],[x+32,y-h-32],[x+73,y-h]],'#526f6b');}
    c.globalAlpha=1;
    // Airship silhouette as world detail.
    c.save();c.translate(1050,130);c.rotate(-.08);c.fillStyle='#a9ad92';c.beginPath();c.ellipse(0,0,125,33,0,0,Math.PI*2);c.fill();c.strokeStyle='#788b80';c.lineWidth=2;
    for(let i=-3;i<=3;i++){c.beginPath();c.ellipse(i*23,0,18,32,0,0,Math.PI*2);c.stroke();}c.fillStyle='#6d7d70';c.fillRect(-30,42,68,15);c.beginPath();c.moveTo(-60,22);c.lineTo(-20,45);c.moveTo(62,21);c.lineTo(24,45);c.stroke();c.restore();
    // Town ground planes and broad walkable plaza.
    this.path(c,[[0,420],[1920,380],[1920,1080],[0,1080]],'#9b9f8b');
    this.path(c,[[550,390],[1035,365],[1920,1080],[80,1080]],'#b6ad94');
    // Cobbles follow a loose perspective grid.
    c.save();c.strokeStyle='#797f7160';c.lineWidth=1;
    for(let yy=430;yy<1100;yy+=22+(yy-430)/45){c.beginPath();c.moveTo(0,yy);c.lineTo(1920,yy-18);c.stroke();for(let xx=-300;xx<2100;xx+=70){c.beginPath();c.moveTo(xx+((yy/22|0)%2)*35,yy);c.lineTo(xx+20,yy+30);c.stroke();}}
    c.restore();
    // Canal and quay in foreground left.
    this.path(c,[[0,650],[185,640],[650,1080],[0,1080]],'#4e7679');
    for(let n=0;n<25;n++){c.strokeStyle=n%2?'#9eb7a650':'#375e6740';c.beginPath();c.moveTo(0,690+n*16);c.lineTo(230+n*11,675+n*16);c.stroke();}
    this.path(c,[[168,620],[197,630],[720,1080],[654,1080]],'#686f64');
    // Background station hall and clock tower.
    this.building(c,965,474,265,135,200,'#b5ac91','#536b68',2);
    c.fillStyle='#546a66';c.fillRect(1063,175,71,180);this.path(c,[[1052,177],[1098,93],[1147,180]],'#4b6260');
    c.fillStyle='#d2c39b';c.beginPath();c.arc(1098,218,25,0,Math.PI*2);c.fill();c.strokeStyle='#4e625f';c.lineWidth=3;c.stroke();c.beginPath();c.moveTo(1098,200);c.lineTo(1098,218);c.lineTo(1110,225);c.stroke();
    // Elevated pipe/bridge and repeating supports.
    this.path(c,[[170,387],[170,415],[1000,373],[1000,344]],'#7b887a');
    c.strokeStyle='#536d69';c.lineWidth=12;c.beginPath();c.moveTo(175,377);c.lineTo(1000,337);c.stroke();
    for(let x=230;x<1000;x+=135){c.strokeStyle='#677b70';c.lineWidth=20;c.beginPath();c.moveTo(x,410-(x-170)*.05);c.lineTo(x,510-(x-170)*.06);c.stroke();}
    // Shopfronts frame the plaza; they are review scenery, not implemented shops.
    this.building(c,-110,704,300,190,375,'#a69b80','#53696a',4);
    this.building(c,235,559,235,135,270,'#b4aa8b','#486569',3);
    this.building(c,540,463,170,100,190,'#a7a78e','#556e66',2);
    this.building(c,1370,597,265,145,340,'#b6ac8c','#4b6569',4);
    this.building(c,1680,837,290,210,470,'#9b9d82','#455e61',5);
    // Awnings and restrained brass pipes.
    this.path(c,[[245,481],[473,510],[508,544],[260,514]],'#698477');
    this.path(c,[[1380,500],[1640,535],[1665,573],[1395,535]],'#9c7758');
    c.strokeStyle='#b19460';c.lineWidth=7;c.beginPath();c.moveTo(449,292);c.lineTo(449,535);c.lineTo(474,544);c.stroke();
    // Planting, benches and route bollards.
    this.tree(c,1277,614,1.1);this.tree(c,515,584,.72);this.tree(c,1570,806,1.2);
    for(const [x,y] of [[560,750],[1280,770]]){c.fillStyle='#6f6853';c.fillRect(x,y,100,12);c.fillRect(x+8,y+12,8,25);c.fillRect(x+84,y+12,8,25);c.fillRect(x,y-27,100,12);}
    for(const [x,y] of [[470,686],[1265,600],[1470,886],[770,475]])this.lamp(c,x,y);
    for(let n=0;n<5;n++){let x=240+n*75,y=700+n*64;c.fillStyle='#4a6462';c.fillRect(x,y-32,8,32);c.fillStyle='#c6b180';c.fillRect(x-2,y-33,12,6);}
    // Review waypoint kiosk in the actual walking plane.
    c.fillStyle='#546c68';c.fillRect(1090,615,12,72);c.fillStyle='#cbb692';c.fillRect(1053,596,90,43);c.strokeStyle='#64736a';c.lineWidth=4;c.strokeRect(1053,596,90,43);
    // Edge vignette and atmospheric foreground.
    const vignette=c.createRadialGradient(960,650,350,960,580,1200);vignette.addColorStop(0,'#18292b00');vignette.addColorStop(1,'#17282e80');c.fillStyle=vignette;c.fillRect(0,0,1920,1080);
  }
  drawRoadBackground(c) {
    const sky=c.createLinearGradient(0,0,0,1080);sky.addColorStop(0,'#90aaa5');sky.addColorStop(.5,'#d5cda7');sky.addColorStop(1,'#7d8f72');c.fillStyle=sky;c.fillRect(0,0,1920,1080);
    this.path(c,[[0,470],[0,310],[210,165],[340,300],[580,100],[820,325],[1070,180],[1320,370],[1570,215],[1920,390],[1920,600]],'#7e9688');
    this.path(c,[[330,310],[580,100],[820,325],[635,222],[595,248],[560,195],[490,257]],'#d3d5bd');
    this.path(c,[[0,500],[300,398],[690,500],[1060,360],[1470,465],[1730,390],[1920,455],[1920,1080],[0,1080]],'#819677');
    this.path(c,[[0,630],[500,550],[850,630],[1290,560],[1920,650],[1920,1080],[0,1080]],'#8f9a78');
    this.path(c,[[920,500],[1070,500],[1450,1080],[380,1080]],'#b9aa87');
    c.strokeStyle='#d2c39b';c.lineWidth=9;c.beginPath();c.moveTo(935,500);c.bezierCurveTo(900,740,770,850,590,1080);c.moveTo(1055,500);c.bezierCurveTo(1040,740,1160,920,1240,1080);c.stroke();
    for(let n=0;n<18;n++){c.strokeStyle='#91896e55';c.lineWidth=3;c.beginPath();c.moveTo(830-n*19,650+n*22);c.lineTo(1080+n*10,649+n*22);c.stroke();}
    for(const [x,y,s] of [[230,760,1.8],[470,640,1.2],[1410,700,1.5],[1710,880,2],[1530,510,.7],[760,525,.65]])this.tree(c,x,y,s);
    // A parked review carriage remains outside the walking area.
    c.fillStyle='#354f50';c.fillRect(420,670,230,130);this.path(c,[[400,673],[433,634],[642,634],[672,673]],'#4b6763');
    c.fillStyle='#cfbc91';c.fillRect(445,697,52,49);c.fillRect(519,697,52,49);c.fillStyle='#7c8b73';c.fillRect(595,688,32,109);
    c.strokeStyle='#bc9e6c';c.lineWidth=6;c.strokeRect(420,670,230,130);
    for(const x of [458,610]){c.fillStyle='#ccb482';c.beginPath();c.arc(x,804,31,0,Math.PI*2);c.fill();c.strokeStyle='#385451';c.lineWidth=7;c.stroke();c.lineWidth=3;c.beginPath();c.moveTo(x-29,804);c.lineTo(x+29,804);c.moveTo(x,775);c.lineTo(x,833);c.stroke();}
    c.fillStyle='#5a6a53';c.fillRect(1090,615,12,72);c.fillStyle='#c8b58b';c.fillRect(1053,596,90,43);c.strokeStyle='#67755e';c.lineWidth=4;c.strokeRect(1053,596,90,43);
    const v=c.createRadialGradient(960,680,250,960,620,1150);v.addColorStop(0,'#20372f00');v.addColorStop(1,'#20372f66');c.fillStyle=v;c.fillRect(0,0,1920,1080);
  }
  sprite(c, x, y, actor, walking = false, t = 0, scale = 3) {
    c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);c.imageSmoothingEnabled=false;
    c.fillStyle='#13282a44';c.beginPath();c.ellipse(0,2,9,3,0,0,Math.PI*2);c.fill();
    const leg=walking?Math.round(Math.sin(t*13))*2:0;
    c.fillStyle='#384844';c.fillRect(-5,-8,4,9+leg);c.fillRect(2,-8,4,9-leg);
    c.fillStyle='#d4ae82';c.fillRect(-8,-20,3,10);c.fillRect(6,-20,3,10);
    c.fillStyle=actor.coat;c.fillRect(-6,-23,12,16);c.fillRect(-8,-22,16,5);
    c.fillStyle='#d1ba88';c.fillRect(-1,-22,2,14);c.fillStyle='#b2976f';c.fillRect(-6,-11,12,2);
    c.fillStyle='#e0bd8d';c.fillRect(-5,-32,10,10);c.fillStyle=actor.hair;c.fillRect(-6,-34,12,5);c.fillRect(-6,-30,3,6);
    c.fillStyle='#283c39';c.fillRect(3,-28,1,2);c.restore();
  }
  frame(now) {
    if(!this.running)return;
    const dt=Math.min((now-this.last)/1000 || 0,.04);this.last=now;
    let dx=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));
    let dy=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));
    const moving=dx!==0||dy!==0;
    if(moving){const len=Math.hypot(dx,dy),speed=this.keys.has('shift')?125:220;this.player.x=Math.max(670,Math.min(1270,this.player.x+dx/len*speed*dt));this.player.y=Math.max(650,Math.min(940,this.player.y+dy/len*speed*dt));this.history.unshift({...this.player});this.history.pop();}
    const c=this.ctx;c.clearRect(0,0,1920,1080);c.drawImage(this.background,0,0);
    // A few distant independent pixel residents.
    this.sprite(c,799,542,{coat:'#7f7762',hair:'#796344'},false,0,1.7);
    this.sprite(c,1267,654,{coat:'#715b5a',hair:'#463e32'},false,0,2);
    const sprites=this.actors.map((a,i)=>({a,p:i?this.history[Math.min(i*18,this.history.length-1)]:this.player,i}));
    sprites.sort((a,b)=>a.p.y-b.p.y).forEach(({a,p,i})=>this.sprite(c,p.x-i*12,p.y+i*12,a,moving,now/1000+i));
    this.onNear(Math.hypot(this.player.x-1095,this.player.y-695)<110, this.player);
    this.raf=requestAnimationFrame(this.frame);
  }
}
