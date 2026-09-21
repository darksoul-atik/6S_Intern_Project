import { PostFeed } from "@/features/posts/components/post-feed";

export default function PostsPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Developer Community
          </p>

          <h1 className="mt-2 font-manrope text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Feed
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Latest posts from the DevPulse community.
          </p>
        </div>

        <PostFeed />
      </div>
    </main>
  );
}
