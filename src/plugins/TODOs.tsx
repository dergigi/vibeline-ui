'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Trash2, Plus, X } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  filePath?: string; // Add filePath to track which file the todo came from
}

interface TodoSection {
  title: string;
  todos: Todo[];
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
  const [newTodoText, setNewTodoText] = useState('');
  const [activeSection, setActiveSection] = useState<string>('Open');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  useEffect(() => {
    // Parse todos from markdown files
    const openTodos: Todo[] = [];
    const completedTodos: Todo[] = [];

    files.forEach(file => {
      const content = file.content || '';
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Match markdown checkbox format: "- [ ] text" or "- [x] text"
        const match = line.match(/^(\s*-\s*\[)([ x])(\]\s*)(.*)/);
        if (match) {
          const isCompleted = match[2] === 'x';
          const todoText = match[4].trim();
          
          const todo: Todo = {
            id: `${file.path}-${index}`,
            text: todoText,
            completed: isCompleted,
            createdAt: file.name.split('_')[0], // Extract date from filename
            filePath: file.path
          };

          if (isCompleted) {
            completedTodos.push(todo);
          } else {
            openTodos.push(todo);
          }
        }
      });
    });

    setSections([
      { title: 'Open', todos: openTodos },
      { title: 'Completed', todos: completedTodos }
    ]);
  }, [files]);

  const addTodo = async () => {
    if (!newTodoText.trim()) return;

    try {
      const response = await fetch('/api/todos/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newTodoText,
          pluginId: 'TODOs'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add todo');
      }

      // Refresh the page to show the new todo
      window.location.reload();
    } catch (error) {
      console.error('Error adding todo:', error);
    }

    setNewTodoText('');
    setIsAddingTodo(false);
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

      // Refresh the page to show the updated todo
      window.location.reload();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const deleteTodo = (todoId: string) => {
    setSections(prevSections => 
      prevSections.map(section => ({
        ...section,
        todos: section.todos.filter(todo => todo.id !== todoId)
      }))
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TODOs</h1>
        <div className="flex space-x-2">
          {sections.map(section => (
            <button
              key={section.title}
              onClick={() => setActiveSection(section.title)}
              className={`px-4 py-2 rounded-lg ${
                activeSection === section.title
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'Open' && (
        <div className="mb-4">
          {!isAddingTodo ? (
            <button
              onClick={() => setIsAddingTodo(true)}
              className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
            >
              <Plus size={20} />
              <span>Add Todo</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Enter new todo..."
                className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                autoFocus
              />
              <button
                onClick={addTodo}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingTodo(false);
                  setNewTodoText('');
                }}
                className="p-2 text-gray-500 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {sections
          .find(section => section.title === activeSection)
          ?.todos.map(todo => (
            <div
              key={todo.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  {todo.completed ? (
                    <CheckCircle size={24} />
                  ) : (
                    <Circle size={24} />
                  )}
                </button>
                <span className={`text-gray-900 dark:text-white ${
                  todo.completed ? 'line-through text-gray-500' : ''
                }`}>
                  {todo.text}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TodosPlugin; 