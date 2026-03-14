import React, { useMemo, useState, useEffect, useRef } from 'react';

function normalizeJobStatus(status?: string): string {
  if (!status) return 'queued';
  const s = String(status).toLowerCase();
  if (['queued', 'pending', 'submitted'].includes(s)) return 'queued';
  if (['processing', 'running', 'in_progress', 'working'].includes(s)) return 'running';
  if (['succeeded', 'success', 'completed', 'done'].includes(s)) return 'succeeded';
  if (['failed', 'error'].includes(s)) return 'failed';
  if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
  return s;
}

function getResultUrl(job: any): string | undefined {
  return job.result?.url || job.resultUrl;
}

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { const ok = document.execCommand('copy'); document.body.removeChild(ta); return ok; }
    catch { document.body.removeChild(ta); return false; }
  }
}

type JobCardProps = {
  job: any;
  onUpdate?: (job: any) => void;
  token?: string;
};

const POLL_INTERVAL_MS = 5000;
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export default function JobCard({ job, onUpdate, token }: JobCardProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  const status = useMemo(() => normalizeJobStatus(job.status), [job.status]);
  const resultUrl = useMemo(() => getResultUrl(job), [job]);
  const isActive = status === 'queued' || status === 'running';

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Auto-poll selama job masih aktif
  useEffect(() => {
    if (!isActive || !token || !job.jobId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${encodeURIComponent(job.jobId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || !isMounted.current) return;

        const data = await res.json();
        const updatedStatus = normalizeJobStatus(data.status);

        if (onUpdate && isMounted.current) {
          onUpdate({
            ...job,
            status: updatedStatus,
            result: data.result ?? job.result ?? null,
            resultUrl: data.result?.url || data.resultUrl || job.resultUrl,
            error: data.error ?? job.error ?? null,
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        }

        // Lanjut poll kalau masih aktif
        if ((updatedStatus === 'queued' || updatedStatus === 'running') && isMounted.current) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (isMounted.current) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS * 2);
        }
      }
    };

    timerRef.current = setTimeout(poll, 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [job.jobId, isActive, token]);

  const handleCopy = async () => {
    setCopied(await copyText(job.jobId));
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 ${
      status === 'succeeded' ? 'border-emerald-500/25 bg-emerald-950/10' :
      status === 'failed'    ? 'border-rose-500/25 bg-rose-950/10' :
      isActive               ? 'border-amber-500/30 bg-amber-950/5' :
                               'border-white/10 bg-black/20'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">

          {/* Status + ID row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status === 'succeeded' ? 'bg-emerald-500/15 text-emerald-300' :
              status === 'failed'    ? 'bg-rose-500/15 text-rose-300' :
              status === 'running'   ? 'bg-amber-500/15 text-amber-300' :
                                       'bg-slate-500/15 text-slate-300'
            }`}>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
              {status === 'queued'     ? 'menunggu' :
               status === 'running'   ? 'memproses…' :
               status === 'succeeded' ? 'berhasil' :
               status === 'failed'    ? 'gagal' : status}
            </span>

            <button
              onClick={handleCopy}
              className="text-[10px] font-mono text-white/35 hover:text-white/60 transition-colors truncate max-w-[150px]"
              title={job.jobId}
            >
              {job.jobId?.slice(0, 24)}…
            </button>
            {copied && <span className="text-[10px] text-emerald-400">✓ copied</span>}
          </div>

          {/* Prompt */}
          {job.prompt && (
            <p className="mt-2 line-clamp-2 text-sm font-medium text-white/90">
              {job.prompt}
            </p>
          )}

          {/* Provider + tool */}
          <p className="mt-1 text-xs text-white/40">
            {[job.provider?.toUpperCase(), job.toolType?.toUpperCase()].filter(Boolean).join(' • ')}
          </p>

          {/* Progress bar saat aktif */}
          {isActive && (
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400/50 to-amber-400 animate-pulse"
                style={{ width: '70%' }}
              />
            </div>
          )}

          {/* Error */}
          {job.error && (
            <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {typeof job.error === 'string' ? job.error : job.error?.message ?? 'Error tidak diketahui'}
            </div>
          )}
        </div>

        {/* View button */}
        <button
          onClick={() => resultUrl && window.open(resultUrl, '_blank', 'noopener,noreferrer')}
          disabled={!resultUrl}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            resultUrl
              ? 'bg-primary/80 hover:bg-primary text-white shadow-md'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          View Media
        </button>
      </div>
    </div>
  );
}
