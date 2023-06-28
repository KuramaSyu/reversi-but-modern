import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Reversi from './pages/Reversi';
import Lobby from './pages/Lobby';

interface TitleBarProps {
	title: string;
	theme: string;
	themes: { [key: string]: string };
	onCycleTheme: () => void;
}

const default_animation = 'transition duration-1000 ease-out';
// TitleBar component
const TitleBar: React.FC<TitleBarProps> = ({ title, theme, themes, onCycleTheme }) => {
	const navigate = useNavigate();
	const onDiscordLogin = () => {
		oauth.tokenRequest({
			code: "query code",
			scope: "identify",
			grantType: "authorization_code",
		}).then(console.log).catch(console.error);
	}
	return (
		<div className={`relative title-bar bg-b text-highlight-c flex justify-between ${default_animation}`}>
			<div className={`ml-3 lg:mx-24 my-2 z-10 text-5xl font-thin hover:text-highlight-a 
      						cursor-pointer transition duration-300`}
				onClick={() => navigate("/lobby/0")}>{title}</div>
			<div>
				<button
					className={`mr-3 lg:mx-24 my-1 py-2 px-4 rounded-xl bg-d hover:bg-c focus:border-blue-500`}
					onClick={onDiscordLogin}>
					soon tm
				</button>
				<button
					className={`mr-3 lg:mx-24 my-1 py-2 px-4 rounded-xl bg-d hover:bg-c focus:border-blue-500`}
					onClick={onCycleTheme}>
					{themes[theme]}
				</button>
			</div>

		</div>
	);
};

// App component
const App: React.FC = () => {
	const [theme, setTheme] = useState('theme-nordic');

	const [themes] = useState<{ [key: string]: string }>({
		'theme-nordic': 'Nordic',
		'theme-woodland': 'Woodland'
	});

	const cycleTheme = () => {
		const themeKeys = Object.keys(themes);
		const currentIndex = themeKeys.indexOf(theme);
		const nextIndex = (currentIndex + 1) % themeKeys.length;
		setTheme(themeKeys[nextIndex]);
	};

	return (
		<div className={`${theme} bg-a h-screen w-screen scrollbar-thin scrollbar-thumb-d scrollbar-track-b overflow-auto ${default_animation}`}>
			<Router>
				<TitleBar title="Reversi" theme={theme} themes={themes} onCycleTheme={cycleTheme} />
				<Routes>
					<Route path='/' element={<Navigate to='/lobby/0' />} />
					<Route path="/game/:session_id" element={<Reversi theme={theme} />} />
					<Route path="/lobby/:session_id" element={<Lobby />} />
				</Routes>
			</Router>
		</div>
	);
};

export default App;
