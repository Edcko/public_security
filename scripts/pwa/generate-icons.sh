#!/bin/bash

# Generador de Iconos PWA
# Requiere: ImageMagick (brew install imagemagick)

echo "🎨 Generando iconos para PWA..."

# Crear directorio si no existe
mkdir -p public/icons

# Tamaños de iconos requeridos
SIZES=(48 72 96 128 144 152 192 384 512)

# Crear icono SVG base (shield azul)
cat > /tmp/pwa-icon.svg << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#grad)"/>
  <path d="M256 64 L416 144 V256 C416 358 346 448 256 448 C166 448 96 358 96 256 V144 L256 64Z" 
        fill="white" opacity="0.9"/>
  <path d="M256 128 L352 176 V240 C352 312 306 368 256 368 C206 368 160 312 160 240 V176 L256 128Z" 
        fill="#1e40af"/>
  <circle cx="256" cy="240" r="48" fill="white"/>
</svg>
SVG

# Generar iconos en todos los tamaños
for size in "${SIZES[@]}"; do
  echo "  Generando icono ${size}x${size}..."
  convert /tmp/pwa-icon.svg -resize ${size}x${size} public/icon-${size}.png
done

# Generar favicon.ico
echo "  Generando favicon.ico..."
convert public/icon-48.png public/icon-32.png public/icon-16.png public/favicon.ico

# Generar Apple Touch Icon
echo "  Generando Apple Touch Icon..."
cp public/icon-192.png public/apple-touch-icon.png

# Limpiar temporal
rm /tmp/pwa-icon.svg

echo ""
echo "✅ Iconos generados exitosamente!"
echo "   - Iconos PWA: ${#SIZES[@]} tamaños"
echo "   - Favicon: public/favicon.ico"
echo "   - Apple Touch Icon: public/apple-touch-icon.png"
echo ""
echo "📦 Iconos creados:"
ls -lh public/*.png | awk '{print "   " $9 " (" $5 ")"}'
