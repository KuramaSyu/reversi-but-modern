import React, { useState, useEffect } from 'react';
interface TitleBarProps {
  title: string;
  darkTheme: boolean;
  onDarkThemeToggle: () => void;
}

let themes = {
  light: {
    titlebar_bg: 'bg-green-200',
    bg: 'bg-green-100',
    text: 'text-green-800',
    buttons: 'bg-green-500 text-white',
  },
  dark: {
    titlebar_bg: 'bg-slate-700',
    bg: 'bg-slate-800',
    text: 'text-white',
    buttons: 'bg-slate-500 text-white',
  },
};

/// TitleBar component
const TitleBar: React.FC<{ title: string; darkTheme: boolean; onDarkThemeToggle: () => void }> = ({
  title,
  darkTheme,
  onDarkThemeToggle,
}) => {
  const theme = darkTheme ? themes.dark : themes.light;

  return (
    <div className={`title-bar ${theme.titlebar_bg}`}>
      <h1 className={`text-xl ${theme.text}`}>{title}</h1>
      <button
        className={`px-4 py-2 rounded ${theme.buttons}`}
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
    setDarkTheme((prevDarkTheme) => !prevDarkTheme);
  };

  const theme = darkTheme ? themes.dark : themes.light;

  return (
    <div className={`app ${theme.bg}`}>
      <TitleBar title="WebSocket Demo" darkTheme={darkTheme} onDarkThemeToggle={toggleDarkTheme} />
      <div className={`message-list ${theme.text}`}>
        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className={`border rounded px-2 py-1 mt-2 ${theme.text}`}
      />
      <button
        onClick={sendMessage}
        className={`px-4 py-2 rounded mt-2 ${theme.buttons}`}
      >
        Send
      </button>
    </div>
  );
};

export default WebSocketDemo;