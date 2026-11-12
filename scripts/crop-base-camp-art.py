"""Crop supplied atlases only; no background removal, stretching or generated art.
Usage: python3 scripts/crop-base-camp-art.py HANDOFF [PLANNED_PROJECTS DISPLAY_COLLECTION]
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
# Later owner-supplied standalone replacements take precedence over atlas cells.
# Use the original complete image, fitting objects onto transparent target canvases.
if len(sys.argv)>2:
 replacements=[('project:'+p+':planned',Path(sys.argv[2]),p+'-planned.png','base-camp-planned-project-card-art.zip') for p in ['greenhouse','lookout','noticeboard']]
 if len(sys.argv)>3:
  display=Path(sys.argv[3])
  replacements += [(ident,display,name,'base-camp-display-collection-art.zip') for ident,name in [
   ('display-shelf','home-shelf-background.png'),('display-garden','camp-garden-background.png'),('display-gate','welcome-gate-background.png'),
   ('keepsake:number|0','copper-compass.png'),('keepsake:fractions|0','oasis-seed.png'),('keepsake:algebra|0','generator-cog.png')]]
 for ident,directory,name,pack in replacements:
  entry=next(a for a in assets if a['id']==ident);original=Image.open(directory/name);im=original.copy()
  target=original.size if ident.startswith('display-') else tuple(entry['dimensions'])
  if im.size!=target:
   im.thumbnail(target,Image.Resampling.LANCZOS);canvas=Image.new('RGBA',target);canvas.paste(im,((target[0]-im.width)//2,(target[1]-im.height)//2));im=canvas
  dest=root/'v3/assets/base-camp'/entry['file'];im.save(dest,'WEBP',lossless=True,exact=True)
  entry.update(source=name,sourcePack=pack,sourceSha256=hashlib.sha256((directory/name).read_bytes()).hexdigest(),crop=[0,0,*original.size],dimensions=list(target),alpha=im.mode=='RGBA',sha256=hashlib.sha256(dest.read_bytes()).hexdigest())
for entry in assets: entry.setdefault('sourcePack','base-camp-artwork-handoff.zip')
(root/'v3/assets/base-camp/manifest.json').write_text(json.dumps({'source':'Owner-supplied Base Camp packs. Atlas crops with nine standalone replacements when the supplemental packs are provided. Full source alpha, proportions and shadows retained; exact source pack and dimensions recorded per asset.','assets':assets},indent=2)+'\n')
print(f'{len(assets)} assets exported without stretching')
