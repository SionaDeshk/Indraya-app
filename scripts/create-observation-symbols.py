"""Original Indraya pictograms. No third-party art, fonts, emojis or remote sprites.
Regenerate with Pillow. Coordinates are a 72px design grid, supersampled 4x.
"""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,math
manifest=json.loads(Path('data/observation-symbols.json').read_text())
names=sorted({v['symbol'] for v in manifest.values()}|{'event-four-by-four','event-atv'})
out=Path('assets/observation-symbols');out.mkdir(exist_ok=True)
S=4;C='#08282a'
for key in names:
 name=key.removeprefix('event-');im=Image.new('RGBA',(72*S,72*S));d=ImageDraw.Draw(im)
 def L(p,w=4):d.line([(x*S,y*S) for x,y in p],fill=C,width=w*S,joint='curve')
 def R(b,w=4,fill=None):d.rounded_rectangle(tuple(v*S for v in b),radius=3*S,outline=C,width=w*S,fill=fill)
 def E(b,fill=C,w=3):d.ellipse(tuple(v*S for v in b),fill=fill,outline=C,width=w*S)
 def P(p):d.polygon([(x*S,y*S) for x,y in p],fill=C)
 def car(x=12,y=24,scale=1):
  def p(a,b):return (x+a*scale,y+b*scale)
  L([p(0,24),p(0,10),p(7,0),p(32,0),p(40,10),p(40,24),p(0,24)])
  L([p(5,10),p(35,10)],3);E((x+4*scale,y+19*scale,x+12*scale,y+29*scale));E((x+28*scale,y+19*scale,x+36*scale,y+29*scale))
 def mountain():L([(8,58),(29,15),(45,44),(55,27),(66,58),(8,58)]);L([(21,31),(29,37),(35,28)],3)
 def water(y=46):
  for yy in [y,y+12]:L([(8,yy),(17,yy-4),(27,yy),(37,yy-4),(47,yy),(57,yy-4),(66,yy)],3)
 def road():L([(23,10),(14,63)]);L([(49,10),(58,63)]);L([(36,12),(36,25)],3);L([(36,43),(36,58)],3)
 def cross(x=36,y=36):L([(x-9,y),(x+9,y)],5);L([(x,y-9),(x,y+9)],5)
 def check(x=47,y=52):L([(x-7,y),(x-1,y+6),(x+10,y-8)],4)
 def question(x=48,y=34):L([(x-6,y-7),(x-4,y-11),(x+3,y-11),(x+7,y-7),(x+6,y-3),(x,y+2),(x,y+7)],4);E((x-2,y+12,x+2,y+16))
 def paw():
  E((24,34,48,57))
  for b in [(10,26,22,40),(22,14,33,30),(39,14,50,30),(51,26,63,40)]:E(b)
 def building():L([(12,61),(12,28),(31,28),(31,12),(58,12),(58,61),(12,61)]);L([(40,24),(49,24)],4);L([(40,36),(49,36)],4);L([(20,40),(24,40)],4)
 def person():E((27,9,43,25));L([(35,29),(35,49),(25,64)]);L([(35,49),(45,64)]);L([(19,39),(35,31),(48,37)])
 def tree():P([(21,13),(7,37),(16,37),(6,49),(36,49),(27,37),(35,37)]);L([(21,45),(21,63)],5)
 def snowflake(x=36,y=35):
  for a in [0,60,120]:
   dx=22*math.cos(math.radians(a));dy=22*math.sin(math.radians(a));L([(x-dx,y-dy),(x+dx,y+dy)],3)
  for a in range(0,360,60):
   dx,dy=math.cos(math.radians(a)),math.sin(math.radians(a));px,py=x+dx*14,y+dy*14
   L([(px-dy*5-dx*3,py+dx*5-dy*3),(px+dx*4,py+dy*4),(px+dy*5-dx*3,py-dx*5-dy*3)],3)
 if name=='road':road()
 elif name=='ice-road':L([(15,60),(55,60)],4);E((20,10,52,46),None,5);L([(36,13),(36,42)],3);L([(23,28),(49,28)],3);L([(22,51),(32,56),(40,49),(52,54)],3)
 elif name=='snow-road':road();snowflake(36,35)
 elif name=='pothole':L([(15,11),(9,61)]);L([(57,11),(63,61)]);E((22,28,50,47),None,5);L([(27,36),(44,36)],3)
 elif name=='washout':L([(20,9),(12,31),(25,40),(12,49),(10,63)]);L([(52,9),(48,28),(61,37),(49,47),(62,63)]);L([(27,52),(37,45),(47,52)],4)
 elif name=='flood':water();L([(23,30),(36,15),(49,30)]);L([(36,16),(36,44)])
 elif name=='obstruction':R((12,26,60,43));L([(18,43),(13,62)]);L([(54,43),(59,62)]);L([(21,28),(31,42)]);L([(42,28),(52,42)])
 elif name=='rockfall':L([(12,8),(17,30),(9,55),(20,64)]);P([(38,13),(48,17),(43,27),(33,24)]);P([(45,35),(59,37),(64,51),(48,56),(39,47)]);L([(60,16),(60,27)],3)
 elif name=='fallen-tree':L([(10,52),(61,38)],8);L([(29,47),(18,28)]);L([(42,43),(51,20)]);L([(43,42),(62,55)]);L([(8,63),(64,63)],3)
 elif name=='visibility':L([(9,21),(60,21)],5);L([(17,34),(66,34)],5);L([(7,47),(52,47)],5);L([(24,59),(60,59)],4)
 elif name in ['wind','snow-wind']:
  L([(8,22),(44,22),(52,17),(51,10),(43,8),(38,12)],4);L([(8,35),(57,35),(65,40),(63,49),(55,51)],4);L([(10,48),(35,48),(43,55),(41,63),(33,64)],4)
  if name=='snow-wind':L([(16,55),(16,67)],3);L([(10,61),(22,61)],3)
 elif name=='smoke':L([(11,60),(61,60)]);L([(23,52),(16,42),(19,33),(29,25),(25,13)],6);L([(44,52),(51,42),(48,32),(40,24),(44,12)],6)
 elif name=='collision':car(6,27,.65);car(41,27,.65);L([(31,10),(36,20),(42,10)],4);L([(33,52),(36,62),(42,53)],4)
 elif name=='off-road':car(8,15,.8);L([(8,62),(35,62),(43,52),(65,52)]);L([(49,18),(61,29),(49,40)],4)
 elif name=='car-wrench':car(7,13,.8);L([(44,60),(57,42)],5);L([(54,33),(53,42),(62,45),(67,39)],4)
 elif name=='blocked-car':car();L([(10,12),(62,64)],5)
 elif name=='queue':car(6,11,.65);car(37,35,.65);L([(8,61),(28,61)],3);L([(45,12),(64,12)],3)
 elif name=='barrier':R((9,23,63,42));L([(19,42),(14,63)]);L([(53,42),(58,63)]);L([(17,25),(31,41)]);L([(39,25),(54,41)])
 elif name=='bridge':L([(8,45),(27,45),(31,39)]);L([(41,45),(65,45)]);L([(16,29),(16,54)]);L([(55,29),(55,54)]);L([(16,30),(29,37)]);L([(42,37),(55,30)]);water(60)
 elif name=='construction':P([(36,10),(18,56),(54,56)]);L([(11,61),(61,61)],5);L([(25,38),(47,38)],5)
 elif name=='bus':R((17,10,55,58),5);R((24,18,48,35),3);L([(24,44),(28,44)],4);L([(44,44),(48,44)],4);L([(23,58),(23,64)],5);L([(49,58),(49,64)],5)
 elif name=='ferry':P([(8,37),(64,37),(54,55),(20,55)]);R((24,18,50,37));L([(36,8),(36,18)]);water(63)
 elif name=='plane':P([(33,8),(40,8),(40,29),(64,43),(64,49),(40,41),(40,55),(49,62),(49,66),(36,62),(22,66),(22,62),(32,55),(32,41),(8,49),(8,43),(32,29)])
 elif name=='parking':L([(14,61),(14,13),(41,13),(54,24),(54,34),(43,44),(15,44)],7)
 elif name in ['paw','paw-question','paw-aid','paw-check','tracks','feeding-site']:
  paw()
  if name=='paw-question':question(59,45)
  if name=='paw-aid':cross(57,58)
  if name=='paw-check':check(55,58)
  if name=='tracks':L([(7,57),(12,62)],4);L([(52,9),(58,14)],4)
  if name=='feeding-site':L([(13,63),(59,63)],5);E((8,59,16,67));E((56,59,64,67))
 elif name=='dog':L([(15,45),(15,29),(25,35),(42,35),(48,22),(61,25),(61,36),(52,40),(50,59)],5);L([(24,44),(24,59)]);L([(13,31),(8,23)])
 elif name=='cattle':R((15,26,55,48));L([(16,28),(8,17),(19,19)]);L([(54,28),(64,17),(53,19)]);L([(23,48),(23,61)],5);L([(48,48),(48,61)],5);E((24,34,29,39));E((42,34,47,39))
 elif name in ['trail','broken-trail','trail-check']:
  L([(18,65),(35,50),(25,38),(47,23),(43,9)],6)
  if name=='broken-trail':L([(39,39),(52,41),(45,48),(58,51)],4)
  if name=='trail-check':check(53,54)
 elif name=='sign':L([(26,8),(26,63)],5);P([(11,16),(51,16),(62,26),(51,36),(11,36)])
 elif name in ['mountain','rock-approach','mountain-sun','avalanche','glacier']:
  mountain()
  if name=='rock-approach':P([(12,59),(22,49),(29,62)])
  if name=='mountain-sun':E((48,7,62,21),None,3)
  if name=='avalanche':L([(37,31),(43,38),(34,44),(45,49)],5);E((42,51,52,60));E((54,56,62,64))
  if name=='glacier':L([(30,43),(36,49),(29,54),(37,61)],4)
 elif name=='tent':L([(7,60),(35,14),(65,60),(7,60)],5);L([(35,14),(35,60),(53,60),(35,31)],4)
 elif name in ['building','building-check','building-crack']:
  building()
  if name=='building-check':check(47,55)
  if name=='building-crack':L([(38,39),(46,44),(37,50),(45,59)],3)
 elif name in ['accessible','accessible-block']:
  E((29,8,41,20));L([(34,25),(34,43),(48,43),(57,58)]);L([(34,32),(49,32)],4);d.arc((14*S,31*S,48*S,65*S),45,330,fill=C,width=4*S)
  if name=='accessible-block':L([(8,13),(62,65)],4)
 elif name in ['rain','hail']:
  for b in [(12,20,38,40),(26,12,51,40),(42,23,62,40)]:E(b)
  for x in [20,36,52]:
   if name=='rain':L([(x,47),(x-5,61)],4)
   else:E((x-3,51,x+3,57))
 elif name=='snowflake':snowflake()
 elif name=='lightning':P([(37,6),(15,39),(33,39),(26,67),(59,28),(40,28),(49,6)])
 elif name=='thermometer':L([(28,47),(28,15),(32,9),(39,9),(44,15),(44,47)],4);E((23,43,49,66),None,4);L([(36,24),(36,54)],6)
 elif name in ['cracked-ice','cracked-ground','lake-ice','river-crossing']:
  water(53);L([(10,27),(30,27),(38,20),(61,27)],4)
  if name in ['cracked-ice','cracked-ground']:L([(36,29),(28,37),(42,40),(36,48)],4)
  if name=='lake-ice':L([(20,14),(26,20)],3);L([(26,14),(20,20)],3)
  if name=='river-crossing':L([(11,10),(11,43)],3);L([(61,10),(61,43)],3);L([(17,37),(53,37)],5);L([(45,29),(55,37),(45,45)],4)
 elif name=='waves':water(23);water(48)
 elif name=='aurora':L([(10,47),(19,18),(30,46),(42,14),(54,46),(64,24)],6);L([(10,62),(62,62)],3)
 elif name=='stars':P([(29,9),(34,27),(52,33),(34,40),(28,59),(22,40),(5,33),(22,27)]);cross(56,15);E((51,53,58,60))
 elif name in ['flame','campfire']:
  P([(35,8),(46,29),(55,22),(61,43),(50,58),(25,58),(13,43),(22,24),(27,36)])
  if name=='campfire':L([(15,64),(58,60)],5);L([(16,60),(58,65)],5)
 elif name=='odor':L([(15,57),(26,37),(34,47),(47,22),(58,30)],5);L([(19,25),(24,10)],3);L([(48,58),(56,43)],3)
 elif name=='spill':L([(12,13),(36,13),(44,34),(23,42),(12,13)]);P([(47,36),(37,53),(43,61),(56,61),(62,53)]);L([(12,65),(63,65)],3)
 elif name=='water-question':water(50);question(36,25)
 elif name=='trash':R((21,22,52,63));L([(15,20),(58,20)],5);L([(29,12),(44,12)],4);L([(31,31),(31,53)],3);L([(43,31),(43,53)],3)
 elif name in ['leaf','leaf-damage']:
  L([(14,59),(20,30),(38,16),(61,11),(57,37),(42,53),(14,59)],4);L([(15,59),(47,28)],4)
  if name=='leaf-damage':L([(48,42),(58,50),(48,58)],4)
 elif name=='plug':L([(25,9),(25,27)]);L([(47,9),(47,27)]);L([(18,26),(54,26),(51,43),(40,50),(40,63)],5);L([(8,61),(64,8)],4)
 elif name=='utility-line':L([(15,11),(15,63)],5);L([(6,22),(30,22)],4);L([(27,23),(47,36),(42,47),(63,58)],4)
 elif name=='tap':L([(9,36),(61,36),(61,45)],6);L([(25,36),(25,24),(43,24),(43,36)],5);L([(34,12),(34,24)],4);L([(24,12),(45,12)],4);P([(60,48),(53,59),(60,65),(67,59)])
 elif name=='signal':L([(36,39),(36,64)],5);E((31,27,41,37));d.arc((15*S,10*S,57*S,52*S),205,335,fill=C,width=4*S);d.arc((4*S,0,68*S,64*S),205,335,fill=C,width=4*S)
 elif name=='traffic-light':R((23,8,49,61));
 elif name=='drain':R((9,27,63,57));L([(20,31),(20,53)],3);L([(31,31),(31,53)],3);L([(43,31),(43,53)],3);L([(54,31),(54,53)],3);L([(36,8),(36,22)],4)
 elif name=='bench':L([(12,18),(60,18),(60,38),(12,38),(12,18)],4);L([(8,46),(65,46)],5);L([(19,46),(19,63)],5);L([(54,46),(54,63)],5)
 elif name=='wrench':L([(14,61),(48,27)],9);L([(41,11),(40,26),(53,34),(65,26),(64,11)],5)
 elif name=='info':E((11,11,61,61),None,4);E((33,21,39,27));L([(36,33),(36,51)],5)
 elif name=='sound-question':L([(9,29),(19,29),(30,18),(30,54),(19,43),(9,43),(9,29)],4);question(53,27)
 elif name=='eye-impact':L([(7,37),(19,22),(35,17),(51,22),(65,37),(51,52),(35,57),(19,52),(7,37)],4);E((26,28,44,46),None,4);L([(54,8),(59,15),(66,9)],3)
 elif name=='police':L([(36,8),(60,18),(57,42),(46,57),(36,65),(25,57),(15,42),(12,18),(36,8)],4);P([(36,23),(40,32),(51,32),(42,39),(46,50),(36,43),(26,50),(30,39),(21,32),(32,32)])
 elif name=='ambulance':R((9,25,62,53));L([(43,25),(43,15),(56,15),(62,25)],4);E((16,49,29,62));E((46,49,59,62));cross(27,37)
 elif name=='speech':L([(11,13),(60,13),(60,45),(37,45),(21,60),(21,45),(11,45),(11,13)],4);L([(21,25),(49,25)],3);L([(21,35),(42,35)],3)
 elif name=='first-aid':R((10,21,62,62));L([(26,21),(26,11),(46,11),(46,21)],4);cross(36,43)
 elif name in ['person-question','person-aid']:
  person()
  if name=='person-question':question(59,28)
  else:cross(58,51)
 elif name=='calendar':R((10,17,62,62));L([(10,30),(62,30)],4);L([(24,9),(24,23)],5);L([(49,9),(49,23)],5);check(36,46)
 elif name=='other':
  for x in [16,36,56]:E((x-4,32,x+4,40))
 elif name=='skis':L([(17,9),(14,58),(19,64),(25,61)],5);L([(39,8),(36,57),(41,64),(47,61)],5);L([(58,15),(51,61)],3);L([(44,54),(58,56)],3)
 elif name=='nordic':L([(15,12),(15,58),(21,63)],4);L([(37,12),(37,58),(43,63)],4);L([(52,18),(57,62)],3);L([(48,55),(64,55)],3)
 elif name=='grooming':
  for x in [15,27,45,57]:L([(x,10),(x,61)],3)
  L([(8,24),(64,24)],3);L([(8,42),(64,42)],3);L([(8,59),(64,59)],3)
 elif name=='skate':L([(24,9),(43,9),(43,32),(58,39),(60,49),(18,49),(18,32),(24,9)],4);L([(17,50),(17,60),(58,60),(64,55)],5);L([(45,50),(45,60)],3);L([(28,23),(38,23)],3);L([(26,31),(38,31)],3)
 elif name=='ice-tools':L([(17,9),(52,62)],6);L([(55,9),(20,62)],6);L([(8,13),(23,7),(33,12)],5);L([(39,12),(51,7),(65,13)],5);L([(45,58),(52,64)],4);L([(19,64),(27,58)],4)
 elif name=='snowmachine':L([(13,40),(48,40),(61,50),(24,50),(13,40)],5);L([(34,40),(40,24),(54,24)],4);L([(27,33),(40,33)],4);E((17,49,46,63),None,4);L([(52,60),(65,60),(68,54)],4)
 elif name=='four-by-four':car(7,20,1.2)
 elif name=='atv':R((23,25,48,47));E((8,36,27,58),None,5);E((46,36,65,58),None,5);L([(37,25),(42,15),(55,15)],4)
 elif name=='fish':L([(9,36),(23,21),(44,20),(57,36),(44,52),(23,51),(9,36)],4);P([(9,36),(3,23),(3,49)]);E((44,29,49,34));L([(31,20),(37,11),(43,20)],3)
 else:raise RuntimeError('Missing original drawing '+name)
 if name=='traffic-light':
  for y in [19,35,51]:E((31,y-4,41,y+4))
 im.resize((72,72),Image.Resampling.LANCZOS).save(out/(key+'.png'))
# Static requires work in Metro and in bundled native maps.
lines=['// Generated by scripts/create-observation-symbols.py; original bundled assets.','import type { ImageRequireSource } from "react-native";']
for i,key in enumerate(names):lines.append(f'import s{i} from "../assets/observation-symbols/{key}.png";')
lines.append('export const eventSymbolImages: Record<string, ImageRequireSource> = {')
lines += [f'  "{key}": s{i},' for i,key in enumerate(names)];lines.append('};')
Path('src/eventSymbolImages.ts').write_text('\n'.join(lines)+'\n')
# Contact sheet includes the actual ~22px marker size beside a larger preview.
cols=4;cellw=300;cellh=98;sheet=Image.new('RGB',(cols*cellw,math.ceil(len(names)/cols)*cellh),'#f3f8f6');sd=ImageDraw.Draw(sheet)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
for i,key in enumerate(names):
 x=(i%cols)*cellw;y=(i//cols)*cellh;icon=Image.open(out/(key+'.png'))
 sd.ellipse((x+8,y+20,x+40,y+52),fill='#8ccce8');small=icon.resize((22,22),Image.Resampling.LANCZOS);sheet.paste(small,(x+13,y+25),small)
 large=icon.resize((42,42),Image.Resampling.LANCZOS);sheet.paste(large,(x+49,y+14),large);sd.text((x+9,y+70),key.removeprefix('event-'),fill='#08282a',font=font)
Path('docs/assets').mkdir(exist_ok=True);sheet.save('docs/assets/observation-symbol-contact-sheet.png')
print('Created',len(names),'original pictograms')
