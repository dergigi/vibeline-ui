import { notFound } from 'next/navigation';
import Link from 'next/link';
import { VoiceMemoCard } from '@/components/VoiceMemoCard';
import { SearchProvider } from '@/contexts/SearchContext';
import type { Metadata } from 'next';

async function getMemo(filename: string) {
  const port = process.env.PORT || '555';
  const response = await fetch(
    new URL(
      `/api/memos/${filename}`,
      typeof window !== 'undefined' ? window.location.protocol + '//' + window.location.host : `http://localhost:${port}`
    ),
    { cache: 'no-store' }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function generateMetadata({ params }: { params: Promise<{ filename: string }> }): Promise<Metadata> {
  const { filename } = await params;
  const memo = await getMemo(filename);

  if (!memo) {
    return {
      title: 'Memo Not Found',
    };
  }

  const title = memo.title || filename;
  return {
    title: title,
  };
}

export default async function MemoPage({ params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const memo = await getMemo(filename);

  if (!memo) {
    notFound();
  }

  return (
    <SearchProvider>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link
              href="/"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              ← Back to all memos
            </Link>
          </div>
          <VoiceMemoCard memo={memo} />
        </div>
      </main>
    </SearchProvider>
  );
} 