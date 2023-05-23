import React, { useState, useEffect } from 'react';
import './App.css';

const colors: string[] = ["emerald-500", "red-800"];
let currentColorIndex = 0;

function App() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [themeColor, setThemeColor] = useState(colors[currentColorIndex]);
  
  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8888/');
    // Handle received messages
    ws.onmessage = (event) => {
      const receivedMessage = event.data;
      
      // Update response field
      setResponse(receivedMessage);
      
      // Cycle to the next color
      currentColorIndex = (currentColorIndex + 1) % colors.length;
      setThemeColor(colors[currentColorIndex]);
    };

    // Clean up the WebSocket connection on unmount
    return () => {
      ws.close();
    };
  });

  const sendMessage = () => {
    // Send message through the WebSocket
    // Replace 'socket.send()' with your own logic
    // For example: socket.send(message);
    ws.send(message);
    // Clear input field
    setMessage('');
  };

  return (
    <div className={`bg-${themeColor} h-screen flex flex-col justify-center items-center`}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="bg-white text-black rounded p-2"
        placeholder="Write a message"
      />
      <button
        onClick={sendMessage}
        className="bg-white text-black rounded p-2 mt-2"
      >
        Send
      </button>
      <div className="text-white mt-4">
        Response: {response}
      </div>
    </div>
  );
}

export default App;
