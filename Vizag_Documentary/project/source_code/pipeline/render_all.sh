#!/usr/bin/env bash
# Render the documentary in chunks (resumable), concatenate, and mux with the mixed audio.
set -u
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
RM="$ROOT/project/source_code/remotion"
OUT="$ROOT/output"; CH="$ROOT/work/chunks"; mkdir -p "$CH"
TOTAL=$(python3 -c "import json;print(json.load(open('$RM/src/plan.json'))['durationInFrames'])")
STEP=${STEP:-3600}
CONC=${CONC:-4}
cd "$RM"
i=0
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $TOTAL ] && b=$((TOTAL-1))
  f="$CH/chunk_$(printf %02d $i).mp4"
  n=$((b-a+1))
  if [ -f "$f" ]; then
    got=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$f" 2>/dev/null || echo 0)
    if [ "$got" = "$n" ]; then echo "chunk $i ok ($n frames)"; i=$((i+1)); continue; fi
  fi
  echo "rendering chunk $i frames $a-$b at $(date +%T)"
  for attempt in 1 2 3; do
    npx remotion render Vizag "$f" --frames=$a-$b --gl=swangle --concurrency=$CONC --codec=h264 --crf=17 --x264-preset=medium --pixel-format=yuv420p --muted --log=error --timeout=120000 && break
    echo "chunk $i attempt $attempt failed"; sleep 5
  done
  i=$((i+1))
done
python3 -I "$ROOT/project/source_code/pipeline/sfx_mix.py" "$ROOT"
ls "$CH"/chunk_*.mp4 | sed "s/^/file '/; s/$/'/" > "$CH/list.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$CH/list.txt" -c copy "$ROOT/work/video_master.mp4"
ffmpeg -v error -y -i "$ROOT/work/video_master.mp4" -i "$ROOT/work/final_mix.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart -shortest "$OUT/final_video.mp4"
echo "DONE $(date +%T)"
