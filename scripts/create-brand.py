"""Reproduce Indraya's original net-of-awareness icon (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw
import math
size = 1024
background = (7, 23, 25, 255)
points = [(512 + 255 * math.cos(math.pi * i / 3), 512 + 255 * math.sin(math.pi * i / 3)) for i in range(6)]

def icon(transparent=False):
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0) if transparent else background)
    draw = ImageDraw.Draw(image)
    for i, point in enumerate(points):
        draw.line([point, points[(i+1)%6]], fill=(50, 100, 103, 255), width=8)
        draw.line([point, (512, 512)], fill=(50, 100, 103, 255), width=6)
    for x,y in points:
        draw.ellipse((x-19,y-19,x+19,y+19), fill=(156,229,217,255))
    draw.ellipse((454,454,570,570), outline=(156,229,217,255), width=8)
    draw.ellipse((488,488,536,536), fill=(230,184,117,255))
    return image
root=Path(__file__).resolve().parent.parent/'assets'
icon().save(root/'indraya-icon.png')
icon(True).save(root/'indraya-foreground.png')
