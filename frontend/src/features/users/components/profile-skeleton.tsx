'use client';

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans text-slate-900 overflow-x-hidden">
      {/* Background Dot Texture */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 px-4 sm:px-6 md:px-10 lg:px-16 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-pulse">
          {/* Top Bar Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-9 w-36 rounded-xl bg-slate-200/80" />
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-28 rounded-xl bg-slate-200/80" />
              <div className="h-9 w-28 rounded-xl bg-slate-200/80" />
            </div>
          </div>

          {/* Hero Header Card Skeleton */}
          <div className="rounded-3xl border border-white/80 bg-white/70 p-6 sm:p-8 md:p-10 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar circle */}
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-slate-200/90 shrink-0" />

              {/* Text lines */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-48 rounded-xl bg-slate-200/90" />
                  <div className="h-6 w-16 rounded-full bg-slate-200/70" />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-4 w-32 rounded-md bg-slate-200/70" />
                  <div className="h-4 w-28 rounded-md bg-slate-200/70" />
                  <div className="h-4 w-40 rounded-md bg-slate-200/70" />
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Skills Card Skeleton */}
            <div className="lg:col-span-1 rounded-3xl border border-white/80 bg-white/70 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="h-5 w-28 rounded-lg bg-slate-200/80" />
                <div className="h-5 w-8 rounded-full bg-slate-200/70" />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <div className="h-7 w-20 rounded-xl bg-slate-200/80" />
                <div className="h-7 w-16 rounded-xl bg-slate-200/80" />
                <div className="h-7 w-24 rounded-xl bg-slate-200/80" />
                <div className="h-7 w-14 rounded-xl bg-slate-200/80" />
                <div className="h-7 w-20 rounded-xl bg-slate-200/80" />
              </div>
            </div>

            {/* Experience Card Skeleton */}
            <div className="lg:col-span-2 rounded-3xl border border-white/80 bg-white/70 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="h-5 w-36 rounded-lg bg-slate-200/80" />
                <div className="h-5 w-12 rounded-full bg-slate-200/70" />
              </div>
              <div className="space-y-6 pt-2">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-slate-200/80 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-44 rounded-md bg-slate-200/80" />
                    <div className="h-4 w-32 rounded-md bg-slate-200/70" />
                    <div className="h-3.5 w-full rounded-md bg-slate-200/60" />
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-slate-200/80 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-40 rounded-md bg-slate-200/80" />
                    <div className="h-4 w-28 rounded-md bg-slate-200/70" />
                    <div className="h-3.5 w-5/6 rounded-md bg-slate-200/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
