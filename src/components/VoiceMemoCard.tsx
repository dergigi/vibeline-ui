"use client";

import React from 'react';
import { VoiceMemo } from '@/types/VoiceMemo';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, ClipboardIcon, CheckIcon, ShareIcon, DocumentIcon } from '@heroicons/react/24/solid';
import { useState, useRef } from 'react';
import { useSearch } from '@/contexts/SearchContext';

interface VoiceMemoCardProps {
  memo: VoiceMemo;
}

export const VoiceMemoCard: React.FC<VoiceMemoCardProps> = ({ memo }) => {
  const { setSearchTerm } = useSearch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasTodos = memo.summary?.split('\n').some(line => line.trim().startsWith('- [ ]')) ?? false;

  const togglePlayPause = (): void => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  };

  const handleLoadedMetadata = (): void => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatShortDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).length;
  };

  const extractHashtags = (text: string): string[] => {
    // Common words to filter out
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
      'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
      'should', 'could', 'was', 'were', 'is', 'am', 'are', 'been', 'being', 'had', 'has', 'did', 'doing', 'does'
    ]);

    // Split into words, convert to lowercase, remove punctuation
    const words = text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3) // Only words longer than 3 characters
      .filter(word => !stopWords.has(word)); // Remove stop words

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Sort by frequency and get top 3
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  };

  const handleCopyTodos = async (): Promise<void> => {
    if (memo.summary) {
      try {
        // Extract only the task lines (lines starting with "- [ ]")
        const tasks = memo.summary
          .split('\n')
          .filter(line => line.trim().startsWith('- [ ]'))
          .join('\n');
        
        if (tasks) {
          await navigator.clipboard.writeText(tasks);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleHashtagClick = (tag: string): void => {
    setSearchTerm(`#${tag}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {formatTimeAgo(memo.createdAt)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatShortDate(memo.createdAt)}
            {duration && ` · ${formatDuration(duration)}`}
            {memo.transcript && ` · ${countWords(memo.transcript)} words`}
          </p>
        </div>
        <button
          onClick={togglePlayPause}
          className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors duration-200"
        >
          {isPlaying ? (
            <PauseIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <PlayIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          )}
        </button>
      </div>

      <div className="space-y-4">
        {memo.summary && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {memo.summary.trim()}
            </p>
          </div>
        )}

        {memo.transcript && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Transcript
                </h4>
                <button className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                  <ArrowPathIcon className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isTranscriptExpanded ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className={`text-sm text-gray-600 dark:text-gray-400 ${isTranscriptExpanded ? '' : 'line-clamp-3'}`}>
              {memo.transcript}
            </p>
          </div>
        )}

        <audio
          ref={audioRef}
          src={memo.audioUrl}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={handleLoadedMetadata}
          className="hidden"
        />

        <div className="flex flex-col gap-4 mt-4 pt-4">
          <div className="flex justify-between items-end">
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1">
                <ShareIcon className="w-3 h-3" />
                <span>share</span>
              </button>
              <button className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1">
                <DocumentIcon className="w-3 h-3" />
                <span>draft</span>
              </button>
              {hasTodos && (
                <button 
                  onClick={handleCopyTodos}
                  className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                >
                  {isCopied ? (
                    <>
                      <CheckIcon className="w-3 h-3" />
                      <span>copied!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardIcon className="w-3 h-3" />
                      <span>TODOs</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {memo.transcript && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {extractHashtags(memo.transcript).map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleHashtagClick(tag)}
                    className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 