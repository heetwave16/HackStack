'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Award, CheckCircle2, Download, Filter, StopCircle, Video } from 'lucide-react';
import { HackStackOutput, JudgingCriterion } from '@/types/hackstack';
import { buildProjectSlug } from '@/lib/packager';

interface DemoTabProps {
  data: HackStackOutput;
}

type FilterCriterion = 'All' | JudgingCriterion;

const FILTERS: FilterCriterion[] = ['All', 'Product Thinking', 'Innovation', 'Use of AI', 'Feasibility'];
const RECORDING_SECONDS = 60;

export default function DemoTab({ data }: DemoTabProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(RECORDING_SECONDS);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});
  const [filterCriteria, setFilterCriteria] = useState<FilterCriterion>('All');

  const scriptSegments = data.demoKit.scriptSegments;
  const checklist = data.demoKit.buildNextChecklist;
  const fileSlug = buildProjectSlug(data.projectName);

  useEffect(() => {
    setCompletedTasks({});
    setRecordingError(null);
    setRecordedVideoUrl(null);
  }, [data.projectName]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
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
  const activeSegmentIndex = isRecording ? Math.min(scriptSegments.length - 1, Math.floor(elapsedSeconds / 15)) : -1;

  const toggleTask = (priority: number) => {
    setCompletedTasks((prev) => ({ ...prev, [priority]: !prev[priority] }));
  };

  const visibleChecklist = checklist.filter((item) => filterCriteria === 'All' || item.judgingCriteria === filterCriteria);
  const completedCount = checklist.filter((item) => completedTasks[item.priority]).length;
  const readinessScore = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <div className="flex flex-col gap-4 border-b border-[#1E293B] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#10B981]">60-second demo</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#F8FAFC] sm:text-2xl">Script, recording, and rubric</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">Read the four timed segments while you record. Then work through the checklist before judging.</p>
        </div>
        <button
          type="button"
          onClick={isRecording ? stopScreenRecording : () => void startScreenRecording()}
          className={`flex shrink-0 items-center gap-2 self-start rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:self-auto ${
            isRecording ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-[#10B981] text-[#090D16] hover:bg-[#34D399]'
          }`}
        >
          {isRecording ? <StopCircle className="h-4 w-4" aria-hidden="true" /> : <Video className="h-4 w-4" aria-hidden="true" />}
          {isRecording ? `Stop recording (${secondsRemaining}s left)` : 'Start 60s screen recording'}
        </button>
      </div>

      {recordingError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-md border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
          <span>{recordingError}</span>
        </div>
      )}

      {recordedVideoUrl && !isRecording && (
        <div className="flex flex-col gap-3 rounded-md border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#A7F3D0] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>The walkthrough was saved as a .webm file.</span>
          </div>
          <a
            href={recordedVideoUrl}
            download={`${fileSlug}-60s-demo.webm`}
            className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#F8FAFC] underline underline-offset-4"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download again
          </a>
        </div>
      )}

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-[#94A3B8]">Teleprompter</h3>
          {isRecording && (
            <span className="font-mono text-xs text-rose-300">
              Segment {activeSegmentIndex + 1} of {scriptSegments.length} - {elapsedSeconds}s elapsed
            </span>
          )}
        </div>

        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#1E293B] bg-[#1E293B] md:grid-cols-2">
          {scriptSegments.map((segment, idx) => {
            const isActive = activeSegmentIndex === idx;
            return (
              <li key={segment.timeRange + idx} className={`flex flex-col gap-4 p-5 sm:p-6 ${isActive ? 'bg-[#10B981]/10' : 'bg-[#0D1322]'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs ${isActive ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>{segment.timeRange}</span>
                  <span className="font-mono text-[11px] text-[#64748B]">
                    {String(idx + 1).padStart(2, '0')} / {String(scriptSegments.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">On screen</span>
                  <p className="text-sm leading-relaxed text-[#CBD5E1]">{segment.visualAction}</p>
                </div>

                <div className="mt-auto flex flex-col gap-1.5 border-l-2 border-[#10B981] pl-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#10B981]">Voiceover</span>
                  <p className="text-sm leading-relaxed text-[#F8FAFC]">{segment.voiceover}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-[#94A3B8]">Build next, ranked</h3>
            <p className="mt-1 flex items-center gap-2 text-sm text-[#CBD5E1]">
              <Award className="h-4 w-4 text-[#10B981]" aria-hidden="true" />
              Judge readiness {readinessScore}% ({completedCount} of {checklist.length} done)
            </p>
          </div>
          <div role="group" aria-label="Filter by judging criterion" className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-1 h-3.5 w-3.5 text-[#64748B]" aria-hidden="true" />
            {FILTERS.map((criterion) => {
              const isActive = filterCriteria === criterion;
              return (
                <button
                  key={criterion}
                  type="button"
                  onClick={() => setFilterCriteria(criterion)}
                  aria-pressed={isActive}
                  className={`rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                    isActive
                      ? 'border-[#10B981]/60 bg-[#10B981]/10 text-[#10B981]'
                      : 'border-[#1E293B] bg-[#0F172A] text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {criterion}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-[#1E293B]">
          <div className="h-full rounded-full bg-[#10B981] transition-[width] duration-300" style={{ width: `${readinessScore}%` }} />
        </div>

        <ul className="divide-y divide-[#1E293B] overflow-hidden rounded-xl border border-[#1E293B] bg-[#0D1322]">
          {visibleChecklist.map((item) => {
            const isChecked = !!completedTasks[item.priority];
            return (
              <li key={item.priority}>
                <label className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-[#131C2E]/60 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <span className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTask(item.priority)}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[#10B981]"
                    />
                    <span className="flex flex-col gap-1">
                      <span className={`text-sm font-medium leading-relaxed ${isChecked ? 'text-[#64748B] line-through' : 'text-[#F8FAFC]'}`}>
                        <span className="mr-2 font-mono text-[#10B981]">{item.priority}.</span>
                        {item.task}
                      </span>
                      <span className="font-mono text-[11px] text-[#94A3B8]">Impact: {item.impactScore}</span>
                    </span>
                  </span>
                  <span className="self-start whitespace-nowrap rounded border border-[#1E293B] px-2 py-0.5 font-mono text-[11px] text-[#CBD5E1] sm:self-auto">
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
