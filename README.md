# VIZAG — THE COASTLINE BLUEPRINT

Telugu investigative documentary (17:55) — production repository.

```
Vizag_Documentary/
  input/                 Vizag.pdf (script) · narration audio (not committed)
  assets/                web_photographs · government_documents (PIB) · maps (geo data) · sound_effects (original) · stock_videos (not committed)
  metadata/              scene_plan.csv · asset_manifest.csv · source_references.csv · narration_timestamps.srt · word/phrase timestamps · sfx_cues.csv
  project/source_code/
    pipeline/            Python: transcription, forced alignment, Pixabay/Commons/PIB acquisition, geo tiles, SFX synthesis, scene plan, mixing, QC
    remotion/            Remotion + Three.js (React Three Fiber) animation system and the master composition `Vizag`
  output/                final_video.mp4 (not committed) · fact_check_report.txt · quality_report.txt · english_subtitles.srt
```

Pipeline: `transcribe.py` → `align.py` → `force_align.py` (MMS CTC aligner) → `make_plan.py` → `prep_stock.py` →
`sfx_synth.py` → `sfx_mix.py` → `render_all.sh` → `qc.py`.

Secrets: the Pixabay key is read from `PIXABAY_API_KEY` (environment) and is never written to the repository.
