import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import ffmpeg from "fluent-ffmpeg";
import type { Caption } from "./pipeline";

const execFileAsync = promisify(execFile);

async function ffprobeDurationSeconds(mediaPath: string): Promise<number> {
  const { stdout } = await execFileAsync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      mediaPath,
    ],
    { maxBuffer: 1024 * 1024 },
  );
  const v = parseFloat(String(stdout).trim());
  return Number.isFinite(v) && v > 0 ? v : 0;
}

type TempPaths = { workDir: string; paths: string[] };

function createTempWorkspace(): TempPaths {
  const workDir = join(tmpdir(), "buymemaybe", randomUUID());
  mkdirSync(workDir, { recursive: true });
  return { workDir, paths: [] };
}

function writeTempFile(ws: TempPaths, filename: string, bytes: Buffer): string {
  const p = join(ws.workDir, filename);
  writeFileSync(p, bytes);
  ws.paths.push(p);
  return p;
}

function writeCaptionsSrt(ws: TempPaths, captions: Caption[]): string {
  const toSrtTime = (ms: number) => {
    const clamped = Math.max(0, Math.floor(ms));
    const hh = Math.floor(clamped / 3_600_000);
    const mm = Math.floor((clamped % 3_600_000) / 60_000);
    const ss = Math.floor((clamped % 60_000) / 1000);
    const ms3 = clamped % 1000;
    const pad = (n: number, w: number) => n.toString().padStart(w, "0");
    return `${pad(hh, 2)}:${pad(mm, 2)}:${pad(ss, 2)},${pad(ms3, 3)}`;
  };

  const srt =
    captions
      .filter((c) => c.text?.trim())
      .map((c, idx) => {
        const start = toSrtTime(c.startMs);
        const end = toSrtTime(c.endMs);
        return `${idx + 1}\n${start} --> ${end}\n${c.text.trim()}\n`;
      })
      .join("\n") + "\n";

  const p = join(ws.workDir, "captions.srt");
  writeFileSync(p, srt, "utf8");
  ws.paths.push(p);
  return p;
}

function runFfmpeg(cmd: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    cmd.on("error", (err, _stdout, stderr) => {
      reject(new Error(`${err.message}\n\nffmpeg stderr:\n${stderr}`));
    });
    cmd.on("end", () => resolve());
    cmd.run();
  });
}

export async function ensureSquare1080(videoBytes: Buffer): Promise<Buffer> {
  const ws = createTempWorkspace();
  try {
    const inPath = writeTempFile(ws, "in.mp4", videoBytes);
    const outPath = join(ws.workDir, "square.mp4");
    ws.paths.push(outPath);

    const vf =
      "scale=1080:1080:force_original_aspect_ratio=increase," +
      "crop=1080:1080:(iw-ow)/2:(ih-oh)/2";

    await runFfmpeg(
      ffmpeg(inPath)
        .outputOptions(["-movflags +faststart", "-pix_fmt yuv420p"])
        .videoFilters(vf)
        .noAudio()
        .output(outPath),
    );

    return readFileSync(outPath);
  } finally {
    rmSync(ws.workDir, { recursive: true, force: true });
  }
}

async function hasAudioStream(mediaPath: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "a",
        "-show_entries",
        "stream=index",
        "-of",
        "csv=p=0",
        mediaPath,
      ],
      { maxBuffer: 64 * 1024 },
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export async function ensureSquare1080KeepNativeAudio(videoBytes: Buffer): Promise<Buffer> {
  const ws = createTempWorkspace();
  try {
    const inPath = writeTempFile(ws, "in.mp4", videoBytes);
    const outPath = join(ws.workDir, "square-audio.mp4");
    ws.paths.push(outPath);

    const vf =
      "scale=1080:1080:force_original_aspect_ratio=increase," +
      "crop=1080:1080:(iw-ow)/2:(ih-oh)/2";

    if (!(await hasAudioStream(inPath))) {
      console.warn("  [ffmpeg] Grok mp4 has no audio stream; exporting silent square video");
      return ensureSquare1080(videoBytes);
    }

    await runFfmpeg(
      ffmpeg(inPath)
        .videoFilters(vf)
        .outputOptions([
          "-movflags",
          "+faststart",
          "-pix_fmt",
          "yuv420p",
          "-map",
          "0:v:0",
          "-map",
          "0:a:0",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
        ])
        .output(outPath),
    );

    return readFileSync(outPath);
  } finally {
    rmSync(ws.workDir, { recursive: true, force: true });
  }
}

export async function muxVoiceover(videoBytes: Buffer, mp3Bytes: Buffer): Promise<Buffer> {
  const ws = createTempWorkspace();
  try {
    const videoPath = writeTempFile(ws, "video.mp4", videoBytes);
    const audioPath = writeTempFile(ws, "audio.mp3", mp3Bytes);
    const outPath = join(ws.workDir, "muxed.mp4");
    ws.paths.push(outPath);

    let videoSec = await ffprobeDurationSeconds(videoPath);
    if (!(videoSec > 0)) {
      videoSec = 0.1;
    }
    const durStr = videoSec.toFixed(6);
    const audioSec = await ffprobeDurationSeconds(audioPath);
    console.log(
      `  [ffmpeg] mux voice: video ${videoSec.toFixed(2)}s, voice ${audioSec.toFixed(2)}s → align audio to video`,
    );

    const audioFilter = `[1:a]atrim=start=0:duration=${durStr},aresample=48000:first_pts=0,apad=whole_dur=${durStr}[aout]`;

    await runFfmpeg(
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .complexFilter(audioFilter)
        .outputOptions([
          "-map",
          "0:v:0",
          "-map",
          "[aout]",
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-movflags",
          "+faststart",
        ])
        .output(outPath),
    );

    return readFileSync(outPath);
  } finally {
    rmSync(ws.workDir, { recursive: true, force: true });
  }
}

export async function makeFinalVideo(params: {
  rawVideoMp4: Buffer;
  voiceMp3?: Buffer | null;
}): Promise<Buffer> {
  const mp3 = params.voiceMp3;
  if (mp3 != null && mp3.length > 0) {
    const square = await ensureSquare1080(params.rawVideoMp4);
    return muxVoiceover(square, mp3);
  }
  return ensureSquare1080KeepNativeAudio(params.rawVideoMp4);
}

