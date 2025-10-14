import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => {
  return (
    <label className="flex items-center space-x-3 cursor-pointer">
      <input
        type="checkbox"
        {...props}
        className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500 rounded"
      />
      <span className="text-gray-300">{label}</span>
    </label>
  );
};

export default Checkbox;
