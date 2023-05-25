import React, { useState, useEffect } from 'react';
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


interface BoardProps {
  theme: string;
}

class Board extends React.Component<BoardProps> {
  render() {
    const squares = [];
    const { theme } = this.props;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const color = (row + col) % 2 === 0 ? "bg-b " : "bg-d";
        squares.push(
          <div
            key={`${row}-${col}`}
            className={`w-[100%] pb-[100%] ${color} hover:bg-highlight-d transition duration-1000 ease-out`}
          ></div>
        );
      }
    }

    return (
      <div className={`${theme} grid grid-cols-8`}>
      {squares}
      </div>
    );
  }
}




// WebSocketDemo component
const WebSocketDemo: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [darkTheme, setDarkTheme] = useState(true);

  useEffect(() => {
    const newSocket = new WebSocket('ws://localhost:8888/chat');
    setSocket(newSocket);

    newSocket.onmessage = (event) => {
      const message = event.data;
      setMessages((prevMessages) => [message, ...prevMessages, ]);
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
  // return (
  // <Board theme={theme}/>
  // )
  return (
    <div className={`app ${theme} bg-a`}>
      <TitleBar title="Reversi — But Modern" darkTheme={darkTheme} onDarkThemeToggle={toggleDarkTheme} />
      <div className='flex flex-row justify-center py-2'>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={`rounded basis-[15%] mx-[3%] py-2 bg-d`}
          placeholder='Communicate with the websocket'
          />
          
        <button
          onClick={sendMessage}
          className={`px-10 py-2 transition duration-300 text-highlight-a rounded-full bg-d hover:bg-highlight-d`}
        >Send</button>
      </div>

      
      <div className="flex flex-row justify-around px-[5%] max-h-[60vh]">
        <div className='basis-[35%]'><Board theme={theme}/></div>
        
        <div className={`bg-d text-center ml-[3%] text-highlight-b message-list flex-auto rounded-3xl overflow-auto `}>
          {messages.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default WebSocketDemo;