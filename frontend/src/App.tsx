import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Reversi from './pages/Reversi';

interface TitleBarProps {
  title: string;
  theme: string;
  themes: { [key: string]: string };
  onCycleTheme: () => void;
}

const default_animation = 'transition duration-1000 ease-out';
/// TitleBar component
const TitleBar: React.FC<TitleBarProps> = ({ title, theme, themes, onCycleTheme }) => {

  return (
    <div className={`title-bar bg-b text-highlight-c flex justify-between ${default_animation}`}>
      <h1 className={`ml-3 lg:mx-24 my-1 py-2 text-3xl font-light`}>{title}</h1>
      <button
        className={`mr-3 lg:mx-24 my-1 py-2 px-4 rounded-xl bg-d hover:bg-c focus:border-blue-500`}
        onClick={onCycleTheme}
      >
        {themes[theme]}
      </button>
    </div>
  );
};

/// App component
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
    <div className={`${theme} bg-a h-screen w-screen scrollbar-thin scrollbar-thumb-b scrollbar-track-highlight-a ${default_animation}`}>
      <Router>
        <TitleBar title="Reversi" theme={theme} themes={themes} onCycleTheme={cycleTheme} />
        <Routes>
          <Route path="/" element={<Reversi theme={theme} />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
