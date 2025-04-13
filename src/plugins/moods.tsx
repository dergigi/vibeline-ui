'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  description: string;
  energy: 'high' | 'low';
  pleasant: boolean;
  color: MoodColor;
  content: string;
  transcript?: string;
}

type MoodColor = 'red' | 'yellow' | 'blue' | 'green';

type EmotionCategory = {
  label: string;
  emotions: Record<string, string>;
}

type EmotionsType = Record<MoodColor, EmotionCategory>;

interface MoodsPluginProps {
  files: {
    name: string;
    path: string;
    content?: string;
    transcript?: string;
  }[];
}

const EMOTIONS: EmotionsType = {
  yellow: {
    label: "High Energy Pleasant",
    emotions: {
      "Alert": "feeling awake and focused",
      "Alive": "filled with energy and vitality",
      "Absorbed": "fully focused and interested",
      "Accomplished": "feeling effective and successful",
      "Adoring": "feeling a deep love or respect for something or someone",
      "Attentive": "focused on what you're doing",
      "Buoyant": "feeling cheerful and lively",
      "Challenged": "feeling pushed to reach a higher goal",
      "Chatty": "feeling like talking in a friendly, informal way",
      "Cheerful": "full of happy feelings",
      "Competent": "feeling capable of doing something successfully",
      "Confident": "feeling sure of yourself",
      "Curious": "interested in learning something",
      "Determined": "knowing what you want and not letting anything stand in the way",
      "Delighted": "feeling lifted by joy",
      "Desire": "wishing or longing for something or someone",
      "Eager": "impatiently wanting to do or get something",
      "Ecstatic": "feeling the greatest amount of joy or happiness",
      "Elated": "very joyful, proud, or enthusiastic",
      "Empowered": "feeling stronger or more confident due to someone or something that happened",
      "Enchanted": "filled with delight",
      "Encouraged": "feeling supported and hopeful with a sense of increasing confidence",
      "Energized": "feeling like you are wide awake and ready to get up and go",
      "Engaged": "paying full attention or participating fully in something",
      "Engrossed": "fully focused on someone or something"
    }
  },
  green: {
    label: "Low Energy Pleasant",
    emotions: {
      "Accepted": "feeling acknowledged and seen",
      "Affectionate": "feeling or showing fondness",
      "Appreciated": "feeling recognized and worthy",
      "At Ease": "feeling content and comfortable",
      "Balanced": "feeling stable and satisfied",
      "Blessed": "feeling thankful and fortunate for what you have",
      "Blissful": "feeling full of joy",
      "Calm": "feeling free of stress, agitation, and worry",
      "Carefree": "feeling free of worry and lighthearted",
      "Chill": "feeling relaxed and easygoing",
      "Clear": "the feeling that you can perceive, understand, or interpret events or situations you are facing",
      "Comfortable": "feeling reassured both in mind and body",
      "Compassionate": "showing care and concern for someone",
      "Connected": "feeling close to someone or part of a community",
      "Contemplative": "a reflective and thoughtful state, usually for a prolonged time",
      "Content": "feeling complete and like you are enough",
      "Copacetic": "feeling agreeable and free of problems",
      "Fulfilled": "feeling like you have accomplished important personal goals or have become the person you want to be"
    }
  },
  blue: {
    label: "Low Energy Unpleasant",
    emotions: {
      "Abandoned": "feeling left behind and not considered, wanted, or cared about",
      "Alienated": "feeling like you have been made a stranger to others, like they have no feelings or affection towards you",
      "Apathetic": "lacking enthusiasm or interest",
      "Ashamed": "feeling lower self-worth as a result of who you are or what you did",
      "Avoidant": "unwilling to face or engage with someone or something",
      "Bereft": "suffering a loss of someone or something",
      "Betrayed": "feeling hurt when someone breaks your trust",
      "Bleh": "feeling indifference or mild discomfort",
      "Blue": "feeling sad, gloom, or dispirited",
      "Bored": "lacking interest in something or someone",
      "Brooding": "preoccupied with depressing or painful thoughts",
      "Burdened": "feeling encumbered by and responsible for something or someone",
      "Burned Out": "feeling exhausted from ongoing stress",
      "Cancelled": "feeling cast out because of a perceived offense",
      "Crushed": "overwhelmingly disappointed or let down",
      "Dead Inside": "depressed to the point of feeling you've lost your spirit or soul",
      "Defeated": "feeling demoralized or overcome by adversity",
      "Deficient": "feeling inadequate or like you lack a desired quality",
      "Dejected": "feeling unhappy, low in spirits",
      "Desolate": "feeling bleak and miserable",
      "Despair": "a feeling of complete hopelessness",
      "Disappointed": "sad because your expectations were not met",
      "Disconnected": "feeling separate from others",
      "Discontented": "dissatisfied with your circumstances",
      "Discouraged": "feeling a loss of confidence and enthusiasm",
      "Disenchanted": "feeling let down by someone or something you once admired",
      "Disengaged": "feeling like you cannot focus; disinterested",
      "Disgruntled": "feeling annoyed and disappointed",
      "Disgusted": "feeling a strong dislike of someone or something",
      "Disheartened": "loss of resolve or determination",
      "Disillusioned": "disappointed in someone who has not lived up to your belief in them",
      "Dispirited": "having lost enthusiasm and hope",
      "Disrespected": "not being treated as if your ideas and feelings matter",
      "Dissatisfied": "unhappy with someone or something",
      "Empty": "lacking meaning or connection",
      "Forlorn": "feeling both sad and alone",
      "Fragile": "feeling delicate and like you could easily break"
    }
  },
  red: {
    label: "High Energy Unpleasant",
    emotions: {
      "Afraid": "experiencing fear or threat",
      "Agitated": "very troubled and restless",
      "Alarmed": "a sense of urgent fear or concern",
      "Ambivalent": "having contradictory attitudes or feelings about something",
      "Angry": "strongly bothered about a perceived injustice",
      "Anguished": "experiencing severe physiological pain or suffering",
      "Annoyed": "bothered by something displeasing or uncomfortable",
      "Anxious": "worried and uneasy about an uncertain outcome",
      "Apprehensive": "unease and worry about something that might happen",
      "Astonished": "greatly surprised or impressed",
      "Confused": "feeling unable to make sense of something",
      "Contempt": "feeling a combination of anger and disgust",
      "Conflicted": "having mutually inconsistent feelings about something",
      "Concerned": "wondering if someone or something is okay",
      "Discombobulated": "thrown into a state of confusion or uncertainty",
      "Discomfort": "feeling of unease or pain",
      "Distracted": "feeling diverted or far away from the present focus",
      "Distressed": "feeling unwell and agitated physiologically, can have different causes (emotional pain, threat, loss, etc.)",
      "Dread": "anxiety because of expecting something unpleasant or upsetting",
      "Dumbfounded": "being speechless with shock",
      "Dysregulated": "feeling you can't steady your emotions",
      "Embarrassed": "self-conscious and uncomfortable about how you think others are perceiving you",
      "Frazzled": "feeling exhausted, disorganized, and emotionally frayed",
      "Frightened": "afraid or fearful",
      "Frozen": "feeling you cannot act due to overwhelming anxiety or fear",
      "Frustrated": "upset because you cannot do something you want to do",
      "Furious": "full of extreme or wild anger"
    }
  }
};

// Color utility functions
const getMoodColor = (color: string) => {
  const colors = {
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      dot: 'bg-red-500 dark:bg-red-400',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
      button: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
    },
    yellow: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500 dark:bg-amber-400',
      hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30',
      button: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500 dark:bg-blue-400',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      button: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500 dark:bg-emerald-400',
      hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
      button: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800'
    }
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

const EmotionalText: React.FC<{ text: string }> = ({ text }) => {
  const parts: { text: string; color?: MoodColor }[] = [];
  let currentIndex = 0;

  // Create a map of all emotions with their colors
  const emotionMap = Object.entries(EMOTIONS).reduce((acc, [color, category]) => {
    Object.keys(category.emotions).forEach(emotion => {
      acc[emotion.toLowerCase()] = color as MoodColor;
    });
    return acc;
  }, {} as Record<string, MoodColor>);

  // Sort emotions by length (longest first)
  const sortedEmotions = Object.keys(emotionMap).sort((a, b) => b.length - a.length);

  // Find all emotion matches
  const matches: { start: number; end: number; color: MoodColor; text: string }[] = [];
  sortedEmotions.forEach(emotion => {
    const regex = new RegExp(`\\b${emotion}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        color: emotionMap[emotion.toLowerCase()],
        text: match[0]
      });
    }
  });

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Build parts array
  matches.forEach(match => {
    if (match.start > currentIndex) {
      parts.push({ text: text.slice(currentIndex, match.start) });
    }
    parts.push({ text: match.text, color: match.color });
    currentIndex = match.end;
  });

  if (currentIndex < text.length) {
    parts.push({ text: text.slice(currentIndex) });
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.color) {
          const colorClasses = getMoodColor(part.color);
          return (
            <span key={i} className={`${colorClasses.text} font-medium`}>
              {part.text}
            </span>
          );
        }
        return part.text;
      })}
    </>
  );
};

const MoodsPlugin: React.FC<MoodsPluginProps> = ({ files }) => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  const [filter, setFilter] = useState<'red' | 'yellow' | 'blue' | 'green' | 'all'>('all');

  useEffect(() => {
    // Process mood files
    const entries: MoodEntry[] = [];
    
    console.log('Processing files with transcripts:', files.map(f => ({
      name: f.name,
      hasTranscript: !!f.transcript,
      transcriptLength: f.transcript?.length
    })));
    
    files.forEach(file => {
      if (!file.content) return;
      
      const content = file.content;
      const fileName = file.name;
      
      console.log('Processing file:', { fileName, hasTranscript: !!file.transcript });
      
      // Extract date from filename (format: YYYYMMDD_HHMMSS.txt)
      const dateMatch = fileName.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
      if (!dateMatch) return;
      
      const [, year, month, day, hour, minute, second] = dateMatch;
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);

      // Analyze content to determine mood category
      const lowerContent = content.toLowerCase();
      
      // Track emotion matches by category
      const emotionMatches = {
        yellow: 0, // high energy pleasant
        green: 0,  // low energy pleasant
        red: 0,    // high energy unpleasant
        blue: 0    // low energy unpleasant
      };
      
      let dominantEmotion = '';
      let maxMatches = 0;
      
      // Count matches for each emotion category
      Object.entries(EMOTIONS).forEach(([categoryColor, category]) => {
        Object.keys(category.emotions).forEach(emotion => {
          const regex = new RegExp(`\\b${emotion}\\b`, 'gi');
          const matches = (lowerContent.match(regex) || []).length;
          emotionMatches[categoryColor as MoodColor] += matches;
          
          // Track the most frequently mentioned individual emotion
          if (matches > 0 && matches > maxMatches) {
            maxMatches = matches;
            dominantEmotion = emotion;
          }
        });
      });

      // Determine overall pleasantness and energy level
      const pleasantCount = emotionMatches.yellow + emotionMatches.green;
      const unpleasantCount = emotionMatches.red + emotionMatches.blue;
      const highEnergyCount = emotionMatches.yellow + emotionMatches.red;
      const lowEnergyCount = emotionMatches.green + emotionMatches.blue;
      
      const isPleasant = pleasantCount > unpleasantCount;
      const isHighEnergy = highEnergyCount > lowEnergyCount;
      
      // Determine color based on the quadrant with most matches
      let color: MoodColor;
      if (isPleasant && isHighEnergy) color = 'yellow';
      else if (isPleasant && !isHighEnergy) color = 'green';
      else if (!isPleasant && isHighEnergy) color = 'red';
      else color = 'blue';
      
      entries.push({
        id: fileName,
        date: date.toISOString(),
        mood: dominantEmotion || 'Unknown',
        description: content.split('\n')[0]?.trim() || 'No description',
        energy: isHighEnergy ? 'high' : 'low',
        pleasant: isPleasant,
        color,
        content,
        transcript: file.transcript
      });
    });
    
    // Sort by date (newest first)
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log('Processed entries:', entries.map(e => ({ id: e.id, hasTranscript: !!e.transcript })));
    
    setMoodEntries(entries);
  }, [files]);

  useEffect(() => {
    if (selectedEntry) {
      console.log('Selected entry details:', {
        id: selectedEntry.id,
        hasTranscript: !!selectedEntry.transcript,
        transcript: selectedEntry.transcript
      });
    }
  }, [selectedEntry]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const filteredEntries = filter === 'all' 
    ? moodEntries 
    : moodEntries.filter(entry => entry.color === filter);

  const renderContent = (content: string, isMarkdown: boolean = true) => {
    // Replace mood color words at the start with Pleasant/Unpleasant
    let processedContent = content.replace(/^(Blue|Red|Yellow|Green)/, 
      selectedEntry?.pleasant ? 'Pleasant' : 'Unpleasant'
    );

    // Filter out empty lines starting with ":" and "None present" lines
    processedContent = processedContent
      .split('\n')
      .filter(line => {
        const trimmedLine = line.trim();
        return !(
          trimmedLine === ':' || 
          trimmedLine.startsWith(': None present in this transcript') ||
          trimmedLine.match(/^:\s*$/)
        );
      })
      .join('\n');

    if (!isMarkdown) {
      // For non-markdown content, just highlight emotions
      return (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
          <EmotionalText text={processedContent} />
        </div>
      );
    }

    // For markdown content, use ReactMarkdown with our custom components
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            p: ({children}) => {
              const text = React.Children.toArray(children)
                .map(child => (typeof child === 'string' ? child : ''))
                .join('');
              return (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  <EmotionalText text={text} />
                </div>
              );
            },
            ul: ({children}) => (
              <div className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {children}
              </div>
            ),
            ol: ({children}) => (
              <div className="list-decimal list-inside mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {children}
              </div>
            ),
            li: ({children}) => {
              const text = React.Children.toArray(children)
                .map(child => (typeof child === 'string' ? child : ''))
                .join('');
              return (
                <div className="mt-1">
                  <EmotionalText text={text} />
                </div>
              );
            }
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-3">Mood Timeline</h2>
        
        <div className="flex space-x-1.5 mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${filter === 'all' 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            All
          </button>
          {Object.entries(EMOTIONS).map(([color, { label }]) => {
            const colorClasses = getMoodColor(color);
            const [energy, ...rest] = label.split(' ');
            return (
              <button
                key={color}
                onClick={() => setFilter(color as MoodColor)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${filter === color ? colorClasses.button : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                <span className="opacity-75">{energy}</span>
                <br />
                {rest.join(' ')}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="md:col-span-1 bg-white rounded-lg shadow overflow-y-auto max-h-[70vh]">
          <div className="divide-y">
            {filteredEntries.map(entry => {
              const colorClasses = getMoodColor(entry.color);
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`p-3 cursor-pointer transition-colors
                    ${colorClasses.hover} ${selectedEntry?.id === entry.id ? colorClasses.bg : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${colorClasses.dot}`} />
                      <span className={`text-sm font-medium ${colorClasses.text}`}>
                        {entry.pleasant ? 'Pleasant' : 'Unpleasant'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatTime(entry.date)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                    {entry.description.replace(/^(Blue|Red|Yellow|Green): /, '')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Detail view */}
        <div className="md:col-span-2 bg-white rounded-lg shadow">
          {selectedEntry ? (
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${getMoodColor(selectedEntry.color).dot}`} />
                  <span className={`text-sm font-medium ${getMoodColor(selectedEntry.color).text}`}>
                    {selectedEntry.pleasant ? 'Pleasant' : 'Unpleasant'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {EMOTIONS[selectedEntry.color].emotions[selectedEntry.mood]}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(selectedEntry.date)} {formatTime(selectedEntry.date)}
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Analysis</h3>
                  {renderContent(selectedEntry.content)}
                </div>
                {selectedEntry.transcript && (
                  <div className="border-t dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Full Transcript</h3>
                    {renderContent(selectedEntry.transcript, false)}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-500 p-4">
              <p>Select a mood entry to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodsPlugin; 