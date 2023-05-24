import React, { useState, useEffect } from 'react';
import { themes } from './themes';
interface TitleBarProps {
  title: string;
  darkTheme: boolean;
  onDarkThemeToggle: () => void;
}

/// TitleBar component
const TitleBar: React.FC<{ title: string; darkTheme: boolean; onDarkThemeToggle: () => void }> = ({
  title,
  darkTheme,
  onDarkThemeToggle,
}) => {
  const theme = darkTheme ? "theme-nordic" : "theme-pastel";

  return (
    <div className={`title-bar ${theme} bg-b text-highlight-c flex justify-between`}>
      <h1 className={`px-10 mx-20 my-1 py-2 text-3xl font-light`}>{title}</h1>
      <button
        className={`px-10 mx-20 my-1 py-2 rounded-xl bg-d hover:bg-c
        focus:border-blue-500`}
        onClick={onDarkThemeToggle}
      >
        {darkTheme ? 'Light Theme' : 'Dark Theme'}
      </button>
    </div>
  );
};

// WebSocketDemo component
const WebSocketDemo: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    const newSocket = new WebSocket('ws://localhost:8888/chat');
    setSocket(newSocket);

    newSocket.onmessage = (event) => {
      const message = event.data;
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = () => {
    if (socket) {
        socket.send(inputValue);
        setInputValue('');
    }
  };

  const toggleDarkTheme = () => {
    setDarkTheme(!darkTheme);
  };

  const theme = darkTheme ? "theme-nordic" : "theme-pastel";

  return (
    <div className={`app ${theme} bg-a`}>
      <TitleBar title="Reversi — But Modern" darkTheme={darkTheme} onDarkThemeToggle={toggleDarkTheme} />
      <div className={`bg-d text-highlight-b message-list`}>
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className={`rounded px-2 py-1 mt-2 bg-d`}
      />
      <button
        onClick={sendMessage}
        className={`px-4 py-2 mx-5 my-2 rounded-full mt-2 bg-d hover:bg-highlight-d`}
      >
        Send
      </button>
    </div>
  );
};

export default WebSocketDemo;