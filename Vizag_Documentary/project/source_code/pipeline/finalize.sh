#!/usr/bin/env bash
# After render_all.sh: keep final under GitHub LFS 2 GB/file limit, then QC + reports.
set -eu
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="$ROOT/output/final_video.mp4"
LIMIT=$((1900*1024*1024))
size=$(stat -c %s "$OUT")
echo "muxed master: $((size/1024/1024)) MB"
if [ "$size" -gt "$LIMIT" ]; then
  echo "re-encoding with capped bitrate to fit LFS limit"
  ffmpeg -v error -y -i "$ROOT/work/video_master.mp4" -i "$ROOT/work/final_mix.wav" -map 0:v:0 -map 1:a:0 \
    -c:v libx264 -preset medium -crf 18 -maxrate 12M -bufsize 24M -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest "$ROOT/work/final_capped.mp4"
  mv "$ROOT/work/final_capped.mp4" "$OUT"
  echo "final: $(( $(stat -c %s "$OUT")/1024/1024 )) MB"
fi
python3 -I "$ROOT/project/source_code/pipeline/qc.py" "$ROOT" "$OUT" > "$ROOT/work/qc_out.txt"
python3 -I "$ROOT/project/source_code/pipeline/build_manifest.py" "$ROOT"
python3 -I "$ROOT/project/source_code/pipeline/quality_report.py" "$ROOT" > /dev/null
echo FINALIZED
