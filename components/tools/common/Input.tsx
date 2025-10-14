import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  ringColorClass?: string;
}

const Input: React.FC<InputProps> = ({ label, ringColorClass = 'focus:ring-blue-500', ...props }) => {
  return (
    <div>
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <input
        {...props}
        className={`w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${ringColorClass} transition-colors`}
      />
    </div>
  );
};

export default Input;