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
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/posts"
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/4 hover:text-indigo-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>

        <PostDetails postId={id} />
      </div>
    </main>
  );
}
