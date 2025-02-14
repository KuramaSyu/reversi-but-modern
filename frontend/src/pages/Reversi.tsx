import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import config from '../app.config.json';
import { JsxElement } from 'typescript';

const backendName = config.backend.websocket_url;

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
	current_player_id: number;
	valid_moves: Array<{ row: number; column: number; owner_id: number; field_name: string }>;
}

interface ChipProps {
	color: {};
	bg_color: {};
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
		player_1: {
			id: number;
			custom_id: number;
		};
		player_2: {
			id: number;
			custom_id: number;
		};
		current_player_id: number;
		current_player_valid_moves: Array<{ row: number; column: number; owner_id: number; field_name: string }>;
		board: Array<{
			row: number;
			column: number;
			owner_id: number;
			field_name: string
		}>;
	};
}

interface NextPlayerEvent {
	event: string;
	data: {
		user_id: number;
		turn: number;
		reason: string | null;
		valid_moves: Array<{ row: number; column: number; owner_id: number; field_name: string }>
	};
}

interface GameOverEvent {
	event: string;
	data: { user_id: number; title: string; reason: string };
}

class Chip extends React.Component<ChipProps> {

	render() {
		const { color, bg_color } = this.props;

		return (
			<div 
			className={`items-center justify-center w-[90%] h-[90%] rounded-full `} //${bg_color}
			style={bg_color}>
				<div
					className={`items-center justify-center transition-all duration-300 ease-out rounded-full w-full h-full `} //${color}
					style={color}
				></div>
			</div>

		);
	}
}

class ChipPlacedEvent {
	user_id: number;
	data: { row: number; column: number; swapped_chips: Array<{ row: number; column: number; owner_id: number }> };
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
	board: Array<{ row: number, col: number, owner_id: number }> = [];
	chips: Record<number, {3: JSX.Element; 2:JSX.Element ; 1:JSX.Element ;}> = {
		1: {
			3: <Chip color={{
				borderColor: 'black',
				borderWidth: 4,
				color: 'white',	
			}} bg_color={{
				backgroundColor: 'royalblue'
			}} />,
			2: <Chip color={{
				borderColor: 'black',
				borderWidth: 4,
				color: 'white',	
			}} bg_color={{
				backgroundColor: 'royalblue'
			}} />,
			1: <Chip color={{
				borderColor: 'black',
				borderWidth: 4,
				color: 'white',	
			}} bg_color={{
				backgroundColor: 'royalblue'
			}} />,
		},
		2: {
			3: <Chip color={{
				borderColor: 'black',
				borderWidth: 4,
				color: 'white',	
			}} bg_color={{
				backgroundColor: 'orange'
			}} />,
			2: <Chip color={{
				borderColor: 'orange',
				borderWidth: 4,
				color: 'white',	
			}} bg_color={{
				backgroundColor: 'red'
			}} />,
			1: <Chip color={{
				borderColor: 'black',
				borderWidth: 4,
				color: 'white',	
			}} bg_color={{
				backgroundColor: 'orange'
			}} />,
		},
	};

	// higher number = intenser color
	chip_colors: Record<number, {3: {}; 2: {}; 1: {};}> = {0:{3:{}, 2:{}, 1:{}}};
	bg_colors: Record<number, string> = {1:"255, 0, 0", 2:"0, 255, 0"};
	current_player_id: number = 0;
	player_1_id: number = 1;
	player_2_id: number = 2;
	starter_id: number = 1;
	turn: number = 1;
	last_chip_placed: {row: number; column: number, ower_id: number};
	last_chips_swapped: Array<{row: number; column: number, owner_id: number}> = [];
	COLOR_VARIANTS: string[][] = [];
	COLOR: string[] = []
	letters: Array<string> = ["a", "b", "c", "d", "e", "f", "g", "h"];

	
	constructor(props: BoardProps) {
		super(props);
		this.state = {
			active_row: -1,
			active_col: -1,
			clicked_row: -1,
			clicked_col: -1,
			screen_height: window.innerHeight,
			rotation: 0,
			player_id: 0,
			info: `Turn ${this.turn}`,
			current_player_id: 0,
			valid_moves: [],
		};
		this.active_attrs = "bg-b text-highlight-b font-semibold text-3xl";
		this.unactive_attrs = "text-highlight-b font-extralight text-3xl";
		this.current_player_id = 0;
		this.player_1_id = 0;
		this.player_2_id = 0;
		this.starter_id = 0;
		this.last_chip_placed = { row: -1, column: -1, ower_id: 0};
		this.last_chips_swapped = [];
		// this.letters.forEach(element => {
		// 	this.COLOR_VARIANTS.push([`bg-chip-${element}1`, `bg-chip-${element}2`])
		// });
		this.COLOR_VARIANTS = [[]] // "bg-chip-a1/60", "bg-chip-a2/60"
		this.COLOR = this.pickColor()
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

		// set new chip
		this.last_chip_placed = { row: row, column: col, ower_id: event.user_id};
		this.last_chips_swapped = event.data.swapped_chips;
		this.board.push({ row: row, col: col, owner_id: this.current_player_id });

		// update swaped chips
		const swappedChips: Array<{ row: number, column: number, owner_id: number }> = event.data.swapped_chips;
		// remove every chip from board that is in swapped chips
		console.log("board before swapping: ", this.board)

		// remove chips which where swapped
		swappedChips.forEach(
			(chip) => {
				console.log("removing chip:", chip)
				this.board = this.board.filter(
					item => !(item.row === chip.row && item.col === chip.column)
				)
			}
		);
		console.log("board after swapping: ", this.board)
		// add swapped chips to board
		swappedChips.forEach(
			(chip) => {
				this.board.push({ row: chip.row, col: chip.column, owner_id: this.current_player_id })
			}
		);

		this.forceUpdate();
	}

	on_next_player(event: NextPlayerEvent) {
		this.turn = event.data.turn;
		this.current_player_id = event.data.user_id;
		// row from 1 - 8; column from A - H needs to be converted from 0 - 7
		const field_name: string = (8 - this.last_chip_placed.row).toString() + String.fromCharCode(65 + this.last_chip_placed.column);
		this.setState({
			
			info: `Turn ${this.turn}${this.current_player_id == this.state.player_id ? " - it's your Turn" : ""} 
				- Last turn was on ${field_name}
				${event.data.reason ? "\n----\n" + event.data.reason : ""}`,
			current_player_id: event.data.user_id,
		});
		if (this.current_player_id == this.state.player_id) {
			this.setState({ valid_moves: event.data.valid_moves });
		}
	}

	on_game_over(event: GameOverEvent) {
		this.setState({
			info: `${event.data.user_id === this.state.player_id ? "You won the game" : "Game Over"}!\n${event.data.reason}`
		});
	}


	get_chip_bg_color(player_id: number, chip_type: number) {
		// chip type: 1, 2, 3
		var intensities: Record<number, number> = {
			1: 0.6,
			2: 0.6,
			3: 1
		}
		var intensity = intensities[chip_type]

		var ret_val = {backgroundColor: `rgba(${this.bg_colors[player_id]}, ${intensity})`}
		console.log("bg color: ", ret_val)
		return ret_val
	}
	on_game_ready(event: GameReadyEvent, custom_id: number) {
		console.log("Game ready event: ", event)
		if (event.status !== 200) {
			console.log("Error: ", event);
			return;
		}
		const board = event.data.board;
		this.player_1_id = event.data.player_1.id;
		this.player_2_id = event.data.player_2.id;
		this.current_player_id = event.data.current_player_id;
		this.starter_id = event.data.current_player_id;

		// set this.state.player_id to own id
		// /100 /60 is not working because tailwind needs full string
		// fix?
		const test = `${this.COLOR[0]}/60`.toString();
		this.bg_colors = {
			[this.player_1_id]: '65, 105, 225',
			[this.player_2_id]: '255, 204, 64',
		};
		this.chip_colors = {
			[this.player_1_id]: {
				3: {
					borderColor: `rgba(0,0,0,0.6)`,
					borderWidth: 4,
					color: 'black',	
				},
				2: {
					borderColor: `rgba(0,0,0,0.6)`,
					borderWidth: 4,
					color: 'black',	
				},
				1: {
					borderColor: `rgba(0,0,0,0.6)`,
					borderWidth: 4,
					color: 'black',	
				},
			},
			[this.player_2_id]: {
				3: {
					borderColor: `rgba(0,0,0,0.6)`,
					borderWidth: 4,
					color: 'white',		
				},
				2: {
					borderColor: `rgba(0,0,0,0.6)`,
					borderWidth: 4,
					color: 'white',		
				},
				1: { 
					borderColor: `rgba(0,0,0,0.6)`,
					borderWidth: 4,
					color: 'white',		
				},
			},
		};


		// this.chips = {
		// 	[this.player_1_id]: {
		// 		3: <Chip color={`${this.chip_colors[this.player_1_id][3]}`} bg_color='bg-a' />,
		// 		2: <Chip color={`${this.chip_colors[this.player_1_id][2]}`} bg_color='bg-a' />,
		// 		1: <Chip color={`${this.chip_colors[this.player_1_id][1]}`} bg_color='bg-a' />,
		// 	},
		// 	[this.player_2_id]: {
		// 		3: <Chip color={`${this.chip_colors[this.player_2_id][3]}`} bg_color='bg-b' />,
		// 		2: <Chip color={`${this.chip_colors[this.player_2_id][2]}`} bg_color='bg-b' />,
		// 		1: <Chip color={`${this.chip_colors[this.player_2_id][1]}`} bg_color='bg-b' />,
		// 	},
		// };
		board.forEach(
			(chip) => {
				this.board.push({ row: chip.row, col: chip.column, owner_id: chip.owner_id })
			}
		);
		// update states
		const own_id = custom_id == event.data.player_1.custom_id ? event.data.player_1.id : event.data.player_2.id;
		this.setState({
			player_id: own_id,
			current_player_id: this.current_player_id,
			valid_moves: own_id == this.current_player_id ? event.data.current_player_valid_moves : [],
		});



		console.log("Board: ", this.board)
		console.log("Current player id: ", this.current_player_id)
		console.log("player 1: ", this.player_1_id)
		console.log("player 2: ", this.player_2_id)
		//this.forceUpdate();
	}

	setPlayerId(id: number) {
		console.log("Setting player id: ", id)
		this.setState(
			{ player_id: id }
		)
	}

	pickColor() {
		// picks a color based on the minute
		var minute = new Date().toLocaleTimeString([], {
			minute: "2-digit",
		});
		return this.COLOR_VARIANTS[(Number(minute) % this.COLOR_VARIANTS.length)]
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

	// playerInfo(px_rest_width: number) {
	// 	return (
	// 	<div className="flex flex-row justify-around items-center relative mr-5 lg:my-0 lg:mx-5 overflow-hidden" style={{ height: px_rest_width, width: px_rest_width }}>
	// 		<div
	// 			className={`absolute -z-1 w-[98%] h-[98%] bg-transparent border-highlight-c rounded-full border-4
	// 			border-t-1 border-l-0 border-r-0 border-b-0 transition-all duration-[1s] ease-out 
	// 			${this.current_player_id !== this.player_1_id ? 'rotate-90 border-highlight-d' : '-rotate-90 border-highlight-a'} `}>
	// 		</div>
	// 		<div className={`flex rounded-full ${this.chip_colors[this.player_1_id][1]} justify-center items-center text-4xl text-a font-extralight font-mono`} style={{ height: px_rest_width / 2.2, width: px_rest_width / 2.2 }}>
	// 			{this.player_1_id === this.state.player_id ? 'You' : ""}
	// 		</div>
	// 		<div className={`flex rounded-full ${this.chip_colors[this.player_2_id][1]} justify-center items-center text-4xl text-a font-extralight font-mono`} style={{ height: px_rest_width / 2.2, width: px_rest_width / 2.2 }}>
	// 			{this.player_2_id === this.state.player_id ? 'You' : ""}
	// 		</div>
	// 	</div>
	// 	)
	// }
	infoBar() {
		return (
		<div className='flex flex-col w-full items-center justify-between'>
		<div className='flex flex-row justify-between items-center w-full h-full bg-b rounded-2xl text-xl'>
			<div className='flex basis-3/5 flex-shrink px-5 text-highlight-a font-mono ustify-center 
			items-center text-center w-full'>
				<TypeAnimation
					key={this.state.info}
					sequence={[
						this.state.info,
					]}
					wrapper="div"
					className="w-full h-full"
					speed={60}
					repeat={0}
					cursor={false}
				/>
			</div>
			<div className='flex basis-2/5 flex-col p-3 bg-c text-highlight-a font-mono items-left rounded-xl h-full w-full justify-center'>
				<p className='flex'>Session: {this.props.session}</p>
				<p className='flex'>Your ID: {this.state.player_id}</p>
				<p className='flex'>Opponent ID: {this.state.player_id === this.player_1_id ? this.player_2_id : this.player_1_id}</p>
				<p className='flex'>Possible moves: {this.state.valid_moves.length}</p>
			</div>
		</div>
		<div className='flex flex-row-reverse items-center w-full'>
			<div className='flex basis-2/5 flex-row items-center justify-center'>
			<div className='flex shrink bg-d font-sans font-extralight border-highlight-c border-solid border-[1px] py-3 px-3 
				rounded-3xl text-3xl hover:text-c hover:bg-highlight-c justify-center
				transition duration-300 ease-in cursor-pointer w-fit my-2'
				onClick={
					() => {
						this.props.socket?.send(JSON.stringify({
							event: "SurrenderEvent",
							session: this.props.session,
							data: {
								player_id: this.state.player_id
							}
						}))
					}
				}>
				SURRENDER
			</div>
			</div>
		</div>	

		</div>
		
		)
	}
	playerInfo(px_rest_width: number) {
		let color = this.chip_colors[this.player_1_id][1];
		let color1 = this.get_chip_bg_color(this.player_1_id, 3)
		let color2 = this.get_chip_bg_color(this.player_2_id, 3)
		// normaly color is put into tsx, but tailwind makes problems
		// with too dynamic colors
		// maybe add it to style
		return (
			<div className='flex basis-3/4 flex-grow'>
			<div className="flex flex-row justify-around items-center relative mr-5 lg:my-0 lg:mx-5 overflow-hidden" 
			style={{ height: px_rest_width, width: px_rest_width }}>
				<div
					className={`absolute -z-1 w-[98%] h-[98%] bg-transparent border-highlight-c rounded-full border-4
					border-t-1 border-l-0 border-r-0 border-b-0 transition-all duration-[1s] ease-out 
					${this.current_player_id !== this.player_1_id ? 'rotate-90 border-highlight-d' : '-rotate-90 border-highlight-a'} `}>
				</div>
				<div /* The player chips at the right side */
				className={`flex rounded-full justify-center bg-a items-center text-4xl text-a font-extralight font-mono`} 
				style={{ height: px_rest_width / 2.2, width: px_rest_width / 2.2, ...color1 }}> 
					{this.player_1_id === this.state.player_id ? 'You' : ""}
				</div>
				<div 
				className={`flex rounded-full bg-b justify-center items-center text-4xl text-a font-extralight font-mono`} 
				style={{ height: px_rest_width / 2.2, width: px_rest_width / 2.2, ...color2 }}>
					{this.player_2_id === this.state.player_id ? 'You' : ""}         
				</div>
			</div>
		</div>
		)
	}
	render() {
		const squares = [];
		const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
		const { active_row, active_col, clicked_col, clicked_row, screen_height, rotation } = this.state;
		const row_amount = this.props.rows;
		const col_amount = this.props.cols;
		const numberLabels = Array.from({ length: col_amount - 1 }, (_, i) => col_amount - i - 1);
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
			for (let col = -1; col < col_amount - 1; col++) {
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
				if (row === row_amount - 1 && col > -1) {
					// add letters
					// background if active
					const active_attrs = col === active_col ? this.active_attrs : this.unactive_attrs;
					const letter = letters[col];
					squares.push(
						<div
							key={`${row}:${col}`}
							className={`flex justify-center items-center transition-all duration-500 ease-out rounded-full ${active_attrs}`}
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
				//const emptyChip = <Chip color="bg-transparent rounded-lg w-[0%] h-[0%] border-transparent" bg_color='' />;
				const emptyChip = <Chip color={{
					color: 'bg-transparent'
				}} bg_color={{backgroundColor: ''}} />;
				// find chip in board for current field
				const owner_id = this.board.find(
					(item) => item.row === row && item.col === col
				)?.owner_id ?? 0;
				var chip: JSX.Element;
				if (owner_id === 0) {
					chip = emptyChip;
				} else {
					var intensity: 1 | 2 | 3 = 1;
					console.log("last chips swapped: ", this.last_chips_swapped)
					if (this.last_chips_swapped.find((item) => { return item.row === row && item.column === col})) {
						// was swapped last time
						intensity = 2;
					} else if (this.last_chip_placed.row === row && this.last_chip_placed.column === col) {
						// was placed last time
						intensity = 3;
					}
					chip = <Chip color={this.chip_colors[owner_id][intensity]} bg_color={this.get_chip_bg_color(owner_id, intensity)}/>;
				}
				// set hover color to red if not in valid moves
				var hover_color = "";
				if (chip == emptyChip) {
					hover_color = this.state.valid_moves.some(
						(move) => move.row === row && move.column === col
					) ? "hover:bg-highlight-d/50" : "hover:bg-red-500/30";
				}
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
						<div className={`flex w-full h-full justify-center items-center ${hover_color} hover:rounded-2xl 
                		bg-transparent transition-all duration-[1200ms] ease-out hover:duration-200`}>
							{/* render chip on click into the square */}
							<div className='flex w-full h-full items-center justify-center'>{chip}</div>
						</div>
					</div>
				);
			}
		}
		// calculate player info circle size
		const shrink_percent = 0.75;
		const px = Math.floor(screen_height * 0.8);
		const px_rest_width = (Math.min(window.innerHeight, window.innerWidth - px)) / 1.42 * 1 * shrink_percent;

		return (
			<div className={`flex flex-col lg:flex-row items-start justify-around h-full`}>
				<div className={" grid grid-cols-9 grid-rows-9 mb-5 lg:mr-5"} style={{ height: px, width: px }}>
					{squares}
				</div>
				<div className='flex flex-col lg:basis-2/5 flex-initial justify-between items-center h-full w-full'>
					{/* info bar */}
					{this.infoBar()}
					{/* player indicator circle */}
					{this.playerInfo(px_rest_width)}
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
	// Create a ref for the Board component
	const boardRef = useRef<Board>(null);
	const custom_id: number = Math.floor(1000000000000000 + Math.random() * 9000000000000000);

	useEffect(() => {
		if (didInit === false) {
			didInit = true;
			const newSocket = new WebSocket(`${backendName}/reversi`);

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
				var json_event = JSON.parse(event.data);

				if (json_event.event) {
					json_event = { events: [json_event] }
				}
				json_event.events.forEach((json_event: any) => {
					const message = json_event;
					if (json_event.event === 'SessionJoinEvent' && json_event.status === 200) {
						if (json_event.data.custom_id == custom_id) {
							setConnectedSession(json_event.session);
							boardRef.current?.setPlayerId(json_event.data.player_id);
						}
					}

					if (json_event.event === 'ChipPlacedEvent' && json_event.status === 200) {
						boardRef.current?.on_chip_placed(json_event);
					}

					if (json_event.event === 'RuleErrorEvent') {
						boardRef.current?.on_rule_error(json_event);
					}

					if (json_event.event === 'GameReadyEvent') {
						boardRef.current?.on_game_ready(json_event, custom_id);
					}

					if (json_event.event === 'NextPlayerEvent') {
						boardRef.current?.on_next_player(json_event);
					}

					if (json_event.event === 'GameOverEvent') {
						boardRef.current?.on_game_over(json_event);
					}

					setMessages((prevMessages) => [JSON.stringify(message), ...prevMessages]);
				});
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
				<Board ref={boardRef} theme={theme} rows={9} cols={9} socket={socket} session={session_id ?? 'FFFF'} />
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