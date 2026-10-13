import json, math, os, struct

OUT = '/home/ubuntu/nubiaodyssey/assets'
os.makedirs(OUT, exist_ok=True)

materials = [
    {'name':'Sun-baked Sandstone','pbrMetallicRoughness':{'baseColorFactor':[0.58,0.30,0.17,1],'metallicFactor':0.03,'roughnessFactor':0.86}},
    {'name':'Deep Shadow Stone','pbrMetallicRoughness':{'baseColorFactor':[0.12,0.07,0.045,1],'metallicFactor':0.02,'roughnessFactor':0.92}},
    {'name':'Aged Brass','pbrMetallicRoughness':{'baseColorFactor':[0.72,0.38,0.13,1],'metallicFactor':0.66,'roughnessFactor':0.30}},
    {'name':'Nile Patina','pbrMetallicRoughness':{'baseColorFactor':[0.18,0.38,0.34,1],'metallicFactor':0.24,'roughnessFactor':0.38}},
]
verts = [[] for _ in materials]
inds = [[] for _ in materials]

def add_vertex(mat, p, n, uv):
    idx = len(verts[mat]) // 8
    verts[mat].extend([*p, *n, *uv])
    return idx

def quad(mat, a,b,c,d, n):
    base = len(verts[mat]) // 8
    for p,uv in zip((a,b,c,d),((0,0),(1,0),(1,1),(0,1))): add_vertex(mat,p,n,uv)
    inds[mat].extend([base,base+1,base+2, base,base+2,base+3])

def box(mat, cx,cy,cz, sx,sy,sz, rot=0):
    # baked Y rotation; six independent faces preserve hard edges
    ca,sa=math.cos(rot),math.sin(rot)
    def tr(x,z): return (cx+x*ca-z*sa, cy, cz+x*sa+z*ca)
    x=sx/2; y=sy/2; z=sz/2
    faces=[
      ([(tr(-x,-z)[0],cy-y,tr(-x,-z)[1]),(tr(x,-z)[0],cy-y,tr(x,-z)[1]),(tr(x,z)[0],cy-y,tr(x,z)[1]),(tr(-x,z)[0],cy-y,tr(-x,z)[1])],(0,-1,0)),
      ([(tr(-x,z)[0],cy+y,tr(-x,z)[1]),(tr(x,z)[0],cy+y,tr(x,z)[1]),(tr(x,-z)[0],cy+y,tr(x,-z)[1]),(tr(-x,-z)[0],cy+y,tr(-x,-z)[1])],(0,1,0)),
      ([(tr(-x,-z)[0],cy-y,tr(-x,-z)[1]),(tr(-x,z)[0],cy-y,tr(-x,z)[1]),(tr(-x,z)[0],cy+y,tr(-x,z)[1]),(tr(-x,-z)[0],cy+y,tr(-x,-z)[1])],(-ca,0,-sa)),
      ([(tr(x,z)[0],cy-y,tr(x,z)[1]),(tr(x,-z)[0],cy-y,tr(x,-z)[1]),(tr(x,-z)[0],cy+y,tr(x,-z)[1]),(tr(x,z)[0],cy+y,tr(x,z)[1])],(ca,0,sa)),
      ([(tr(-x,-z)[0],cy-y,tr(-x,-z)[1]),(tr(x,-z)[0],cy-y,tr(x,-z)[1]),(tr(x,-z)[0],cy+y,tr(x,-z)[1]),(tr(-x,-z)[0],cy+y,tr(-x,-z)[1])],(-sa,0,ca)),
      ([(tr(x,z)[0],cy-y,tr(x,z)[1]),(tr(-x,z)[0],cy-y,tr(-x,z)[1]),(tr(-x,z)[0],cy+y,tr(-x,z)[1]),(tr(x,z)[0],cy+y,tr(x,z)[1])],(sa,0,-ca)),
    ]
    for face,n in faces: quad(mat,*face,n)

def frustum(mat,cx,cy,cz,bottom,top,height,rot=math.pi/4):
    ca,sa=math.cos(rot),math.sin(rot)
    def pts(size,y):
        h=size/2
        raw=[(-h,y,-h),(h,y,-h),(h,y,h),(-h,y,h)]
        return [(cx+x*ca-z*sa,cy+y,cz+x*sa+z*ca) for x,_,z in raw]
    bot=pts(bottom,0); topv=pts(top,height)
    quad(mat,bot[0],bot[3],bot[2],bot[1],(0,-1,0))
    quad(mat,topv[0],topv[1],topv[2],topv[3],(0,1,0))
    for i in range(4):
        j=(i+1)%4
        a,b,c,d=bot[i],bot[j],topv[j],topv[i]
        # approximate outward normal
        nx=(a[0]+b[0]+c[0]+d[0])/4-cx; nz=(a[2]+b[2]+c[2]+d[2])/4-cz
        ln=max(0.001,(nx*nx+nz*nz)**0.5); quad(mat,a,b,c,d,(nx/ln,0,nz/ln))

def arch_blocks(mat,cx,cy,cz,radius,depth,count=14,block=.17):
    for i in range(count):
        angle=math.pi - (i/(count-1))*math.pi
        x=cx+math.cos(angle)*radius
        y=cy+math.sin(angle)*radius
        rot=angle-math.pi/2
        box(mat,x,y,cz,block,block*1.18,depth,rot)

# Monument footprint, stepped sanctuary, twin pylons
box(1,0,-0.94,0,5.2,.22,3.7)
box(0,0,-0.80,0,4.9,.26,3.35)
for i in range(8):
    width=4.25-i*.33
    box(0,0,-.68+i*.22,0,width,.22,width*.62)
frustum(0,1.14,0,.82,.50,.65, .85, math.pi/4)
# Twin pylons frame the front, with capstones and relief bands
for x in (-1.72,1.72):
    box(0,x,-.05,0,1.08,2.55,.78)
    box(0,x,1.28,0,1.22,.18,.9)
    box(2,x,.55,.42,1.12,.08,.08)
    box(2,x,.72,.42,1.12,.08,.08)
    box(3,x,.89,.43,.86,.05,.06)
# central shadow chamber and doorway
box(1,0,.18,.52,1.48,1.65,.12)
box(1,0,.45,.65,1.68,.16,.18)
box(1,0,.02,.66,1.62,.12,.18)
arch_blocks(2,0,.70,.68,.74,1.0,16,.12)
# inner arch in patina, sun disc and geometric relief
arch_blocks(3,0,.70,.83,.57,.55,14,.08)
for x in (-.72,-.36,0,.36,.72):
    box(2,x,.31,.86,.07,.54,.05)
for x in (-.82,-.41,0,.41,.82):
    box(3,x,.98,.87,.06,.22,.05)
# roof ornaments, side shrines, and a carved solar finial
for x in (-1.1,1.1):
    frustum(0,x,1.62,-.05,.58,.30,.72,math.pi/4)
box(2,0,1.62,.03,.24,.76,.24,math.pi/4)
frustum(2,0,2.18,.03,.34,.08,.42,math.pi/4)
# side ceremonial stones and etched lines
for x in (-2.3,2.3):
    frustum(0,x,-.69,-.68,.56,.22,.82,math.pi/4)
    for z in (-.32,0,.32): box(2,x,-.16,z,.07,.06,.20)

# Build binary interleaved position/normal/uv buffers and glTF accessors
raw = bytearray(); buffer_views=[]; accessors=[]; meshes=[]
for mi in range(len(materials)):
    data=verts[mi]
    blob=struct.pack('<'+'f'*len(data),*data)
    if len(raw)%4: raw.extend(b'\0'*(4-len(raw)%4))
    offset=len(raw); raw.extend(blob)
    buffer_views.append({'buffer':0,'byteOffset':offset,'byteLength':len(blob),'byteStride':32,'target':34962})
    view_index=len(buffer_views)-1
    idx_blob=struct.pack('<'+'I'*len(inds[mi]),*inds[mi])
    if len(raw)%4: raw.extend(b'\0'*(4-len(raw)%4))
    idx_offset=len(raw); raw.extend(idx_blob)
    buffer_views.append({'buffer':0,'byteOffset':idx_offset,'byteLength':len(idx_blob),'target':34963})
    idx_view=len(buffer_views)-1
    count=len(data)//8
    positions=list(zip(*[iter(data[0::8])]*3))
    # above helper is intentionally replaced with explicit slices for bounds
    positions=[data[i:i+3] for i in range(0,len(data),8)]
    mins=[min(p[j] for p in positions) for j in range(3)]; maxs=[max(p[j] for p in positions) for j in range(3)]
    accessors.append({'bufferView':view_index,'componentType':5126,'count':count,'type':'VEC3','min':mins,'max':maxs})
    pos_acc=len(accessors)-1
    accessors.append({'bufferView':view_index,'byteOffset':12,'componentType':5126,'count':count,'type':'VEC3'})
    norm_acc=len(accessors)-1
    accessors.append({'bufferView':view_index,'byteOffset':24,'componentType':5126,'count':count,'type':'VEC2'})
    uv_acc=len(accessors)-1
    accessors.append({'bufferView':idx_view,'componentType':5125,'count':len(inds[mi]),'type':'SCALAR'})
    idx_acc=len(accessors)-1
    meshes.append({'name':materials[mi]['name']+' geometry','primitives':[{'attributes':{'POSITION':pos_acc,'NORMAL':norm_acc,'TEXCOORD_0':uv_acc},'indices':idx_acc,'material':mi}]})

nodes=[{'name':'Nubia Sanctuary Root','children':list(range(1,1+len(meshes)))}]
for i in range(len(meshes)): nodes.append({'name':meshes[i]['name'],'mesh':i+0})
# root children use mesh node indices, but root is node 0 and mesh nodes start 1
nodes[0]['children']=list(range(1,len(meshes)+1))

gltf={'asset':{'version':'2.0','generator':'Nubia Odyssey Original GLTF Builder'},'scene':0,'scenes':[{'name':'Nubia Sanctuary','nodes':[0]}],'nodes':nodes,'meshes':meshes,'materials':materials,'buffers':[{'uri':'nubia-sanctuary.bin','byteLength':len(raw)}],'bufferViews':buffer_views,'accessors':accessors}
with open(os.path.join(OUT,'nubia-sanctuary.bin'),'wb') as f: f.write(raw)
with open(os.path.join(OUT,'nubia-sanctuary.gltf'),'w',encoding='utf-8') as f: json.dump(gltf,f,ensure_ascii=False,separators=(',',':'))
print(json.dumps({'gltf':os.path.join(OUT,'nubia-sanctuary.gltf'),'bin':os.path.join(OUT,'nubia-sanctuary.bin'),'materials':len(materials),'vertices':sum(len(v)//8 for v in verts),'triangles':sum(len(i)//3 for i in inds)},ensure_ascii=False))
