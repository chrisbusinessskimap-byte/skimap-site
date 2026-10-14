var L10N = window.SKIMAP_T || {};

/* ============ mappa viva 3D: anteprima dimostrativa sul gruppo del Sella (rilievo DEM, piste e impianti OSM) ============ */
(function(){
  var cv = document.getElementById('net'); if (!cv) return;
  var G = window.SKIMAP_GRAPH; if (!G) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGL = false;
  try { var tcv=document.createElement('canvas'); hasGL = !!(window.THREE && (tcv.getContext('webgl') || tcv.getContext('experimental-webgl'))); } catch(err){ hasGL=false; }

  /* ---------- dati: grafo ---------- */
  var V_SKI = 250, V_LIFT = 200, V_WALK = 80, WAIT = { g:3, c:5, p:2, '':4 };
  var nodes = [], edges = [], out = [], you = G.start;
  for (var i=0;i<G.n.length;i++){ nodes.push({ lat:G.n[i][0], lon:G.n[i][1], name:G.n[i][2], station: !!G.n[i][2] || i===G.start }); out.push([]); }
  for (var j=0;j<G.e.length;j++){ var r=G.e[j]; var e={ a:r[0], b:r[1], kind:r[2]==='p'?'piste':(r[2]==='l'?'lift':'transfer'), diff:r[3], name:r[4], len:r[5], lt:r[6], coords:r[7] }; if (e.coords.length<2) e.coords=[[nodes[e.a].lat,nodes[e.a].lon],[nodes[e.b].lat,nodes[e.b].lon]]; edges.push(e); out[e.a].push(e); }
  var HUBS = {"Arabba":"Arabba","Le Pale":"Arabba · Le Pale","Burz":"Arabba · Burz","Dantercepies":"Passo Gardena · Dantercepies","Piz la Ila":"Piz la Ila","Pralongià":"Pralongià","Ciampinoi":"Selva · Ciampinoi","Sass Pordoi":"Sass Pordoi","Pecol":"Canazei · Pecol","Col Pradat":"Colfosco · Col Pradat","Fodom":"Passo Pordoi · Fodom","Piz Seteur":"Piz Seteur","Vallon":"Vallon","Cherz II":"Cherz","Belvedere":"Belvedere","Col Rodella":"Col Rodella","Col Alto":"Col Alto","La Fraina":"San Cassiano · La Fraina","Gardenaccia":"La Villa · Gardenaccia","Campolongo":"Passo Campolongo","Colfosco":"Colfosco","Costoratta":"Costoratta","Sochers":"Sochers","Cir":"Cir","Val Setus":"Val Setus","Plans":"Plans"};
  var LABELS = ['Arabba','Dantercepies','Piz la Ila','Pralongià','Ciampinoi','Sass Pordoi','Pecol','Col Pradat','Fodom','Piz Seteur','Vallon','Col Rodella','Gardenaccia','Campolongo'];
  var PEAKS = [ [46.5092,11.8247,'Piz Boè',3152], [46.4986,11.8181,'Sass Pordoi',2950], [46.5142,11.7453,'Sassolungo',3181], [46.5157,11.7997,'Piz Ciavazes',2831] ];
  function pretty(i){ var n=nodes[i].name; return HUBS[n] || n; }
  function fmtKm(v){ return v.toFixed(1).replace('.', L10N.decimal) + ' km'; }
  function fmtN(v){ return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, L10N.thousands); }

  /* ---------- dati: DEM INGV Tinitaly (celle quadrate in metri) ---------- */
  var DEM = null;
  if (G.dem){ var bin=atob(G.dem.b64), u16=new Uint16Array(bin.length/2); for (var bi=0;bi<u16.length;bi++) u16[bi] = bin.charCodeAt(2*bi) | (bin.charCodeAt(2*bi+1)<<8);
    DEM={cols:G.dem.cols, rows:G.dem.rows, lon0:G.dem.lon0, lat0:G.dem.lat0, cell:G.dem.cell, z:u16}; DEM.cellLat = DEM.cell*Math.cos((DEM.lat0+.07)*Math.PI/180); DEM.lat1 = DEM.lat0 + DEM.rows*DEM.cellLat; DEM.lon1 = DEM.lon0 + DEM.cols*DEM.cell; }
  function ele(lat,lon){
    if (!DEM) return 1500;
    var fc=(lon-DEM.lon0)/DEM.cell-.5, fr=DEM.rows-(lat-DEM.lat0)/DEM.cellLat-.5;
    if (fc<0) fc=0; if (fr<0) fr=0; if (fc>DEM.cols-1.001) fc=DEM.cols-1.001; if (fr>DEM.rows-1.001) fr=DEM.rows-1.001;
    var c0=Math.floor(fc), r0=Math.floor(fr), tx=fc-c0, ty=fr-r0, Cn=DEM.cols, z=DEM.z;
    var a=z[r0*Cn+c0], b=z[r0*Cn+c0+1], d=z[(r0+1)*Cn+c0], e=z[(r0+1)*Cn+c0+1];
    return (a*(1-tx)+b*tx)*(1-ty) + (d*(1-tx)+e*tx)*ty;
  }

  /* ---------- routing orientato (modello tempi dell'app) ---------- */
  function weight(e){ if (e.kind==='lift') return e.len/V_LIFT + (WAIT[e.lt]!=null ? WAIT[e.lt] : 4); if (e.kind==='transfer') return e.len/V_WALK; return e.len/V_SKI; }
  function dijkstra(src, allow){
    var n=nodes.length, d=new Float64Array(n), prev=new Array(n), done=new Uint8Array(n), i;
    for (i=0;i<n;i++){ d[i]=Infinity; prev[i]=null; }
    d[src]=0;
    for (var it=0; it<n; it++){
      var u=-1, best=Infinity;
      for (var jj=0;jj<n;jj++) if(!done[jj] && d[jj]<best){best=d[jj]; u=jj;}
      if (u<0) break; done[u]=1;
      var es=out[u];
      for (var k=0;k<es.length;k++){ var e=es[k]; if (!allow(e)) continue; var w=d[u]+weight(e); if (w<d[e.b]){ d[e.b]=w; prev[e.b]=e; } }
    }
    return { d:d, prev:prev };
  }
  var ALLOW = {
    beg: function(e){ return e.kind!=='piste' || e.diff==='e'; },
    int: function(e){ return e.kind!=='piste' || e.diff==='e' || e.diff==='i' || e.diff===''; },
    adv: function(e){ return e.kind!=='piste' || e.diff!=='f'; }
  };
  function pathTo(res, t){ var o=[], cur=t; while (cur!==you){ var e=res.prev[cur]; if(!e) return null; o.unshift(e); cur=e.a; } return o; }
  function cost(path){ var m=0, min=0, lifts=0; for (var i=0;i<path.length;i++){ var e=path[i]; m+=e.len; min+=weight(e); if (e.kind==='lift') lifts++; } return { km:m/1000, min:Math.round(min), lifts:lifts, legs:path.length }; }
  function legNames(path){ var o=[], seen={}; for (var i=0;i<path.length;i++){ var e=path[i]; if (e.kind==='transfer' || !e.name || seen[e.name]) continue; seen[e.name]=1; o.push({ name:e.name, kind:e.kind, diff:e.diff }); } return o; }
  function setLevel(id, path, label, adv){
    var el=document.getElementById(id), s=document.getElementById(id+'-s'), n=document.getElementById(id+'-n');
    if (!path){ el.classList.add('off'); s.textContent=L10N.routeUnavailable; n.innerHTML='—'; return; }
    var c=cost(path); el.classList.remove('off');
    s.textContent = (c.km > adv.km*1.8) ? label+L10N.indirect : label;
    n.innerHTML = '<b>~'+c.min+' min</b>'+fmtKm(c.km);
  }
  function fillCard(t, p){
    var adv=cost(p);
    document.getElementById('rc-name').textContent = pretty(t);
    document.getElementById('rc-from').textContent = L10N.fromLabel(adv.legs, adv.lifts);
    setLevel('rc-beg', pathTo(dijkstra(you, ALLOW.beg), t), L10N.easyOnly, adv);
    setLevel('rc-int', pathTo(dijkstra(you, ALLOW.int), t), L10N.easyMedium, adv);
    document.getElementById('rc-adv-n').innerHTML = '<b>~'+adv.min+' min</b>'+fmtKm(adv.km);
    var legs=legNames(p), html='';
    for (var i=0;i<Math.min(4,legs.length);i++){ var L=legs[i]; html += '<span class="leg '+(L.kind==='lift'?'lift':(L.diff||'x'))+'"><i></i>'+L.name+'</span>'; }
    if (legs.length>4) html += '<span class="leg more">+'+(legs.length-4)+'</span>';
    document.getElementById('rc-legs').innerHTML = html;
  }
  var nP=0,nL=0; for (var z=0;z<edges.length;z++){ if (edges[z].kind==='piste') nP++; else if (edges[z].kind==='lift') nL++; }
  var badge=document.getElementById('databadge'); if (badge) badge.innerHTML = L10N.badge(fmtN(nP), nL);

  /* ---------- scena 3D ---------- */
  var T = window.THREE, renderer, scene, camera, terrain, routeMesh=null, routeTotal=0, routeShown=0;
  var youMesh, targetMesh=null, targetRing=null, hoverSprite=null, labelSprites=[];
  var target=-1, routeEdges=[], idle=null, raf=null, onScreen=true, lastT=0, clock=0, az=0.9, autoRot=true, rotResume=0;
  var W, H, DPR, latC, lonC, kmX, kmY, EXAG = 1.35;
  var texSize = 2048;

  function toKm(lat,lon){ return { x:(lon-lonC)*kmX, z:-(lat-latC)*kmY }; }
  function toWorld(lat,lon,up){ var p=toKm(lat,lon); return new T.Vector3(p.x, (ele(lat,lon)+(up||0))/1000*EXAG, p.z); }
  function fromWorld(v){ return { lat: latC - v.z/kmY, lon: lonC + v.x/kmX }; }

  function buildTerrain(){
    var cols=DEM.cols, rows=DEM.rows, pos=new Float32Array(cols*rows*3), uv=new Float32Array(cols*rows*2), r, c, k=0, u=0;
    for (r=0;r<rows;r++) for (c=0;c<cols;c++){
      var lon = DEM.lon0 + (c+.5)*DEM.cell, lat = DEM.lat0 + (rows-r-.5)*DEM.cellLat, p=toKm(lat,lon);
      pos[k++]=p.x; pos[k++]=DEM.z[r*cols+c]/1000*EXAG; pos[k++]=p.z;
      uv[u++]=c/(cols-1); uv[u++]=1-r/(rows-1);
    }
    var idx=[]; for (r=0;r<rows-1;r++) for (c=0;c<cols-1;c++){ var a=r*cols+c, b=a+1, d=a+cols, e2=d+1; idx.push(a,d,b, b,d,e2); }
    var geo=new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos,3)); geo.setAttribute('uv', new T.BufferAttribute(uv,2)); geo.setIndex(idx); geo.computeVertexNormals();
    var tex=new T.CanvasTexture(paintTexture()); tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    var mat=new T.MeshLambertMaterial({ map:tex, transparent:true, opacity:.94, alphaTest:.02, side:T.FrontSide });
    terrain=new T.Mesh(geo, mat); scene.add(terrain);
  }

  /* texture: neve con tinta di quota, isoipse marcate (marching squares), piste, impianti, stazioni; bordi sfumati */
  function paintTexture(){
    var S = texSize, cvs=document.createElement('canvas'); cvs.width=S; cvs.height=Math.round(S*(DEM.lat1-DEM.lat0)*kmY/((DEM.lon1-DEM.lon0)*kmX)); var Hs=cvs.height;
    var g=cvs.getContext('2d');
    function tx(lat,lon){ return { x:(lon-DEM.lon0)/(DEM.lon1-DEM.lon0)*S, y:(DEM.lat1-lat)/(DEM.lat1-DEM.lat0)*Hs }; }
    /* neve: più bianca in quota, un filo grigio-azzurra a valle */
    var img=g.createImageData(S,Hs), d=img.data, cols=DEM.cols, rows=DEM.rows;
    /* ombreggiatura per cella (luce da nord-ovest) */
    var shade=new Float32Array(cols*rows), steep=new Float32Array(cols*rows), mx=DEM.cell*111320*Math.cos(latC*Math.PI/180), my=DEM.cellLat*111320;
    for (var r0=0;r0<rows;r0++) for (var c0=0;c0<cols;c0++){
      var zl=DEM.z[r0*cols+Math.max(0,c0-1)], zr=DEM.z[r0*cols+Math.min(cols-1,c0+1)], zu=DEM.z[Math.max(0,r0-1)*cols+c0], zd=DEM.z[Math.min(rows-1,r0+1)*cols+c0];
      var nx=-(zr-zl)/(2*mx), ny=-(zd-zu)/(2*my), nl=Math.sqrt(nx*nx+ny*ny+1);
      shade[r0*cols+c0] = Math.max(0, Math.min(1, .5 + ((nx*-.6 + ny*-.6 + .53)/nl)*.9));
      steep[r0*cols+c0] = 1 - 1/nl;   /* 1 - cos(pendenza) */
    }
    for (var yy=0;yy<Hs;yy++){ var rr=Math.min(rows-1.001, yy/Hs*rows); for (var xx=0;xx<S;xx++){ var cc=Math.min(cols-1.001, xx/S*cols);
      var ri=Math.floor(rr), ci=Math.floor(cc), fx=cc-ci, fy=rr-ri, i00=ri*cols+ci, i10=i00+(ci<cols-1?1:0), i01=i00+(ri<rows-1?cols:0), i11=i01+(ci<cols-1?1:0);
      var zv=(DEM.z[i00]*(1-fx)+DEM.z[i10]*fx)*(1-fy)+(DEM.z[i01]*(1-fx)+DEM.z[i11]*fx)*fy, t=Math.max(0,Math.min(1,(zv-1300)/1800));
      var sh=(shade[i00]*(1-fx)+shade[i10]*fx)*(1-fy)+(shade[i01]*(1-fx)+shade[i11]*fx)*fy, k=.62+sh*.48;
      var st=(steep[i00]*(1-fx)+steep[i10]*fx)*(1-fy)+(steep[i01]*(1-fx)+steep[i11]*fx)*fy;  /* 0 = piano, 1 = parete */
      var rock=Math.max(0, Math.min(1, (st-.45)/.3)) * (zv>2000 ? 1 : Math.max(0,(zv-1700)/300));
      var sr=212+t*43, sg=220+t*35, sb=230+t*25, rr2=168, rg=160, rb=150;
      var o=(yy*S+xx)*4; d[o]=(sr*(1-rock)+rr2*rock)*k; d[o+1]=(sg*(1-rock)+rg*rock)*k; d[o+2]=(sb*(1-rock)+rb*rock)*Math.min(1,k+.06*(1-rock)); d[o+3]=255; } }
    g.putImageData(img,0,0);
    /* isoipse ogni 100 m, ogni 500 più scure (marching squares sul DEM) */
    g.lineCap='round'; g.lineJoin='round';
    for (var lvl=1300; lvl<=3200; lvl+=100){
      g.beginPath();
      for (var r=0;r<rows-1;r++) for (var c=0;c<cols-1;c++){
        var z00=DEM.z[r*cols+c], z10=DEM.z[r*cols+c+1], z01=DEM.z[(r+1)*cols+c], z11=DEM.z[(r+1)*cols+c+1];
        var m=(z00>=lvl?8:0)|(z10>=lvl?4:0)|(z11>=lvl?2:0)|(z01>=lvl?1:0); if (m===0||m===15) continue;
        var x0=(c+.5)/cols*S, x1=(c+1.5)/cols*S, y0=(r+.5)/rows*Hs, y1=(r+1.5)/rows*Hs, pts=[];
        function ip(za,zb,xa,ya,xb,yb){ var f=(lvl-za)/(zb-za||1); pts.push([xa+(xb-xa)*f, ya+(yb-ya)*f]); }
        if ((z00>=lvl)!==(z10>=lvl)) ip(z00,z10,x0,y0,x1,y0);
        if ((z10>=lvl)!==(z11>=lvl)) ip(z10,z11,x1,y0,x1,y1);
        if ((z11>=lvl)!==(z01>=lvl)) ip(z11,z01,x1,y1,x0,y1);
        if ((z01>=lvl)!==(z00>=lvl)) ip(z01,z00,x0,y1,x0,y0);
        if (pts.length>=2){ g.moveTo(pts[0][0],pts[0][1]); g.lineTo(pts[1][0],pts[1][1]); if (pts.length===4){ g.moveTo(pts[2][0],pts[2][1]); g.lineTo(pts[3][0],pts[3][1]); } }
      }
      g.lineWidth = lvl%500===0 ? 3 : 1.6; g.strokeStyle = lvl%500===0 ? 'rgba(16,20,24,.5)' : 'rgba(16,20,24,.26)'; g.stroke();
    }
    /* grafo drappeggiato: collegamenti, piste con battuta, impianti, stazioni */
    var i, e, q, p;
    function poly(pts){ g.beginPath(); for (q=0;q<pts.length;q++){ p=tx(pts[q][0],pts[q][1]); if (q===0) g.moveTo(p.x,p.y); else g.lineTo(p.x,p.y); } }
    for (i=0;i<edges.length;i++){ e=edges[i]; if (e.kind!=='transfer') continue; poly(e.coords); g.setLineDash([4,7]); g.lineWidth=2.4; g.strokeStyle='rgba(16,20,24,.45)'; g.stroke(); }
    g.setLineDash([]);
    for (i=0;i<edges.length;i++){ e=edges[i]; if (e.kind!=='piste') continue; poly(e.coords); g.lineWidth=9; g.strokeStyle='rgba(255,255,255,.95)'; g.stroke(); }
    for (i=0;i<edges.length;i++){ e=edges[i]; if (e.kind!=='piste') continue; poly(e.coords);
      if (e.diff==='f'){ g.setLineDash([4,7]); g.lineWidth=2.4; g.strokeStyle='rgba(16,20,24,.5)'; g.stroke(); g.setLineDash([]); continue; }
      g.lineWidth=4.6; g.strokeStyle = e.diff==='e' ? '#2f7de1' : e.diff==='a' ? '#101418' : e.diff==='i' ? '#e5484d' : '#9aa6b2'; g.stroke(); }
    for (i=0;i<edges.length;i++){ e=edges[i]; if (e.kind!=='lift') continue; poly(e.coords); g.setLineDash([9,8]); g.lineWidth = e.lt==='g' ? 3.6 : 2.6; g.strokeStyle='rgba(16,20,24,.75)'; g.stroke(); g.setLineDash([]); }
    for (i=0;i<nodes.length;i++){ if (!nodes[i].station) continue; p=tx(nodes[i].lat,nodes[i].lon); g.beginPath(); g.arc(p.x,p.y,6,0,Math.PI*2); g.fillStyle='#ff8a3d'; g.fill(); g.lineWidth=3; g.strokeStyle='#fff'; g.stroke(); }
    /* bordi sfumati */
    var fade=Math.round(S*.11), gr;
    gr=g.createLinearGradient(0,0,fade,0); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.globalCompositeOperation='destination-out'; g.fillStyle=gr; g.fillRect(0,0,fade,Hs);
    gr=g.createLinearGradient(S,0,S-fade,0); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(S-fade,0,fade,Hs);
    gr=g.createLinearGradient(0,0,0,fade); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,S,fade);
    gr=g.createLinearGradient(0,Hs,0,Hs-fade); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,Hs-fade,S,fade);
    g.globalCompositeOperation='source-over';
    return cvs;
  }

  /* conifere: coni con la punta innevata (colore per vertice), solo sotto il limite del bosco e lontano dalle piste */
  var forest=null, snowPts=null, snowVel=null;
  function buildForest(){
    var cellDeg=.0011, occ={};
    function key(lat,lon){ return Math.floor(lat/cellDeg)+'_'+Math.floor(lon/cellDeg); }
    for (var i=0;i<edges.length;i++){ var cs=edges[i].coords; for (var q=0;q<cs.length;q++){ occ[key(cs[q][0],cs[q][1])]=1; if (q>0){ var n=Math.ceil(Math.hypot((cs[q][0]-cs[q-1][0])*111320,(cs[q][1]-cs[q-1][1])*76500)/70); for (var k=1;k<n;k++){ var f=k/n; occ[key(cs[q-1][0]+(cs[q][0]-cs[q-1][0])*f, cs[q-1][1]+(cs[q][1]-cs[q-1][1])*f)]=1; } } } }
    var geo=new T.ConeGeometry(.04, .105, 6, 1); geo.translate(0,.052,0);
    var pos=geo.attributes.position, col=new Float32Array(pos.count*3);
    for (var v=0;v<pos.count;v++){ var y=pos.getY(v)/.105, w=Math.max(0,Math.min(1,(y-.35)/.5)); col[v*3]=.18+(1-.18)*w; col[v*3+1]=.32+(1-.32)*w; col[v*3+2]=.24+(1-.24)*w; }
    geo.setAttribute('color', new T.BufferAttribute(col,3));
    var mat=new T.MeshLambertMaterial({ vertexColors:true });
    var N = W>=900 ? 5200 : 2600, m=new T.Matrix4(), placed=0, tries=0;
    forest=new T.InstancedMesh(geo, mat, N);
    var latA=DEM.lat0+(DEM.lat1-DEM.lat0)*.1, latB=DEM.lat1-(DEM.lat1-DEM.lat0)*.1, lonA=DEM.lon0+(DEM.lon1-DEM.lon0)*.1, lonB=DEM.lon1-(DEM.lon1-DEM.lon0)*.1;
    while (placed<N && tries<N*8){ tries++;
      var lat=latA+Math.random()*(latB-latA), lon=lonA+Math.random()*(lonB-lonA), z=ele(lat,lon);
      if (z<1250 || z>2150) continue;
      if (Math.random() > Math.min(1,(2150-z)/650)) continue;      /* più fitto in basso, rado al limite del bosco */
      if (occ[key(lat,lon)]) continue;
      var p=toKm(lat,lon), sc=.75+Math.random()*.7;
      m.makeRotationY(Math.random()*6.28); m.scale(new T.Vector3(sc,sc*(.9+Math.random()*.4),sc)); m.setPosition(p.x, z/1000*EXAG, p.z);
      forest.setMatrixAt(placed++, m);
    }
    forest.count=placed; forest.instanceMatrix.needsUpdate=true; scene.add(forest);
  }
  /* neve: punti bianchi che scendono sopra il massiccio */
  function buildSnow(){
    var N = reduce ? 0 : (W>=900 ? 1300 : 500); if (!N) return;
    var arr=new Float32Array(N*3); snowVel=new Float32Array(N);
    for (var i=0;i<N;i++){ arr[i*3]=(Math.random()-.5)*22; arr[i*3+1]=1.2+Math.random()*4.5; arr[i*3+2]=(Math.random()-.5)*18; snowVel[i]=.35+Math.random()*.35; }
    var g=new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(arr,3));
    snowPts=new T.Points(g, new T.PointsMaterial({ color:0xffffff, size:.085, transparent:true, opacity:.9, depthWrite:false }));
    scene.add(snowPts);
  }
  function makeLabel(text, strong, small){
    var c=document.createElement('canvas'), g=c.getContext('2d'), fs = small ? 26 : 30;
    g.font=(strong?'700 ':'600 ')+fs+'px Barlow, sans-serif';
    var w=Math.ceil(g.measureText(text).width)+34, h=fs+22; c.width=w*2; c.height=h*2; g.scale(2,2);
    g.font=(strong?'700 ':'600 ')+fs+'px Barlow, sans-serif';
    g.shadowColor='rgba(16,20,24,.3)'; g.shadowBlur=10; g.shadowOffsetY=3;
    g.fillStyle = strong ? '#101418' : 'rgba(255,255,255,.97)'; g.beginPath(); if (g.roundRect) g.roundRect(4,4,w-8,h-8,10); else g.rect(4,4,w-8,h-8); g.fill();
    g.shadowColor='transparent'; g.fillStyle = strong ? '#ffb300' : '#101418'; g.textBaseline='middle'; g.fillText(text, 17, h/2+1);
    var tex=new T.CanvasTexture(c); tex.minFilter=T.LinearFilter;
    var sp=new T.Sprite(new T.SpriteMaterial({ map:tex, transparent:true, depthTest:false }));
    var kmH = small ? .3 : .36; sp.scale.set(kmH*w/h, kmH, 1); sp.center.set(0, .5); sp.renderOrder=10;
    return sp;
  }

  function init3D(){
    var host=cv.parentNode.getBoundingClientRect(); W=Math.max(320,host.width); H=Math.max(420,host.height); DPR=Math.min(2, window.devicePixelRatio||1);
    if (W<900) texSize=1024;
    latC=(DEM.lat0+DEM.lat1)/2; lonC=(DEM.lon0+DEM.lon1)/2; kmY=111.32; kmX=111.32*Math.cos(latC*Math.PI/180);
    renderer=new T.WebGLRenderer({ canvas:cv, antialias:true, alpha:true }); renderer.setPixelRatio(DPR); renderer.setSize(W,H,false); renderer.setClearColor(0x000000,0);
    scene=new T.Scene();
    camera=new T.PerspectiveCamera(34, W/H, .1, 200);
    scene.add(new T.HemisphereLight(0xffffff, 0x8fa0b3, .8));
    var sun=new T.DirectionalLight(0xffffff, 1.0); sun.position.set(-16, 18, -12); scene.add(sun);
    buildTerrain(); buildForest(); buildSnow();
    scene.fog = new T.Fog(0xe3ebf4, 30, 64);
    /* tu */
    youMesh=new T.Group();
    var s1=new T.Mesh(new T.SphereGeometry(.13,18,14), new T.MeshBasicMaterial({color:0xffffff})); var s2=new T.Mesh(new T.SphereGeometry(.095,18,14), new T.MeshBasicMaterial({color:0x2f7de1}));
    youMesh.add(s1); youMesh.add(s2); var yp=toWorld(nodes[you].lat,nodes[you].lon,40); youMesh.position.copy(yp); scene.add(youMesh);
    var yl=makeLabel(L10N.youAre, false, false); yl.position.copy(yp).add(new T.Vector3(.12,.22,0)); scene.add(yl);
    /* etichette degli hub e delle vette */
    var seen={}; for (var i=0;i<nodes.length;i++){ var n=nodes[i]; if (!n.station || LABELS.indexOf(n.name)<0 || seen[n.name]) continue; seen[n.name]=1;
      var sp=makeLabel(HUBS[n.name]||n.name, false, true); sp.position.copy(toWorld(n.lat,n.lon,60)).add(new T.Vector3(.1,.16,0)); scene.add(sp); labelSprites.push(sp); }
    for (var k=0;k<PEAKS.length;k++){ var P=PEAKS[k]; var ps=makeLabel('▲ '+P[2]+' · '+fmtN(P[3])+' m', true, true); ps.position.copy(toWorld(P[0],P[1],120)).add(new T.Vector3(.1,.2,0)); scene.add(ps); }
    /* destinazione */
    targetMesh=new T.Mesh(new T.SphereGeometry(.11,18,14), new T.MeshBasicMaterial({color:0xffb300})); scene.add(targetMesh);
    targetRing=new T.Mesh(new T.RingGeometry(.22,.3,40), new T.MeshBasicMaterial({color:0xff7a00, transparent:true, opacity:.7, side:T.DoubleSide, depthTest:false})); targetRing.rotation.x=-Math.PI/2; scene.add(targetRing);
    hoverSprite=null;
    layout(); pickTarget(false);
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerleave', function(){ setHover(-1); });
    if (!raf) raf=requestAnimationFrame(frame);
  }
  function layout(){
    var host=cv.parentNode.getBoundingClientRect(); W=Math.max(320,host.width); H=Math.max(420,host.height);
    renderer.setSize(W,H,false); camera.aspect=W/H;
    if (W>=900) camera.setViewOffset(W*1.42, H, 0, 0, W, H); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  var orbitCenter=null;
  function placeCamera(){
    if (!orbitCenter) orbitCenter = toWorld(46.535,11.815,0); orbitCenter.y = 1.6*EXAG;
    var dist = W>=900 ? 34 : 36, elev = .64;
    camera.position.set(orbitCenter.x+Math.cos(az)*dist*Math.cos(elev), orbitCenter.y+dist*Math.sin(elev), orbitCenter.z+Math.sin(az)*dist*Math.cos(elev));
    camera.lookAt(orbitCenter);
  }

  /* percorso: tubo ambra sul terreno, rivelato progressivamente */
  function buildRoute(p){
    if (routeMesh){ scene.remove(routeMesh); routeMesh.geometry.dispose(); routeMesh=null; }
    var pts=[]; for (var i=0;i<p.length;i++){ var cs=p[i].coords; for (var q=(i===0?0:1); q<cs.length; q++) pts.push(toWorld(cs[q][0],cs[q][1],28)); }
    if (pts.length<2) return;
    var curve=new T.CatmullRomCurve3(pts, false, 'catmullrom', .0); var segs=Math.min(1200, Math.max(60, pts.length*2));
    var geo=new T.TubeGeometry(curve, segs, .038, 7, false);
    routeMesh=new T.Mesh(geo, new T.MeshBasicMaterial({ color:0xffb300 })); routeMesh.renderOrder=5; scene.add(routeMesh);
    routeTotal=geo.index.count; routeShown = reduce ? routeTotal : 0; geo.setDrawRange(0, routeShown);
  }
  function pickTarget(user, forced){
    var all=dijkstra(you, ALLOW.adv), t=forced;
    if (t==null){ var pool=[], seen={}; for (var i0=0;i0<nodes.length;i0++){ var n0=nodes[i0]; if (i0===you || !n0.station || !HUBS[n0.name] || !isFinite(all.d[i0]) || seen[n0.name]) continue; seen[n0.name]=1; pool.push(i0); } if (!pool.length) return; t=pool[Math.floor(Math.random()*pool.length)]; }
    var p=pathTo(all,t); if (!p) return;
    target=t; routeEdges=p; buildRoute(p); fillCard(t,p);
    var tp=toWorld(nodes[t].lat,nodes[t].lon,40); targetMesh.position.copy(tp); targetRing.position.copy(tp);
    if (targetMesh.userData.label){ scene.remove(targetMesh.userData.label); }
    var tl=makeLabel(pretty(t), true, false); tl.position.copy(tp).add(new T.Vector3(.12,.24,0)); scene.add(tl); targetMesh.userData.label=tl;
    clearTimeout(idle); idle=setTimeout(function(){ pickTarget(false); }, user ? 16000 : 9000);
  }

  var ray=null, ndc=null, hover=-1;
  function pick(ev){
    if (!ndc) ndc=new T.Vector2();
    var r=cv.getBoundingClientRect(); ndc.set(((ev.clientX-r.left)/r.width)*2-1, -((ev.clientY-r.top)/r.height)*2+1);
    if (!ray){ ray=new T.Raycaster(); ndc=new T.Vector2(); }
    ray.setFromCamera(ndc, camera); var hits=ray.intersectObject(terrain); if (!hits.length) return -1;
    var ll=fromWorld(hits[0].point), best=-1, bd=0.55; /* km */
    for (var i=0;i<nodes.length;i++){ var n=nodes[i]; if (!n.station || !n.name) continue; var dx=(n.lon-ll.lon)*kmX, dz=(n.lat-ll.lat)*kmY, d=Math.sqrt(dx*dx+dz*dz); if (d<bd){bd=d;best=i;} }
    return best;
  }
  function setHover(n){
    if (n===hover) return; hover=n;
    if (hoverSprite){ scene.remove(hoverSprite); hoverSprite=null; }
    if (n>=0 && n!==target){ hoverSprite=makeLabel(pretty(n), false, true); hoverSprite.position.copy(toWorld(nodes[n].lat,nodes[n].lon,70)).add(new T.Vector3(.1,.16,0)); scene.add(hoverSprite); }
    cv.style.cursor = n>=0 ? 'pointer' : 'default';
  }
  function onMove(ev){ if (ev.pointerType==='touch') return; setHover(pick(ev)); autoRot=false; rotResume=clock+2.5; }
  function onDown(ev){ var n=pick(ev); if (n>=0 && n!==you) pickTarget(true, n); }

  function frame(ts){
    if (!lastT) lastT=ts; var dt=Math.min(50, ts-lastT)/1000; lastT=ts; clock+=dt;
    if (!autoRot && clock>rotResume) autoRot=true;
    if (autoRot && !reduce) az += dt*.055;
    placeCamera();
    if (routeMesh && routeShown<routeTotal){ routeShown=Math.min(routeTotal, routeShown + dt*routeTotal*.32); routeMesh.geometry.setDrawRange(0, Math.floor(routeShown/42)*42); }
    if (snowPts){ var sp=snowPts.geometry.attributes.position, ar=sp.array; for (var si=0;si<snowVel.length;si++){ ar[si*3+1]-=snowVel[si]*dt; ar[si*3]+=Math.sin(clock*1.3+si)*dt*.15; if (ar[si*3+1]<1.0){ ar[si*3+1]=5.7; ar[si*3]=(Math.random()-.5)*22; ar[si*3+2]=(Math.random()-.5)*18; } } sp.needsUpdate=true; }
    if (targetRing){ var ph=(clock*.9)%1; targetRing.scale.set(1+ph*1.6,1+ph*1.6,1); targetRing.material.opacity=.7*(1-ph); }
    renderer.render(scene, camera);
    raf = onScreen ? requestAnimationFrame(frame) : null;
  }

  var rt;
  window.SkiNet = { resize: function(){ clearTimeout(rt); rt=setTimeout(function(){ if (renderer) layout(); else if (hasGL && DEM) init3D(); }, 120); } };
  window.addEventListener('resize', window.SkiNet.resize);
  document.addEventListener('visibilitychange', function(){ if (document.hidden){ cancelAnimationFrame(raf); raf=null; } else if (renderer && onScreen && !raf){ lastT=0; raf=requestAnimationFrame(frame); } });

  if (!(hasGL && DEM)){ var hint=document.querySelector('.hint'); if (hint) hint.textContent=L10N.noWebGL; }
  /* fuori schermo la scena si ferma: niente lavoro della GPU mentre si legge il resto della pagina */
  if ('IntersectionObserver' in window) new IntersectionObserver(function(es){
    onScreen = es[0].isIntersecting;
    if (onScreen && renderer && !raf && !document.hidden){ lastT=0; raf=requestAnimationFrame(frame); }
  }).observe(cv);
  window.SkiNet.resize(); /* costruisce la scena a dimensioni reali */
})();

