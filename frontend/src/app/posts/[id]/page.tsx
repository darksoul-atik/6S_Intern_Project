import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

import { PostDetails } from "@/features/posts/components/post-details";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Dot Texture */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Radiant Glow Orbs */}
      <div
        className="absolute top-12 left-1/4 -translate-x-1/2 w-[550px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-300/30 via-emerald-200/20 to-transparent blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="absolute top-28 right-1/4 translate-x-1/3 w-[600px] h-[520px] rounded-full bg-gradient-to-bl from-emerald-300/25 via-indigo-200/20 to-transparent blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <main className="relative z-10 px-4 sm:px-6 md:px-10 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <Link
            href="/posts"
            className="inline-flex items-center space-x-1.5 sm:space-x-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3 sm:px-3.5 py-2 backdrop-blur-md shadow-xs transition-all"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            <span>Back to feed</span>
          </Link>

          <PostDetails postId={id} />
        </div>
      </main>
    </div>
  );
}
