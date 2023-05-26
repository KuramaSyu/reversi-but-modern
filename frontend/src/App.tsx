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
  const theme = darkTheme ? "theme-nordic" : "theme-neon";

  return (
    <div className={`title-bar ${theme} bg-b text-highlight-c flex justify-between`}>
      <h1 className={`ml-3 lg:mx-24 my-1 py-2 text-3xl font-light`}>{title}</h1>
      <button
        className={`mr-3 lg:mx-24 my-1 py-2 rounded-xl bg-d hover:bg-c
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
  rows: number;
  cols: number;
  socket: WebSocket | null;
}

interface BoardState {
  active_row: number;
  active_col: number;
}

class Board extends React.Component<BoardProps, BoardState> {
  active_attrs: string;
  unactive_attrs: string;
  constructor(props: BoardProps) {
    super(props);
    this.state = {
      active_row: -1,
      active_col: -1,
    };
    this.active_attrs = "bg-b text-highlight-b font-medium text-xl";
    this.unactive_attrs = "text-highlight-b font-extralight text-xl";
  }
  render() {
    const squares = [];
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const { active_row, active_col } = this.state;
    const row_amount = this.props.rows;
    const col_amount = this.props.cols;
    const numberLabels = Array.from({ length: col_amount -1 }, (_, i) => i + 1);
    const { theme, socket } = this.props;

    // call websocket on click
    const handleClick = (row: number, col: number) => {
      if (socket) {

        socket.send(`clicked on ${numberLabels[col]}${letters[row]}`);

      }
    };
    // generate squares
    for (let row = 0; row < row_amount; row++) {
      for (let col = 0; col < col_amount; col++) {
        // add orientation squares
        if (row === row_amount - 1 && col === 0) {
          // add empty square
          squares.push(
            <div
              key={`${row}-${col}`}
              className={`pb-[100%]`}
              
            ></div>
          );
          continue;
        }
        if (row < row_amount - 1 && col === 0) {
          // add letters
          // background if active
          const active_attrs = row === active_row ? this.active_attrs : this.unactive_attrs;
          const letter = letters[row];
          squares.push(
            <div
              key={`${row}-${col}`}
              className={`flex justify-center items-center rounded-full transition duration-700 ease-out ${active_attrs}`}
            >
              {letter}
            </div>
          );
          continue;
        }
        if (row === row_amount -1 && col > 0) {
          // add numbers
          // background if active
          const active_attrs = col === active_col ? this.active_attrs : this.unactive_attrs;
          const number = numberLabels[col -1];
          squares.push(
            <div
              key={`${row}-${col}`}
              className={`flex justify-center items-center rounded-full transition duration-700 ease-out ${active_attrs}`}
            >
              {number}
            </div>
          );
          continue;
        }
        // add normal squares
        const color = (row + col) % 2 === 0 ? "bg-b " : "bg-d";
        squares.push(
          <div
            key={`${row}-${col}`}
            className={`pb-[100%] ${color} hover:bg-highlight-d transition duration-1000 ease-out`}
            // set state of active row and col
            onMouseEnter={() => {
              this.setState({
                active_row: row,
                active_col: col,
              });
            }}
            onClick={() => {
              handleClick(row, col);
            }}
          ></div>
        );
      }
    }

    return (

      <div className={`${theme} grid grid-cols-9`}>
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

  const theme = darkTheme ? "theme-nordic" : "theme-neon";
  // return (
  // <Board theme={theme}/>
  // )
  return (
    <div className={`app ${theme} bg-a transition duration-700 ease-out`}>
      <TitleBar title="Reversi — But Modern" darkTheme={darkTheme} onDarkThemeToggle={toggleDarkTheme} />
      
      <div className="flex flex-col md:flex-row my-10 justify-around px-[5%] overflow-y-visible">
        <div className='basis-[48%] h-[100%]'><Board theme={theme} rows={9} cols={9} socket={socket}/></div>
        
        <div>
          <div className={`bg-d text-center ml-[3%] h-[50vh] text-highlight-b message-list flex-auto rounded-3xl overflow-auto `}>
            {messages.map((message, index) => (
              <p key={index}>{message}</p>
            ))}

          </div>
          <div className='flex flex-row justify-end py-2'>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              // tailwind css to make input border to highlight-b when active
              className={`rounded-full flex-auto mx-[3%] py-2 bg-d text-center hover:border-red-600`}
              placeholder='Communicate with the websocket'
              />
              
            <button
              onClick={sendMessage}
              className={`px-10 py-2 basis[20%] transition duration-300 text-highlight-a rounded-full bg-d hover:bg-highlight-d`}
            >Send</button>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default WebSocketDemo;