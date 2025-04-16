'use client';

import React, { useState, useEffect } from 'react';
import { Square, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  filePath?: string;
}

interface TodoSection {
  title: string;
  todos: Todo[];
  isExpanded: boolean;
}

interface TodosPluginProps {
  files: {
    name: string;
    path: string;
    content?: string;
  }[];
}

type FilterState = 'all' | 'open-first' | 'open' | 'done';

const TodosPlugin: React.FC<TodosPluginProps> = ({ files }) => {
  const [sections, setSections] = useState<TodoSection[]>([]);
  const [filter, setFilter] = useState<FilterState>('open-first');

  useEffect(() => {
    // Parse todos from markdown files
    const allTodos: Todo[] = [];
    
    files.forEach(file => {
      const content = file.content || '';
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const match = line.match(/^(\s*-\s*\[)([ x])(\]\s*)(.*)/);
        if (match) {
          const isCompleted = match[2] === 'x';
          const todoText = match[4].trim();
          
          const todo: Todo = {
            id: `${file.path}-${index}`,
            text: todoText,
            completed: isCompleted,
            createdAt: file.name.split('_')[0], // Format: YYYYMMDD
            filePath: file.path
          };
          
          allTodos.push(todo);
        }
      });
    });

    // Sort todos by creation date (newest first)
    const sortTodos = (a: Todo, b: Todo) => {
      // First compare dates
      const dateComparison = b.createdAt.localeCompare(a.createdAt);

      // If dates are equal, use the line number to maintain original order
      if (dateComparison === 0) {
        const aLine = parseInt(a.id.split('-')[1], 10);
        const bLine = parseInt(b.id.split('-')[1], 10);
        return aLine - bLine;
      }
      return dateComparison;
    };

    allTodos.sort(sortTodos);

    // Get date boundaries
    const now = new Date();
    const today = now.toISOString().split('T')[0].replace(/-/g, '');
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');
    
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0].replace(/-/g, '');
    
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0].replace(/-/g, '');

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0].replace(/-/g, '');
    
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0].replace(/-/g, '');

    // Organize todos into sections
    const todayTodos = allTodos.filter(todo => todo.createdAt === today);
    const yesterdayTodos = allTodos.filter(todo => todo.createdAt === yesterdayStr);
    const thisWeekTodos = allTodos.filter(todo => 
      todo.createdAt < yesterdayStr && 
      todo.createdAt > weekAgoStr
    );
    const lastWeekTodos = allTodos.filter(todo =>
      todo.createdAt <= weekAgoStr &&
      todo.createdAt > twoWeeksAgoStr
    );
    const thisMonthTodos = allTodos.filter(todo =>
      todo.createdAt <= twoWeeksAgoStr &&
      todo.createdAt >= monthStartStr
    );
    const lastMonthTodos = allTodos.filter(todo =>
      todo.createdAt < monthStartStr &&
      todo.createdAt >= lastMonthStartStr
    );
    const olderTodos = allTodos.filter(todo => todo.createdAt < lastMonthStartStr);

    setSections([
      { title: 'Today', todos: todayTodos, isExpanded: false },
      { title: 'Yesterday', todos: yesterdayTodos, isExpanded: false },
      { title: 'This Week', todos: thisWeekTodos, isExpanded: false },
      { title: 'Last Week', todos: lastWeekTodos, isExpanded: false },
      { title: 'This Month', todos: thisMonthTodos, isExpanded: false },
      { title: 'Last Month', todos: lastMonthTodos, isExpanded: false },
      { title: 'Older', todos: olderTodos, isExpanded: false }
    ]);
  }, [files]);

  const toggleSection = (sectionIndex: number) => {
    setSections(prevSections => 
      prevSections.map((section, index) => 
        index === sectionIndex
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    );
  };

  const toggleTodo = async (todoId: string, currentCompleted: boolean) => {
    const [filePath, lineNumber] = todoId.split('-');
    
    try {
      const response = await fetch('/api/todos/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          lineNumber: parseInt(lineNumber, 10),
          completed: !currentCompleted
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle todo');
      }

      // Update local state instead of reloading the page
      setSections(prevSections => 
        prevSections.map(section => ({
          ...section,
          todos: section.todos.map(todo => 
            todo.id === todoId 
              ? { ...todo, completed: !currentCompleted } 
              : todo
          )
        }))
      );
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const formatTimestamp = (filename: string, section: string) => {
    // Extract date and time from filename format: YYYYMMDD_HHMMSS
    const [date, time] = filename.split('_');
    if (!time) return '';
    
    const timeFormatted = `${time.slice(0, 2)}:${time.slice(2, 4)}`;
    
    if (section === 'Today' || section === 'Yesterday') {
      return timeFormatted;
    }
    
    // Format date as "Apr 11 · 14:30"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = parseInt(date.slice(4, 6), 10) - 1; // Convert to 0-based index
    const day = parseInt(date.slice(6, 8), 10);
    return `${months[month]} ${day} · ${timeFormatted}`;
  };

  const filterTodos = (todos: Todo[]) => {
    switch (filter) {
      case 'open':
        return todos.filter(todo => !todo.completed);
      case 'done':
        return todos.filter(todo => todo.completed);
      case 'open-first':
        return [...todos.filter(todo => !todo.completed), ...todos.filter(todo => todo.completed)];
      default:
        return todos;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center px-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('open-first')}
            className={`text-sm px-3 py-1 rounded-full ${
              filter === 'open-first'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Open First
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`text-sm px-3 py-1 rounded-full ${
              filter === 'open'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`text-sm px-3 py-1 rounded-full ${
              filter === 'done'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Done
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`text-sm px-3 py-1 rounded-full ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unfiltered
          </button>
        </div>
      </div>
      {sections.map((section, index) => {
        const filteredTodos = filterTodos(section.todos);
        if (filteredTodos.length === 0) return null;
        
        return (
          <div key={section.title} className="rounded-lg bg-gray-50">
            <button
              onClick={() => toggleSection(index)}
              className="flex w-full items-center px-4 py-3 hover:bg-gray-100 transition-colors duration-200 rounded-t-lg bg-gray-100/50"
            >
              {section.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-blue-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-blue-500" />
              )}
              <span className="ml-2 text-sm font-semibold text-gray-900">
                {section.title}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                ({filteredTodos.length})
              </span>
            </button>
            <div className="px-4 pb-3">
              {(section.isExpanded ? filteredTodos : filteredTodos.slice(0, 5)).map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start py-2"
                >
                  <div className="flex-shrink-0 pt-1">
                    {todo.completed ? (
                      <div className="text-gray-400 cursor-pointer" onClick={() => toggleTodo(todo.id, todo.completed)}>
                        <Check className="h-4 w-4" />
                      </div>
                    ) : (
                      <Square
                        className="h-4 w-4 text-blue-500 cursor-pointer"
                        onClick={() => toggleTodo(todo.id, todo.completed)}
                      />
                    )}
                  </div>
                  <span className={`ml-3 text-sm flex-1 break-words ${
                    todo.completed ? "text-gray-400 line-through" : "text-gray-900"
                  }`}>
                    {todo.text}
                  </span>
                  <span className="ml-3 flex-shrink-0 text-xs text-gray-400">
                    {formatTimestamp(todo.filePath?.split('/').pop() || '', section.title)}
                  </span>
                </div>
              ))}
              {!section.isExpanded && filteredTodos.length > 5 && (
                <button
                  onClick={() => toggleSection(index)}
                  className="mt-2 text-sm text-blue-500 hover:text-blue-600"
                >
                  Show {filteredTodos.length - 5} more...
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TodosPlugin; 