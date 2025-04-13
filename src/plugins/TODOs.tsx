'use client';

import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';

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
    const todayTodos = allTodos.filter(todo => todo.createdAt === today);
    const yesterdayTodos = allTodos.filter(todo => todo.createdAt === yesterday);
    const weekTodos = allTodos.filter(todo => 
      todo.createdAt < yesterday && 
      todo.createdAt > weekAgo
    );
    const olderTodos = allTodos.filter(todo => todo.createdAt <= weekAgo);

    setSections([
      { title: 'Today', todos: todayTodos, isExpanded: false },
      { title: 'Yesterday', todos: yesterdayTodos, isExpanded: false },
      { title: 'This Week', todos: weekTodos, isExpanded: false },
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

  const renderTodoItem = (todo: Todo, section: string) => (
    <div
      key={todo.id}
      className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
    >
      <div className="flex items-center space-x-3 flex-1">
        <button
          onClick={() => toggleTodo(todo.id, todo.completed)}
          className="text-blue-500 hover:text-blue-600"
        >
          {todo.completed ? (
            <CheckSquare size={24} />
          ) : (
            <Square size={24} />
          )}
        </button>
        <span className={`text-gray-900 dark:text-white flex-1 ${
          todo.completed ? 'line-through text-gray-500' : ''
        }`}>
          {todo.text}
        </span>
        <span className="text-[10px] text-gray-400 tabular-nums">
          {formatTimestamp(todo.filePath?.split('/').pop() || '', section)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={section.title} className="space-y-2">
            <button
              onClick={() => toggleSection(index)}
              className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white"
            >
              {section.isExpanded ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
              <span>{section.title}</span>
              <span className="text-sm text-gray-500">({section.todos.length})</span>
            </button>
            <div className="space-y-2 ml-6">
              {(section.isExpanded ? section.todos : section.todos.slice(0, 5))
                .map(todo => renderTodoItem(todo, section.title))}
              {!section.isExpanded && section.todos.length > 5 && (
                <button
                  onClick={() => toggleSection(index)}
                  className="text-sm text-blue-500 hover:text-blue-600 mt-2"
                >
                  Show {section.todos.length - 5} more...
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodosPlugin; 