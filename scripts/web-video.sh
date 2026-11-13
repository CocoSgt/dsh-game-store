#!/bin/sh
# Make a trailer ready for the site: 1920×1080, H.264, about 4.5 Mbit/s, sound kept, starts playing before it has fully loaded.
#   scripts/web-video.sh <input.mp4> <output.mp4>
set -eu
in="$1"; out="$2"
ffmpeg -y -loglevel error -i "$in" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -b:v 4500k -maxrate 6000k -bufsize 9000k \
  -c:a aac -b:a 160k -ac 2 -movflags +faststart "$out"
ls -la "$out" | awk '{printf "%s  %.1f MB\n", $9, $5/1048576}'
