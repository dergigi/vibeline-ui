'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarProps
} from 'recharts';
import { groupBy, countBy, mean } from 'lodash';

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
  intensity?: number;
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

interface RadarDataPoint {
  emotion: string;
  count: number;
  category: string;
}

interface TimelineDataPoint {
  date: string;
  entries: MoodEntry[];
  intensity: number;
  red: number;
  yellow: number;
  green: number;
  blue: number;
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
const MOOD_COLORS = {
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500 dark:bg-red-400',
    hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
    button: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800',
    hex: {
      fill: '#EF4444',    // red-500
      stroke: '#DC2626',  // red-600
      text: '#DC2626'     // red-600
    }
  },
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500 dark:bg-amber-400',
    hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30',
    button: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800',
    hex: {
      fill: '#F59E0B',    // amber-500
      stroke: '#D97706',  // amber-600
      text: '#D97706'     // amber-600
    }
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500 dark:bg-blue-400',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    button: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800',
    hex: {
      fill: '#3B82F6',    // blue-500
      stroke: '#2563EB',  // blue-600
      text: '#2563EB'     // blue-600
    }
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
    button: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800',
    hex: {
      fill: '#10B981',    // emerald-500
      stroke: '#059669',  // emerald-600
      text: '#059669'     // emerald-600
    }
  }
} as const;

const getMoodColor = (color: string) => {
  return MOOD_COLORS[color as keyof typeof MOOD_COLORS] || MOOD_COLORS.blue;
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

// Add proper types for the formatter functions
type TooltipFormatter = (value: number, name: string, props: { payload?: { category: string; emotion: string } }) => [React.ReactElement, React.ReactElement];
type LabelFormatter = (label: string) => string;

const MoodsPlugin: React.FC<MoodsPluginProps> = ({ files }) => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  const [filter, setFilter] = useState<MoodColor | 'all'>('all');
  const [timeRange] = useState<{ start: Date; end: Date }>(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return { start: sevenDaysAgo, end: now };
  });

  // Process data for timeline
  const timelineData = useMemo<TimelineDataPoint[]>(() => {
    const groupedByDate = groupBy(moodEntries, (entry: MoodEntry) => 
      new Date(entry.date).toISOString().split('T')[0]
    );

    return Object.entries(groupedByDate).map(([date, entries]) => {
      const typedEntries = entries as MoodEntry[];
      const colorCounts = countBy(typedEntries, 'color');
      const avgIntensity = mean(typedEntries.map(e => e.intensity || 0));
      
      return {
        date,
        entries: typedEntries,
        intensity: avgIntensity || 0,
        red: colorCounts.red || 0,
        yellow: colorCounts.yellow || 0,
        green: colorCounts.green || 0,
        blue: colorCounts.blue || 0
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [moodEntries]);

  // Process radar data
  const radarData = useMemo<RadarDataPoint[]>(() => {
    const emotionTotals: Record<string, number> = {};
    moodEntries
      .filter(entry => new Date(entry.date) >= timeRange.start)
      .forEach(entry => {
        const lowerContent = entry.content.toLowerCase();
        Object.entries(EMOTIONS).forEach(([, category]) => {
          Object.entries(category.emotions).forEach(([emotion]) => {
            const regex = new RegExp(`\\b${emotion}\\b`, 'gi');
            const matches = (lowerContent.match(regex) || []).length;
            if (matches > 0) {
              emotionTotals[emotion] = (emotionTotals[emotion] || 0) + matches;
            }
          });
        });
      });

    return Object.entries(emotionTotals)
      .map(([emotion, count]) => ({
        emotion,
        count,
        category: Object.entries(EMOTIONS).find(([, category]) => 
          Object.keys(category.emotions).includes(emotion)
        )?.[0] || ''
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [moodEntries, timeRange.start]);

  // Fix tooltip formatter types
  const tooltipFormatter: TooltipFormatter = (value, name, props) => {
    const color = props.payload?.category;
    const colorClass = color === 'red' ? 'text-red-400' :
                      color === 'yellow' ? 'text-amber-400' :
                      color === 'green' ? 'text-emerald-400' :
                      'text-blue-400';
    return [
      <span key="value" className={colorClass}>{`Count: ${value}`}</span>,
      <span key="name" className={colorClass}>{props.payload?.emotion}</span>
    ];
  };

  const timelineTooltipFormatter = (value: number, name: string) => {
    const color = name.toLowerCase();
    return [
      <span key="value" className={getMoodColor(color).text}>{`Count: ${value}`}</span>,
      <span key="name" className={getMoodColor(color).text}>{name}</span>
    ];
  };

  const labelFormatter: LabelFormatter = (date) => new Date(date).toLocaleDateString();

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Timeline Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 0, right: -5, left: -25, bottom: -5 }}
                >
                  <defs>
                    {Object.keys(MOOD_COLORS).map((color) => (
                      <linearGradient key={color} id={`color${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getMoodColor(color).hex.fill} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={getMoodColor(color).hex.fill} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.15} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    fontSize={10}
                    tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    tickMargin={0}
                    axisLine={false}
                    tickLine={false}
                    dy={-3}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={10}
                    tickFormatter={(value: number) => Math.round(value).toString()}
                    tickMargin={0}
                    axisLine={false}
                    tickLine={false}
                    dx={-3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '12px',
                      color: '#F3F4F6'
                    }}
                    formatter={timelineTooltipFormatter}
                    labelFormatter={labelFormatter}
                  />
                  {Object.keys(MOOD_COLORS).map((color) => (
                    <Area
                      key={color}
                      type="monotone"
                      dataKey={color}
                      name={color.charAt(0).toUpperCase() + color.slice(1)}
                      stroke={getMoodColor(color).hex.stroke}
                      fillOpacity={1}
                      fill={`url(#color${color})`}
                      stackId="1"
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emotion Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%">
                  <PolarGrid 
                    stroke="#374151" 
                    strokeOpacity={0.15}
                    strokeDasharray="3 3"
                  />
                  <PolarAngleAxis
                    dataKey="emotion"
                    tick={(props) => {
                      const { x, y, payload, cx = 0 } = props;
                      const matchingEmotion = radarData.find(d => d.emotion === payload.value);
                      const color = matchingEmotion?.category ? getMoodColor(matchingEmotion.category).hex.text : '#6B7280';
                      return (
                        <text
                          x={x}
                          y={y}
                          textAnchor={x > cx ? 'start' : 'end'}
                          fill={color}
                          fontSize={10}
                          fillOpacity={0.85}
                        >
                          {payload.value}
                        </text>
                      );
                    }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 'auto']}
                    tick={{ 
                      fill: '#6B7280',
                      fontSize: 10,
                      fillOpacity: 0.7
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Radar
                    name="Emotions"
                    dataKey="count"
                    data={radarData}
                    stroke={getMoodColor(radarData[0]?.category || 'blue').hex.stroke}
                    fill={getMoodColor(radarData[0]?.category || 'blue').hex.fill}
                    fillOpacity={0.3}
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '12px',
                      color: '#F3F4F6'
                    }}
                    formatter={tooltipFormatter}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${filter === 'all' 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            All Moods
          </button>
          {Object.keys(MOOD_COLORS).map((color) => (
            <button
              key={color}
              onClick={() => setFilter(color as MoodColor)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${filter === color 
                  ? getMoodColor(color).button
                  : `${getMoodColor(color).bg} ${getMoodColor(color).text}`
                }`}
            >
              <span className="block leading-tight">
                {color === 'yellow' && (
                  <>
                    <span className="block">High Energy</span>
                    <span className="block">Pleasant</span>
                  </>
                )}
                {color === 'green' && (
                  <>
                    <span className="block">Low Energy</span>
                    <span className="block">Pleasant</span>
                  </>
                )}
                {color === 'blue' && (
                  <>
                    <span className="block">Low Energy</span>
                    <span className="block">Unpleasant</span>
                  </>
                )}
                {color === 'red' && (
                  <>
                    <span className="block">High Energy</span>
                    <span className="block">Unpleasant</span>
                  </>
                )}
              </span>
            </button>
          ))}
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
                      <span>{formatDateTime(entry.date)}</span>
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
                  {formatDateTime(selectedEntry.date)}
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