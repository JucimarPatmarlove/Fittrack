import os
import glob

svg_files = glob.glob('public/assets/exercises/images/*.svg')

beautiful_svg = """<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#131920"/>
  <rect width="90%" height="80%" x="5%" y="10%" fill="none" stroke="#e8c84a" stroke-width="2" stroke-dasharray="8,8" rx="10"/>
  <text x="50%" y="45%" fill="#e8c84a" text-anchor="middle" font-size="40">🏋️</text>
  <text x="50%" y="60%" fill="#eceae4" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold">NENHUMA IMAGEM</text>
  <text x="50%" y="70%" fill="#55626e" text-anchor="middle" font-family="sans-serif" font-size="14">(Adicione o .jpg real na pasta)</text>
</svg>"""

for f in svg_files:
    with open(f, 'w') as out:
        out.write(beautiful_svg)
