(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
if(!window.THREE){$('panel').innerHTML='<h1>VECTOR SKY</h1><p class="sub">โหลดไลบรารี 3D ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วโหลดหน้านี้ใหม่</p>';return;}

var V3=THREE.Vector3,Q=THREE.Quaternion;
var AX=new V3(1,0,0),AY=new V3(0,1,0),AZ=new V3(0,0,1),UP=new V3(0,1,0),ZERO=new V3(0,0,0);
var tq=new Q(),ta=new V3(),tb=new V3(),tc=new V3(),tm=new THREE.Matrix4();
function clamp(x,a,b){return x<a?a:(x>b?b:x);}
function rnd(a,b){return a+Math.random()*(b-a);}
function sstep(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}

/* ================= data ================= */
var PLANES={
  f16:{n:'F-16C Fighting Falcon',code:'F16',rw:'16',thr:1.00,turn:1.08,roll:1.15,hp:95,len:15.1,noz:[[0,-0.1,6.9]]},
  f15:{n:'F-15E Strike Eagle',code:'F15',rw:'15',thr:1.10,turn:0.94,roll:0.95,hp:125,len:19.4,noz:[[-0.75,-0.1,9.1],[0.75,-0.1,9.1]]},
  f18:{n:'F/A-18E Super Hornet',code:'F18',rw:'18',thr:0.97,turn:1.03,roll:1.00,hp:115,len:18.3,noz:[[-0.5,-0.15,8.2],[0.5,-0.15,8.2]]},
  rafale:{n:'Rafale M',code:'RAF',rw:'RF',thr:1.02,turn:1.12,roll:1.10,hp:100,len:15.3,noz:[[-0.45,0,6.7],[0.45,0,6.7]]},
  gripen:{n:'JAS 39C Gripen',code:'J39',rw:'39',thr:0.95,turn:1.10,roll:1.20,hp:85,len:14.1,noz:[[0,0.2,6.9]]},
  su35:{n:'Su-35S',code:'S35',rw:'35',thr:1.08,turn:1.12,roll:0.95,hp:120,len:21.9,noz:[[-1.2,-0.45,9.7],[1.2,-0.45,9.7]]},
  mig35:{n:'MiG-35',code:'M35',rw:'29',thr:1.04,turn:1.06,roll:1.05,hp:105,len:17.3,noz:[[-0.85,-0.15,7.1],[0.85,-0.15,7.1]]},
  j10:{n:'Chengdu J-10',code:'J10',rw:'10',thr:0.98,turn:1.08,roll:1.10,hp:90,len:16.4,noz:[[0,0.25,7.6]]}
};
var PKEYS=['f16','f15','f18','rafale','gripen','su35','mig35','j10'];
var WPN={
  fox2:{n:'FOX-2 IR',cls:'air',seek:'ir',range:9000,burn:2.6,acc:300,vmax:1050,drag:0.00009,turn:2.6,life:22,dmg:110,rad:16,lock:0.8},
  fox1:{n:'FOX-1 SARH',cls:'air',seek:'sarh',range:22000,burn:4.5,acc:190,vmax:1150,drag:0.00005,turn:2.0,life:45,dmg:120,rad:18,lock:0.3},
  fox3:{n:'FOX-3 ARH',cls:'air',seek:'arh',range:36000,burn:6.5,acc:140,vmax:1250,drag:0.00004,turn:2.0,life:70,dmg:120,rad:18,lock:0.3,act:8000},
  tv:{n:'AGM-TV',cls:'gnd',seek:'gnd',range:10000,burn:3.5,acc:130,vmax:800,drag:0.00003,turn:1.5,life:55,dmg:420,rad:24,lock:1.2},
  arm:{n:'ARM',cls:'gnd',seek:'arm',range:30000,burn:5,acc:170,vmax:1100,drag:0.00004,turn:1.6,life:70,dmg:320,rad:30,lock:0.6},
  lgb:{n:'LGB',cls:'gnd',range:12000,dmg:650,rad:42,lock:0.2},
  gps:{n:'GPS',cls:'gnd',range:14000,dmg:650,rad:42,lock:0.4},
  bomb:{n:'BOMB',cls:'gnd',dmg:650,rad:58},
  cbu:{n:'CBU',cls:'gnd',dmg:170,rad:120},
  rkt:{n:'ROCKET',cls:'gnd',dmg:190,rad:13}
};
var ORDER=['fox2','fox1','fox3','tv','arm','lgb','gps','bomb','cbu','rkt'],PER={bomb:2,rkt:19},KG={fox2:90,fox1:230,fox3:160,tv:300,arm:360,lgb:500,gps:500,bomb:250,cbu:430,rkt:8};
var PYL={f16:9,f15:12,f18:11,rafale:11,gripen:8,su35:12,mig35:9,j10:9};
var WDESC={fox2:'อินฟราเรด ระยะใกล้',fox1:'กึ่งแอคทีฟเรดาร์ ต้องล็อก STT',fox3:'แอคทีฟเรดาร์ ระยะไกล',tv:'มิสไซล์นำวิถี TV ยิงแล้วลืม',arm:'มิสไซล์ต่อต้านเรดาร์ (SAM/AAA)',lgb:'ระเบิดนำวิถีเลเซอร์ ต้องส่องเลเซอร์',gps:'ระเบิดนำวิถี GPS พิกัดตายตัว',bomb:'ระเบิดธรรมดา (2 ลูก/จุด)',cbu:'ระเบิดพวง พื้นที่กว้าง',rkt:'กระเปาะจรวด (19 นัด/จุด)'};
var EW_IR={seek:'ir',burn:2.4,acc:300,vmax:1000,drag:0.0001,turn:1.7,life:16,dmg:50,rad:14};
var EW_R={seek:'arh',burn:5,acc:150,vmax:1100,drag:0.00005,turn:1.45,life:50,dmg:60,rad:14,act:7000};
var SAM_W={seek:'sarh',burn:5,acc:210,vmax:1100,drag:0.00005,turn:1.4,life:40,dmg:60,rad:14};
var LOADS={air:1,cas:1,mix:1,custom:1};
function presetPyl(m,total){
  var p={},i;for(i=0;i<ORDER.length;i++)p[ORDER[i]]=0;
  if(m==='air'){p.fox2=2;p.fox1=2;p.fox3=total-4;}
  else if(m==='cas'){p.fox2=1;p.tv=2;p.arm=1;p.lgb=1;p.gps=1;p.bomb=1;p.rkt=1;for(i=0;i<total-8;i++)p[['tv','gps','cbu','lgb'][i%4]]++;}
  else{p.fox2=2;p.fox3=2;p.tv=1;p.arm=1;p.lgb=1;p.gps=1;p.fox3+=total-8;} // mix and custom
  return p;
}
function pylUsed(){var n=0;for(var i=0;i<ORDER.length;i++)n+=cfg.pyl[ORDER[i]]||0;return n;}
function normPyl(){
  var i,k;if(!cfg.pyl||typeof cfg.pyl!=='object')cfg.pyl=presetPyl(cfg.mission,PYL[cfg.plane]);
  for(i=0;i<ORDER.length;i++){k=ORDER[i];cfg.pyl[k]=Math.max(0,Math.floor(Number(cfg.pyl[k])||0));}
  while(pylUsed()>PYL[cfg.plane]){var b=ORDER[0];for(i=0;i<ORDER.length;i++)if(cfg.pyl[ORDER[i]]>cfg.pyl[b])b=ORDER[i];cfg.pyl[b]--;}
}
var DIFF={
  easy:{turn:0.82,dmg:0.55,fire:1.7,cm:1.45,disp:1.9,irw:2,rw:4,inc:1,samw:3,maw:99999},
  normal:{turn:1.0,dmg:1.0,fire:1.0,cm:1.0,disp:1.0,irw:1,rw:2,inc:2,samw:2,maw:3500},
  hard:{turn:1.15,dmg:1.35,fire:0.65,cm:0.8,disp:0.7,irw:1,rw:1,inc:3,samw:1,maw:2200}
};
var GTYPE={
  tank:{code:'TNK',hp:260,gun:0.12,score:80},
  truck:{code:'TRK',hp:70,gun:1,score:40},
  aaa:{code:'AAA',hp:110,gun:0.8,score:70},
  sam:{code:'SAM',hp:130,gun:0.8,score:120},
  bunker:{code:'BKR',hp:520,gun:0,score:100}
};

/* ================= settings ================= */
var isTouch=!!(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches)||(('ontouchstart' in window)&&!(window.matchMedia&&window.matchMedia('(hover:hover)').matches));
var cfg={plane:'f16',mission:'air',diff:'normal',mode:'mouse',v:2,ms:1,cs:1,pyl:null,wing:'1',cm:{ef:2,et:0,tank:3,truck:2,aaa:1,sam:0,bunker:0,goal:0,dist:1}};
var CMDEF=[['ef','เครื่องบินข้าศึกในอากาศพร้อมกัน',0,8],['et','ชนิดเครื่องข้าศึก',0,8],['tank','รถถัง',0,8],['truck','รถบรรทุก (เคลื่อนที่)',0,8],['aaa','ปืนต่อสู้อากาศยาน',0,6],['sam','ฐาน SAM',0,4],['bunker','บังเกอร์',0,4],['goal','เป้าหมายจำนวนทำลาย (0 = ไม่จำกัด)',0,10],['dist','ระยะเริ่มต้น',0,2]];
function normCM(){if(!cfg.cm||typeof cfg.cm!=='object')cfg.cm={};for(var i=0;i<CMDEF.length;i++){var d=CMDEF[i],v=Math.floor(Number(cfg.cm[d[0]]));if(!isFinite(v))v=d[0]==='dist'?1:(d[0]==='ef'?2:0);cfg.cm[d[0]]=clamp(v,d[2],d[3]);}}
try{var sv=JSON.parse(localStorage.getItem('vsky-cfg')||'null');if(sv){for(var k0 in cfg)if(sv[k0]!==undefined&&(k0==='pyl'||typeof sv[k0]===typeof cfg[k0]))cfg[k0]=sv[k0];if(isTouch&&sv.v!==2)cfg.mode='mouse';cfg.v=2;}}catch(e){}
if(!PLANES[cfg.plane])cfg.plane='f16';if(!LOADS[cfg.mission])cfg.mission='air';if(!DIFF[cfg.diff])cfg.diff='normal';
function saveCfg(){try{localStorage.setItem('vsky-cfg',JSON.stringify(cfg));}catch(e){}}
var D=DIFF[cfg.diff];
normPyl();normCM();if(['0','1','2','3'].indexOf(cfg.wing)<0)cfg.wing='1';

/* ================= renderer ================= */
var glc=$('gl'),hudc=$('hud'),hx=hudc.getContext('2d');
var renderer=new THREE.WebGLRenderer({canvas:glc,antialias:!isTouch,logarithmicDepthBuffer:true});
var MAXDPR=isTouch?1.5:2;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,MAXDPR));
var scene=new THREE.Scene(),SKY=0xb7d3ea;
scene.background=new THREE.Color(SKY);
scene.fog=new THREE.Fog(SKY,5000,70000);
var camera=new THREE.PerspectiveCamera(65,1,2,140000);
scene.add(new THREE.HemisphereLight(0xe4f0ff,0x56624f,0.9));
var sun=new THREE.DirectionalLight(0xfff2d8,0.95);sun.position.set(0.5,0.8,0.3);scene.add(sun);
var W=1,H=1,DPR=1;
function resize(){
  W=window.innerWidth||1;H=window.innerHeight||1;DPR=Math.min(window.devicePixelRatio||1,MAXDPR);
  renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();
  hudc.width=W*DPR;hudc.height=H*DPR;
}
window.addEventListener('resize',resize);resize();

/* sky dome */
var skyDome=(function(){
  var g=new THREE.SphereGeometry(100000,24,14),pos=g.attributes.position,col=[];
  var c0=new THREE.Color(SKY),c1=new THREE.Color(0x2f6fbe),c=new THREE.Color();
  for(var i=0;i<pos.count;i++){var t=clamp(pos.getY(i)/100000,0,1);c.copy(c0).lerp(c1,Math.pow(t,0.6));col.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  var m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));
  m.renderOrder=-1;m.frustumCulled=false;scene.add(m);return m;
})();

/* terrain */
var TS=160000,TN=256,TC=TS/TN,hgt=new Float32Array((TN+1)*(TN+1));
function terrainH(x,z){
  return 560*Math.sin(x*0.00023)*Math.cos(z*0.00029)
       + 300*Math.sin(x*0.00061+1.3)*Math.sin(z*0.0005+0.4)
       + 90*Math.sin(x*0.0017)*Math.cos(z*0.0015) - 130;
}
function groundAt(x,z){
  var gx=(x+TS/2)/TC,gz=(z+TS/2)/TC;
  if(gx<0||gz<0||gx>=TN||gz>=TN)return 0;
  var ix=Math.floor(gx),iz=Math.floor(gz),fx=gx-ix,fz=gz-iz,i=iz*(TN+1)+ix;
  var h=(hgt[i]*(1-fx)+hgt[i+1]*fx)*(1-fz)+(hgt[i+TN+1]*(1-fx)+hgt[i+TN+2]*fx)*fz;
  return h>0?h:0;
}
(function(){
  var g=new THREE.PlaneGeometry(TS,TS,TN,TN);g.rotateX(-Math.PI/2);
  var pos=g.attributes.position,col=[],c=new THREE.Color();
  for(var i=0;i<pos.count;i++){
    var x=pos.getX(i),z=pos.getZ(i),h=terrainH(x,z);pos.setY(i,h);
    hgt[Math.round((z+TS/2)/TC)*(TN+1)+Math.round((x+TS/2)/TC)]=h;
    var n=0.5+0.5*Math.sin(x*0.013)*Math.cos(z*0.017);
    if(h<14)c.setHex(0xd9cf9c);
    else if(h<280)c.setRGB(0.24+0.08*n,0.44+0.1*n,0.2);
    else if(h<500)c.setRGB(0.3+0.06*n,0.38+0.05*n,0.22);
    else if(h<640)c.setRGB(0.46,0.44,0.4);
    else c.setRGB(0.93,0.95,0.97);
    col.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
  scene.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true})));
  var w=new THREE.Mesh(new THREE.PlaneGeometry(400000,400000),new THREE.MeshLambertMaterial({color:0x245f8c}));
  w.rotation.x=-Math.PI/2;scene.add(w);
})();

/* sprites & particles */
var puffTex=(function(){
  var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');
  var g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.4,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);
})();
(function(){
  for(var k=0;k<70;k++){
    var cx=rnd(-70000,70000),cz=rnd(-70000,70000),cy=rnd(1800,4200);
    for(var j=0;j<4;j++){
      var s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xffffff,transparent:true,opacity:0.5,depthWrite:false}));
      var sz=rnd(900,2000);s.scale.set(sz,sz*0.55,1);
      s.position.set(cx+rnd(-900,900),cy+rnd(-150,150),cz+rnd(-900,900));scene.add(s);
    }
  }
})();
var parts=[],pool=[];
function spawnP(pos,vx,vy,vz,life,s0,s1,color,add,op){
  if(parts.length>650)return;
  var s=pool.pop();
  if(!s)s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false}));
  s.material.blending=add?THREE.AdditiveBlending:THREE.NormalBlending;
  s.material.color.setHex(color);s.material.opacity=op;s.material.needsUpdate=true;
  s.position.copy(pos);s.scale.set(s0,s0,1);scene.add(s);
  parts.push({s:s,vx:vx,vy:vy,vz:vz,life:life,max:life,s0:s0,s1:s1,op:op});
}
function updateParts(dt){
  for(var i=parts.length-1;i>=0;i--){
    var p=parts[i];p.life-=dt;
    if(p.life<=0){scene.remove(p.s);pool.push(p.s);parts.splice(i,1);continue;}
    var t=1-p.life/p.max,sz=p.s0+(p.s1-p.s0)*t;
    p.s.position.x+=p.vx*dt;p.s.position.y+=p.vy*dt;p.s.position.z+=p.vz*dt;
    p.s.scale.set(sz,sz,1);p.s.material.opacity=p.op*(1-t);
  }
}
function explode(pos,size){ // size 1 small .. 3 huge
  var n=4+size*5,i,k=size;
  for(i=0;i<n;i++)spawnP(pos,rnd(-30,30)*k,rnd(-10,40)*k,rnd(-30,30)*k,rnd(0.4,1.0),6*k,34*k,i%2?0xffb347:0xff5a1f,true,0.95);
  for(i=0;i<n*0.7;i++)spawnP(pos,rnd(-14,14)*k,rnd(0,24)*k,rnd(-14,14)*k,rnd(1.6,3.2),8*k,40*k,0x2b2b2b,false,0.6);
  var d=pos.distanceTo(camera.position);
  noise(0.4+size*0.4,clamp(0.6*size/(1+d/900),0.02,0.6),size>1?450:900);
}

/* ================= aircraft visuals ================= */
function flat(pts,th){
  var sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);
  for(var i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);
  var g=new THREE.ExtrudeGeometry(sh,{depth:th,bevelEnabled:false});g.rotateX(Math.PI/2);return g;
}
function fin(pts,th){
  var sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);
  for(var i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);
  var g=new THREE.ExtrudeGeometry(sh,{depth:th,bevelEnabled:false});g.rotateY(-Math.PI/2);return g;
}
function fallbackJet(){
  var grp=new THREE.Group();
  var body=new THREE.MeshLambertMaterial({color:0x8f9aa6,flatShading:true}),trim=new THREE.MeshLambertMaterial({color:0x5d6b78,flatShading:true});
  var fus=new THREE.CylinderGeometry(0.85,1.15,11,10);fus.rotateX(-Math.PI/2);
  var f=new THREE.Mesh(fus,body);f.scale.set(1.15,0.85,1);grp.add(f);
  var ng=new THREE.ConeGeometry(0.85,4.2,10);ng.rotateX(-Math.PI/2);
  var nose=new THREE.Mesh(ng,trim);nose.position.z=-7.6;nose.scale.set(1.15,0.85,1);grp.add(nose);
  var wing=new THREE.Mesh(flat([[0,-2.6],[1.2,-2.6],[6.4,2.6],[6.4,3.9],[0,4.6]],0.16),body);grp.add(wing);
  var wing2=wing.clone();wing2.scale.x=-1;grp.add(wing2);
  var fg=fin([[2.6,0],[5.4,2.9],[6.3,2.9],[6.1,0]],0.14);
  var f1=new THREE.Mesh(fg,trim);f1.position.set(0.1,0.5,0);grp.add(f1);
  return grp;
}
function b64buf(s){var bin=atob(s),n=bin.length,u=new Uint8Array(n);for(var i=0;i<n;i++)u[i]=bin.charCodeAt(i);return u.buffer;}
var modelCache={},modelWait={};
function buildModel(key){
  var d=window.JETMODELS&&window.JETMODELS[key];if(!d)return null;
  var g=new THREE.Group();
  var texs=d.tex.map(function(src){
    var img=new Image(),t=new THREE.Texture(img);t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;
    img.onload=function(){t.needsUpdate=true;};img.src=src;return t;
  });
  d.parts.forEach(function(p){
    var geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(new Int16Array(b64buf(p.pos)),3,true));
    geo.setAttribute('normal',new THREE.BufferAttribute(new Int8Array(b64buf(p.nor)),3,true));
    if(p.uv)geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(b64buf(p.uv)),2));
    geo.setIndex(new THREE.BufferAttribute(p.i32?new Uint32Array(b64buf(p.idx)):new Uint16Array(b64buf(p.idx)),1));
    var mat=new THREE.MeshPhongMaterial({color:new THREE.Color(p.c[0],p.c[1],p.c[2]),side:THREE.DoubleSide,shininess:p.glass?90:16,specular:p.glass?0x777777:0x161616});
    if(p.uv&&p.tex!==undefined&&texs[p.tex])mat.map=texs[p.tex];
    if(p.blend){mat.transparent=true;mat.opacity=p.c[3];mat.depthWrite=false;}
    if(p.em)mat.emissive=new THREE.Color(p.em[0],p.em[1],p.em[2]);
    var m=new THREE.Mesh(geo,mat);m.scale.setScalar(d.scale);m.frustumCulled=false;if(p.blend)m.renderOrder=2;g.add(m);
  });
  d.parts=null;d.tex=null;
  return g;
}
function loadModel(key,cb){
  if(modelCache[key]!==undefined){cb(modelCache[key]);return;}
  if(modelWait[key]){modelWait[key].push(cb);return;}
  modelWait[key]=[cb];
  var done=function(){var m=null;try{m=buildModel(key);}catch(e){m=null;}
    modelCache[key]=m;var l=modelWait[key];modelWait[key]=null;for(var i=0;i<l.length;i++)l[i](m);};
  var s=document.createElement('script');s.src='models/'+key+'.js';s.onload=done;s.onerror=done;document.head.appendChild(s);
}
function makeJet(key){
  var grp=new THREE.Group(),fb=fallbackJet(),P=PLANES[key];grp.add(fb);grp.glows=[];
  for(var i=0;i<P.noz.length;i++){
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xffa24a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    sp.position.set(P.noz[i][0],P.noz[i][1],P.noz[i][2]);sp.userData.z=P.noz[i][2];grp.add(sp);grp.glows.push(sp);
  }
  loadModel(key,function(m){if(m){grp.remove(fb);grp.add(m.clone(true));}});
  return grp;
}
function setGlow(grp,thr){
  var ab=thr>0.95,s=ab?4.6+Math.random()*1.2:1.2+thr*1.6;
  for(var i=0;i<grp.glows.length;i++){var g=grp.glows[i];g.scale.set(s,s,1);g.position.z=g.userData.z+(ab?1.8:0.3);g.material.opacity=ab?0.95:0.2+thr*0.45;}
}
function rotLocal(q,ax,ang){tq.setFromAxisAngle(ax,ang);q.multiply(tq);}
function fwdOf(e,out){return out.set(0,0,-1).applyQuaternion(e.q);}

/* ================= audio ================= */
var actx=null,engGain=null,engFilt=null,noiseBuf=null;
function initAudio(){
  try{
    if(actx){actx.resume();return;}
    var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    actx=new AC();
    noiseBuf=actx.createBuffer(1,actx.sampleRate,actx.sampleRate);
    var d=noiseBuf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    var src=actx.createBufferSource();src.buffer=noiseBuf;src.loop=true;
    engFilt=actx.createBiquadFilter();engFilt.type='lowpass';engFilt.frequency.value=400;
    engGain=actx.createGain();engGain.gain.value=0;
    src.connect(engFilt);engFilt.connect(engGain);engGain.connect(actx.destination);src.start();
  }catch(e){actx=null;}
}
function beep(f,d,type,vol){
  if(!actx)return;try{
    var o=actx.createOscillator(),g=actx.createGain();o.type=type||'square';o.frequency.value=f;
    g.gain.setValueAtTime(vol||0.05,actx.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+d);
    o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+d);
  }catch(e){}
}
function noise(d,vol,freq){
  if(!actx||!noiseBuf)return;try{
    var s=actx.createBufferSource();s.buffer=noiseBuf;
    var fl=actx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=freq;
    var g=actx.createGain();g.gain.setValueAtTime(vol,actx.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+d);
    s.connect(fl);fl.connect(g);g.connect(actx.destination);s.start(0,Math.random()*0.5,Math.min(d,0.95));
  }catch(e){}
}

/* ================= state ================= */
var state='menu';
var player={isPlayer:true,pos:new V3(0,3000,0),vel:new V3(),q:new Q(),speed:260,thr:0.8,hp:100,maxHp:100,alive:true,ammo:600,cm:60,
            cp:0,cr:0,cy:0,gunT:0,wT:0,cmT:0,grp:null,key:null,st:PLANES.f16,load:[],cur:0};
var enemies=[],wings=[],blue=[],gnds=[],bullets=[],missiles=[],ords=[],flares=[];
var freeFlight=false,dlT=0,FW_R={seek:'arh',burn:5.5,acc:150,vmax:1150,drag:0.00005,turn:1.9,life:55,dmg:120,rad:18,act:8000};
var FORMS=[['WEDGE',[[-45,0,50],[45,0,50],[-90,0,100]]],['ECHELON R',[[45,0,45],[90,0,90],[135,0,135]]],['ECHELON L',[[-45,0,45],[-90,0,90],[-135,0,135]]],
  ['LINE',[[-70,0,0],[70,0,0],[-140,0,0]]],['TRAIL',[[0,-6,80],[0,-12,160],[0,-18,240]]]],formI=0,formSp=1,SLOTS=FORMS[0][1];
var awacs={isFriend:true,isAwacs:true,team:'f',pos:new V3(0,8500,25000),vel:new V3(),q:new Q(),alive:false,hp:400,speed:210,ang:0,grp:null,cmT:0,cmN:30,respT:0,call:'AWACS',P:{code:'E767'}};
var AWC={x:0,z:18000,r:7000,y:7000},airT=2,gndT=3,deaths=0,ending=false,resT=0,resCd=0,awWarnT=0,lF=new V3(),lR=new V3();
function effWave(){return cfg.mission==='custom'?99:wave;}
var score=0,wave=0,waveT=0,kills=0,gkills=0,sel=null,lockT=0,locked=false,msg='',msgT=0,hitFlash=0,camQ=new Q();
var lookYaw=0,lookPitch=0,zoomTog=false,camDir=new V3(0,0,-1);
var aimYaw=0,aimPitch=0,aimDir=new V3(0,0,-1),mouseNX=0,mouseNY=0,ptrLocked=false,lastRoll=1;
var deadT=0,deadWhy='',perfNow=0,toneT=0,rwrT=0,mawT=0,rwr=[],rwrMax=0;
var pf=new V3(0,0,-1),pUp=new V3(0,1,0),pRight=new V3(1,0,0);
var bulletGeo=new THREE.BoxGeometry(0.35,0.35,11);
var bulMatP=new THREE.MeshBasicMaterial({color:0xfff07a}),bulMatE=new THREE.MeshBasicMaterial({color:0xff6a3d});
var mslGeo=new THREE.CylinderGeometry(0.22,0.22,4,6);mslGeo.rotateX(Math.PI/2);
var mslMat=new THREE.MeshLambertMaterial({color:0xf2f2f2});
var bombGeo=new THREE.CylinderGeometry(0.3,0.18,2.6,6);bombGeo.rotateX(Math.PI/2);
var bombMat=new THREE.MeshLambertMaterial({color:0x4a5240});

function say(t,d){msg=t;msgT=d||2.5;}
function clearList(a){for(var i=0;i<a.length;i++){var o=a[i].mesh||a[i].grp||a[i].s;if(o)scene.remove(o);}a.length=0;}
function setPlane(key){
  if(player.key===key&&player.grp)return;
  if(player.grp)scene.remove(player.grp);
  player.key=key;player.st=PLANES[key];player.grp=makeJet(key);scene.add(player.grp);
}
function rearm(){
  normPyl();player.load=[];
  for(var i=0;i<ORDER.length;i++){var id=ORDER[i],n=(cfg.pyl[id]||0)*(PER[id]||1);if(n>0)player.load.push({id:id,n:n,max:n});}
  if(player.cur>=player.load.length)player.cur=0;
  player.ammo=600;player.cm=40;
}
function resetGame(){
  clearList(enemies);clearList(wings);clearList(gnds);clearList(bullets);clearList(missiles);clearList(ords);clearList(flares);
  D=DIFF[cfg.diff];setPlane(cfg.plane);
  player.pos.set(0,3200,0);player.q.set(0,0,0,1);player.speed=270;player.thr=0.8;player.maxHp=player.st.hp;player.hp=player.maxHp;player.alive=true;
  player.cp=player.cr=player.cy=0;player.grp.visible=true;rearm();player.cur=0;if(cfg.mission==='cas')for(var li=0;li<player.load.length;li++)if(WPN[player.load[li].id].cls==='gnd'){player.cur=li;break;}
  player.vel.set(0,0,-270);
  aimYaw=0;aimPitch=0;lookYaw=0;lookPitch=0;zoomTog=false;touchLook=false;aimDir.set(0,0,-1);camQ.copy(player.q);
  radar.contacts.length=0;radar.lock=null;radar.acq=null;radar.a=0;radar.on=true;gT=0;awacsT=6;laserOn=false;laserValid=false;
  var nw=parseInt(cfg.wing,10)||0,C=cfg.cm;freeFlight=cfg.mission==='custom'&&(C.ef+C.tank+C.truck+C.aaa+C.sam+C.bunker)===0;
  formI=0;formSp=1;for(var wi2=0;wi2<nw;wi2++){var f=makeFighter(player.key,'f',new V3(SLOTS[wi2][0],3200,SLOTS[wi2][2]));f.slot=wi2;f.call='ลูกฝูง '+(wi2+2);f.speed=270;scene.add(f.grp);wings.push(f);}
  
  score=0;wave=1;kills=0;gkills=0;waveT=2;airT=2;gndT=3;deaths=0;ending=false;resT=0;resCd=0;awWarnT=0;spawnAwacs();
 sel=null;lockT=0;locked=false;hitFlash=0;rwr=[];
}

/* ================= ground units ================= */
function box(w,h,d,col,x,y,z){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:col,flatShading:true}));m.position.set(x||0,y||0,z||0);return m;}
function cyl(r,l,col,x,y,z,rx){var g=new THREE.CylinderGeometry(r,r,l,8);var m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y,z);m.rotation.x=rx||0;return m;}
function makeGround(type){
  var g=new THREE.Group(),c1=0x5b5f3c,c2=0x44482d,c3=0x2a2c22;
  if(type==='tank'){g.add(box(3.6,1.3,7.2,c1,0,0.9,0));g.add(box(2.4,0.9,3,c2,0,2,0.3));g.add(cyl(0.14,4.6,c3,0,2.1,-3.2,Math.PI/2));}
  else if(type==='truck'){g.add(box(2.6,1.9,2.2,c1,0,1.6,-2.4));g.add(box(2.7,2.2,5,0x6b6f52,0,1.8,1.3));}
  else if(type==='aaa'){g.add(box(3.2,1.2,6,c1,0,0.8,0));g.add(box(2.2,1.1,2.2,c2,0,1.9,0));g.add(cyl(0.1,3.6,c3,-0.4,3.2,-1,0.9));g.add(cyl(0.1,3.6,c3,0.4,3.2,-1,0.9));}
  else if(type==='sam'){g.add(box(3.2,1.2,8,c1,0,0.8,0));for(var i=0;i<4;i++)g.add(cyl(0.3,5.4,0xd8d8d0,-1.05+i*0.7,3,0.6,1.05));g.add(box(2.6,2.2,0.3,c2,0,3.6,-3.2));}
  else{g.add(box(22,7,15,0x8b8b80,0,3.5,0));g.add(box(8,3,8,0x77776c,0,8.3,0));}
  g.scale.setScalar(type==='bunker'?1:1.7);
  return g;
}
function findSite(cx,cz,dmin,dmax){
  for(var i=0;i<400;i++){
    var a=rnd(0,Math.PI*2),d=rnd(dmin,dmax),x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;
    if(Math.hypot(x,z)>48000)continue;
    var h=groundAt(x,z);
    if(h>25&&h<260&&Math.abs(groundAt(x+200,z)-h)<28&&Math.abs(groundAt(x,z+200)-h)<28)return {x:x,z:z};
  }
  for(var r=2000;r<60000;r+=1500){for(var b=0;b<16;b++){var x2=Math.cos(b*0.39)*r,z2=Math.sin(b*0.39)*r,h2=groundAt(x2,z2);if(h2>25&&h2<300)return {x:x2,z:z2};}}
  return {x:cx+dmin,z:cz};
}
function addGround(type,x,z){
  var T=GTYPE[type],g={isGround:true,type:type,T:T,pos:new V3(x,groundAt(x,z)+2,z),vel:new V3(),hp:T.hp,alive:true,grp:makeGround(type),
         t1:rnd(0,3),t2:rnd(3,8),burst:0,track:0,burn:0,seen:false,mt:rnd(15,40),md:1,dx:0,dz:0};
  var ma=rnd(0,6.28);g.dx=Math.cos(ma);g.dz=Math.sin(ma);
  g.grp.position.set(x,g.pos.y-2,z);g.grp.rotation.y=rnd(0,6.28);scene.add(g.grp);gnds.push(g);return g;
}
function spawnGroundList(list,dmin,dmax){
  if(!list.length)return 0;
  var s=findSite(player.pos.x,player.pos.z,dmin,dmax),i;objPos.set(s.x,groundAt(s.x,s.z),s.z);
  for(i=0;i<list.length;i++){
    var a=rnd(0,6.28),d=list[i]==='sam'?rnd(250,420):rnd(30,260);
    addGround(list[i],s.x+Math.cos(a)*d,s.z+Math.sin(a)*d);
  }
  return list.length;
}
function spawnGroundGroup(w){
  var list=[],nt=Math.min(2+w,6),i;
  for(i=0;i<nt;i++)list.push('tank');
  list.push('truck','truck');
  for(i=0;i<Math.min(w,3);i++)list.push('aaa');
  if(w>=D.samw)list.push('sam');
  if(w>=3)list.push('bunker');
  return spawnGroundList(list,14000,23000);
}
function makeFighter(key,team,pos){
  var P=PLANES[key],fr=team==='f';
  return {team:team,isFriend:fr,pos:pos,vel:new V3(0,0,-270),q:new Q(),key:key,P:P,speed:270,cruise:280,base:rnd(255,300)+(fr?25:wave*3),hp:fr?130:100,alive:true,
    side:Math.random()<0.5?-1:1,sideT:rnd(2,4),gunT:0,irT:rnd(2,6),rT:rnd(3,9),cmT:0,cmN:fr?12:6,irN:2,rN:fr?4:2,agN:fr?4:0,agT:0,lockT:0,smokeT:0,
    pr:fr?0.82*P.turn:Math.min(0.74*D.turn*P.turn*(1+wave*0.03),1.2),grp:makeJet(key),tgt:null,tgtT:0,order:'free',slot:0,call:'',dlT:-99,awT:-99,respT:0};
}
function spawnFighters(n,dmin,dmax,fixed){
  var types=[fixed||pick(PKEYS.filter(function(k){return k!==player.key;}))];
  if(n>2&&!fixed)types.push(pick(PKEYS.filter(function(k){return k!==player.key;})));
  for(var i=0;i<n;i++){
    var a=rnd(0,Math.PI*2),d=rnd(dmin,dmax),key=types[i%types.length];
    var x=player.pos.x+Math.cos(a)*d,z=player.pos.z+Math.sin(a)*d,l=Math.hypot(x,z);
    if(l>46000){x*=44000/l;z*=44000/l;}
    var e=makeFighter(key,'e',new V3(x,rnd(2200,5200),z));
    tm.lookAt(e.pos,player.pos,UP);e.q.setFromRotationMatrix(tm);
    scene.add(e.grp);enemies.push(e);
  }
}
function makeAwacsGrp(){
  var g=new THREE.Group(),fb=new THREE.Group();
  var b=box(5,5,46,0x9aa3ad,0,0,0),w=box(46,0.6,7,0x8c959e,0,-0.5,2),d=cyl(4.6,1.1,0x30343a,0,6,6,0),t=box(0.6,9,7,0x8c959e,0,5,20);
  fb.add(b);fb.add(w);fb.add(d);fb.add(t);g.add(fb);
  loadModel('awacs',function(m){if(m){g.remove(fb);g.add(m.clone(true));}});
  return g;
}
function spawnAwacs(){
  var A=awacs;if(!A.grp){A.grp=makeAwacsGrp();scene.add(A.grp);}
  A.alive=true;A.hp=400;A.cmN=30;A.ang=rnd(0,6.28);A.grp.visible=true;updateAwacs(0);
}
function updateAwacs(dt){
  var A=awacs,i;
  if(!A.alive){if(state==='play'){A.respT-=dt;if(A.respT<=0){spawnAwacs();say('AWACS ลำใหม่เข้าประจำการแล้ว',3);}}return;}
  A.ang+=A.speed/AWC.r*dt;var ca=Math.cos(A.ang),sa=Math.sin(A.ang);
  A.pos.set(AWC.x+ca*AWC.r,AWC.y,AWC.z+sa*AWC.r);A.vel.set(-sa*A.speed,0,ca*A.speed);
  tm.lookAt(ZERO,A.vel,UP);A.q.setFromRotationMatrix(tm);rotLocal(A.q,AZ,-0.3);
  A.grp.position.copy(A.pos);A.grp.quaternion.copy(A.q);
  if(state!=='play')return;
  A.cmT-=dt;
  for(i=0;i<missiles.length;i++){var m=missiles[i];
    if(m.target===A&&A.cmT<=0&&A.cmN>0&&m.pos.distanceTo(A.pos)<8000){A.cmT=0.8;A.cmN--;dropCM(A,0.2,0.14);break;}}
  awWarnT-=dt;
  if(awWarnT<=0){for(i=0;i<enemies.length;i++)if(enemies[i].alive&&enemies[i].pos.distanceTo(A.pos)<16000){say('AWACS: ข้าศึกเข้าใกล้ ขอความคุ้มกัน!',3);awWarnT=25;beep(700,0.2,'square',0.04);break;}}
  // rearm and repair by joining up on the AWACS
  resCd-=dt;
  if(player.alive&&player.pos.distanceTo(A.pos)<2500&&resCd<=0){
    resT+=dt;
    if(resT>=5){rearm();player.hp=player.maxHp;for(i=0;i<wings.length;i++){var f=wings[i];if(f.alive){f.hp=130;f.irN=2;f.rN=4;f.agN=4;f.cmN=12;}}
      resT=0;resCd=45;say('เติมอาวุธและซ่อมเครื่องเรียบร้อย',3);beep(1200,0.15,'square',0.04);}
  }else resT=0;
}
function airTarget(){var m=cfg.mission,L=wave;return m==='air'?Math.min(1+L,6):(m==='cas'?(L>=3?Math.min(L-2,3):0):(m==='custom'?cfg.cm.ef:Math.min(L,3)));}
function director(dt){ // continuous reinforcement instead of waves
  wave=clamp(1+Math.floor((kills+gkills/3)/3),1,8);
  var i,na=0,ng=0,m=cfg.mission,C=cfg.cm;
  for(i=enemies.length-1;i>=0;i--){if(enemies[i].alive)na++;else enemies.splice(i,1);}
  for(i=gnds.length-1;i>=0;i--){var g=gnds[i];if(g.alive)ng++;else if(g.burn<=0){scene.remove(g.grp);gnds.splice(i,1);}}
  for(i=0;i<wings.length;i++){var f=wings[i];if(f.alive)continue;f.respT-=dt;
    if(f.respT<=0&&player.alive){f.alive=true;f.hp=130;f.irN=2;f.rN=4;f.agN=4;f.cmN=12;f.tgt=null;f.tgtT=0;f.speed=player.speed;
      f.pos.copy(player.pos).addScaledVector(pf,-900).addScaledVector(pRight,(i-1)*150);f.pos.y=Math.max(f.pos.y,groundAt(f.pos.x,f.pos.z)+1500);f.q.copy(player.q);
      scene.add(f.grp);say(f.call+' กลับเข้าร่วมฝูง',2);}}
  if(freeFlight)return;
  if(m==='custom'&&C.goal>0&&kills+gkills>=C.goal*5){winMission();return;}
  if(na<airTarget()){airT-=dt;
    if(airT<=0){airT=rnd(8,14);
      if(m==='custom')spawnFighters(1,[10000,22000,36000][C.dist],[14000,32000,46000][C.dist],C.et>0?PKEYS[C.et-1]:null);
      else spawnFighters(1,24000,38000);
      if(awacs.alive&&msgT<=0)say('AWACS: ตรวจพบเครื่องบินข้าศึกลำใหม่',2.5);}}
  if(m!=='air'&&ng===0){
    var list=[],ks=['tank','truck','aaa','sam','bunker'],j;
    if(m==='custom')for(i=0;i<ks.length;i++)for(j=0;j<C[ks[i]];j++)list.push(ks[i]);
    if(m!=='custom'||list.length){gndT-=dt;
      if(gndT<=0){gndT=12;
        if(m==='custom')spawnGroundList(list,[8000,14000,25000][C.dist],[12000,23000,35000][C.dist]);
        else spawnGroundGroup(m==='cas'?wave:Math.max(1,wave-1));
        say('พบกลุ่มเป้าภาคพื้นกลุ่มใหม่ — ดูกรอบ OBJ',3);}}
  }
}
function respawnPlayer(){
  var p=player;deaths++;score=Math.max(0,score-100);
  if(awacs.alive)p.pos.set(AWC.x,5000,AWC.z+4000);else p.pos.set(0,5000,10000);
  p.q.set(0,0,0,1);p.speed=280;p.thr=0.8;p.hp=p.maxHp;p.alive=true;p.cp=p.cr=p.cy=0;p.grp.visible=true;p.vel.set(0,0,-280);rearm();
  aimYaw=0;aimPitch=0;lookYaw=0;lookPitch=0;aimDir.set(0,0,-1);camQ.copy(p.q);sel=null;lockT=0;locked=false;radar.lock=null;radar.acq=null;hitFlash=0;
  state='play';say('เกิดใหม่ — เสียคะแนน 100',3);
}

function winMission(){ending=true;state='dead';deadT=2.5;deadWhy='ภารกิจสำเร็จ';releaseLock();}
function quitMission(){ending=true;state='dead';deadT=0;deadWhy='จบภารกิจ';msgT=0;releaseLock();}
function damageFriend(f,d){
  if(!f.alive)return;f.hp-=d;
  if(f.hp<=0){f.alive=false;explode(f.pos,f.isAwacs?3:2);
    if(f.isAwacs){f.grp.visible=false;f.respT=120;say('AWACS ถูกยิงตก! ภาพสนามรบจาก AWACS หายไป 2 นาที',5);}
    else{scene.remove(f.grp);f.respT=40;say(f.call+' ถูกยิงตก!',3);}}
  else if(d>20)say(f.call+': โดนยิง!',1.5);
}
function wingOrder(o){
  var n=0;for(var i=0;i<wings.length;i++)if(wings[i].alive){wings[i].order=o;wings[i].tgt=null;wings[i].tgtT=0;n++;}
  if(!n){say('ไม่มีเพื่อนร่วมฝูง',1.2);return;}
  say(o==='mine'?(sel?'สั่งฝูง: โจมตีเป้าของฉัน':'สั่งฝูง: ยังไม่ได้เลือกเป้า'):(o==='form'?'สั่งฝูง: บินเกาะหมู่ ('+FORMS[formI][0]+')':(o==='awacs'?'สั่งฝูง: ไปคุ้มกัน AWACS':'สั่งฝูง: โจมตีอิสระ')),1.8);beep(900,0.06,'square',0.03);
}
function dlKnown(e){return gT-e.dlT<3;}
function awKnown(e){return gT-e.awT<3;}
function linkKnown(e){return dlKnown(e)||awKnown(e);}
function updateDL(dt){ // wingmen share what their radar or eyes see
  dlT-=dt;if(dlT>0)return;dlT=0.25;
  for(var i=0;i<wings.length;i++){var f=wings[i];if(!f.alive)continue;fwdOf(f,rdB);
    for(var j=0;j<enemies.length;j++){var e=enemies[j];if(!e.alive||gT-e.dlT<0.2)continue;
      rdA.copy(e.pos).sub(f.pos);var d=rdA.length();
      if((d<7000||(d<55000&&rdA.angleTo(rdB)<1.05))&&los(f.pos,e.pos))e.dlT=gT;}}
  if(awacs.alive)for(var k=0;k<enemies.length;k++){var en=enemies[k];if(en.alive&&en.pos.distanceTo(awacs.pos)<150000&&los(awacs.pos,en.pos))en.awT=gT;}
}

/* ================= input ================= */
var keys={},touchIn={x:0,y:0,gun:false,fire:false,cm:false,thrUp:false,thrDn:false,yawL:false,yawR:false,brk:false,look:false},mouseIn={gun:false,fire:false,zoom:false};
function mouseMode(){return cfg.mode==='mouse';}
var touchLook=false;
function lookActive(){return !!(keys.KeyC||touchLook);}
function requestLock(){try{var p=glc.requestPointerLock&&glc.requestPointerLock();if(p&&p.catch)p.catch(function(){});}catch(e){}}
function releaseLock(){try{if(document.exitPointerLock)document.exitPointerLock();}catch(e){}}
document.addEventListener('pointerlockchange',function(){ptrLocked=document.pointerLockElement===glc;});
window.addEventListener('keydown',function(e){
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].indexOf(e.code)>=0&&state!=='menu')e.preventDefault();
  if(e.ctrlKey&&state==='play')e.preventDefault();
  if(e.repeat)return;keys[e.code]=true;
  action(e.code);
});
function action(code){
  if(code==='KeyP'){if(state==='play'){state='paused';say(isTouch?'หยุดชั่วคราว':'หยุดชั่วคราว — P เล่นต่อ · Enter จบภารกิจกลับเมนู',99999);}else if(state==='paused'){state='play';msgT=0;}}
  if(code==='Enter'&&state==='paused'){quitMission();return;}
  if(state!=='play')return;
  if(code==='KeyT')cycleTarget();
  if(code==='KeyX')lockKey();
  if(code==='KeyB'){radar.on=!radar.on;say(radar.on?'เรดาร์: เปิด':'เรดาร์: ปิด',1.2);}
  if(code==='KeyN'){radar.mode=(radar.mode+1)%3;radar.lock=null;radar.acq=null;say('โหมดเรดาร์: '+RMODE[radar.mode],1.2);}
  if(code==='KeyV'){radar.az=(radar.az+1)%3;say('มุมกวาดเรดาร์ ±'+Math.round(radarAz()*180/Math.PI)+'°',1.2);}
  if(code==='Equal')radar.rng=Math.min(3,radar.rng+1);
  if(code==='Minus')radar.rng=Math.max(0,radar.rng-1);
  if(code==='KeyZ'&&(mouseMode()||isTouch))zoomTog=!zoomTog;
  if(code==='KeyR')cycleWeapon(1);
  if(code.indexOf('Digit')===0){var n=(parseInt(code.slice(5),10)+9)%10;if(n>=0&&n<player.load.length)selectWeapon(n);}
  if(code==='KeyL'){laserOn=!laserOn;say(laserOn?'เลเซอร์: เปิด':'เลเซอร์: ปิด',1.2);beep(laserOn?1100:500,0.06,'square',0.03);}
  if(code==='KeyM')mapZ=(mapZ+1)%3;
  if(code==='KeyY')wingOrder('mine');
  if(code==='KeyU')wingOrder('form');
  if(code==='KeyI')wingOrder('free');
  if(code==='KeyJ')wingOrder('awacs');
  if(code==='KeyO'){formI=(formI+1)%FORMS.length;say('รูปขบวน: '+FORMS[formI][0],1.5);}
  if(code==='KeyK'){formSp=formSp===1?2.5:1;say('ระยะรูปขบวน: '+(formSp===1?'ชิด':'ห่าง'),1.5);}
}
window.addEventListener('keyup',function(e){keys[e.code]=false;});
window.addEventListener('beforeunload',function(e){if(state==='play'){e.preventDefault();e.returnValue='';return '';}});
window.addEventListener('blur',function(){keys={};mouseIn.gun=mouseIn.fire=mouseIn.zoom=false;});
glc.addEventListener('mousedown',function(e){
  if(state!=='play')return;
  if(cfg.mode==='mouse'&&!ptrLocked)requestLock();
  if(e.button===0)mouseIn.gun=true;
  if(e.button===2){if(mouseMode())mouseIn.zoom=true;else mouseIn.fire=true;}
  if(e.button===1)cycleTarget();
  e.preventDefault();
});
window.addEventListener('mouseup',function(e){if(e.button===0)mouseIn.gun=false;if(e.button===2){mouseIn.fire=false;mouseIn.zoom=false;}});
window.addEventListener('contextmenu',function(e){if(state==='play')e.preventDefault();});
window.addEventListener('wheel',function(e){if(state!=='play')return;
  if(mouseMode())player.thr=clamp(player.thr+(e.deltaY<0?0.05:-0.05),0,1);else cycleWeapon(e.deltaY>0?1:-1);},{passive:true});
window.addEventListener('mousemove',function(e){
  if(state!=='play'||cfg.mode!=='mouse')return;
  if(ptrLocked){var k=0.0016*cfg.ms*((mouseIn.zoom||zoomTog)?0.35:1),mx=(e.movementX||0)*k,my=(e.movementY||0)*k;
    if(keys.KeyC){lookYaw+=mx;lookPitch=clamp(lookPitch-my,-1.5,1.5);}
    else{aimYaw+=mx;aimPitch=clamp(aimPitch-my,-1.45,1.45);}}
  else{mouseNX=(e.clientX/W-0.5)*2;mouseNY=(e.clientY/H-0.5)*2;}
});
(function(){
  if(!isTouch)return;
  var st=$('stick'),kn=$('knob'),id=null;
  function mv(t){var r=st.getBoundingClientRect(),h=r.width/2,dx=(t.clientX-r.left-h)/(h*0.8),dy=(t.clientY-r.top-h)/(h*0.8);
    var l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}touchIn.x=dx;touchIn.y=dy;kn.style.left=(50+dx*32)+'%';kn.style.top=(50+dy*32)+'%';}
  st.addEventListener('touchstart',function(e){e.preventDefault();var t=e.changedTouches[0];id=t.identifier;mv(t);},{passive:false});
  st.addEventListener('touchmove',function(e){e.preventDefault();for(var i=0;i<e.changedTouches.length;i++)if(e.changedTouches[i].identifier===id)mv(e.changedTouches[i]);},{passive:false});
  function end(e){for(var i=0;i<e.changedTouches.length;i++)if(e.changedTouches[i].identifier===id){id=null;touchIn.x=touchIn.y=0;kn.style.left='50%';kn.style.top='50%';}}
  st.addEventListener('touchend',end);st.addEventListener('touchcancel',end);
  // drag anywhere on empty screen: steer the aim point (drag-aim mode) or look around (stick mode, or while LOOK is held)
  var did=null,lx=0,ly=0,dragLook=false;
  glc.addEventListener('touchstart',function(e){e.preventDefault();if(did!==null)return;var t=e.changedTouches[0];did=t.identifier;lx=t.clientX;ly=t.clientY;
    dragLook=!mouseMode()||touchIn.look;if(dragLook)touchLook=true;},{passive:false});
  glc.addEventListener('touchmove',function(e){e.preventDefault();
    for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(t.identifier!==did)continue;
      var k=0.0042*cfg.ms*((mouseIn.zoom||zoomTog)?0.35:1),mx=(t.clientX-lx)*k,my=(t.clientY-ly)*k;lx=t.clientX;ly=t.clientY;
      if(state!=='play')continue;
      if(dragLook||touchIn.look){lookYaw=clamp(lookYaw+mx,-3.1,3.1);lookPitch=clamp(lookPitch-my,-1.5,1.5);touchLook=true;}
      else{aimYaw+=mx;aimPitch=clamp(aimPitch-my,-1.45,1.45);}}},{passive:false});
  function dend(e){for(var i=0;i<e.changedTouches.length;i++)if(e.changedTouches[i].identifier===did){did=null;if(!touchIn.look)touchLook=false;}}
  glc.addEventListener('touchend',dend);glc.addEventListener('touchcancel',dend);
  // throttle slider
  var th=$('thr');
  function tv(e){e.preventDefault();var t=e.changedTouches[0],r=th.getBoundingClientRect();player.thr=clamp(1-(t.clientY-r.top)/r.height,0,1);}
  th.addEventListener('touchstart',tv,{passive:false});th.addEventListener('touchmove',tv,{passive:false});
  Array.prototype.forEach.call(document.querySelectorAll('.tb'),function(b){
    var k=b.getAttribute('data-k');
    b.addEventListener('touchstart',function(e){e.preventDefault();b.classList.add('on');
      if(k==='wpn')cycleWeapon(1);
      else if(k==='tgt'){if(state==='play'){cycleTarget();if(sel&&!sel.isGround){radar.acq=sel;radar.acqT=0;}}}
      else if(k==='menu'){var c=$('cmd');c.style.display=c.style.display==='grid'?'none':'grid';}
      else if(k==='zoom'){zoomTog=!zoomTog;b.classList.toggle('lit',zoomTog);}
      else if(k==='look'){touchIn.look=true;touchLook=true;}
      else touchIn[k]=true;},{passive:false});
    var off=function(){touchIn[k]=false;b.classList.remove('on');if(k==='look')touchLook=did!==null&&dragLook;};
    b.addEventListener('touchend',off);b.addEventListener('touchcancel',off);
  });
  Array.prototype.forEach.call(document.querySelectorAll('.cb'),function(b){
    b.addEventListener('click',function(){
      var a=b.getAttribute('data-a');
      if(a==='close')$('cmd').style.display='none';
      else if(a==='quit'){$('cmd').style.display='none';if(state==='play'||state==='paused')quitMission();}
      else action(a);
    });
  });
})();

/* ================= weapons ================= */
function curW(){var s=player.load[player.cur];return s?WPN[s.id]:null;}
function curId(){var s=player.load[player.cur];return s?s.id:'';}
function selectWeapon(i){
  var old=curW();player.cur=i;var w=curW();
  if(!old||!w||old.cls!==w.cls)sel=null;
  lockT=0;locked=false;beep(700,0.04,'square',0.03);
}
function cycleWeapon(d){var n=player.load.length;if(n)selectWeapon((player.cur+d+n)%n);}
function fireBullet(side,pos,dir,baseSpeed,dmg,spd){
  var m=new THREE.Mesh(bulletGeo,side==='p'?bulMatP:bulMatE);
  var b={mesh:m,pos:pos.clone(),prev:pos.clone(),vel:dir.clone().multiplyScalar((spd||1100)+baseSpeed),life:1.8,side:side,dmg:dmg};
  m.position.copy(b.pos);m.lookAt(ta.copy(b.pos).add(b.vel));scene.add(m);bullets.push(b);
}
function segHit(a,b,c,r){
  ta.copy(b).sub(a);var l2=ta.lengthSq();tb.copy(c).sub(a);
  var t=l2>0?clamp(tb.dot(ta)/l2,0,1):0;tc.copy(a).addScaledVector(ta,t);
  return tc.distanceToSquared(c)<r*r;
}
function launchMissile(owner,side,w,target,dir0){
  var dir=dir0?dir0.clone().normalize():fwdOf(owner,new V3());
  var m={mesh:new THREE.Mesh(mslGeo,mslMat),w:w,pos:owner.pos.clone().addScaledVector(dir,7),dir:dir,speed:(owner.speed||40)+60,burn:w.burn,
         target:target,life:w.life,owner:owner,side:side,active:false,lostT:0,smokeT:0,arm:0.3};
  if(!owner.isGround)m.pos.y-=1.6;
  m.prev=m.pos.clone();m.mesh.position.copy(m.pos);scene.add(m.mesh);missiles.push(m);
  noise(0.9,clamp(0.3/(1+m.pos.distanceTo(camera.position)/600),0.01,0.3),1800);
  return m;
}
var ilA=new V3(),ilB=new V3();
function illuminates(owner,t,stt){
  if(!owner||!owner.alive)return false;
  if(owner.isPlayer){
    if(!radar.on||t.isFlare)return false;
    if(radar.lock===t)return radar.memT<0.01;
    return !stt&&((radar.mode===1&&!radar.lock&&trackFresh(t))||dlKnown(t));
  }
  ilA.copy(t.pos).sub(owner.pos);var d=ilA.length();
  if(owner.isGround)return d<18000&&(t.isFlare||samSees(owner,t));
  return d<46000&&fwdOf(owner,ilB).angleTo(ilA)<1.06&&(t.isFlare||(!notched(owner.pos,t)&&los(owner.pos,t.pos)));
}
function dropCM(from,pIR,pRad){
  var back=new V3(0,0,1).applyQuaternion(from.q);
  var f={isFlare:true,pos:from.pos.clone(),vel:from.vel.clone().multiplyScalar(0.5).addScaledVector(back,25),life:3.2,alive:true,
         s:new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xfff1b0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}))};
  f.vel.y-=18;f.vel.x+=rnd(-12,12);f.vel.z+=rnd(-12,12);f.s.scale.set(14,14,1);f.s.position.copy(f.pos);scene.add(f.s);flares.push(f);
  for(var i=0;i<6;i++)spawnP(from.pos,rnd(-9,9),rnd(-9,9),rnd(-9,9),1.6,2,9,0xdfe6ee,false,0.5);
  for(i=0;i<missiles.length;i++){var m=missiles[i];
    if(m.target!==from||m.pos.distanceTo(from.pos)>6000)continue;
    if(m.w.seek==='ir'){if(Math.random()<pIR)m.target=f;}
    else if(m.w.seek==='sarh'||m.w.seek==='arh'){
      var sp=from.vel.length()||1,c=(m.dir.x*from.vel.x+m.dir.y*from.vel.y+m.dir.z*from.vel.z)/sp,beam=Math.sqrt(Math.max(0,1-c*c));
      if(Math.random()<pRad*(0.5+1.3*beam)){m.target=f;m.active=true;}
    }
  }
}
function damageEnemy(e,d){
  if(!e.alive)return;e.hp-=d;
  if(e.hp<=0){e.alive=false;explode(e.pos,2);scene.remove(e.grp);kills++;var s=100+wave*20;score+=s;
    if(sel===e){sel=null;lockT=0;}say('ยิง '+e.P.code+' ตก! +'+s,2);}
}
function damageGround(g,d){
  if(!g.alive||d<=0)return;g.hp-=d;
  if(g.hp<=0){g.alive=false;g.burn=30;explode(g.pos,2);gkills++;score+=g.T.score;
    g.grp.traverse(function(o){if(o.material&&o.material.color)o.material.color.setHex(0x1c1c1a);});
    if(sel===g){sel=null;lockT=0;}say('ทำลาย '+g.T.code+' +'+g.T.score,2);}
}
function explodeGround(pos,rad,dmg,size){
  explode(pos,size);
  for(var i=0;i<gnds.length;i++){var g=gnds[i];if(!g.alive)continue;var d=g.pos.distanceTo(pos);if(d<rad)damageGround(g,dmg*(1-0.75*d/rad));}
}
function damagePlayer(d){
  if(!player.alive||state!=='play')return;player.hp-=d*D.dmg;hitFlash=0.35;
  if(player.hp<=0)killPlayer('เครื่องของคุณถูกยิงตก');
}
function killPlayer(why){
  if(!player.alive)return;player.alive=false;player.hp=0;explode(player.pos,2);player.grp.visible=false;
  state='dead';deadT=4;deadWhy=why;say(why+' — กำลังเกิดใหม่…',4);
}
var ctA=new V3(),ctB=new V3();
function targetList(){
  var w=curW(),cls=w?w.cls:'air',out=[],i,arm=curId()==='arm';
  if(cls==='gnd'){for(i=0;i<gnds.length;i++){var g=gnds[i];if(g.alive&&(arm?(emits(g)&&g.pos.distanceTo(player.pos)<32000):g.seen))out.push(g);}}
  else{for(i=0;i<enemies.length;i++)if(enemies[i].alive&&(isKnown(enemies[i])||linkKnown(enemies[i])))out.push(enemies[i]);}
  return out;
}

function offBore(t){return ctB.copy(t.pos).sub(player.pos).normalize().angleTo(pf);}
function cycleTarget(){
  var l=targetList();
  if(l.length&&!l[0].isGround&&(radar.lock||radar.acq)){radar.lock=null;radar.acq=null;}
  if(!l.length){sel=null;return;}
  l.sort(function(a,b){return offBore(a)-offBore(b);});
  var i=l.indexOf(sel);sel=l[(i+1)%l.length];lockT=0;locked=false;beep(1000,0.04,'square',0.03);
}
function autoTarget(){
  var w=curW(),cls=w?w.cls:'air';
  if(cls==='gnd'){if(sel&&sel.alive&&sel.isGround&&(curId()==='arm'?emits(sel):sel.seen))return;}
  else{
    if(radar.lock){if(sel!==radar.lock){sel=radar.lock;lockT=0;}return;}
    if(sel&&sel.alive&&!sel.isGround&&(isKnown(sel)||linkKnown(sel)))return;
  }
  var l=targetList(),best=null,bs=1e12;
  for(var i=0;i<l.length;i++){var s=offBore(l[i])*20000+l[i].pos.distanceTo(player.pos);if(s<bs){bs=s;best=l[i];}}
  if(sel!==best){sel=best;lockT=0;locked=false;}
}
/* unguided ordnance: shared step so the CCIP prediction matches the real thing */
function stepOrd(o,dt){
  var aim=null;
  if(o.type==='gps')aim=o.tgt;
  else if(o.type==='lgb'&&laserValid&&tb.copy(laserSpot).sub(o.pos).angleTo(o.vel)<0.8)aim=laserSpot; // seeker must see the laser spot
  if(aim){
    var s=o.vel.length()||1;ta.copy(o.vel).multiplyScalar(1/s);
    tb.copy(aim).sub(o.pos).normalize();var a=ta.angleTo(tb),mx=0.55*dt;
    if(a<=mx)ta.copy(tb);else ta.lerp(tb,mx/a).normalize();
    s=clamp(s+(-9.8*ta.y-0.00006*s*s)*dt,90,420);o.vel.copy(ta).multiplyScalar(s);
  }else if(o.type==='rkt'){
    if(o.burn>0){o.burn-=dt;ta.copy(o.vel).normalize();o.vel.addScaledVector(ta,520*dt);}
    o.vel.y-=9.8*0.7*dt;
  }else{o.vel.y-=9.8*dt;o.vel.multiplyScalar(1-0.012*dt);}
  o.pos.addScaledVector(o.vel,dt);
}
function dropOrd(type,target,side){
  var o={type:type,pos:player.pos.clone(),prev:player.pos.clone(),vel:player.vel.clone(),life:70,burn:0,target:target||null,tgt:target?target.pos.clone():null,
         mesh:new THREE.Mesh(type==='rkt'?mslGeo:bombGeo,type==='rkt'?mslMat:bombMat),smokeT:0};
  if(type==='rkt'){o.burn=0.9;o.pos.addScaledVector(pRight,3.2*side).addScaledVector(pUp,-1).addScaledVector(pf,4);o.mesh.scale.setScalar(0.6);
    o.vel.addScaledVector(pUp,rnd(-2,2)).addScaledVector(pRight,rnd(-2,2));}
  else{o.pos.addScaledVector(pUp,-2);o.mesh.scale.setScalar(type==='bomb'?1.15:1.35);}
  o.prev.copy(o.pos);o.mesh.position.copy(o.pos);scene.add(o.mesh);ords.push(o);
}
var objPos=new V3(),laserOn=false,laserValid=false,laserSpot=new V3(),mapZ=1,MRNG=[15000,30000,60000],pdA=new V3();
function emits(g){return g.type==='sam'||g.type==='aaa';}
function podSees(t){return pdA.copy(t.pos).sub(player.pos).angleTo(pf)<2.4&&los(player.pos,t.pos);}
function glideRange(w,t){return clamp((player.pos.y-t.pos.y)*3.2+1500,2500,w.range);}
var ccip={ok:false,pos:new V3()},simO={type:'bomb',pos:new V3(),vel:new V3(),burn:0,target:null};
function computeCCIP(type){
  simO.type=type;simO.pos.copy(player.pos);simO.vel.copy(player.vel);simO.burn=type==='rkt'?0.9:0;ccip.ok=false;
  var dt=type==='rkt'?0.05:0.12,n=type==='rkt'?220:420;
  for(var i=0;i<n;i++){stepOrd(simO,dt);if(simO.pos.y<=groundAt(simO.pos.x,simO.pos.z)){ccip.ok=true;ccip.pos.copy(simO.pos);return;}}
}
function nextGround(){
  var l=targetList(),best=null,bs=1e12,i,j;
  for(i=0;i<l.length;i++){var g=l[i];if(g===sel||!g.isGround)continue;
    var busy=false;for(j=0;j<missiles.length;j++)if(missiles[j].target===g)busy=true;
    for(j=0;j<ords.length;j++)if(ords[j].target===g)busy=true;
    if(busy)continue;var sc=offBore(g)*20000+g.pos.distanceTo(player.pos);if(sc<bs){bs=sc;best=g;}}
  if(best){sel=best;lockT=0;locked=false;}
}
function fireWeapon(){
  var s=player.load[player.cur];if(!s)return;
  function deny(m){say(m,1.6);beep(200,0.1,'square',0.04);player.wT=0.3;}
  if(s.n<=0){deny('อาวุธนี้หมดแล้ว');return;}
  var w=WPN[s.id],id=s.id,gl=locked&&sel&&sel.alive&&sel.isGround;
  if(id==='fox2'||id==='fox1'||id==='fox3'){
    var t=(locked&&sel&&sel.alive&&!sel.isGround)?sel:null;
    launchMissile(player,'p',w,t);s.n--;player.wT=0.8;
    say(t?(id==='fox2'?'FOX TWO':id==='fox1'?'FOX ONE — รักษาล็อกไว้จนกว่าจะชน':'FOX THREE'):'ยิงโดยไม่ได้ล็อกเป้า',1.6);
  }else if(id==='tv'){
    if(!gl){deny('ซีกเกอร์ TV ยังไม่ล็อก — หันหัวเครื่องเข้าหาเป้าในระยะ 10 กม.');return;}
    launchMissile(player,'p',w,sel);say('RIFLE',1.2);s.n--;player.wT=0.9;nextGround();
  }else if(id==='arm'){
    if(!gl){deny('ไม่มีเรดาร์ข้าศึกให้ล็อก');return;}
    launchMissile(player,'p',w,sel);say('MAGNUM',1.2);s.n--;player.wT=0.9;nextGround();
  }else if(id==='gps'){
    if(!gl){deny('เป้าอยู่นอกระยะร่อนของระเบิด GPS');return;}
    dropOrd('gps',sel,0);say('ปล่อยระเบิด GPS',1.2);noise(0.2,0.1,500);s.n--;player.wT=0.6;nextGround();
  }else if(id==='lgb'){
    dropOrd('lgb',null,0);noise(0.2,0.1,500);s.n--;player.wT=0.6;
    say(laserOn?'ปล่อย LGB — ส่องเลเซอร์ไว้จนกว่าจะชน':'ปล่อย LGB — ยังไม่ได้เปิดเลเซอร์ (L)',2);
  }else if(id==='bomb'||id==='cbu'){dropOrd(id,null,0);s.n--;player.wT=0.28;noise(0.2,0.1,500);}
  else if(id==='rkt'){dropOrd('rkt',null,1);if(s.n>1)dropOrd('rkt',null,-1);s.n=Math.max(0,s.n-2);player.wT=0.16;noise(0.4,0.2,2200);}
}

/* ================= player ================= */
var dzf=function(v){var a=Math.abs(v);return a<0.08?0:(v>0?1:-1)*(a-0.08)/0.92;};
var plA=new V3(),plB=new V3(),plQ=new Q();
function updatePlayer(dt,active){
  var p=player,ip=0,ir=0,iy=0,it=0,mouse=mouseMode(),stickOn=Math.abs(touchIn.x)>0.12||Math.abs(touchIn.y)>0.12;
  if(active){
    if(mouse){
      if(!ptrLocked&&!isTouch){aimYaw+=dzf(mouseNX)*1.5*cfg.ms*dt;aimPitch=clamp(aimPitch-dzf(mouseNY)*1.1*cfg.ms*dt,-1.45,1.45);}
      var cpi=Math.cos(aimPitch);aimDir.set(Math.sin(aimYaw)*cpi,Math.sin(aimPitch),-Math.cos(aimYaw)*cpi);
      // instructor: steer the aircraft toward the aim point
      if(keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||keys.KeyQ||keys.KeyE||touchIn.yawL||touchIn.yawR||stickOn){
        // manual stick: keys take full control, and the aim point follows the nose so nothing snaps back on release
        ip=clamp((keys.KeyS?1:0)-(keys.KeyW?1:0)+(stickOn?touchIn.y:0),-1,1);ir=clamp((keys.KeyD?1:0)-(keys.KeyA?1:0)+(stickOn?touchIn.x:0),-1,1);
        aimYaw=Math.atan2(pf.x,-pf.z);aimPitch=clamp(Math.asin(clamp(pf.y,-1,1)),-1.45,1.45);
        cpi=Math.cos(aimPitch);aimDir.set(Math.sin(aimYaw)*cpi,Math.sin(aimPitch),-Math.cos(aimYaw)*cpi);
      }else{
      plQ.copy(p.q).invert();plA.copy(aimDir).applyQuaternion(plQ);
      var ang=Math.acos(clamp(-plA.z,-1,1)),ra=Math.atan2(plA.x,plA.y),w=sstep(0.05,0.32,ang);
      if(Math.abs(ra)>2.7)ra=Math.abs(ra)*lastRoll;else if(Math.abs(ra)>0.3)lastRoll=ra>0?1:-1;
      var bank=Math.asin(clamp(-pRight.y,-1,1)),bankT=clamp(plA.x*3.5,-0.7,0.7);
      var rollSmall=pUp.y<0?lastRoll:clamp((bankT-bank)*3,-1,1);
      ir=w*clamp(ra*2.6,-1,1)+(1-w)*rollSmall;
      ip=w*clamp(ang*2.6,0,1)*Math.max(0,Math.cos(ra))+(1-w)*clamp(Math.atan2(plA.y,-plA.z)*6,-1,1);
      iy=clamp(plA.x*4,-1,1)*(1-0.5*w);
      }
    }else{
      if(keys.KeyS||keys.ArrowDown)ip+=1;if(keys.KeyW||keys.ArrowUp)ip-=1;
      if(keys.KeyD||keys.ArrowRight)ir+=1;if(keys.KeyA||keys.ArrowLeft)ir-=1;
      ip+=touchIn.y;ir+=touchIn.x;
    }
    if(keys.KeyE||touchIn.yawR)iy+=1;if(keys.KeyQ||touchIn.yawL)iy-=1;
    if(keys.ShiftLeft||keys.ShiftRight||touchIn.thrUp)it+=1;if(keys.ControlLeft||keys.ControlRight||touchIn.thrDn||(!mouse&&keys.KeyZ))it-=1;
    ip=clamp(ip,-1,1);ir=clamp(ir,-1,1);iy=clamp(iy,-1,1);it=clamp(it,-1,1);
  }
  var k=1-Math.exp(-(mouse?10:7)*dt),S=p.st,cs=mouse?1:cfg.cs,kg=0,wi;
  for(wi=0;wi<p.load.length;wi++)kg+=p.load[wi].n*KG[p.load[wi].id];
  var mf=1/(1+kg/16000);
  p.cp+=(ip-p.cp)*k;p.cr+=(ir-p.cr)*k;p.cy+=(iy-p.cy)*k;
  p.thr=clamp(p.thr+it*0.55*dt,0,1);
  var v=p.speed,auth=clamp(v/170,0.15,1)*(v>340?340/v:1);
  rotLocal(p.q,AX,p.cp*(p.cp>0?1.22:0.7)*S.turn*cs*auth*(0.6+0.4*mf)*dt);
  rotLocal(p.q,AZ,-p.cr*3.0*S.roll*cs*clamp(v/150,0.2,1)*dt);
  rotLocal(p.q,AY,-p.cy*0.45*auth*dt);
  fwdOf(p,pf);
  if(v<95){plB.crossVectors(pf,plA.set(0,-1,0));
    if(plB.lengthSq()>1e-4){tq.setFromAxisAngle(plB.normalize(),(1-v/95)*1.4*dt);p.q.premultiply(tq);}}
  p.q.normalize();
  fwdOf(p,pf);pUp.set(0,1,0).applyQuaternion(p.q);pRight.set(1,0,0).applyQuaternion(p.q);
  var ab=p.thr>0.95,thrust=p.thr*(ab?62:44)*S.thr*mf;
  var acc=thrust-0.000305*v*v-9.8*pf.y-Math.abs(p.cp)*auth*16-((active&&(keys.KeyH||touchIn.brk))?0.0008*v*v+6:0);
  p.speed=clamp(v+acc*dt,35,560);
  p.vel.copy(pf).multiplyScalar(p.speed);
  p.pos.addScaledVector(p.vel,dt);
  if(p.speed<110)p.pos.y-=(110-p.speed)*0.6*dt;
  if(p.pos.y>12000)p.pos.y=12000;
  p.grp.position.copy(p.pos);p.grp.quaternion.copy(p.q);setGlow(p.grp,p.thr);
  if(!active)return;
  if(p.pos.y<groundAt(p.pos.x,p.pos.z)+6){killPlayer('เครื่องชนพื้น');return;}
  if(Math.hypot(p.pos.x,p.pos.z)>60000)damagePlayer(14*dt);
  // gun
  p.gunT-=dt;p.wT-=dt;p.cmT-=dt;
  if((mouseIn.gun||touchIn.gun||(!mouse&&keys.Space))&&p.gunT<=0&&p.ammo>0){
    p.gunT=0.05;p.ammo--;
    plA.copy(pf).addScaledVector(pUp,rnd(-0.004,0.004)).addScaledVector(pRight,rnd(-0.004,0.004)).normalize();
    fireBullet('p',plB.copy(p.pos).addScaledVector(pf,10).addScaledVector(pRight,1.2),plA,p.speed,15);
    if(p.ammo%2===0)noise(0.06,0.12,2600);
  }
  // targeting & lock
  autoTarget();
  var cw=curW(),id=curId();locked=false;
  if(sel&&sel.alive&&cw&&cw.lock){
    plA.copy(sel.pos).sub(p.pos);var d=plA.length(),a=plA.normalize().angleTo(pf),ok;
    if(id==='fox2')ok=a<0.42&&d<cw.range;
    else if(id==='fox1')ok=illuminates(p,sel,true)&&d<cw.range;
    else if(id==='fox3')ok=illuminates(p,sel,false)&&d<cw.range;
    else if(id==='tv')ok=a<0.5&&d<cw.range&&los(p.pos,sel.pos);
    else if(id==='arm')ok=emits(sel)&&a<1.0&&d<cw.range;
    else if(sel.isGround)ok=a<1.3&&d<glideRange(cw,sel);
    else ok=false;
    if(ok)lockT=Math.min(lockT+dt,cw.lock+0.1);else lockT=Math.max(0,lockT-dt*2);
    locked=lockT>=cw.lock;
    toneT-=dt;
    if(lockT>0.05&&toneT<=0){beep(locked?1500:900,0.05,'square',0.025);toneT=locked?0.13:0.34;}
  }else lockT=0;
  if(cw&&(id==='bomb'||id==='rkt'||id==='cbu'||id==='lgb'))computeCCIP(id==='rkt'?'rkt':'bomb');else ccip.ok=false;
  laserValid=false;
  if(laserOn&&sel&&sel.isGround&&sel.alive&&sel.pos.distanceTo(p.pos)<16000&&podSees(sel)){laserValid=true;laserSpot.copy(sel.pos);}
  if((mouseIn.fire||touchIn.fire||keys.Enter||(mouse?keys.Space:keys.KeyF))&&p.wT<=0){
    fireWeapon();
    if(id!=='rkt'&&id!=='bomb'&&id!=='cbu'){mouseIn.fire=false;touchIn.fire=false;keys.KeyF=false;keys.Enter=false;if(mouse)keys.Space=false;}
  }
  if((keys.KeyG||touchIn.cm)&&p.cmT<=0&&p.cm>0){p.cmT=0.3;p.cm--;dropCM(p,0.28*D.cm,0.15*D.cm);beep(300,0.05,'triangle',0.04);}
}

/* ================= enemy fighters ================= */
var ef=new V3(),des=new V3(),ld=new V3(),eq=new Q(),eA=new V3(),eB=new V3(),eC=new V3(),eF=new V3();
function pickTarget(e){
  var best=null,bs=1e12,i,d;
  if(e.team==='e'){for(i=0;i<blue.length;i++){d=blue[i].pos.distanceTo(e.pos)*(blue[i].isPlayer?0.85:(blue[i].isAwacs?1.2:1));if(d<bs){bs=d;best=blue[i];}}return best;}
  if(e.order==='form')return null;
  if(e.order==='awacs'){if(!awacs.alive)return null;for(i=0;i<enemies.length;i++){if(!enemies[i].alive)continue;d=enemies[i].pos.distanceTo(awacs.pos);if(d<25000&&d<bs){bs=d;best=enemies[i];}}return best;}
  if(!player.alive)return null;
  if(e.order==='mine'&&sel&&sel.alive&&(!sel.isGround||e.agN>0))return sel;
  for(i=0;i<enemies.length;i++){if(!enemies[i].alive)continue;d=enemies[i].pos.distanceTo(e.pos);if(d<50000&&d<bs){bs=d;best=enemies[i];}}
  if(best||e.agN<=0)return best;
  for(i=0;i<gnds.length;i++){var g=gnds[i];if(!g.alive||!g.seen)continue;
    var busy=false;for(var j=0;j<missiles.length;j++)if(missiles[j].target===g)busy=true;
    if(busy)continue;d=g.pos.distanceTo(e.pos);if(d<bs){bs=d;best=g;}}
  return best;
}
function updateFighter(e,dt){
  var fr=e.team==='f',side=fr?'p':'e',i;
  e.tgtT-=dt;if(e.tgtT<=0||(e.tgt&&!e.tgt.alive)){e.tgtT=2;e.tgt=pickTarget(e);}
  var tgt=e.tgt,air=!!tgt&&!tgt.isGround,dist=0,mode='cruise';
  fwdOf(e,ef);
  if(tgt){eA.copy(tgt.pos).sub(e.pos);dist=eA.length();eA.normalize();}
  var agl=e.pos.y-groundAt(e.pos.x,e.pos.z),threat=null;
  for(i=0;i<missiles.length;i++){var mm=missiles[i];
    if(mm.target===e){var md=mm.pos.distanceTo(e.pos);if(mm.w.seek==='ir'?md<3000:((mm.active||mm.w.seek==='sarh')&&md<10000)){threat=mm;break;}}}
  e.sideT-=dt;if(e.sideT<=0){e.side=-e.side;e.sideT=rnd(2.5,4.5);}
  e.cruise=e.base;
  if(agl<450||(agl<1000&&ef.y<-0.35)){des.set(ef.x,0.7,ef.z).normalize();mode='climb';}
  else if(threat){
    eB.copy(e.pos).sub(threat.pos).normalize();des.crossVectors(eB,UP).multiplyScalar(e.side);des.y=agl>1500?-0.2:0.1;des.normalize();mode='evade';
    e.cmT-=dt;if(e.cmT<=0&&e.cmN>0&&threat.pos.distanceTo(e.pos)<6000){e.cmT=1.0;e.cmN--;dropCM(e,fr?0.16:0.10,fr?0.10:0.06);}
  }
  else if(air){
    if(ef.dot(eA)<0&&dist<1700&&fwdOf(tgt,eF).dot(eA)<-0.82){des.set(1,0,0).applyQuaternion(e.q).multiplyScalar(e.side);des.y+=0.25;des.normalize();mode='break';}
    else if(dist<260){des.copy(ef).addScaledVector(UP,0.8).normalize();mode='avoid';}
    else{des.copy(tgt.pos).addScaledVector(tgt.vel,Math.min(dist/1100,1.6)).sub(e.pos).normalize();mode='pursue';}
  }
  else if(tgt){ // friendly strike run on a ground target
    if(dist<4200||e.agN<=0){e.tgt=null;e.tgtT=8;des.set(-eA.x,0.25,-eA.z).normalize();mode='egress';}
    else{des.copy(eA);if(e.pos.y<2200)des.y=Math.max(des.y,0.08);des.normalize();mode='strike';}
  }
  else if(fr&&((e.order==='awacs'&&awacs.alive)||player.alive)){ // hold formation on the leader (you, or the AWACS when escorting it)
    var esc=e.order==='awacs'&&awacs.alive,ldr=esc?awacs:player,sl=FORMS[formI][1][e.slot%3],sp=esc?4:formSp,lU=pUp;
    if(esc){fwdOf(awacs,lF);lF.y=0;lF.normalize();lR.crossVectors(lF,UP);lU=UP;}else{lF.copy(pf);lR.copy(pRight);}
    eC.copy(ldr.pos).addScaledVector(lR,sl[0]*sp).addScaledVector(lU,sl[1]*sp+(esc?-150:0)).addScaledVector(lF,-sl[2]*sp).sub(e.pos);
    var fd=eC.length()||1,ahead=eC.dot(lF)>0;
    if(fd<45){des.copy(lF);e.cruise=ldr.speed+(ahead?1:-1)*fd*0.4;}
    else{var fw=clamp(fd/400,0.3,1);des.copy(eC).multiplyScalar(fw/fd).addScaledVector(lF,1-fw).normalize();
      e.cruise=(ahead||fd>700)?ldr.speed+clamp(fd*0.35,10,esc?300:170):ldr.speed-clamp(fd*0.3,10,90);}
    mode='form';
  }
  else{des.set(ef.x,0.05,ef.z).normalize();}
  if(e.pos.y>9500){des.y-=0.5;des.normalize();}
  if(Math.hypot(e.pos.x,e.pos.z)>56000&&mode!=='climb'&&mode!=='form'){des.set(-e.pos.x,0,-e.pos.z).normalize();mode='return';}
  eq.copy(e.q).invert();ld.copy(des).applyQuaternion(eq);
  var ang=Math.acos(clamp(-ld.z,-1,1)),rollC,pitchC,yawC=0;
  if(ang>0.12){var ra=Math.atan2(ld.x,ld.y);rollC=clamp(ra*2.2,-1,1);pitchC=Math.abs(ra)<0.7?clamp(ang*3,0,1):0.12;}
  else{eB.set(1,0,0).applyQuaternion(e.q);rollC=clamp(eB.y*2,-1,1);pitchC=clamp(ld.y*9,-1,1);yawC=clamp(ld.x*9,-1,1);}
  rotLocal(e.q,AX,pitchC*e.pr*dt);rotLocal(e.q,AZ,-rollC*2.6*dt);rotLocal(e.q,AY,-yawC*0.5*dt);e.q.normalize();
  fwdOf(e,ef);
  e.speed=clamp(e.speed+((e.cruise-e.speed)*(fr?1.3:0.6)-9.8*ef.y*0.5)*dt,150,fr?560:360);
  e.vel.copy(ef).multiplyScalar(e.speed);e.pos.addScaledVector(e.vel,dt);
  e.grp.position.copy(e.pos);e.grp.quaternion.copy(e.q);setGlow(e.grp,0.75);
  if(e.pos.y<groundAt(e.pos.x,e.pos.z)+6){if(fr)damageFriend(e,999);else damageEnemy(e,999);return;}
  if(e.hp<55){e.smokeT-=dt;if(e.smokeT<=0){e.smokeT=0.07;spawnP(e.pos,0,3,0,1.6,5,22,0x222222,false,0.55);}}
  if(state!=='play'||!tgt||!tgt.alive||!e.tgt){e.lockT=0;return;}
  e.gunT-=dt;e.irT-=dt;e.rT-=dt;e.agT-=dt;
  var nose=ef.angleTo(eA);
  if(!air){
    if(mode==='strike'&&dist<9500&&nose<0.35&&e.agT<=0&&los(e.pos,tgt.pos)){launchMissile(e,'p',WPN.tv,tgt);e.agN--;e.agT=7;e.tgt=null;e.tgtT=0.5;say(e.call+': RIFLE',1.5);}
    return;
  }
  var canR=fr||effWave()>=D.rw,canIR=fr||effWave()>=D.irw;
  e.lockT=(mode==='pursue'&&nose<0.6&&dist<24000&&canR&&e.rN>0&&!notched(e.pos,tgt))?e.lockT+dt:0;
  var aim=ef.angleTo(eC.copy(tgt.pos).addScaledVector(tgt.vel,dist/1350).sub(e.pos).normalize());
  if(mode==='pursue'&&aim<0.05&&dist<850&&e.gunT<=0){
    e.gunT=0.085;var dp=fr?0.012:0.012*D.disp;eB.copy(ef);eB.x+=rnd(-dp,dp);eB.y+=rnd(-dp,dp);eB.z+=rnd(-dp,dp);eB.normalize();
    fireBullet(side,eC.copy(e.pos).addScaledVector(ef,10),eB,e.speed,fr?10:5);
  }
  if(mode!=='pursue')return;
  var inc=0;for(i=0;i<missiles.length;i++)if(missiles[i].side===side&&missiles[i].target===tgt)inc++;
  if(inc>=(fr?1:D.inc))return;
  var fm=fr?1:D.fire;
  if(canIR&&e.irN>0&&e.irT<=0&&nose<0.3&&dist>800&&dist<4500){e.irT=rnd(12,18)*fm;e.irN--;launchMissile(e,side,fr?WPN.fox2:EW_IR,tgt);if(fr)say(e.call+': FOX TWO',1.5);}
  else if(e.lockT>3&&e.rT<=0&&nose<0.35&&dist>5000&&dist<19000){e.rT=rnd(16,24)*fm;e.rN--;launchMissile(e,side,fr?FW_R:EW_R,tgt);if(fr)say(e.call+': FOX THREE',1.5);}
}

/* ================= ground units ================= */
var gA=new V3(),gB=new V3();
function updateGround(g,dt){
  if(!g.alive){if(g.burn>0){g.burn-=dt;if(Math.random()<dt*9)spawnP(g.pos,rnd(-2,2),rnd(8,14),rnd(-2,2),rnd(2.5,4),6,34,0x1d1d1d,false,0.6);}return;}
  if(g.type==='truck'){ // convoy trucks keep moving, so fixed-coordinate (GPS) weapons can miss them
    g.mt-=dt;if(g.mt<=0){g.mt=rnd(30,50);g.md=-g.md;}
    var nx=g.pos.x+g.dx*g.md*11*dt,nz=g.pos.z+g.dz*g.md*11*dt,nh=groundAt(nx,nz);
    if(nh>8&&Math.abs(nh-(g.pos.y-2))<3){g.pos.set(nx,nh+2,nz);g.vel.set(g.dx*g.md*11,0,g.dz*g.md*11);g.grp.position.set(nx,nh,nz);g.grp.rotation.y=Math.atan2(-g.dx*g.md,-g.dz*g.md);}
    else{g.md=-g.md;g.vel.set(0,0,0);}
  }
  if(!player.alive||state!=='play'){g.track=0;return;}
  gA.copy(player.pos).sub(g.pos);var d=gA.length(),i;
  if(!g.seen&&d<16000&&los(player.pos,g.pos))g.seen=true;
  if(g.type==='aaa'){
    g.t1-=dt;
    if(d<3600){
      if(g.burst<=0&&g.t1<=0){g.burst=1.4;g.t1=rnd(2.2,3.6)*D.fire;}
      if(g.burst>0){g.burst-=dt;g.t2-=dt;
        if(g.t2<=0){g.t2=0.11;var tt=d/950,dp=0.022*D.disp;
          gB.copy(player.pos).addScaledVector(player.vel,tt).sub(g.pos);gB.y+=4.9*tt*tt*0.3;gB.normalize();
          gB.x+=rnd(-dp,dp);gB.y+=rnd(-dp,dp);gB.z+=rnd(-dp,dp);gB.normalize();
          fireBullet('e',gA.copy(g.pos).setY(g.pos.y+4),gB,0,4,950);}}
    }
  }else if(g.type==='sam'){
    for(i=0;i<missiles.length;i++)if(missiles[i].w.seek==='arm'&&missiles[i].target===g){g.track=0;g.silent=true;return;} // shuts its radar down while an ARM is inbound
    g.silent=false;
    if(d<16000&&samSees(g,player))g.track+=dt;else g.track=Math.max(0,g.track-dt*2);
    g.t1-=dt;
    if(g.track>3.5&&g.t1<=0&&d>2500&&d<14000){
      var n=0;for(i=0;i<missiles.length;i++)if(missiles[i].side==='e'&&missiles[i].target===player)n++;
      if(n<D.inc){g.t1=rnd(15,22)*D.fire;gB.copy(gA).normalize();gB.y+=0.5;launchMissile(g,'e',SAM_W,player,gB);}
      else g.t1=2;
    }
  }
}

/* ================= projectiles ================= */
function updateBullets(dt){
  for(var i=bullets.length-1;i>=0;i--){
    var b=bullets[i],j;b.life-=dt;b.prev.copy(b.pos);b.pos.addScaledVector(b.vel,dt);b.vel.y-=9.8*dt;
    var dead=b.life<=0;
    if(!dead&&b.side==='p'){
      for(j=0;j<enemies.length;j++){var e=enemies[j];
        if(e.alive&&segHit(b.prev,b.pos,e.pos,11)){damageEnemy(e,b.dmg);spawnP(b.pos,0,0,0,0.25,3,12,0xffd070,true,0.9);beep(180,0.04,'sawtooth',0.03);dead=true;break;}}
      if(!dead&&b.pos.y<900){for(j=0;j<gnds.length;j++){var g=gnds[j];
        if(g.alive&&segHit(b.prev,b.pos,g.pos,g.type==='bunker'?13:7)){damageGround(g,b.dmg*g.T.gun);spawnP(b.pos,0,4,0,0.3,3,12,0xffd070,true,0.9);dead=true;break;}}}
    }else if(!dead){
      if(player.alive&&segHit(b.prev,b.pos,player.pos,8)){damagePlayer(b.dmg);dead=true;noise(0.08,0.2,700);}
      else if(awacs.alive&&segHit(b.prev,b.pos,awacs.pos,22)){damageFriend(awacs,b.dmg);dead=true;}
      else for(j=0;j<wings.length;j++){var wf=wings[j];if(wf.alive&&segHit(b.prev,b.pos,wf.pos,9)){damageFriend(wf,b.dmg);dead=true;break;}}
    }
    if(!dead&&b.pos.y<groundAt(b.pos.x,b.pos.z)){dead=true;if(b.side==='p')spawnP(b.pos,0,6,0,0.5,2,10,0xb8a888,false,0.6);}
    if(dead){scene.remove(b.mesh);bullets.splice(i,1);}
    else{b.mesh.position.copy(b.pos);b.mesh.lookAt(ta.copy(b.pos).add(b.vel));}
  }
}
var mA=new V3();
function updateMissiles(dt){
  for(var i=missiles.length-1;i>=0;i--){
    var m=missiles[i],w=m.w,boom=false,gone=false,j;m.life-=dt;m.arm-=dt;
    if(m.burn>0){m.burn-=dt;m.speed=Math.min(m.speed+w.acc*dt,w.vmax);}else m.speed-=w.drag*m.speed*m.speed*dt;
    m.speed-=9.8*m.dir.y*dt*0.6;
    var t=m.target,guide=true;
    if(t&&t.alive===false){m.target=t=null;}
    if(t&&!t.isFlare){
      if(w.seek==='sarh'){if(illuminates(m.owner,t,true))m.lostT=0;else{m.lostT+=dt;guide=false;if(m.lostT>1.5){m.target=t=null;}}}
      else if(w.seek==='arh'&&!m.active){
        mA.copy(t.pos).sub(m.pos);var dd=mA.length();
        if(dd<w.act&&mA.normalize().angleTo(m.dir)<0.9)m.active=true;
        else if(!illuminates(m.owner,t,false))guide=false;
      }
      if(m.active&&w.seek==='arh'&&notched(m.pos,t))guide=false;
    }else if(!t&&w.seek==='arh'&&m.side==='p'&&m.arm<=0){
      for(j=0;j<enemies.length;j++){var en=enemies[j];if(!en.alive)continue;mA.copy(en.pos).sub(m.pos);
        if(mA.length()<8000&&mA.normalize().angleTo(m.dir)<0.6){m.target=en;m.active=true;break;}}
    }
    if(t&&guide){
      mA.copy(t.pos).sub(m.pos);var d=mA.length();
      mA.copy(t.pos).addScaledVector(t.vel,Math.min(d/Math.max(m.speed,200),3)).sub(m.pos).normalize();
      var a=m.dir.angleTo(mA),maxT=w.turn*clamp(m.speed/500,0.3,1)*dt;
      if(a>1.25&&(w.seek==='ir'||m.active)){m.target=null;}
      else if(a<=maxT)m.dir.copy(mA);else m.dir.lerp(mA,maxT/a).normalize();
    }else if(!t){m.dir.y-=0.08*dt;m.dir.normalize();}
    m.prev.copy(m.pos);m.pos.addScaledVector(m.dir,m.speed*dt);
    if(m.arm<=0){
      if(t&&t.isGround){if(segHit(m.prev,m.pos,t.pos,9)){explodeGround(t.pos,w.rad,w.dmg,2);gone=true;}}
      else if(m.side==='p'){
        for(j=0;j<enemies.length;j++){var e=enemies[j];
          if(e.alive&&segHit(m.prev,m.pos,e.pos,w.rad)){damageEnemy(e,w.dmg);boom=true;break;}}
      }else{
        if(player.alive&&segHit(m.prev,m.pos,player.pos,w.rad)){boom=true;damagePlayer(w.dmg);}
        else if(awacs.alive&&segHit(m.prev,m.pos,awacs.pos,26)){boom=true;damageFriend(awacs,w.dmg);}
        else for(j=0;j<wings.length;j++){var wf=wings[j];if(wf.alive&&segHit(m.prev,m.pos,wf.pos,w.rad)){boom=true;damageFriend(wf,w.dmg);break;}}
      }
      if(!boom&&!gone&&t&&t.isFlare&&segHit(m.prev,m.pos,t.pos,14))boom=true;
    }
    if(!boom&&!gone&&m.pos.y<groundAt(m.pos.x,m.pos.z)){
      if(m.side==='p'&&w.cls==='gnd'){explodeGround(m.pos,w.rad,w.dmg,2);gone=true;}else boom=true;
    }
    if(boom)explode(m.pos,1);
    if(boom||gone||m.life<=0||(m.burn<=0&&m.speed<170)){scene.remove(m.mesh);missiles.splice(i,1);continue;}
    m.mesh.position.copy(m.pos);m.mesh.lookAt(ta.copy(m.pos).add(m.dir));
    m.smokeT-=dt;if(m.smokeT<=0&&m.burn>-1.5){m.smokeT=0.03;spawnP(m.pos,rnd(-2,2),rnd(-2,2),rnd(-2,2),1.3,2.5,11,0xe6e6e6,false,m.burn>0?0.55:0.25);}
  }
}
function updateOrds(dt){
  for(var i=ords.length-1;i>=0;i--){
    var o=ords[i],hit=false,j;o.life-=dt;o.prev.copy(o.pos);stepOrd(o,dt);
    var W2=WPN[o.type],gh=groundAt(o.pos.x,o.pos.z);
    if(o.type==='cbu'){
      if(o.pos.y-gh<260){ // airburst: bomblets scattered over a wide footprint
        for(j=0;j<12;j++){var bx=o.pos.x+rnd(-1,1)*W2.rad*0.8,bz=o.pos.z+rnd(-1,1)*W2.rad*0.8;explode(ta.set(bx,groundAt(bx,bz)+1,bz).clone(),1);}
        o.pos.y=gh;explodeGround(o.pos,W2.rad,W2.dmg,1);scene.remove(o.mesh);ords.splice(i,1);continue;}
    }else{
      for(j=0;j<gnds.length&&!hit;j++){var g=gnds[j];if(g.alive&&segHit(o.prev,o.pos,g.pos,g.type==='bunker'?12:6)){hit=true;o.pos.copy(g.pos);}}
    }
    if(!hit&&o.pos.y<=gh){hit=true;o.pos.y=gh;}
    if(hit)explodeGround(o.pos,W2.rad,W2.dmg,o.type==='rkt'?1:3);
    if(hit||o.life<=0){scene.remove(o.mesh);ords.splice(i,1);continue;}
    o.mesh.position.copy(o.pos);o.mesh.lookAt(ta.copy(o.pos).add(o.vel));
    if(o.type==='rkt'){o.smokeT-=dt;if(o.smokeT<=0){o.smokeT=0.03;spawnP(o.pos,0,0,0,0.8,2,7,0xdddddd,false,0.45);}}
  }
}
function updateFlares(dt){
  for(var i=flares.length-1;i>=0;i--){
    var f=flares[i];f.life-=dt;f.vel.multiplyScalar(1-0.9*dt);f.vel.y-=14*dt;f.pos.addScaledVector(f.vel,dt);
    if(f.life<=0){f.alive=false;scene.remove(f.s);flares.splice(i,1);continue;}
    f.s.position.copy(f.pos);var s=10+Math.random()*8;f.s.scale.set(s,s,1);f.s.material.opacity=Math.min(1,f.life);
    if(Math.random()<0.4)spawnP(f.pos,0,2,0,0.8,2,8,0xdddddd,false,0.35);
  }
}

/* ================= radar ================= */
var RAZ=[60,30,10],RRNG=[10000,20000,40000,80000],RMODE=['SRC','TWS','ACM'];
var radar={on:true,mode:0,az:0,rng:2,a:0,dir:1,contacts:[],lock:null,acq:null,acqT:0,memT:0};
var gT=0,awacsT=6,rdA=new V3(),rdB=new V3(),sA=new V3();
function los(a,b){
  for(var i=1;i<=10;i++){var t=i/11,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;if(groundAt(x,z)>a.y+(b.y-a.y)*t)return false;}
  return true;
}
function notched(em,t){ // pulse-doppler: looking down at a target with low radial speed = lost in ground clutter
  rdA.copy(em).sub(t.pos);var d=rdA.length()||1;
  if(em.y-t.pos.y<0.03*d)return false;
  return Math.abs(t.vel.dot(rdA))/d<50;
}
function samSees(g,t){
  if(!los(sA.copy(g.pos).setY(g.pos.y+6),t.pos))return false;
  var agl=t.pos.y-groundAt(t.pos.x,t.pos.z);if(agl<60)return false;
  if(agl<500){sA.copy(g.pos).sub(t.pos);var d=sA.length()||1;if(Math.abs(t.vel.dot(sA))/d<45)return false;}
  return true;
}
function radarSees(e){
  if(!radar.on||!e.alive)return false;
  rdB.copy(e.pos).sub(player.pos);var d=rdB.length();if(d>75000||d<1)return false;
  rdB.multiplyScalar(1/d);if(rdB.angleTo(pf)>1.047)return false;
  var asp=Math.abs(fwdOf(e,rdA).dot(rdB));
  if(d>75000*(0.5+0.5*asp))return false;
  if(notched(player.pos,e))return false;
  return los(player.pos,e.pos);
}
function visual(e){return e.pos.distanceTo(player.pos)<7000&&los(player.pos,e.pos);}
function contactOf(e){for(var i=0;i<radar.contacts.length;i++)if(radar.contacts[i].e===e)return radar.contacts[i];return null;}
function seeContact(e){var c=contactOf(e);if(!c){c={e:e,pos:new V3(),vel:new V3(),t:0};radar.contacts.push(c);}c.pos.copy(e.pos);c.vel.copy(e.vel);c.t=gT;return c;}
function trackFresh(e){var c=contactOf(e);return !!c&&gT-c.t<4.5;}
function contactPos(c,out){out.copy(c.pos);if(radar.mode===1||radar.lock===c.e)out.addScaledVector(c.vel,gT-c.t);return out;}
function isKnown(e){return radar.lock===e||!!contactOf(e)||visual(e);}
function radarAz(){return (radar.mode===1?Math.min(RAZ[radar.az],30):RAZ[radar.az])*Math.PI/180;}
function updateRadar(dt){
  var R=radar,i,e;
  if(!R.on){R.contacts.length=0;R.lock=null;R.acq=null;return;}
  if(R.lock){
    if(R.lock.alive&&radarSees(R.lock)){R.memT=0;seeContact(R.lock);}
    else{R.memT+=dt;if(!R.lock.alive||R.memT>2.5){if(R.lock.alive)say('เรดาร์หลุดล็อก',1.5);R.lock=null;R.memT=0;}}
  }else{
    if(R.acq){
      if(R.acq.alive&&radarSees(R.acq)){R.acqT+=dt;seeContact(R.acq);if(R.acqT>0.8){R.lock=R.acq;R.acq=null;R.memT=0;beep(1300,0.12,'square',0.04);}}
      else{R.acq=null;say('ล็อกไม่สำเร็จ — เป้าอยู่นอกกรวยเรดาร์หรือถูกบัง',1.6);}
    }
    if(R.mode===2){
      var best=null,bd=10000;
      for(i=0;i<enemies.length;i++){e=enemies[i];if(!e.alive)continue;var d=e.pos.distanceTo(player.pos);
        if(d<bd&&rdB.copy(e.pos).sub(player.pos).angleTo(pf)<0.4&&radarSees(e)){bd=d;best=e;}}
      if(best&&!R.acq){R.acq=best;R.acqT=0.4;}
    }else{
      var lim=radarAz(),a0=R.a;R.a+=R.dir*2.1*dt;
      if(R.a>lim){R.a=lim;R.dir=-1;}else if(R.a<-lim){R.a=-lim;R.dir=1;}
      var lo=Math.min(a0,R.a)-0.01,hi=Math.max(a0,R.a)+0.01;
      for(i=0;i<enemies.length;i++){e=enemies[i];if(!e.alive)continue;var az=relBearing(e.pos);
        if(az>=lo&&az<=hi&&radarSees(e))seeContact(e);}
    }
  }
  var keep=R.mode===1?9:6;
  for(i=R.contacts.length-1;i>=0;i--){var c=R.contacts[i];if(!c.e.alive||(gT-c.t>keep&&R.lock!==c.e))R.contacts.splice(i,1);}
}
function lockKey(){
  if(radar.lock||radar.acq){radar.lock=null;radar.acq=null;say('ปลดล็อกเรดาร์',1);return;}
  if(!radar.on){say('เรดาร์ปิดอยู่ (B)',1.2);return;}
  if(sel&&sel.alive&&!sel.isGround){radar.acq=sel;radar.acqT=0;beep(1000,0.05,'square',0.03);}
  else say('ยังไม่มีเป้าให้ล็อก — กด T เลือกเป้าบนจอเรดาร์',1.6);
}
function awacsCall(dt){
  awacsT-=dt;if(awacsT>0)return;awacsT=22;
  if(!awacs.alive)return;
  var best=null,bd=1e12;
  for(var i=0;i<enemies.length;i++){var e=enemies[i];if(!e.alive||!awKnown(e))continue;var d=e.pos.distanceTo(player.pos);if(d<bd){bd=d;best=e;}}
  if(best&&bd>9000&&msgT<=0){var brg=(Math.atan2(best.pos.x-player.pos.x,-(best.pos.z-player.pos.z))*180/Math.PI+360)%360;
    say('AWACS: ข้าศึกใกล้สุด ทิศ '+('00'+Math.round(brg)%360).slice(-3)+'° ระยะ '+Math.round(bd/1000)+' กม. สูง '+(best.pos.y/1000).toFixed(1)+' กม.',5);}
}

/* ================= RWR ================= */
var rwA=new V3(),rwB=new V3();
function relBearing(pos){
  var dx=pos.x-player.pos.x,dz=pos.z-player.pos.z,h=Math.atan2(pf.x,-pf.z),ch=Math.cos(h),sh=Math.sin(h);
  return Math.atan2(dx*ch+dz*sh,dx*sh-dz*ch);
}
function updateRWR(dt){
  rwr.length=0;rwrMax=0;var i,maw=false;
  for(i=0;i<enemies.length;i++){var e=enemies[i];if(!e.alive)continue;
    rwA.copy(player.pos).sub(e.pos);var d=rwA.length();
    if(d<40000&&fwdOf(e,rwB).angleTo(rwA.normalize())<1.06){var lv=(e.lockT>1&&e.tgt===player)?1:0;rwr.push({a:relBearing(e.pos),lv:lv,code:e.P.rw});if(lv>rwrMax)rwrMax=lv;}}
  for(i=0;i<gnds.length;i++){var g=gnds[i];if(!g.alive)continue;var dg=g.pos.distanceTo(player.pos);
    if(g.type==='sam'&&dg<18000&&!g.silent){var l2=g.track>1.5?1:0;rwr.push({a:relBearing(g.pos),lv:l2,code:'SA'});if(l2>rwrMax)rwrMax=l2;}
    else if(g.type==='aaa'&&dg<6000)rwr.push({a:relBearing(g.pos),lv:0,code:'A'});}
  for(i=0;i<missiles.length;i++){var m=missiles[i];if(m.side!=='e'||m.target!==player)continue;
    if(m.w.seek==='sarh'||m.active){rwr.push({a:relBearing(m.pos),lv:2,code:'M'});rwrMax=2;}
    else if(m.w.seek==='ir'&&m.pos.distanceTo(player.pos)<D.maw)maw=true;}
  mawT=maw?0.5:Math.max(0,mawT-dt);
  rwrT-=dt;
  if(rwrT<=0){
    if(rwrMax===2||mawT>0){beep(rwrMax===2?1250:620,0.09,'sawtooth',0.05);rwrT=0.16;}
    else if(rwrMax===1){beep(820,0.12,'square',0.03);rwrT=0.7;}
    else rwrT=0.2;
  }
}

/* ================= HUD ================= */
var G='#7dffb0',R='#ff5a4d',Y='#ffd27d',O='#ffa94d',B='#78dcff',sp=new V3(),hA=new V3(),hB=new V3(),hC=new V3();
function scr(v){sp.copy(v).project(camera);return {x:(sp.x*0.5+0.5)*W,y:(-sp.y*0.5+0.5)*H,front:sp.z<1};}
function txt(s,x,y,size,col,align){hx.font='600 '+size+'px ui-monospace,Menlo,Consolas,"Noto Sans Thai",monospace';hx.textAlign=align||'left';
  hx.fillStyle='rgba(0,0,0,.55)';hx.fillText(s,x+1,y+1);hx.fillStyle=col||G;hx.fillText(s,x,y);}
function onScreen(s){return s.front&&s.x>-40&&s.x<W+40&&s.y>-40&&s.y<H+40;}
function drawScope(x,y,w,h,gndMode){
  var rng=gndMode?20000:RRNG[radar.rng],i,d,a,px,py,fs=Math.max(9,Math.round(w/13)),lim=gndMode?1.05:radarAz();
  hx.fillStyle='rgba(6,18,28,.62)';hx.fillRect(x,y,w,h);hx.strokeStyle='rgba(125,255,176,.6)';hx.lineWidth=1.2;hx.strokeRect(x,y,w,h);
  hx.strokeStyle='rgba(125,255,176,.18)';hx.beginPath();
  for(i=1;i<4;i++){hx.moveTo(x,y+h*i/4);hx.lineTo(x+w,y+h*i/4);}
  hx.moveTo(x+w/2,y);hx.lineTo(x+w/2,y+h);hx.stroke();
  function sx(az){return x+w/2+az/1.05*(w/2-5);}
  function sy(dd){return y+h-dd/rng*(h-6)-3;}
  if(gndMode){
    txt('GND',x+4,y+fs+2,fs,G);txt((rng/1000)+'km',x+w-4,y+fs+2,fs,G,'right');
    for(i=0;i<gnds.length;i++){var t=gnds[i];if(!t.alive)continue;d=t.pos.distanceTo(player.pos);a=relBearing(t.pos);
      if(d>rng||Math.abs(a)>1.05)continue;px=sx(a);py=sy(d);var gs=t===sel;
      hx.fillStyle=gs?(locked?R:Y):O;if(gs){hx.strokeStyle=locked?R:Y;hx.strokeRect(px-6,py-6,12,12);}hx.fillRect(px-2.5,py-2.5,5,5);}
  }else{
    txt(radar.on?RMODE[radar.mode]+(radar.lock?' STT':'')+' ±'+Math.round(lim*57.3):'RDR OFF',x+4,y+fs+2,fs,radar.on?G:R);
    txt((rng/1000)+'km',x+w-4,y+fs+2,fs,G,'right');
    if(radar.on){
      hx.strokeStyle='rgba(125,255,176,.35)';hx.beginPath();hx.moveTo(sx(-lim),y);hx.lineTo(sx(-lim),y+h);hx.moveTo(sx(lim),y);hx.lineTo(sx(lim),y+h);hx.stroke();
      if(!radar.lock&&radar.mode!==2){hx.strokeStyle='rgba(125,255,176,.85)';hx.beginPath();hx.moveTo(sx(radar.a),y+h);hx.lineTo(sx(radar.a),y);hx.stroke();}
      for(i=0;i<radar.contacts.length;i++){var c=radar.contacts[i],age=gT-c.t;contactPos(c,hB);
        d=hB.distanceTo(player.pos);a=relBearing(hB);if(d>rng||Math.abs(a)>1.05)continue;px=sx(a);py=sy(d);
        var isS=c.e===sel,isL=c.e===radar.lock,al=clamp(1-age/(radar.mode===1?9:6),0.25,1);
        hx.globalAlpha=isL?1:al;hx.fillStyle=isL?R:(isS?Y:G);
        if(radar.mode===1||isL){hx.strokeStyle=hx.fillStyle;hx.strokeRect(px-4,py-4,8,8);
          var hv=Math.atan2(c.vel.x,-c.vel.z)-Math.atan2(pf.x,-pf.z);hx.beginPath();hx.moveTo(px,py);hx.lineTo(px+Math.sin(hv)*11,py-Math.cos(hv)*11);hx.stroke();}
        else hx.fillRect(px-4,py-1.5,8,3);
        if(isS&&!isL){hx.strokeStyle=Y;hx.beginPath();hx.moveTo(px-8,py-7);hx.lineTo(px-8,py+7);hx.moveTo(px+8,py-7);hx.lineTo(px+8,py+7);hx.stroke();}
        if(isL){hx.beginPath();hx.arc(px,py,8,0,7);hx.stroke();}
        hx.globalAlpha=1;
      }
      for(i=0;i<enemies.length;i++){var de=enemies[i];if(!de.alive||!linkKnown(de)||contactOf(de))continue;
        d=de.pos.distanceTo(player.pos);a=relBearing(de.pos);if(d>rng||Math.abs(a)>1.05)continue;px=sx(a);py=sy(d);
        hx.strokeStyle=de===sel?Y:B;hx.beginPath();hx.moveTo(px,py-5);hx.lineTo(px+5,py);hx.lineTo(px,py+5);hx.lineTo(px-5,py);hx.closePath();hx.stroke();}
      if(awacs.alive){d=awacs.pos.distanceTo(player.pos);a=relBearing(awacs.pos);if(d<rng&&Math.abs(a)<1.05){hx.strokeStyle=B;hx.strokeRect(sx(a)-4,sy(d)-4,8,8);}}
      for(i=0;i<wings.length;i++){var wf2=wings[i];if(!wf2.alive)continue;d=wf2.pos.distanceTo(player.pos);a=relBearing(wf2.pos);
        if(d<rng&&Math.abs(a)<1.05){hx.strokeStyle=B;hx.beginPath();hx.arc(sx(a),sy(d),3.5,0,7);hx.stroke();}}
      if(radar.acq)txt('ACQ',x+w/2,y+h-5,fs,Y,'center');
      else if(radar.lock){var L=radar.lock;hA.copy(L.pos).sub(player.pos);d=hA.length()||1;var vc=-(L.vel.dot(hA)-player.vel.dot(hA))/d;
        txt((radar.memT>0?'MEM ':'')+(d/1000).toFixed(1)+'km Vc'+Math.round(vc)+' '+(L.pos.y/1000).toFixed(1)+'k',x+w/2,y+h-5,fs,radar.memT>0?Y:R,'center');}
    }
  }
  for(i=0;i<missiles.length;i++){var m=missiles[i];if(m.side!=='p')continue;d=m.pos.distanceTo(player.pos);a=relBearing(m.pos);
    if(d<rng&&Math.abs(a)<1.05){hx.fillStyle='#fff';hx.fillRect(sx(a)-1,sy(d)-1,2,4);}}
}
var mapCv=null,tgpRect={on:false,x:0,y:0,s:0};
function buildMap(){
  mapCv=document.createElement('canvas');mapCv.width=mapCv.height=160;var x=mapCv.getContext('2d'),i,j;
  for(j=0;j<160;j++)for(i=0;i<160;i++){var h=terrainH((i+0.5)/160*TS-TS/2,(j+0.5)/160*TS-TS/2);
    x.fillStyle=h<=0?'#1d4f74':(h<14?'#b9b083':(h<280?'#3f6b35':(h<500?'#566238':(h<640?'#6e6a62':'#dfe4e8'))));x.fillRect(i,j,1,1);}
}
function drawMap(x,y,sz){
  if(!mapCv)buildMap();
  var p=player,Rg=MRNG[mapZ],k=160/TS,i,c=x+sz/2,cy=y+sz/2,sc=sz/2/Rg;
  function mx(wx){return c+(wx-p.pos.x)*sc;}function my(wz){return cy+(wz-p.pos.z)*sc;}
  hx.save();hx.beginPath();hx.rect(x,y,sz,sz);hx.clip();
  hx.fillStyle='#1d4f74';hx.fillRect(x,y,sz,sz);
  hx.globalAlpha=0.8;hx.drawImage(mapCv,(p.pos.x-Rg+TS/2)*k,(p.pos.z-Rg+TS/2)*k,2*Rg*k,2*Rg*k,x,y,sz,sz);hx.globalAlpha=1;
  hx.lineWidth=1;hx.strokeStyle='rgba(255,210,125,.7)';hx.beginPath();hx.arc(mx(0),my(0),60000*sc,0,7);hx.stroke();
  var hd=Math.atan2(pf.x,-pf.z),az=radarAz(),rl=Math.min(RRNG[radar.rng],Rg*1.5)*sc;
  if(radar.on){hx.strokeStyle='rgba(125,255,176,.45)';hx.beginPath();hx.moveTo(c+Math.sin(hd-az)*rl,cy-Math.cos(hd-az)*rl);hx.lineTo(c,cy);hx.lineTo(c+Math.sin(hd+az)*rl,cy-Math.cos(hd+az)*rl);hx.stroke();}
  var ng=0;
  for(i=0;i<gnds.length;i++){var g=gnds[i];if(!g.alive)continue;ng++;if(!g.seen)continue;var gx=mx(g.pos.x),gy=my(g.pos.z);
    if(g.type==='sam'||g.type==='aaa'){hx.strokeStyle='rgba(255,90,77,.6)';hx.beginPath();hx.arc(gx,gy,(g.type==='sam'?14000:3600)*sc,0,7);hx.stroke();}
    hx.fillStyle=g===sel?Y:O;hx.fillRect(gx-2,gy-2,4,4);}
  if(ng){var ox=mx(objPos.x),oy=my(objPos.z);hx.strokeStyle='#fff';hx.strokeRect(ox-5,oy-5,10,10);}
  if(awacs.alive){var ax2=clamp(mx(awacs.pos.x),x+5,x+sz-5),ay2=clamp(my(awacs.pos.z),y+5,y+sz-5);hx.strokeStyle=B;hx.lineWidth=1.5;hx.strokeRect(ax2-4,ay2-4,8,8);hx.beginPath();hx.arc(mx(AWC.x),my(AWC.z),AWC.r*sc,0,7);hx.globalAlpha=0.3;hx.stroke();hx.globalAlpha=1;hx.lineWidth=1;}
  for(i=0;i<enemies.length;i++){var e=enemies[i];if(!e.alive||!(isKnown(e)||linkKnown(e)))continue;var ex=mx(e.pos.x),ey=my(e.pos.z),eh=Math.atan2(e.vel.x,-e.vel.z);
    hx.save();hx.translate(clamp(ex,x+4,x+sz-4),clamp(ey,y+4,y+sz-4));hx.rotate(eh);hx.fillStyle=e===sel?Y:R;
    hx.beginPath();hx.moveTo(0,-5);hx.lineTo(3.5,4);hx.lineTo(-3.5,4);hx.closePath();hx.fill();hx.restore();}
  for(i=0;i<wings.length;i++){var wf=wings[i];if(!wf.alive)continue;var wx=mx(wf.pos.x),wy=my(wf.pos.z);
    if(wf.tgt&&wf.tgt.alive){hx.strokeStyle='rgba(120,220,255,.45)';hx.beginPath();hx.moveTo(wx,wy);hx.lineTo(mx(wf.tgt.pos.x),my(wf.tgt.pos.z));hx.stroke();}
    hx.save();hx.translate(clamp(wx,x+4,x+sz-4),clamp(wy,y+4,y+sz-4));hx.rotate(Math.atan2(wf.vel.x,-wf.vel.z));hx.fillStyle=B;
    hx.beginPath();hx.moveTo(0,-5);hx.lineTo(3.5,4);hx.lineTo(-3.5,4);hx.closePath();hx.fill();hx.restore();}
  hx.fillStyle='#fff';
  for(i=0;i<missiles.length;i++){var m=missiles[i];hx.fillRect(mx(m.pos.x)-1,my(m.pos.z)-1,2,2);}
  hx.save();hx.translate(c,cy);hx.rotate(hd);hx.fillStyle=G;hx.beginPath();hx.moveTo(0,-7);hx.lineTo(5,5);hx.lineTo(0,2);hx.lineTo(-5,5);hx.closePath();hx.fill();hx.restore();
  hx.restore();
  hx.strokeStyle='rgba(125,255,176,.6)';hx.lineWidth=1.2;hx.strokeRect(x,y,sz,sz);
  var fs=Math.max(9,Math.round(sz/13));txt('N',c,y+fs+1,fs,G,'center');txt('±'+(Rg/1000)+'km',x+sz-4,y+sz-4,fs,G,'right');
}
function drawRWR(cx,cy,r){
  hx.fillStyle='rgba(6,18,28,.6)';hx.beginPath();hx.arc(cx,cy,r,0,7);hx.fill();
  hx.strokeStyle='rgba(125,255,176,.6)';hx.lineWidth=1.2;hx.stroke();
  hx.strokeStyle='rgba(125,255,176,.2)';hx.beginPath();hx.arc(cx,cy,r*0.5,0,7);hx.moveTo(cx,cy-r);hx.lineTo(cx,cy-r+7);hx.stroke();
  hx.fillStyle=G;hx.beginPath();hx.moveTo(cx,cy-5);hx.lineTo(cx+4,cy+4);hx.lineTo(cx-4,cy+4);hx.closePath();hx.fill();
  var fs=Math.max(9,Math.round(r/4.6)),blink=Math.floor(perfNow*7)%2===0;
  for(var i=0;i<rwr.length;i++){var c=rwr[i],rr=c.lv===2?r*0.42:(c.lv===1?r*0.62:r*0.82),x=cx+Math.sin(c.a)*rr,y=cy-Math.cos(c.a)*rr;
    var col=c.lv===2?R:(c.lv===1?Y:G);
    if(c.lv===2&&!blink)continue;
    txt(c.code,x,y+fs*0.35,fs,col,'center');
    if(c.lv>=1){hx.strokeStyle=col;hx.beginPath();hx.moveTo(x,y-fs);hx.lineTo(x+fs*1.1,y);hx.lineTo(x,y+fs);hx.lineTo(x-fs*1.1,y);hx.closePath();hx.stroke();}
  }
  txt('RWR',cx,cy+r+fs+2,fs,G,'center');
}
function drawHUD(){
  hx.setTransform(DPR,0,0,DPR,0,0);hx.clearRect(0,0,W,H);
  if(state==='menu')return;
  var p=player,u=clamp(Math.min(W,H)/720,0.7,1.25),fs=Math.round(15*u),i,s,d,cw=curW(),id=curId(),gndMode=!!(cw&&cw.cls==='gnd'),compact=isTouch||H<480;
  hx.lineWidth=1.6;
  if(hitFlash>0){hx.fillStyle='rgba(255,40,30,'+(hitFlash*0.9)+')';hx.fillRect(0,0,W,H);}
  if(p.alive){
    // boresight
    var bs=scr(hA.copy(p.pos).addScaledVector(pf,1200));
    if(bs.front){hx.strokeStyle=G;hx.beginPath();hx.arc(bs.x,bs.y,3,0,7);
      hx.moveTo(bs.x-16,bs.y);hx.lineTo(bs.x-6,bs.y);hx.moveTo(bs.x+6,bs.y);hx.lineTo(bs.x+16,bs.y);hx.moveTo(bs.x,bs.y-16);hx.lineTo(bs.x,bs.y-6);hx.stroke();}
    if(mouseMode()){
      s=scr(hA.copy(p.pos).addScaledVector(aimDir,5000));
      if(s.front){hx.strokeStyle='rgba(255,255,255,.9)';hx.beginPath();hx.arc(s.x,s.y,11,0,7);hx.stroke();hx.fillStyle='#fff';hx.fillRect(s.x-1,s.y-1,2,2);}
      if(!ptrLocked&&!isTouch)txt('คลิกที่จอเพื่อล็อกเมาส์',W/2,H*0.9,Math.round(fs*0.95),Y,'center');
    }
    // CCIP
    if(ccip.ok){s=scr(ccip.pos);
      if(s.front){hx.strokeStyle=G;hx.beginPath();if(bs.front){hx.moveTo(bs.x,bs.y);hx.lineTo(s.x,s.y);}hx.stroke();
        hx.beginPath();hx.arc(s.x,s.y,13,0,7);hx.moveTo(s.x-3,s.y);hx.lineTo(s.x+3,s.y);hx.moveTo(s.x,s.y-3);hx.lineTo(s.x,s.y+3);hx.stroke();
        txt('CCIP',s.x,s.y+13+fs,Math.round(fs*0.8),G,'center');}}
    // air targets
    for(i=0;i<enemies.length;i++){var e=enemies[i];if(!e.alive)continue;
      var vis=visual(e),ct=contactOf(e),isSel=e===sel,lk=isSel&&locked,stt=radar.lock===e,dl=linkKnown(e);
      if(!(vis||isSel||stt||dl||(radar.mode===1&&ct)))continue;
      var ep=(vis||stt||dl||!ct)?e.pos:contactPos(ct,hC);
      d=ep.distanceTo(p.pos);s=scr(ep);
      if(onScreen(s)){
        var b=isSel?15:9;hx.strokeStyle=lk?R:(isSel?Y:(vis?'rgba(255,120,100,.85)':(dl?'rgba(120,220,255,.8)':'rgba(255,120,100,.4)')));
        if(lk){hx.beginPath();hx.moveTo(s.x,s.y-b-4);hx.lineTo(s.x+b+4,s.y);hx.lineTo(s.x,s.y+b+4);hx.lineTo(s.x-b-4,s.y);hx.closePath();hx.stroke();}
        hx.strokeRect(s.x-b,s.y-b,b*2,b*2);
        if(isSel&&cw&&cw.lock&&lockT>0&&!lk){hx.beginPath();hx.arc(s.x,s.y,b+8,-Math.PI/2,-Math.PI/2+Math.PI*2*lockT/cw.lock);hx.stroke();}
        txt((d/1000).toFixed(1),s.x,s.y+b+fs,Math.round(fs*0.8),lk?R:(isSel?Y:'#ffb0a6'),'center');
        if(isSel){
          txt((vis||stt?e.P.code:(dl&&!ct?'DL':'TRK'))+(stt?' STT':'')+(lk?' LOCK':''),s.x,s.y-b-8,Math.round(fs*0.85),lk?R:Y,'center');
          hx.fillStyle=R;hx.fillRect(s.x-b,s.y-b-5,b*2*clamp(e.hp/100,0,1),2.5);
          if(d<1600){var l=scr(hA.copy(e.pos).addScaledVector(e.vel,d/(1100+p.speed)));
            if(l.front){hx.strokeStyle=G;hx.beginPath();hx.arc(l.x,l.y,8,0,7);hx.stroke();}}
        }
      }else if(isSel){
        hA.copy(ep).applyMatrix4(camera.matrixWorldInverse);var an=Math.atan2(-hA.y,hA.x),rr=Math.min(W,H)*0.36;
        hx.save();hx.translate(W/2+Math.cos(an)*rr,H/2+Math.sin(an)*rr);hx.rotate(an);hx.fillStyle=Y;hx.beginPath();hx.moveTo(14,0);hx.lineTo(-8,-9);hx.lineTo(-8,9);hx.closePath();hx.fill();hx.restore();
      }
    }
    // AWACS
    if(awacs.alive){s=scr(awacs.pos);var ad=awacs.pos.distanceTo(p.pos);
      if(onScreen(s)){hx.strokeStyle=B;hx.strokeRect(s.x-9,s.y-9,18,18);txt('AWACS '+(ad/1000).toFixed(1),s.x,s.y-13,Math.round(fs*0.78),B,'center');}
      if(ad<2500&&resCd<=0)txt('กำลังเติมอาวุธและซ่อม… '+Math.round(resT/5*100)+'%',W/2,H*(compact?0.62:0.8),Math.round(fs*1.05),B,'center');
      else if(ad<6000&&resCd<=0)txt('เข้าใกล้ AWACS ในระยะ 2.5 กม. เพื่อเติมอาวุธ',W/2,H*(compact?0.62:0.8),Math.round(fs*0.9),B,'center');}
    if(wings.length&&!isTouch)txt('Y เป้าฉัน · U เกาะหมู่ · I อิสระ · J คุ้มกัน AWACS · O รูปขบวน: '+FORMS[formI][0]+' · K ระยะ: '+(formSp===1?'ชิด':'ห่าง'),W/2,H-10,Math.round(fs*0.72),'rgba(120,220,255,.75)','center');
    // wingmen (datalink)
    for(i=0;i<wings.length;i++){var wg=wings[i];if(!wg.alive)continue;s=scr(wg.pos);
      if(onScreen(s)){hx.strokeStyle=B;hx.beginPath();hx.arc(s.x,s.y,8,0,7);hx.stroke();
        txt((wg.slot+2)+' '+(wg.pos.distanceTo(p.pos)/1000).toFixed(1),s.x,s.y+8+fs*0.8,Math.round(fs*0.75),B,'center');}}
    // ground targets
    var ngA=0;for(i=0;i<gnds.length;i++)if(gnds[i].alive)ngA++;
    if(ngA){s=scr(objPos);if(onScreen(s)){hx.strokeStyle='rgba(255,255,255,.75)';hx.strokeRect(s.x-5,s.y-5,10,10);txt('OBJ '+(objPos.distanceTo(p.pos)/1000).toFixed(0)+'km',s.x,s.y-10,Math.round(fs*0.78),'#fff','center');}}
    for(i=0;i<gnds.length;i++){var g=gnds[i];if(!g.alive||!(g.seen||g===sel))continue;d=g.pos.distanceTo(p.pos);
      s=scr(g.pos);var gs=g===sel,gl=gs&&locked;
      if(onScreen(s)){var b2=gs?12:6;hx.strokeStyle=gl?R:(gs?Y:O);
        hx.beginPath();hx.moveTo(s.x,s.y-b2);hx.lineTo(s.x+b2,s.y);hx.lineTo(s.x,s.y+b2);hx.lineTo(s.x-b2,s.y);hx.closePath();hx.stroke();
        if(gs&&cw&&cw.lock&&lockT>0&&!gl){hx.beginPath();hx.arc(s.x,s.y,b2+8,-Math.PI/2,-Math.PI/2+Math.PI*2*lockT/cw.lock);hx.stroke();}
        if(gs||d<5000)txt(g.T.code+(gs?' '+(d/1000).toFixed(1)+(gl?' LOCK':''):''),s.x,s.y-b2-5,Math.round(fs*0.78),gl?R:(gs?Y:O),'center');
      }else if(gs){
        hA.copy(g.pos).applyMatrix4(camera.matrixWorldInverse);var an2=Math.atan2(-hA.y,hA.x),r2=Math.min(W,H)*0.36;
        hx.save();hx.translate(W/2+Math.cos(an2)*r2,H/2+Math.sin(an2)*r2);hx.rotate(an2);hx.fillStyle=O;hx.beginPath();hx.moveTo(14,0);hx.lineTo(-8,-9);hx.lineTo(-8,9);hx.closePath();hx.fill();hx.restore();
      }
    }
    // incoming missiles in view
    for(i=0;i<missiles.length;i++){var m=missiles[i];if(m.side!=='e'||m.pos.distanceTo(p.pos)>6000)continue;
      s=scr(m.pos);if(onScreen(s)){hx.strokeStyle=R;hx.beginPath();hx.moveTo(s.x,s.y-7);hx.lineTo(s.x+7,s.y+6);hx.lineTo(s.x-7,s.y+6);hx.closePath();hx.stroke();}}
    var blink=Math.floor(perfNow*6)%2===0;
    if((rwrMax===2||mawT>0)&&blink)txt(compact?'⚠ MISSILE — กด CM แล้วเลี้ยวหลบ':'⚠ MISSILE — ปล่อยเป้าลวง (G) แล้วเลี้ยวหลบ',W/2,compact?H*0.5:H*0.26,Math.round(fs*1.3),R,'center');
    else if(rwrMax===1&&blink)txt('ถูกเรดาร์ล็อก',W/2,compact?H*0.5:H*0.26,Math.round(fs*1.05),Y,'center');
    // weapon cue
    if(sel&&sel.alive&&cw&&cw.lock){d=sel.pos.distanceTo(p.pos);
      var cue=locked?(id==='lgb'||id==='gps'?'IN RANGE':'SHOOT'):(id==='arm'&&!emits(sel)?'เป้านี้ไม่ได้เปิดเรดาร์':(id==='lgb'||id==='gps')&&sel.isGround?'นอกระยะร่อน '+(glideRange(cw,sel)/1000).toFixed(1)+' กม. (บินสูงขึ้นจะไปได้ไกลขึ้น)':cw.range&&d>cw.range?'นอกระยะ '+(cw.range/1000)+' กม.':(lockT>0?'กำลังล็อก…':(id==='fox2'?'หันหัวเครื่องเข้าหาเป้า':(id==='fox1'?'ต้องล็อกเรดาร์ STT (X)':(id==='fox3'?'ล็อกเรดาร์ (X) หรือใช้โหมด TWS (N)':(id==='tv'?'หันหัวเครื่องเข้าหาเป้าให้ซีกเกอร์ TV จับภาพ':'เป้าอยู่นอกกรวยล็อก'))))));
      txt(cue,W/2,H*(compact?0.57:0.74),Math.round(fs*1.05),locked?R:Y,'center');}
    // flight data
    var x0=18,y0=24+fs;
    txt('SPD '+Math.round(p.speed*3.6)+' km/h  M'+(p.speed/340).toFixed(2),x0,y0,fs);
    txt('ALT '+Math.round(p.pos.y)+' m',x0,y0+fs*1.5,fs,(p.pos.y-groundAt(p.pos.x,p.pos.z)<250)?R:G);
    txt('THR '+Math.min(100,Math.round(p.thr/0.95*100))+'%'+(p.thr>0.95?' WEP':'')+((keys.KeyH||touchIn.brk)?'  BRK':''),x0,y0+fs*3,fs,p.thr>0.95?Y:G);
    var hd=(Math.atan2(pf.x,-pf.z)*180/Math.PI+360)%360;txt('HDG '+('00'+Math.round(hd)%360).slice(-3),x0,y0+fs*4.5,fs);
    txt(p.st.n,x0,y0+fs*6,Math.round(fs*0.8),'rgba(125,255,176,.7)');
    for(i=0;i<wings.length;i++){var wl=wings[i],stx=!wl.alive?'ตก':(wl.order==='form'?'เกาะหมู่':(wl.tgt?(wl.tgt.isGround?'โจมตี '+wl.tgt.T.code:'โจมตี '+wl.tgt.P.code):(wl.order==='awacs'?'คุ้มกัน AWACS':wl.order==='mine'?'รอเป้า':'คุ้มกัน')));
      txt((wl.slot+2)+' '+(wl.alive?Math.round(wl.hp/1.3)+'% ':'')+stx,x0,y0+fs*(7.5+i*1.2),Math.round(fs*0.8),wl.alive?B:R);}
    // stores
    var n=p.load.length,wy=H-20-fs*1.35*(n+3);
    if(compact){var cs=p.load[p.cur];wy=y0+fs*(7.5+wings.length*1.2);n=-1;
      txt(cs?('▶ '+WPN[cs.id].n+' ×'+cs.n):'ไม่มีอาวุธ',x0,wy,fs,cs&&cs.n?'#fff':R);txt('GUN '+p.ammo+'  CM '+p.cm,x0,wy+fs*1.35,fs,(p.ammo&&p.cm)?G:Y);wy+=fs*1.35;}
    else txt('GUN '+p.ammo,x0,wy,fs,p.ammo?G:R);
    for(i=0;i<n;i++){var sl=p.load[i],on=i===p.cur;
      txt((on?'▶':' ')+(i+1)+' '+WPN[sl.id].n+' ×'+sl.n,x0,wy+fs*1.35*(i+1),fs,sl.n?(on?'#fff':G):R);}
    if(!compact)txt('CM '+p.cm,x0,wy+fs*1.35*(n+1),fs,p.cm?G:R);
    var hy=wy+fs*1.35*(n+2);
    txt('HP',x0,hy,fs,p.hp<35?R:G);hx.strokeStyle=G;hx.strokeRect(x0+fs*2,hy-fs*0.8,120*u,fs*0.85);
    hx.fillStyle=p.hp<p.maxHp*0.35?R:G;hx.fillRect(x0+fs*2+2,hy-fs*0.8+2,(120*u-4)*clamp(p.hp/p.maxHp,0,1),fs*0.85-4);
    if(p.speed<110)txt('STALL — เร่งเครื่อง',W/2,H*0.64,Math.round(fs*1.2),R,'center');
    var rad=Math.hypot(p.pos.x,p.pos.z);
    if(rad>52000)txt(rad>60000?'ออกนอกเขตรบ — เครื่องเสียหาย!':'กำลังออกนอกเขตรบ กรุณาเลี้ยวกลับ',W/2,H*0.7,Math.round(fs*1.1),rad>60000?R:Y,'center');
    // radar scope + RWR
    var sw=Math.round(150*u),mm=sw,mmx=W-mm-16,mmy=compact?26:40,rr3=Math.round(58*u),sx,sy,rx,ry,tx,ty;
    if(compact){sx=mmx-sw-8;sy=mmy;rx=sx-rr3-10;ry=mmy+rr3;tx=Math.round(W/2-sw/2);ty=H-sw-22;}
    else{sx=W-sw-16;sy=H-sw-22;rx=sx-rr3-16;ry=sy+sw-rr3-fs;tx=sx;ty=sy-sw-30;}
    drawMap(mmx,mmy,mm);
    drawScope(sx,sy,sw,sw,gndMode);
    drawRWR(rx,ry,rr3);
    tgpRect.on=false;
    if(gndMode&&sel&&sel.alive&&sel.isGround){
      hx.strokeStyle=G;hx.lineWidth=1.2;hx.strokeRect(tx,ty,sw,sw);
      d=sel.pos.distanceTo(p.pos);var fs2=Math.max(9,Math.round(sw/13));
      if(podSees(sel)&&d<20000){tgpRect.on=true;tgpRect.x=tx;tgpRect.y=ty;tgpRect.s=sw;
        hx.strokeStyle='rgba(255,255,255,.85)';hx.beginPath();hx.moveTo(tx+sw/2-22,ty+sw/2);hx.lineTo(tx+sw/2-6,ty+sw/2);hx.moveTo(tx+sw/2+6,ty+sw/2);hx.lineTo(tx+sw/2+22,ty+sw/2);
        hx.moveTo(tx+sw/2,ty+sw/2-22);hx.lineTo(tx+sw/2,ty+sw/2-6);hx.moveTo(tx+sw/2,ty+sw/2+6);hx.lineTo(tx+sw/2,ty+sw/2+22);hx.stroke();}
      else{hx.fillStyle='rgba(6,18,28,.75)';hx.fillRect(tx,ty,sw,sw);txt(d>=20000?'ไกลเกินกล้อง':'MASK — ลำตัว/ภูเขาบัง',tx+sw/2,ty+sw/2,fs2,Y,'center');}
      txt('TGP '+sel.T.code,tx+4,ty+fs2+2,fs2,G);txt((d/1000).toFixed(1)+'km',tx+sw-4,ty+fs2+2,fs2,G,'right');
      if(laserOn)txt(laserValid?'LSR ●':'LSR ✕',tx+4,ty+sw-5,fs2,laserValid?(blink?R:'#ff9a90'):Y);
      else if(id==='lgb')txt('L = เลเซอร์',tx+4,ty+sw-5,fs2,Y);
      if(sel.vel.lengthSq()>1)txt('MOVING',tx+sw-4,ty+sw-5,fs2,Y,'right');
    }
  }
  var na=0,ng=0;for(i=0;i<enemies.length;i++)if(enemies[i].alive)na++;for(i=0;i<gnds.length;i++)if(gnds[i].alive)ng++;
  if(isTouch||H<480)txt('S '+score+'  LVL '+wave+'  K '+kills+'/'+gkills+(cfg.mission==='custom'&&cfg.cm.goal?'  เป้า '+(kills+gkills)+'/'+cfg.cm.goal*5:''),W-16,18,Math.round(fs*0.9),G,'right');
  else txt('SCORE '+score+'   LVL '+wave+'   ยิงตก '+kills+'   ภาคพื้น '+gkills+'   ข้าศึก '+na+'/'+ng+(cfg.mission==='custom'&&cfg.cm.goal?'   เป้าหมาย '+(kills+gkills)+'/'+cfg.cm.goal*5:''),W/2,22+fs*0.4,fs,G,'center');
  if(msgT>0){if(isTouch||H<480)txt(msg,W/2,H*0.43,Math.round(fs*1.15),Y,'center');else txt(msg,W/2,H*0.18,Math.round(fs*1.35),Y,'center');}
}

/* ================= main loop ================= */
var thrFill=$('thrFill'),thrShown=-1;
var last=0,overlay=$('overlay'),camT=new Q(),tgpCam=new THREE.PerspectiveCamera(2,1,40,140000);
function showEnd(){
  var r=$('result');r.style.display='block';
  r.style.color=deadWhy==='ภารกิจสำเร็จ'?'#7dffb0':'#ffd27d';
  r.textContent=deadWhy+' — คะแนน '+score+' · ยิงตก '+kills+' ลำ · ทำลายภาคพื้น '+gkills+' เป้า · ถูกยิงตก '+deaths+' ครั้ง';
  $('startBtn').textContent='บินอีกครั้ง';zoomTog=false;var zb=document.querySelector('.tb[data-k=zoom]');if(zb)zb.classList.remove('lit');overlay.style.display='flex';$('touch').style.display='none';$('cmd').style.display='none';
}
function frame(t){
  requestAnimationFrame(frame);
  var dt=Math.min(0.05,(t-last)/1000||0.016),i;last=t;perfNow=t/1000;
  if(state==='paused'){drawHUD();return;}
  if(msgT>0)msgT-=dt;if(hitFlash>0)hitFlash-=dt;
  if(state==='menu'){updateAwacs(dt);updatePlayer(dt,false);for(i=0;i<wings.length;i++)if(wings[i].alive)updateFighter(wings[i],dt);if(Math.hypot(player.pos.x,player.pos.z)>30000)player.pos.set(0,3200,0);}
  else if(state==='play'){
    gT+=dt;updatePlayer(dt,true);updateRadar(dt);updateDL(dt);awacsCall(dt);updateAwacs(dt);
    blue.length=0;if(player.alive)blue.push(player);for(i=0;i<wings.length;i++)if(wings[i].alive)blue.push(wings[i]);if(awacs.alive)blue.push(awacs);
    var alive=0;
    for(i=0;i<enemies.length;i++)if(enemies[i].alive){alive++;updateFighter(enemies[i],dt);}
    for(i=0;i<wings.length;i++)if(wings[i].alive)updateFighter(wings[i],dt);
    for(i=0;i<gnds.length;i++){if(gnds[i].alive)alive++;updateGround(gnds[i],dt);}
    if(state==='play')director(dt);
    updateRWR(dt);
  }else if(state==='dead'){
    blue.length=0;for(i=0;i<wings.length;i++)if(wings[i].alive)blue.push(wings[i]);if(awacs.alive)blue.push(awacs);updateAwacs(dt);
    for(i=0;i<enemies.length;i++)if(enemies[i].alive)updateFighter(enemies[i],dt);
    for(i=0;i<wings.length;i++)if(wings[i].alive)updateFighter(wings[i],dt);
    for(i=0;i<gnds.length;i++)updateGround(gnds[i],dt);
    deadT-=dt;if(deadT<=0){if(ending){if(overlay.style.display==='none')showEnd();}else respawnPlayer();}
  }
  updateBullets(dt);updateMissiles(dt);updateOrds(dt);updateFlares(dt);updateParts(dt);
  // camera
  var dist=player.st.len*1.75+6;
  if(!lookActive()){var kk=Math.exp(-9*dt);lookYaw*=kk;lookPitch*=kk;}
  if(state==='play'&&mouseMode()){
    var cy2=aimYaw+lookYaw,cp2=clamp(aimPitch+lookPitch,-1.5,1.5),cc=Math.cos(cp2);camDir.set(Math.sin(cy2)*cc,Math.sin(cp2),-Math.cos(cy2)*cc);
    tm.lookAt(ZERO,camDir,UP);camT.setFromRotationMatrix(tm);camQ.slerp(camT,1-Math.exp(-16*dt));
    ta.set(0,5.5,dist).applyQuaternion(camQ);
  }else{camT.copy(player.q);rotLocal(camT,AY,-lookYaw);rotLocal(camT,AX,lookPitch);
    camQ.slerp(camT,1-Math.exp(-(lookActive()?14:5.5)*dt));ta.set(0,6.5,dist).applyQuaternion(camQ);}
  camera.position.copy(player.pos).add(ta);camera.quaternion.copy(camQ);
  var gy=groundAt(camera.position.x,camera.position.z)+3;if(camera.position.y<gy)camera.position.y=gy;
  var fovT=(state==='play'&&(mouseIn.zoom||zoomTog))?26:62+clamp((player.speed-200)/300,0,1)*14;
  var fov=camera.fov+(fovT-camera.fov)*(1-Math.exp(-12*dt));if(Math.abs(camera.fov-fov)>0.05){camera.fov=fov;camera.updateProjectionMatrix();}
  camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  skyDome.position.copy(camera.position);
  if(engGain&&actx){var on=(state==='play'&&player.alive);
    engGain.gain.value=on?0.05+player.thr*0.09:0;engFilt.frequency.value=250+player.thr*900+(player.thr>0.95?700:0);}
  if(isTouch&&thrFill){var tp=Math.round(player.thr*100);if(tp!==thrShown){thrShown=tp;thrFill.style.height=tp+'%';thrFill.style.background=player.thr>0.95?'rgba(255,210,125,.8)':'rgba(125,255,176,.55)';}}
  renderer.render(scene,camera);
  drawHUD();
  if(tgpRect.on&&state==='play'&&sel&&sel.isGround){
    var td=sel.pos.distanceTo(player.pos);
    tgpCam.position.copy(player.pos);tgpCam.position.y-=2;tgpCam.lookAt(sel.pos);
    tgpCam.fov=clamp(2*Math.atan(55/td)*57.3,0.35,9);tgpCam.updateProjectionMatrix();
    renderer.setScissorTest(true);renderer.setScissor(tgpRect.x+1,H-tgpRect.y-tgpRect.s+1,tgpRect.s-2,tgpRect.s-2);
    renderer.setViewport(tgpRect.x+1,H-tgpRect.y-tgpRect.s+1,tgpRect.s-2,tgpRect.s-2);
    renderer.render(scene,tgpCam);
    renderer.setScissorTest(false);renderer.setViewport(0,0,W,H);
  }
}

/* ================= menu ================= */
(function(){
  var pl=$('planes');
  PKEYS.forEach(function(k){var P=PLANES[k],b=document.createElement('button');b.className='opt';b.setAttribute('data-v',k);
    b.innerHTML=P.n+'<small>แรงขับ '+Math.round(P.thr*100)+' · เลี้ยว '+Math.round(P.turn*100)+' · ทนทาน '+P.hp+'</small>';pl.appendChild(b);});
  function group(id,key,onChange){
    var box=$(id),btns=box.querySelectorAll('.opt');
    function paint(){Array.prototype.forEach.call(btns,function(b){b.classList.toggle('sel',b.getAttribute('data-v')===cfg[key]);});}
    Array.prototype.forEach.call(btns,function(b){b.addEventListener('click',function(){cfg[key]=b.getAttribute('data-v');paint();saveCfg();if(onChange)onChange();});});
    paint();
  }
  group('planes','plane',function(){if(state==='menu'||state==='dead'){setPlane(cfg.plane);player.grp.visible=true;}paintLoad();});
  var ldBox=$('loadout');
  function paintLoad(){
    normPyl();ldBox.innerHTML='';
    ORDER.forEach(function(id){
      var row=document.createElement('div');row.className='ld';
      var nm=document.createElement('span');nm.className='ldn';nm.innerHTML=WPN[id].n+'<small>'+WDESC[id]+'</small>';
      var mn=document.createElement('button');mn.className='opt';mn.textContent='−';
      var ct=document.createElement('span');ct.className='ldc';ct.textContent=(cfg.pyl[id]*(PER[id]||1));
      var pl=document.createElement('button');pl.className='opt';pl.textContent='+';
      mn.addEventListener('click',function(){if(cfg.pyl[id]>0){cfg.pyl[id]--;saveCfg();paintLoad();}});
      pl.addEventListener('click',function(){if(pylUsed()<PYL[cfg.plane]){cfg.pyl[id]++;saveCfg();paintLoad();}});
      row.appendChild(nm);row.appendChild(mn);row.appendChild(ct);row.appendChild(pl);ldBox.appendChild(row);
    });
    $('pylInfo').textContent='— ใช้จุดติดอาวุธ '+pylUsed()+' / '+PYL[cfg.plane];
  }
  var cmBox=$('customBox');
  function paintCM(){
    cmBox.style.display=cfg.mission==='custom'?'block':'none';cmBox.innerHTML='';
    CMDEF.forEach(function(d){
      var k=d[0],row=document.createElement('div');row.className='ld';
      var nm=document.createElement('span');nm.className='ldn';nm.textContent=d[1];
      var mn=document.createElement('button');mn.className='opt';mn.textContent='−';
      var ct=document.createElement('span');ct.className='ldc';var v=cfg.cm[k];
      ct.textContent=k==='et'?(v===0?'สุ่ม':PLANES[PKEYS[v-1]].code):(k==='dist'?['ใกล้','กลาง','ไกล'][v]:(k==='goal'?(v?v*5:'∞'):v));
      var pl=document.createElement('button');pl.className='opt';pl.textContent='+';
      mn.addEventListener('click',function(){if(cfg.cm[k]>d[2]){cfg.cm[k]--;saveCfg();paintCM();}});
      pl.addEventListener('click',function(){if(cfg.cm[k]<d[3]){cfg.cm[k]++;saveCfg();paintCM();}});
      row.appendChild(nm);row.appendChild(mn);row.appendChild(ct);row.appendChild(pl);cmBox.appendChild(row);
    });
  }
  group('missions','mission',function(){cfg.pyl=presetPyl(cfg.mission,PYL[cfg.plane]);saveCfg();paintLoad();paintCM();});
  group('wings','wing');paintCM();
  group('diffs','diff');group('modes','mode');
  $('presetBtn').addEventListener('click',function(){cfg.pyl=presetPyl(cfg.mission,PYL[cfg.plane]);saveCfg();paintLoad();});
  paintLoad();
  function slider(id,out,key,dec){var s=$(id),o=$(out);s.value=cfg[key];o.textContent=Number(cfg[key]).toFixed(dec);
    s.addEventListener('input',function(){cfg[key]=parseFloat(s.value)||1;o.textContent=cfg[key].toFixed(dec);saveCfg();});}
  slider('sMouse','oMouse','ms',1);slider('sCtrl','oCtrl','cs',2);
  if(isTouch){$('touchNote').style.display='block';
    var mb=$('modes').querySelectorAll('.opt');if(mb.length>1){mb[0].innerHTML='ลากนิ้วเล็ง<small>แบบ War Thunder</small>';mb[1].innerHTML='จอยสติ๊ก<small>บังคับตรง</small>';}
    $('lblMouse').textContent='ความไวการลากนิ้ว';}
  $('startBtn').addEventListener('click',function(){
    initAudio();resetGame();state='play';overlay.style.display='none';
    if(isTouch){$('touch').style.display='block';
      try{var de=document.documentElement,fp=de.requestFullscreen&&de.requestFullscreen();if(fp&&fp.catch)fp.catch(function(){});}catch(e){}
      try{var op=screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape');if(op&&op.catch)op.catch(function(){});}catch(e){}}
    else if(cfg.mode==='mouse')requestLock();
    try{window.focus();}catch(e){}
  });
})();
setPlane(cfg.plane);resetGame();state='menu';
window.__vsky={touchIn:touchIn,lookState:function(){return {lookYaw:+lookYaw.toFixed(2),lookPitch:+lookPitch.toFixed(2),touchLook:touchLook,zoom:zoomTog,fov:Number(camera.fov)};},wings:wings,wingOrder:wingOrder,toggleLaser:function(){laserOn=!laserOn;},radar:radar,lockKey:lockKey,player:player,enemies:enemies,gnds:gnds,missiles:missiles,ords:ords,cfg:cfg,keys:keys,mouseIn:mouseIn,
  get:function(){return {state:state,wave:wave,score:score,sel:sel,locked:locked,kills:kills,gkills:gkills};},
  selectWeapon:selectWeapon,awacs:awacs,respawn:respawnPlayer,get2:function(){return {deaths:deaths,form:FORMS[formI][0],resT:resT};},damageEnemy:damageEnemy,damageGround:damageGround,setAim:function(y,p){aimYaw=y;aimPitch=p;}};
requestAnimationFrame(frame);
})();
