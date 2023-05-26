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
        className={`mr-3 lg:mx-24 my-1 py-2 px-4 rounded-xl bg-d hover:bg-c
        focus:border-blue-500`}
        onClick={onDarkThemeToggle}
      >
        {darkTheme ? 'Nordic' : 'Ne, lass \'ma lieber'}
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
  clicked_row: number;
  clicked_col: number;
  screen_height: number;
}

class Board extends React.Component<BoardProps, BoardState> {
  active_attrs: string;
  unactive_attrs: string;
  constructor(props: BoardProps) {
    super(props);
    this.state = {
      active_row: -1,
      active_col: -1,
      clicked_row: -1,
      clicked_col: -1,
      screen_height: window.innerHeight,
    };
    this.active_attrs = "bg-b text-highlight-b font-semibold text-xl";
    this.unactive_attrs = "text-highlight-b font-extralight text-xl";
  }
  componentDidMount() {
    // Update the screen height state when the component mounts
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    // Remove the event listener when the component unmounts
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    // Update the screen height state when the window is resized
    this.setState({ screen_height: Math.min(window.innerHeight, window.innerWidth) });
  }
  render() {
    const squares = [];
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const { active_row, active_col, clicked_col, clicked_row, screen_height } = this.state;
    const row_amount = this.props.rows;
    const col_amount = this.props.cols;
    const numberLabels = Array.from({ length: col_amount -1 }, (_, i) => i + 1);
    const { theme, socket } = this.props;

    // call websocket on click
    const handleClick = (row: number, col: number) => {
      this.setState({
        clicked_col: col,
        clicked_row: row,
      });
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
              className={``}
              
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
              className={`flex justify-center items-center transition-all duration-700 ease-out rounded-full ${active_attrs}`}
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
              className={`flex justify-center items-center transition-all duration-700 ease-out rounded-full ${active_attrs}`}
            >
              {number}
            </div>
          );
          continue;
        }
        // add normal squares
        const color = (row + col) % 2 === 0 ? "bg-b " : "bg-d";
        const isActive = row === clicked_row && col === clicked_col;
        squares.push(
          <div
            key={`${row}-${col}`}
            className={`flex ${color} justify-center items-center hover:bg-highlight-d/80 transition-all duration-1000 ease-out`}
            // set state of hover row and col
            onMouseEnter={() => {
              this.setState({
                active_row: row,
                active_col: col,
              });
            }}
            // send WS message and set active row and col
            onClick={() => {
              handleClick(row, col);
            }}
          >
            {/* render chip on click into the square */}
            <div className='flex w-full h-full items-center justify-center'>
              { isActive ? 
                <div className="items-center justify-center transition-all duration-300 ease-out rounded-full w-[90%] h-[90%] bg-highlight-b/60 border-4 border-black/40"></div> 
                : <div className="items-center justify-center transition-all duration-700 ease-out bg-transparent rounded-lg w-[0%] h-[0%] border-transparent"></div>
              }
            </div>
            
          </div>
        );
      }
    }
    const px = Math.floor(screen_height * 0.8);
    return (
      <div className={` overflow-hidden`}>
        <div className={theme + " grid grid-cols-9 grid-rows-9"} style={{ height: px, width: px }}>
        {squares}
        </div>
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

  return (
    <div className={`app ${theme} bg-a transition duration-700 ease-out`}>
      <TitleBar title="Reversi — But Modern" darkTheme={darkTheme} onDarkThemeToggle={toggleDarkTheme} />
      
      <div className="flex flex-col md:flex-row space-x-4 space-y-4 my-10 justify-around px-[5%] overflow-y-visible">

        {/* Board Component  */}
        <div className='flex-shrink'><Board theme={theme} rows={9} cols={9} socket={socket}/></div>
        
        {/* Websocket communication */}
        <div className='flex-auto'>
          <div className={`bg-d text-center h-[50vh] text-highlight-b message-list flex-auto rounded-3xl overflow-auto transition-all duration-300`}>
            {messages.map((message, index) => (
              <p key={index} className="transition-all duration-300">{message}</p>
            ))}

          </div>
          <div className='flex flex-row justify-end m-2'>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={`rounded-full flex-auto mx-[3%] py-2 bg-d text-center border-2 border-transparent transition duration-300 focus:border-2 focus:border-highlight-b outline-none`}
              placeholder='Communicate with the websocket'
              />
              
            <button
              onClick={sendMessage}
              className={`px-10 py-2 basis[20%] transition duration-300 text-highlight-a rounded-full bg-d hover:border-red-700`}
            >Send</button>
          </div>
        </div> 
        {/* end Websocket communication */}

      </div>
      {/* end Board Component  */}

    </div>
  );
};

export default WebSocketDemo;