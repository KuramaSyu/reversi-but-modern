import React, { useState, useEffect } from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {useNavigate} from 'react-router-dom';
import {ReactComponent as CopySvg} from '../svg/copy.svg';

const Lobby: React.FC = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [copied, setCopied] = useState(''); // contains the copied text
  const navigate = useNavigate(); 

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
    <div className="flex flex-col h-full text-6xl text-highlight-a justify-center 
      items-center text-center gap-24">
      <div className='flex flex-row'>
        <div className='relative'>
          <div className='relative border-highlight-c border-solid border-[1px] py-4 px-4 rounded-3xl'>
            <p className='font-light'>Lobby Code: {sessionCode}</p>
          </div>
          <div className='absolute w-full h-full top-0 left-0 border-highlight-c border-solid border-[12px] rounded-3xl blur-xl'>
          </div>
        </div>
        <CopyToClipboard text={sessionCode}
          onCopy={() => setCopied(sessionCode)}>
          <div className='w-24 h-24'>
            <CopySvg className={`w-full h-full mx-10 p-4 rounded-3xl text-highlight-a fill-highlight-a 
            ${copied === sessionCode? "bg-d":"bg-d fill-a"} border-highlight-c border-solid border-[1px]
            transition-all duration-300`} />
          </div>
        </CopyToClipboard>
      </div>
      <div className='flex relative'
      onClick={() => navigate(`/game/${sessionCode}`)}>
          <div className='relative border-highlight-c border-solid border-[1px] py-4 px-4 
          rounded-3xl font-normal'>
            <p className='font-thin'>PLAY</p>
          </div>
          <div className='absolute w-full h-full top-0 left-0 border-highlight-c border-solid border-[12px] rounded-3xl blur-xl'>
          </div>
      </div>

    </div>
  );
};

export default Lobby;