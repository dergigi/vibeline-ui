import { getVoiceMemos } from '@/lib/voiceMemos';
import { VoiceMemoCard } from '@/components/VoiceMemoCard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const memos = await getVoiceMemos();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ggpt-ass-t</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gigi&apos;s personal transcription assistant thing
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-1">
          {memos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No voice memos found</p>
            </div>
          ) : (
            memos.map((memo) => (
              <VoiceMemoCard key={memo.id} memo={memo} />
            ))
          )}
        </div>
      </div>
    </main>
  );
} 