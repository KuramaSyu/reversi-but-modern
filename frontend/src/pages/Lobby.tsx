import React, { useState, useEffect } from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {ReactComponent as CopySvg} from '../svg/copy.svg';

const Lobby: React.FC = () => {
  const [sessionCode, setSessionCode] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8888/create_session');
        const data = await response.json();
        const sessionCode = data.data.code;
        setSessionCode(sessionCode);
      } catch (error) {
        console.error('Error fetching session code:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-full text-6xl font-serif text-highlight-a justify-around items-center text-center">
      <div className='flex flex-row'>
        <div className='border-highlight-c border-solid border-4 py-4 px-4 rounded-3xl'>
          <p>Lobby Code: {sessionCode}</p>
        </div>
        <div className='w-24 h-24'>
          <CopySvg className="w-full h-full mx-10 p-3 rounded-xl bg-b text-highlight-a fill-current border-highlight-c border-solid border-4" />
        </div>
      </div>

    </div>
  );
};

export default Lobby;
