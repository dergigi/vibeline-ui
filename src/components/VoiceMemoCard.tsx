"use client";

import React from 'react';
import { VoiceMemo } from '@/types/VoiceMemo';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, CheckIcon, ShareIcon, SparklesIcon, ClipboardDocumentCheckIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { useState, useRef } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { DraftEditor } from './DraftEditor';

interface VoiceMemoCardProps {
  memo: VoiceMemo;
}

export const VoiceMemoCard: React.FC<VoiceMemoCardProps> = ({ memo }) => {
  const { setSearchTerm } = useSearch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isTodosExpanded, setIsTodosExpanded] = useState(false);
  const [isPromptsExpanded, setIsPromptsExpanded] = useState(false);
  const [isDraftsExpanded, setIsDraftsExpanded] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [isTodosCopied, setIsTodosCopied] = useState(false);
  const [isPromptsCopied, setIsPromptsCopied] = useState(false);
  const [showDraftEditor, setShowDraftEditor] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const SPEED_OPTIONS = [1, 1.5, 2, 3];

  const hasTodos = memo.todos?.trim().length > 0;
  const hasPrompts = memo.prompts?.trim().length > 0;
  const hasDrafts = memo.drafts?.trim().length > 0;

  const countTodos = (todos: string): number => {
    return todos.trim().split('\n').filter(line => line.trim().length > 0).length;
  };

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

  const togglePlaybackSpeed = (): void => {
    if (audioRef.current) {
      const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
      const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
      const newSpeed = SPEED_OPTIONS[nextIndex];
      audioRef.current.playbackRate = newSpeed;
      setPlaybackSpeed(newSpeed);
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
    
    // If years are different, return the formatted date with year
    if (date.getFullYear() !== now.getFullYear()) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    }

    // For same year, check if it's today/yesterday
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffInDays = Math.floor((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).length;
  };

  const getLastParagraph = (text: string): string => {
    const paragraphs = text.trim().split(/\n\s*\n/);
    return paragraphs[paragraphs.length - 1];
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
    if (memo.todos) {
      try {
        await navigator.clipboard.writeText(memo.todos);
        setIsTodosCopied(true);
        setTimeout(() => setIsTodosCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleCopyPrompts = async (): Promise<void> => {
    if (memo.prompts) {
      try {
        await navigator.clipboard.writeText(memo.prompts);
        setIsPromptsCopied(true);
        setTimeout(() => setIsPromptsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleHashtagClick = (tag: string): void => {
    setSearchTerm(tag);
  };

  const handleShare = async (): Promise<void> => {
    try {
      const response = await fetch('/api/open-in-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: memo.filename }),
      });

      if (!response.ok) {
        throw new Error('Failed to open file in Finder');
      }
    } catch (error) {
      console.error('Error opening file in Finder:', error);
    }
  };

  return (
    <>
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
          <div className="flex items-center gap-1">
            <button
              onClick={togglePlaybackSpeed}
              className={`px-1.5 py-0.5 rounded-md transition-colors text-[10px] ${
                playbackSpeed > 1
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              title="Click to change playback speed"
            >
              {playbackSpeed}x
            </button>
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
        </div>

        <div className="space-y-4">
          {memo.transcript && (
            <div>
              <div 
                className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 rounded px-1"
                onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transcript
                  </h4>
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                    <ArrowPathIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {isTranscriptExpanded ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </div>
              </div>
              <p className={`text-sm text-gray-600 dark:text-gray-400 ${isTranscriptExpanded ? '' : 'line-clamp-5'}`}>
                {memo.transcript}
              </p>
            </div>
          )}

          {memo.summary && (
            <div>
              <div 
                className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 rounded px-1"
                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              >
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Summary
                </h4>
                <div className="text-gray-500 dark:text-gray-400">
                  {isSummaryExpanded ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </div>
              </div>
              <p className={`text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line`}>
                {isSummaryExpanded ? memo.summary.trim() : getLastParagraph(memo.summary)}
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
            {hasTodos && (
              <div>
                <div 
                  className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 rounded px-1"
                  onClick={() => setIsTodosExpanded(!isTodosExpanded)}
                >
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    TODOs ({memo.todos ? countTodos(memo.todos) : 0})
                  </h4>
                  <div className="flex items-center gap-1">
                    <div className="text-gray-500 dark:text-gray-400">
                      {isTodosExpanded ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyTodos();
                      }}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                    >
                      {isTodosCopied ? (
                        <>
                          <CheckIcon className="w-3 h-3" />
                          <span>copied!</span>
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentCheckIcon className="w-3 h-3" />
                          <span>copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {isTodosExpanded && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {memo.todos.trim()}
                  </p>
                )}
              </div>
            )}

            {hasPrompts && (
              <div>
                <div 
                  className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 rounded px-1"
                  onClick={() => setIsPromptsExpanded(!isPromptsExpanded)}
                >
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Prompt
                  </h4>
                  <div className="flex items-center gap-1">
                    <div className="text-gray-500 dark:text-gray-400">
                      {isPromptsExpanded ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPrompts();
                      }}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                    >
                      {isPromptsCopied ? (
                        <>
                          <CheckIcon className="w-3 h-3" />
                          <span>copied!</span>
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-3 h-3" />
                          <span>copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {isPromptsExpanded && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {memo.prompts.trim()}
                  </p>
                )}
              </div>
            )}

            {hasDrafts && (
              <div>
                <div 
                  className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 rounded px-1"
                  onClick={() => setIsDraftsExpanded(!isDraftsExpanded)}
                >
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Draft
                  </h4>
                  <div className="flex items-center gap-1">
                    <div className="text-gray-500 dark:text-gray-400">
                      {isDraftsExpanded ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDraftEditor(true);
                      }}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                    >
                      <PencilSquareIcon className="w-3 h-3" />
                      <span>edit</span>
                    </button>
                  </div>
                </div>
                {isDraftsExpanded && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {memo.drafts.trim()}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                {memo.transcript && (
                  <div className="flex gap-1.5 flex-wrap">
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
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShare}
                  className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 min-w-[80px] justify-center"
                >
                  <ShareIcon className="w-3 h-3" />
                  <span>share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {showDraftEditor && (
        <DraftEditor
          initialContent={memo.drafts || ''}
          onClose={() => setShowDraftEditor(false)}
        />
      )}
    </>
  );
} 