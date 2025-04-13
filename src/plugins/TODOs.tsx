'use client';

import React, { useState, useEffect } from 'react';
import { Square, ChevronDown, ChevronRight } from 'lucide-react';

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

const TodosPlugin: React.FC<TodosPluginProps> = ({ files }) => {
  const [sections, setSections] = useState<TodoSection[]>([]);

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
    allTodos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    // Get date boundaries
    const now = new Date();
    const today = now.toISOString().split('T')[0].replace(/-/g, '');
    const yesterday = new Date(now.setDate(now.getDate() - 1))
      .toISOString().split('T')[0].replace(/-/g, '');
    const weekAgo = new Date(now.setDate(now.getDate() - 6))
      .toISOString().split('T')[0].replace(/-/g, '');

    // Organize todos into sections
    const todayTodos = allTodos.filter(todo => todo.createdAt === today)
      .sort((a, b) => {
        // Sort by completion status first, then by creation date
        if (a.completed === b.completed) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return a.completed ? 1 : -1;
      });

    const yesterdayTodos = allTodos.filter(todo => todo.createdAt === yesterday)
      .sort((a, b) => {
        if (a.completed === b.completed) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return a.completed ? 1 : -1;
      });

    const weekTodos = allTodos.filter(todo => 
      todo.createdAt < yesterday && 
      todo.createdAt > weekAgo
    ).sort((a, b) => {
      if (a.completed === b.completed) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return a.completed ? 1 : -1;
    });

    const olderTodos = allTodos.filter(todo => todo.createdAt <= weekAgo)
      .sort((a, b) => {
        if (a.completed === b.completed) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return a.completed ? 1 : -1;
      });

    setSections([
      { title: 'Today', todos: todayTodos, isExpanded: true },
      { title: 'Yesterday', todos: yesterdayTodos, isExpanded: true },
      { title: 'This Week', todos: weekTodos, isExpanded: true },
      { title: 'Older', todos: olderTodos, isExpanded: true }
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

      window.location.reload();
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

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={section.title} className="rounded-lg bg-gray-50">
          <button
            onClick={() => toggleSection(index)}
            className="flex w-full items-center px-4 py-3"
          >
            {section.isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <span className="ml-2 text-sm font-medium text-gray-900">
              {section.title}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              ({section.todos.length})
            </span>
          </button>
          {section.isExpanded && (
            <div className="px-4 pb-3">
              {section.todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center py-2"
                >
                  <Square
                    className={`h-4 w-4 ${
                      todo.completed ? "text-gray-400" : "text-blue-500"
                    }`}
                    onClick={() => toggleTodo(todo.id, todo.completed)}
                  />
                  <span className={`ml-3 text-sm ${
                    todo.completed ? "text-gray-400 line-through" : "text-gray-900"
                  }`}>
                    {todo.text}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {formatTimestamp(todo.filePath?.split('/').pop() || '', section.title)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TodosPlugin; 