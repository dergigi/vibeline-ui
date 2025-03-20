"use client";

import React from 'react';
import { VoiceMemo } from '@/types/VoiceMemo';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { useState, useRef } from 'react';

interface VoiceMemoCardProps {
  memo: VoiceMemo;
}

export const VoiceMemoCard: React.FC<VoiceMemoCardProps> = ({ memo }) => {
  const [isPlaying, setIsPlaying] = useState(false);
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
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
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
            {memo.filename.replace('.json', '')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(memo.createdAt)}
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
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Summary</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{memo.summary}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transcript</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{memo.transcript}</p>
        </div>

        <audio
          ref={audioRef}
          src={memo.audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    </motion.div>
  );
} 