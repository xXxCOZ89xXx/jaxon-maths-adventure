"""Build delivery derivatives from retained originals. Requires Pillow with WebP support.
Run from the repository root; source files and their preservation manifests are never changed.
"""
from pathlib import Path
from PIL import Image
import hashlib, json
root = Path(__file__).resolve().parents[1]
rows = []
def derivative(source, output, size):
    with Image.open(root / source) as image:
        image = image.convert('RGBA')
        image.thumbnail(size, Image.Resampling.LANCZOS)
        target = root / output
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, 'WEBP', quality=85, method=6)
        data = target.read_bytes()
        rows.append(dict(source=source, file=output, width=image.width, height=image.height,
                         bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                         sourceSha256=hashlib.sha256((root/source).read_bytes()).hexdigest()))
for entry in json.loads((root/'v3/assets/ingredients/manifest.json').read_text())['assets']:
    name = Path(entry['file']).stem
    derivative('v3/assets/ingredients/'+entry['file'], 'v3/assets/ingredients/served/'+name+'.webp', (512,512))
scenes = {
    'checkpoint': ['bus','market','town','camp','kitchen','rail'],
    'rollout': ['atlas','home-exterior','forest','desert','geometry','measure','ratio','probability','statistics',
                'camp1','camp2','camp3','camp4','shops','train-station','cafe','work','bank','leisure','library','post']}
for family,names in scenes.items():
    for name in names:
        derivative(f'v3/assets/{family}/{name}.webp',f'v3/assets/{family}/served/{name}-1024.webp',(1024,683))
(root/'v3/assets/delivery-manifest.json').write_text(json.dumps(dict(generator='scripts/prepare-ipad-art.py',assets=rows),indent=2)+'\n')
print(f'{len(rows)} derivatives: {sum(x["bytes"] for x in rows):,} bytes')
