'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  Award,
  Filter,
  Download
} from 'lucide-react';
import { HackStackOutput, JudgingCriterion } from '@/types/hackstack';

interface DemoTabProps {
  data: HackStackOutput;
}

type FilterCriterion = 'All' | JudgingCriterion;

export default function DemoTab({ data }: DemoTabProps) {
  // Screen recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rubric Checklist state
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});
  const [filterCriteria, setFilterCriteria] = useState<FilterCriterion>('All');

  const scriptSegments = data.demoKit.scriptSegments || [];
  const checklist = data.demoKit.buildNextChecklist || [];

  // Reset states on project change
  useEffect(() => {
    setCompletedTasks({});
    setRecordingError(null);
    setRecordedVideoUrl(null);
  }, [data.projectName]);

  // Clean up recording timer and stream on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Screen recording handler
  const startScreenRecording = async () => {
    setRecordingError(null);
    setRecordedVideoUrl(null);

    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getDisplayMedia
      ) {
        setRecordingError('Screen recording is not supported in this browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      streamRef.current = stream;
      recordedChunksRef.current = [];

      // Detect supported mimeType
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
        setIsRecording(false);
        setSecondsRemaining(60);

        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);

          // Trigger automatic download
          const a = document.createElement('a');
          a.href = url;
          const slug = data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          a.download = `${slug}-60s-demo-walkthrough.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };

      // Handle stream track ending prematurely (e.g. user clicked browser native Stop sharing)
      stream.getVideoTracks()[0].onended = () => {
        stopScreenRecording();
      };

      recorder.start(1000); // 1-second chunks
      setIsRecording(true);
      setSecondsRemaining(60);

      timerIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            stopScreenRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setRecordingError('Screen recording permission was cancelled by user.');
        } else {
          setRecordingError(`Could not start screen recording: ${err.message}`);
        }
      } else {
        setRecordingError('Failed to initialize screen recording.');
      }
      setIsRecording(false);
    }
  };

  const stopScreenRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setIsRecording(false);
  };

  // Determine active teleprompter segment when recording (0 to 60s elapsed)
  const elapsedSeconds = 60 - secondsRemaining;
  const activeSegmentIndex = isRecording ? Math.min(3, Math.floor(elapsedSeconds / 15)) : -1;

  // Toggle checklist task completion
  const handleToggleTask = (priority: number) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [priority]: !prev[priority]
    }));
  };

  // Filter checklist
  const filteredChecklist = checklist.filter((item) => {
    if (filterCriteria === 'All') return true;
    return item.judgingCriteria === filterCriteria;
  });

  // Calculate judge readiness score
  const totalTasksCount = checklist.length || 1;
  const completedCount = checklist.filter((item) => completedTasks[item.priority]).length;
  const readinessScore = Math.round((completedCount / totalTasksCount) * 100);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      {/* Top Header with Recording Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
              60s Demo Kit & Judge Rubric Checklist
            </h2>
            <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
              CoNSTruct Model
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            4-part timestamped voiceover script and ranked checklist tuned to what hackathon judges reward.
          </p>
        </div>

        {/* Screen Recording Trigger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={isRecording ? stopScreenRecording : startScreenRecording}
            className={`font-semibold text-xs sm:text-sm py-2 px-4 rounded-lg flex items-center gap-2 transition active:scale-95 shadow-lg shrink-0 ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse'
                : 'bg-[#10B981] hover:bg-[#10B981]/90 text-[#090D16] shadow-[#10B981]/20'
            }`}
          >
            {isRecording ? (
              <>
                <StopCircle className="w-4 h-4" />
                <span>Stop Recording ({secondsRemaining}s remaining)</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Start 60s Screen Recording</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Screen Recording Error Banner */}
      {recordingError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm px-4 py-3 rounded-xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{recordingError}</span>
        </div>
      )}

      {/* Recording Success Banner */}
      {recordedVideoUrl && !isRecording && (
        <div className="bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs sm:text-sm px-4 py-3 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>60-second walkthrough recorded and saved as .webm</span>
          </div>
          <a
            href={recordedVideoUrl}
            download={`${data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-60s-demo.webm`}
            className="flex items-center gap-1 font-semibold underline text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Re-download
          </a>
        </div>
      )}

      {/* SECTION 1: 60-Second Teleprompter Script */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F8FAFC]">
              60-Second Timed Stage Teleprompter
            </h3>
          </div>
          {isRecording && (
            <span className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Recording Active • Segment {activeSegmentIndex + 1} of 4 ({elapsedSeconds}s)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scriptSegments.map((segment, idx) => {
            const isCurrentlyActive = isRecording && activeSegmentIndex === idx;
            return (
              <div
                key={idx}
                className={`border rounded-xl p-4 sm:p-5 flex flex-col gap-3 transition shadow-sm ${
                  isCurrentlyActive
                    ? 'bg-[#10B981]/10 border-[#10B981] shadow-lg shadow-[#10B981]/15 ring-1 ring-[#10B981]'
                    : 'bg-[#0F172A] border-[#1E293B] hover:border-[#334155]'
                }`}
              >
                {/* Segment Header */}
                <div className="flex items-center justify-between border-b border-[#1E293B]/70 pb-2.5">
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                      isCurrentlyActive
                        ? 'bg-[#10B981] text-[#090D16] border-[#10B981]'
                        : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                    }`}
                  >
                    ⏱️ {segment.timeRange}
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    Segment {idx + 1} of {scriptSegments.length}
                  </span>
                </div>

                {/* Visual screen action cue */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-mono font-semibold">
                    Visual Screen Action:
                  </span>
                  <p className="text-xs text-[#CBD5E1] font-sans leading-relaxed">
                    {segment.visualAction}
                  </p>
                </div>

                {/* Voiceover text */}
                <div className="bg-[#090D16]/70 border border-[#1E293B]/80 rounded-lg p-3 mt-auto">
                  <span className="text-[10px] uppercase tracking-wider text-[#10B981] font-mono font-semibold block mb-0.5">
                    Voiceover Delivery:
                  </span>
                  <p className="text-xs text-[#E2E8F0] italic font-sans leading-relaxed">
                    &ldquo;{segment.voiceover}&rdquo;
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Ranked CoNSTruct "Build Next" Rubric Checklist */}
      <div className="flex flex-col gap-5 pt-4 border-t border-[#1E293B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F8FAFC]">
              Ranked &ldquo;Build Next&rdquo; Rubric Checklist
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            {(['All', 'Product Thinking', 'Innovation', 'Use of AI', 'Feasibility'] as FilterCriterion[]).map(
              (criterion) => (
                <button
                  key={criterion}
                  type="button"
                  onClick={() => setFilterCriteria(criterion)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition ${
                    filterCriteria === criterion
                      ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-semibold'
                      : 'bg-[#0F172A] text-[#94A3B8] border border-[#1E293B] hover:text-[#F8FAFC]'
                  }`}
                >
                  {criterion}
                </button>
              )
            )}
          </div>
        </div>

        {/* Live Judge Readiness Score Progress Bar */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#94A3B8] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#10B981]" />
              Judge Readiness Score:
            </span>
            <span className="text-[#10B981] font-bold">
              {readinessScore}% ({completedCount}/{totalTasksCount} tasks validated)
            </span>
          </div>

          <div className="w-full bg-[#131C2E] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
            <div
              className="bg-gradient-to-r from-[#10B981]/70 to-[#10B981] h-full rounded-full transition-all duration-300"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
        </div>

        {/* Checklist Cards */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden divide-y divide-[#1E293B]/70 shadow-sm">
          {filteredChecklist.map((item) => {
            const isChecked = !!completedTasks[item.priority];
            return (
              <div
                key={item.priority}
                onClick={() => handleToggleTask(item.priority)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition cursor-pointer select-none ${
                  isChecked ? 'bg-[#10B981]/5' : 'hover:bg-[#131C2E]/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Interactive Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleTask(item.priority)}
                    className="w-4 h-4 rounded border-[#1E293B] bg-[#090D16] text-[#10B981] focus:ring-0 focus:ring-offset-0 mt-0.5 cursor-pointer accent-[#10B981]"
                  />

                  {/* Priority Number Badge */}
                  <span className="w-6 h-6 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                    {item.priority}
                  </span>

                  <div>
                    <p
                      className={`text-xs sm:text-sm font-medium transition ${
                        isChecked ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'
                      }`}
                    >
                      {item.task}
                    </p>
                    <span className="text-[11px] text-[#94A3B8] font-mono mt-0.5 inline-block">
                      Impact: <strong className="text-[#10B981]">{item.impactScore}</strong>
                    </span>
                  </div>
                </div>

                {/* Judging Criteria Tag */}
                <span className="self-start sm:self-auto px-2.5 py-1 rounded bg-[#131C2E] border border-[#1E293B] text-[11px] font-mono text-[#10B981] whitespace-nowrap">
                  {item.judgingCriteria}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
