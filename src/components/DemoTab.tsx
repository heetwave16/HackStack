'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Award, CheckCircle2, Circle, Download, Filter, StopCircle, Video } from 'lucide-react';
import { HackStackOutput, JudgingCriterion } from '@/types/hackstack';
import { buildProjectSlug } from '@/lib/packager';

interface DemoTabProps {
  data: HackStackOutput;
}

type FilterCriterion = 'All' | JudgingCriterion;

const FILTERS: FilterCriterion[] = ['All', 'Product Thinking', 'Innovation', 'Use of AI', 'Feasibility'];
const RECORDING_SECONDS = 60;
const SEGMENT_SECONDS = 15;

export default function DemoTab({ data }: DemoTabProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(RECORDING_SECONDS);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedVideoUrlRef = useRef<string | null>(null);

  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});
  const [filterCriteria, setFilterCriteria] = useState<FilterCriterion>('All');

  const scriptSegments = data.demoKit.scriptSegments;
  const checklist = data.demoKit.buildNextChecklist;
  const fileSlug = buildProjectSlug(data.projectName);

  useEffect(() => {
    setCompletedTasks({});
    setRecordingError(null);
    if (recordedVideoUrlRef.current) URL.revokeObjectURL(recordedVideoUrlRef.current);
    recordedVideoUrlRef.current = null;
    setRecordedVideoUrl(null);
  }, [data.projectName]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordedVideoUrlRef.current) URL.revokeObjectURL(recordedVideoUrlRef.current);
    };
  }, []);

  const stopTimerAndStream = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const stopScreenRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    stopTimerAndStream();
    setIsRecording(false);
  };

  const startScreenRecording = async () => {
    setRecordingError(null);
    if (recordedVideoUrlRef.current) URL.revokeObjectURL(recordedVideoUrlRef.current);
    recordedVideoUrlRef.current = null;
    setRecordedVideoUrl(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      setRecordingError('Screen recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      streamRef.current = stream;
      recordedChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stopTimerAndStream();
        setIsRecording(false);
        setSecondsRemaining(RECORDING_SECONDS);
        if (recordedChunksRef.current.length === 0) {
          setRecordingError('The recording was empty. Try again and keep the window open for the full minute.');
          return;
        }
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        recordedVideoUrlRef.current = url;
        setRecordedVideoUrl(url);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${fileSlug}-60s-demo.webm`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      };

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.onended = () => stopScreenRecording();

      recorder.start(1000);
      setIsRecording(true);
      setSecondsRemaining(RECORDING_SECONDS);
      timerIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Screen sharing was cancelled. Click record again to allow it.'
          : 'Could not start the screen recording. Check that your browser allows screen capture.';
      setRecordingError(message);
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (isRecording && secondsRemaining === 0) stopScreenRecording();
    // stopScreenRecording only reads refs and setters, so it is safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, secondsRemaining]);

  const elapsedSeconds = RECORDING_SECONDS - secondsRemaining;
  const activeSegmentIndex = isRecording ? Math.min(scriptSegments.length - 1, Math.floor(elapsedSeconds / SEGMENT_SECONDS)) : -1;

  const toggleTask = (priority: number) => {
    setCompletedTasks((prev) => ({ ...prev, [priority]: !prev[priority] }));
  };

  const visibleChecklist = checklist.filter((item) => filterCriteria === 'All' || item.judgingCriteria === filterCriteria);
  const completedCount = checklist.filter((item) => completedTasks[item.priority]).length;
  const readinessScore = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">60-second demo</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">Record, read, and judge</h2>
          <p className="mt-1 text-sm text-fg-3">Follow the script while you record, then clear the rubric before you pitch.</p>
        </div>
      </div>

      {recordingError && (
        <div role="alert" className="flex items-start gap-2.5 rounded border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
          <span>{recordingError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="recorder-heading" className="flex flex-col gap-4 rounded-lg border border-line bg-surface-1 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 id="recorder-heading" className="font-mono text-xs uppercase tracking-wider text-fg-2">
              Recorder
            </h3>
            {isRecording ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-danger" aria-live="polite">
                <span className="h-2 w-2 animate-pulse rounded-full bg-danger" aria-hidden="true" />
                REC {String(elapsedSeconds).padStart(2, '0')}s
              </span>
            ) : (
              <span className="font-mono text-xs text-fg-3">Idle</span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 rounded border border-line bg-surface-0 px-6 py-10 text-center">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-150 ease-linear motion-reduce:transition-none"
                style={{ width: `${(elapsedSeconds / RECORDING_SECONDS) * 100}%` }}
              />
            </div>
            <p className="text-sm text-fg-2">
              {isRecording
                ? 'Keep the demo window in view. The recording stops on its own after 60 seconds.'
                : 'Share a window or tab, then read the script on the right. The file downloads when you stop.'}
            </p>
            <button
              type="button"
              onClick={isRecording ? stopScreenRecording : () => void startScreenRecording()}
              className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold transition-colors ${
                isRecording ? 'bg-danger text-surface-0 hover:opacity-90' : 'bg-accent text-surface-0 hover:bg-accent-hover'
              }`}
            >
              {isRecording ? <StopCircle className="h-4 w-4" aria-hidden="true" /> : <Video className="h-4 w-4" aria-hidden="true" />}
              {isRecording ? 'Stop recording' : 'Start 60s recording'}
            </button>
          </div>

          {recordedVideoUrl && !isRecording && (
            <div className="flex items-center justify-between gap-3 rounded border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-fg">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                Saved as a .webm file
              </span>
              <a
                href={recordedVideoUrl}
                download={`${fileSlug}-60s-demo.webm`}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-fg underline underline-offset-4 hover:text-accent"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download again
              </a>
            </div>
          )}
        </section>

        <section aria-labelledby="teleprompter-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h3 id="teleprompter-heading" className="font-mono text-xs uppercase tracking-wider text-fg-2">
              Teleprompter
            </h3>
            <span className="font-mono text-xs text-fg-3">
              {isRecording && activeSegmentIndex >= 0
                ? `Segment ${activeSegmentIndex + 1} of ${scriptSegments.length}`
                : `${scriptSegments.length} segments`}
            </span>
          </div>

          <ol className="flex flex-col gap-2">
            {scriptSegments.map((segment, idx) => {
              const isActive = activeSegmentIndex === idx;
              return (
                <li
                  key={segment.timeRange + idx}
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex flex-col gap-2 rounded border p-4 transition-colors duration-150 ${
                    isActive ? 'border-accent/60 bg-accent/10' : 'border-line bg-surface-1'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`font-mono text-xs ${isActive ? 'text-accent' : 'text-fg-3'}`}>{segment.timeRange}</span>
                    <span className="font-mono text-xs text-fg-3">
                      {String(idx + 1).padStart(2, '0')} / {String(scriptSegments.length).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="border-l-2 border-accent pl-3 text-base leading-relaxed text-fg">{segment.voiceover}</p>
                  <p className="text-sm leading-relaxed text-fg-3">
                    <span className="font-mono text-xs uppercase tracking-wider text-fg-3">On screen: </span>
                    {segment.visualAction}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section aria-labelledby="rubric-heading" className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h3 id="rubric-heading" className="font-mono text-xs uppercase tracking-wider text-fg-2">
              Rubric and build-next list
            </h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-fg-2">
              <Award className="h-4 w-4 text-accent" aria-hidden="true" />
              Judge readiness {readinessScore}% ({completedCount} of {checklist.length} done)
            </p>
          </div>
          <div role="group" aria-label="Filter by judging criterion" className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-1 h-3.5 w-3.5 text-fg-3" aria-hidden="true" />
            {FILTERS.map((criterion) => {
              const isActive = filterCriteria === criterion;
              return (
                <button
                  key={criterion}
                  type="button"
                  onClick={() => setFilterCriteria(criterion)}
                  aria-pressed={isActive}
                  className={`rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
                    isActive ? 'border-accent/60 bg-accent/10 text-accent' : 'border-line bg-surface-1 text-fg-2 hover:text-fg'
                  }`}
                >
                  {criterion}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-label="Judge readiness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={readinessScore}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${readinessScore}%` }} />
        </div>

        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface-1">
          {visibleChecklist.length === 0 && (
            <li className="p-5 text-sm text-fg-3">No tasks match this criterion. Choose All to see the full list.</li>
          )}
          {visibleChecklist.map((item) => {
            const isChecked = !!completedTasks[item.priority];
            return (
              <li key={item.priority}>
                <label className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <span className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTask(item.priority)}
                      className="sr-only"
                    />
                    {isChecked ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-fg-3" aria-hidden="true" />
                    )}
                    <span className="flex flex-col gap-1">
                      <span className={`text-sm font-medium leading-relaxed ${isChecked ? 'text-fg-3 line-through' : 'text-fg'}`}>
                        <span className="mr-2 font-mono text-accent">{item.priority}.</span>
                        {item.task}
                      </span>
                      <span className="font-mono text-xs text-fg-3">Impact: {item.impactScore}</span>
                    </span>
                  </span>
                  <span className="self-start whitespace-nowrap rounded border border-line px-2 py-0.5 font-mono text-xs text-fg-2 sm:self-auto">
                    {item.judgingCriteria}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
