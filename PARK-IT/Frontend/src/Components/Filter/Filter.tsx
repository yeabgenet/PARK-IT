import React, { useState } from 'react';

// 1. (Optional but recommended) Define a type for the possible values.
// This prevents typos and ensures you only use valid terminal values.
type TerminalValue = 'mexico' | 'stadium' | '';

function Filter() {
  // 2. Set up state with the defined type.
  // useState will infer the type, but being explicit is clearer.
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalValue>('');

  // 3. Create a type-safe event handler.
  // React.ChangeEvent<HTMLSelectElement> correctly types the 'event' object.
  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // We can cast event.target.value to our type.
    setSelectedTerminal(event.target.value as TerminalValue);
  };


  // 4. Function to "unselect" or reset the dropdown.
  // This sets the state back to its initial empty string value.
  const clearSelection = () => {
    setSelectedTerminal('');
  };

  return (
    <div>
      <select
        id="terminals"
        name="terminals"
        className="px-10 py-1 border"
        // Bind the select element's value to your state
        value={selectedTerminal}
        // Call your type-safe handler when the selection changes
        onChange={handleSelectionChange}
      >
        {/* This is your placeholder option. */}
        <option value=""  onClick={clearSelection}>
          Search by Terminals ...
        </option>
        <option value="mexico">  Mexico</option>
        <option value="stadium"> Stadium</option>
      </select>

  

    </div>
  );
}

export default Filter;