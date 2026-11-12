"""Crop supplied atlases only; no background removal, stretching or generated art.
Usage: python3 scripts/crop-base-camp-art.py /path/to/extracted/handoff
"""
from pathlib import Path
from PIL import Image
import sys,json,hashlib
root=Path(__file__).resolve().parents[1]
src=Path(sys.argv[1]); spec=json.loads((root/'docs/review/base-camp/proposed-assets.json').read_text())
worlds={'number':'number-forest','fractions':'fraction-desert','algebra':'algebra-peaks','geometry':'geometry-kingdom','ratio':'ratio-island','statistics':'statistics-city','probability':'probability-portal','measure':'measurement-mines','town':'practical-maths-town'}
assets=[]
for a in spec['assets']:
 ident=a['id']; size=tuple(a['dimensions'])
 if ident.startswith('display-') or ident=='collection-surface':
  name='display-collection-surfaces-atlas.png'; i=['display-shelf','display-garden','display-gate','collection-surface'].index(ident)
  # Narrow white separators are excluded. Preserve the supplied portrait panels.
  xs=[(0,536),(548,1080),(1093,1626),(1638,2172)];box=(*xs[i][:1],0,xs[i][1],724);size=(xs[i][1]-xs[i][0],724)
 elif ident.startswith('keepsake:'):
  world,route=ident.split(':')[1].split('|'); name='keepsakes-'+worlds[world]+'-atlas.png'
  if world=='town':
   i=['market','cafe','bank','shops','station','home','leisure','work','gateway'].index(route)
   # Content is a 3x3 grid inside the wide transparent canvas, NOT across its full width.
   xs=[450,880,1310,1740]; ys=[0,241,482,724]; col=i%3;row=i//3;box=(xs[col],ys[row],xs[col+1],ys[row+1])
  else:
   i=['0','1','2','gateway'].index(route); im=Image.open(src/name);w,h=im.size;col=i%2;row=i//2;box=(round(col*w/2),round(row*h/2),round((col+1)*w/2),round((row+1)*h/2))
 else:
  project,state=ident.split(':')[1:];name='build-projects-planned-complete-atlas.png'; col=['greenhouse','lookout','noticeboard'].index(project);row=0 if state=='planned' else 1;box=(col*512,row*512,(col+1)*512,(row+1)*512)
 im=Image.open(src/name).crop(box)
 if im.size!=size:
  # Fit the whole cell, including its original contact shadow, on a transparent canvas.
  im.thumbnail(size,Image.Resampling.LANCZOS);canvas=Image.new('RGBA',size);canvas.paste(im,((size[0]-im.width)//2,(size[1]-im.height)//2));im=canvas
 dest=root/a['path'];dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest,'WEBP',lossless=True,exact=True)
 assets.append({'id':ident,'file':a['path'].split('v3/assets/base-camp/')[1],'name':a.get('name'),'source':name,'sourceSha256':hashlib.sha256((src/name).read_bytes()).hexdigest(),'crop':list(box),'dimensions':list(size),'alpha':im.mode=='RGBA','sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
(root/'v3/assets/base-camp/manifest.json').write_text(json.dumps({'source':'Owner-supplied base-camp-artwork-handoff.zip; crops only. Source alpha and shadows retained. Actual portrait surfaces supersede proposed wide dimensions.','assets':assets},indent=2)+'\n')
print(f'{len(assets)} assets cropped without stretching')
