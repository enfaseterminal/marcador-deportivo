import os
from datetime import datetime

# Definir la raíz del proyecto (un nivel por encima de /script/)
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
base_url = "https://www.ligaescolar.es"
ignore_folders = {'script', '.git', '.github', 'assets', 'css', 'js', 'imagenes'}

# Archivos específicos en la raíz que SÍ queremos incluir aunque no sean index.html
extra_files = ['privacidad.html']

pages = []

for root, dirs, files in os.walk(root_dir):
    dirs[:] = [d for d in dirs if d not in ignore_folders and not d.startswith('.')]
    
    # Caso 1: Buscar carpetas para URLs limpias (/voleibol/)
    if "index.html" in files:
        rel_path = os.path.relpath(root, root_dir)
        if rel_path == ".":
            full_url = f"{base_url}/"
        else:
            clean_path = rel_path.replace("\\", "/")
            full_url = f"{base_url}/{clean_path}/"
        pages.append(full_url)
    
    # Caso 2: Añadir archivos específicos (como privacidad.html)
    if root == root_dir:
        for f in extra_files:
            if f in files:
                pages.append(f"{base_url}/{f}")

# Eliminar duplicados y generar XML
pages = sorted(list(set(pages)))
sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

for page in pages:
    # Prioridad alta para la home, media para el resto
    priority = "1.0" if page == f"{base_url}/" else "0.6"
    sitemap_xml += f'  <url>\n    <loc>{page}</loc>\n    <lastmod>{datetime.now().strftime("%Y-%m-%d")}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>{priority}</priority>\n  </url>\n'

sitemap_xml += '</urlset>'

sitemap_path = os.path.join(root_dir, "sitemap.xml")
with open(sitemap_path, "w", encoding="utf-8") as f:
    f.write(sitemap_xml)

print(f"Sitemap generado con {len(pages)} páginas en {sitemap_path}")
