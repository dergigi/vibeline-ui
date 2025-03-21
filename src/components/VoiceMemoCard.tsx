"use client";

import React from 'react';
import { VoiceMemo } from '@/types/VoiceMemo';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { useState, useRef } from 'react';

interface VoiceMemoCardProps {
  memo: VoiceMemo;
}

export const VoiceMemoCard: React.FC<VoiceMemoCardProps> = ({ memo }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {formatDate(memo.createdAt)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatTimeAgo(memo.createdAt)}
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
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Summary</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {memo.summary.trim()}
            </p>
          </div>
        )}

        {memo.transcript && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Transcript</h4>
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
          className="hidden"
        />

        <div className="flex gap-2 mt-4 pt-4">
          <button className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            share with friend
          </button>
          <button className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            post to nostr
          </button>
          <button className="text-xs px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            extract TODOs
          </button>
        </div>
      </div>
    </motion.div>
  );
} 