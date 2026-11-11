"""Original local map pictograms; no remote font/sprite service. Pillow needed only to regenerate."""
from PIL import Image, ImageDraw
from pathlib import Path
out=Path('assets/map-symbols');out.mkdir(exist_ok=True)
S=4
for name in ['travel','wildlife','outdoors','weather','environment','community','safety','discoveries']:
 im=Image.new('RGBA',(72*S,72*S));d=ImageDraw.Draw(im)
 color='#08282a'
 def line(points,width=5):d.line([(x*S,y*S) for x,y in points],fill=color,width=width*S,joint='curve')
 def ellipse(box):d.ellipse(tuple(v*S for v in box),fill=color)
 def polygon(points):d.polygon([(x*S,y*S) for x,y in points],fill=color)
 if name=='travel':
  line([(23,10),(15,62)]);line([(49,10),(57,62)])
  for y in [12,30,48]:line([(36,y),(36,y+10)],4)
 elif name=='wildlife':
  ellipse((23,34,49,59))
  for box in [(9,24,22,41),(20,10,33,29),(39,10,52,29),(52,24,65,41)]:ellipse(box)
 elif name=='outdoors':
  line([(7,59),(29,16),(48,52),(57,33),(67,59),(7,59)],4)
  line([(21,33),(29,38),(36,31)],4)
 elif name=='weather':
  ellipse((12,27,41,54));ellipse((28,14,57,54));ellipse((43,30,66,54));polygon([(19,40),(58,40),(58,54),(19,54)])
  line([(22,60),(18,67)],3);line([(39,60),(35,67)],3);line([(56,60),(52,67)],3)
 elif name=='environment':
  polygon([(38,6),(49,28),(58,19),(61,41),(54,59),(38,66),(21,59),(12,44),(18,26),(26,36),(38,6)])
  d.polygon([(x*S,y*S) for x,y in [(36,36),(44,50),(40,59),(30,57),(27,48)]],fill='#ffffff')
 elif name=='community':
  line([(10,62),(10,28),(31,28),(31,11),(58,11),(58,62),(10,62)],4)
  for x,y in [(19,38),(19,51),(40,23),(50,23),(40,36),(50,36),(40,49),(50,49)]:d.rectangle((x*S,y*S,(x+4)*S,(y+5)*S),fill=color)
 elif name=='safety':
  line([(36,7),(60,17),(57,43),(49,56),(36,65),(23,56),(15,43),(12,17),(36,7)],4)
  line([(36,23),(36,49)],5);line([(24,36),(48,36)],5)
 else:
  line([(36,7),(42,28),(64,36),(42,43),(36,65),(29,43),(8,36),(29,28),(36,7)],4)
 im.resize((72,72),Image.Resampling.LANCZOS).save(out/(name+'.png'))
