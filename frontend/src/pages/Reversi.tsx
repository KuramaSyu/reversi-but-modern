import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';

interface BoardProps {
    theme: string;
    rows: number;
    cols: number;
    socket: WebSocket | null;
    session: string;
  }
  
interface BoardState {
  active_row: number;
  active_col: number;
  clicked_row: number;
  clicked_col: number;
  screen_height: number;
  rotation: number;
  player_id: number | null;
  info: string;
}

interface ChipProps {
    color: string;
    bg_color: string;
}

class Chip extends React.Component<ChipProps> {

    render() {
        const { color, bg_color } = this.props;

        return (
        <div className={`items-center justify-center w-[90%] h-[90%] rounded-full ${bg_color}`}>
            <div
                className={`items-center justify-center transition-all duration-300 ease-out rounded-full w-full h-full ${color}`}
            ></div>
        </div>

        );
    }
}

interface RuleErrorEvent {
  event: string;
  user_id: number;
  message: string;
}

interface GameReadyEvent {
  event: string;
  status: number;
  session: string;
  data: { 
    player_1_id: number; 
    player_2_id: number; 
    current_player_id: number; 
    board: Array<{ 
      row: number; 
      column: number; 
      owner_id: number; 
      field_name: string
    }>; 
  };
}

class ChipPlacedEvent {
  user_id: number;
  data: { row: number; column: number; swapped_chips: Array<{ row: number; column: number; owner_id: number}>};
  session: string;
  event: string = "ChipPlacedEvent";
  type: string = "request";
  status: number = 200;

  constructor(user_id: number, row: number, col: number, session?: string) {
    this.user_id = user_id;
    this.data = {
      row: row,
      column: col,
      swapped_chips: [],
    };
    this.session = session ?? 'test00session';
  }


  public to_json() {
    return JSON.stringify(this);
  }
}

class Board extends React.Component<BoardProps, BoardState> {
    active_attrs: string;
    unactive_attrs: string;
    // board: list[dict[row: int, col: int, chip: Chip]]
    board: Array<{ row: number, col: number, chip: JSX.Element }> = [];
    chips: Record<number, JSX.Element> = {
        1 : <Chip color="bg-highlight-a/70 border-4 border-black/40" bg_color='bg-a'/>,
        2 : <Chip color="bg-highlight-d/70 border-4 border-black/40" bg_color='bg-a' />,
    };
    chip_colors: Record<number, string> = {};
    current_player_id: number = 0;
    player_1_id: number = 0;
    player_2_id: number = 0;
    starter_id: number = 0;
    turn: number = 5;

    constructor(props: BoardProps) {
      super(props);
      this.state = {
      active_row: -1,
      active_col: -1,
      clicked_row: -1,
      clicked_col: -1,
      screen_height: window.innerHeight,
      rotation: 0,
      player_id: null,
      info: `Turn ${this.turn}`,
      };
      this.active_attrs = "bg-b text-highlight-b font-semibold text-xl";
      this.unactive_attrs = "text-highlight-b font-extralight text-xl";
      this.current_player_id = 0;
      this.player_1_id = 0;
      this.player_2_id = 0;
      this.starter_id = 0;
    }

    on_rule_error(event: RuleErrorEvent) {
      this.setState({ info: event.message });
    }

    on_chip_placed(event: ChipPlacedEvent) {
      if (event.status !== 200) {
        console.log("Error: ", event);
        return;
      }
      const row = event.data.row;
      const col = event.data.column;
      this.board.push({ row: row, col: col, chip: this.chips[this.current_player_id]});
      const swappedChips: Array<{ row: number, column: number, owner_id: number }> = event.data.swapped_chips;
      // remove every chip from board that is in swapped chips
      console.log("board before swapping: ", this.board)
      
      swappedChips.forEach(
        (chip) => {
          console.log("removing chip:" , chip)
          this.board = this.board.filter(
            item => !(item.row === chip.row && item.col === chip.column)
          )
        }
      );
      console.log("board after swapping: ", this.board)
      // add swapped chips to board
      swappedChips.forEach(
        (chip) => {
          this.board.push({ row: chip.row, col: chip.column, chip: this.chips[this.current_player_id]})
        }
      );
      this.turn++;
      this.setState({ info: `Turn ${this.turn}` });
      this.cyclePlayer();
      this.forceUpdate();
    }


    on_game_ready(event: GameReadyEvent, opponentID: number | null, ownID: number | null) {
      console.log("Game ready event: ", event)
      if (event.status !== 200) {
        console.log("Error: ", event);
        return;
      }
      const board = event.data.board;
      this.player_1_id = event.data.player_1_id;
      this.player_2_id = event.data.player_2_id;
      this.current_player_id = event.data.current_player_id;
      this.starter_id = event.data.current_player_id;

      // set this.state.player_id to own id
      this.setState({player_id: ownID ?? opponentID === this.player_1_id ? this.player_2_id : this.player_1_id});
      this.chip_colors = {
        [this.player_1_id] : "bg-highlight-a/70 border-4 border-black/40",
        [this.player_2_id] : "bg-highlight-d/70 border-4 border-black/40",
      };

      this.chips = {
        [this.player_1_id] : <Chip color="bg-highlight-a/70 border-4 border-black/40" bg_color='bg-a'/>,
        [this.player_2_id] : <Chip color="bg-highlight-d/70 border-4 border-black/40" bg_color='bg-a' />,
      };
      board.forEach(
        (chip) => {
          this.board.push({ row: chip.row, col: chip.column, chip: this.chips[chip.owner_id]})
        }
      );
      console.log("Board: ", this.board)
      console.log("Current player id: ", this.current_player_id)
      console.log("Own id: ", this.player_1_id)
      console.log("Opponent id: ", this.player_2_id)
      this.forceUpdate();
    }

    setPlayerId(id: number) {
        console.log("Setting player id: ", id)
        this.setState(
          {player_id: id}
        )
    }

    cyclePlayer() {
        this.current_player_id = this.current_player_id === this.player_1_id ? this.player_2_id : this.player_1_id;
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
        const { active_row, active_col, clicked_col, clicked_row, screen_height, rotation } = this.state;
        const row_amount = this.props.rows;
        const col_amount = this.props.cols;
        const numberLabels = Array.from({ length: col_amount -1 }, (_, i) => col_amount - i - 1);
        const { theme, socket, session } = this.props;

        // call websocket on click
        const handleClick = (row: number, col: number) => {
          console.log("Clicked: ", row, col);
            this.setState({
                clicked_col: col,
                clicked_row: row,
            });
            
            if (!this.state.player_id) {
                console.log("Error: player id not set");
                return;
            }
            if (socket) {
                console.log("Sending chip placed event");
                socket.send(
                  new ChipPlacedEvent(this.state.player_id, row, col, session)
                  .to_json()
                )
            } else {
                console.log("Error: socket not set");
            }
        };
        // generate squares
        for (let row = 0; row < row_amount; row++) {
        for (let col = -1; col < col_amount-1; col++) {
            // add orientation squares
            if (row === row_amount - 1 && col === -1) {
            // add empty square
            squares.push(
                <div
                key={`${row}-${col}`}
                className={``}
                
                ></div>
            );
            continue;
            }
            if (row === row_amount -1 && col > -1) {
              // add letters
              // background if active
              const active_attrs = col === active_col ? this.active_attrs : this.unactive_attrs;
              const letter = letters[col];
              squares.push(
                  <div
                  key={`${row}:${col}`}
                  className={`flex justify-center items-center transition-all duration-700 ease-out rounded-full ${active_attrs}`}
                  >
                  {letter}
                  </div>
              );
              continue;
            }
            
            if (row < row_amount - 1 && col === -1) {
              // add numbers
              // background if active
              const active_attrs = row === active_row ? this.active_attrs : this.unactive_attrs;
              const number = numberLabels[row];
              
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
            const chip = this.board.find((item) => item.row === row && item.col === col)?.chip ?? <Chip color="bg-transparent rounded-lg w-[0%] h-[0%] border-transparent" bg_color=''/>;
            squares.push(
            <div
                key={`${row}-${col}`}
                className={`flex ${color} justify-center items-center transition-all duration-1000 ease-out`}
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
                <div className={`flex w-full h-full justify-center items-center hover:bg-highlight-d/50 hover:rounded-2xl 
                bg-transparent transition-all duration-[1200ms] ease-out hover:duration-200`}>
                    {/* render chip on click into the square */}
                    <div className='flex w-full h-full items-center justify-center'>{chip}</div>
                </div>
            </div>
            );
        }
        }
      // calculate player info circle size
      const shrink_percent = 0.65;
      const px = Math.floor(screen_height * 0.8);
      const px_rest_width = (Math.min(window.innerHeight, window.innerWidth - px) ) / 1.42 * 1 * shrink_percent;

      return (
        <div className={`flex flex-col lg:flex-row items-start justify-around h-full`}>
            <div className={" grid grid-cols-9 grid-rows-9 mb-5 lg:mr-5"} style={{ height: px, width: px }}>
            {squares}
            </div>
            <div className='flex flex-col basis-2/5 flex-initial justify-between items-center gap-5 h-full'>
                {/* info bar */}
                <div className='flex flex-row basis-1/5 justify-between items-center w-full h-full bg-b rounded-2xl'>
                  <div className='flex basis-3/5 flex-shrink px-5 text-highlight-a font-mono justify-center items-center text-center w-full'>
                      <TypeAnimation
                        key={this.state.info}
                        sequence={[
                          this.state.info,
                        ]}
                        wrapper="div"
                        className="w-full h-full"
                        speed={50}
                        repeat={0}
                      />
                  </div>
                  <div className='flex basis-2/5 flex-col p-3 bg-c text-highlight-a font-mono items-left rounded-xl h-full justify-center'>
                    <p className='flex'>Session: {this.props.session}</p>
                    <p className='flex'>Your ID: {this.state.player_id}</p>
                    <p className='flex'>Opponent ID: {this.state.player_id === this.player_1_id ? this.player_2_id : this.player_1_id}</p>
                  </div>
                </div>
              {/* player indicator circle */}
              <div className='flex basis-3/4 flex-grow'>
                <div className="flex flex-row justify-around items-center relative mr-5 lg:my-0 lg:mx-5 overflow-hidden" style={{ height: px_rest_width, width: px_rest_width }}>
                    <div
                        className={`absolute -z-1 w-[98%] h-[98%] bg-transparent border-highlight-c rounded-full border-4
                        border-t-1 border-l-0 border-r-0 border-b-0 transition-all duration-[1s] ease-out 
                        ${this.current_player_id !== this.player_1_id ? 'rotate-90 border-highlight-d' : '-rotate-90 border-highlight-a'} `}>
                    </div>
                    <div className={`flex rounded-full ${this.chip_colors[this.player_1_id]} justify-center items-center text-4xl text-a font-extralight font-mono`} style={{ height: px_rest_width/2.2, width: px_rest_width/2.2 }}>
                        {this.player_1_id === this.state.player_id ? 'You' : ""}
                    </div>
                    <div className={`flex rounded-full ${this.chip_colors[this.player_2_id]} justify-center items-center text-4xl text-a font-extralight font-mono`} style={{ height: px_rest_width/2.2, width: px_rest_width/2.2 }}>
                    {this.player_2_id === this.state.player_id ? 'You' : ""}
                    </div>
                </div>
              </div>

            </div>

        </div>
      );
    }
}



interface ReversiProps {
    theme: string;
  }

let didInit = false;
const Reversi: React.FC<ReversiProps> = ({ theme }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected_session, setConnectedSession] = useState<string | null>(null);
  const { session_id } = useParams<{ session_id: string }>();
  const [ playerID, setPlayerID ] = useState<number | null>(null);
  const [ opponentID, setOpponentID ] = useState<number | null>(null);
  // Create a ref for the Board component
  const boardRef = useRef<Board>(null);
  const custom_id: number = Math.floor(1000000000000000 + Math.random() * 9000000000000000);

  useEffect(() => {
    if (didInit === false) {
      didInit = true;
      const newSocket = new WebSocket('ws://localhost:8888/reversi');
      
      newSocket.onopen = (event) => {
        console.log('connected');
        newSocket.send(JSON.stringify({
          event: 'SessionJoinEvent',
          type: 'request',
          session: session_id,
          data: {
            custom_id: custom_id,
          }
          })
        );
        setSocket(newSocket);
      }

      // handling events
      newSocket.onmessage = (event) => {
        const message = event.data;
        const json_event = JSON.parse(message);
        if (json_event.event === 'SessionJoinEvent' && json_event.status === 200) {
          if (json_event.data.custom_id === custom_id) {          
            setConnectedSession(json_event.session);
            boardRef.current?.setPlayerId(json_event.data.player_id);
            setPlayerID(json_event.data.player_id);
          } else {
            setOpponentID(json_event.data.player_id);
          }
        }
        if (json_event.event === 'ChipPlacedEvent' && json_event.status === 200) {
          // Call on_chip_placed method of the Board component
          boardRef.current?.on_chip_placed(json_event);
        }
        // handle RuleErrorEvent
        if (json_event.event === 'RuleErrorEvent') {
          console.log('RuleErrorEvent');
          boardRef.current?.on_rule_error(json_event);
        }
        setMessages((prevMessages) => [message, ...prevMessages]);
        if (json_event.event === 'GameReadyEvent') {
          boardRef.current?.on_game_ready(json_event, opponentID, playerID);
        }
      }
      


    }
    return () => {
      socket?.close();
    }
  }, []);

  const sendMessage = () => {
    if (socket) {
      socket.send(inputValue);
      setInputValue('');
    }
  }

  return (
    <div className={`${theme} flex flex-col md:flex-col gap-5 space-x-4 space-y-4 my-10 justify-around pl-[2%] overflow-y-visible text-highlight-c`}>
      {/* Board Component */}
      <div className="flex-auto">
        <Board ref={boardRef} theme={theme} rows={9} cols={9} socket={socket} session={session_id ?? 'FFFF'}/>
      </div>
      <br></br>
      <br></br>
      
      {/* Websocket communication */}
      <div className="flex-auto text-highlight-c">
        <div
          className={`bg-c text-left text-[12px] h-[63vh] text-highlight-c message-list flex-auto rounded-3xl overflow-auto transition-all 
          duration-300 scrollbar-thin scrollbar-thumb-d scrollbar-track-b w-[99%] my-5 py-3 px-3`}
        >
          {messages.map((message, index) => (
            <p key={index} className="transition-all duration-300">
              {message}
            </p>
          ))}
        </div>

        <div className="flex flex-row justify-end m-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`rounded-full text-highlight-c flex-auto mx-[3%] py-2 bg-d text-center border-2 border-transparent 
            transition duration-300 focus:border-2 focus:border-highlight-b outline-none placeholder-highlight-a`}
            placeholder="Communicate with the websocket"
          />

          <button
            onClick={sendMessage}
            className={`px-10 py-2 basis[20%] transition duration-300 text-highlight-a rounded-full bg-d hover:border-red-700`}
          >
            Send
          </button>
        </div>
      </div>

    </div>
  );
}
  

export default Reversi;