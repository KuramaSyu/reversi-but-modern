import React, { useState, useEffect } from 'react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {useNavigate} from 'react-router-dom';
import {ReactComponent as CopySvg} from '../svg/copy.svg';

const Lobby: React.FC = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [joinedSessionCode, setJoinedSessionCode] = useState(''); // contains the session code that the user has joined
  const [copied, setCopied] = useState(''); // contains the copied text
  const navigate = useNavigate(); 
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [userIds, setUserIds] = useState<Array<number>>([]);
  const [playButtonClicked, setPlayButtonClicked] = useState(false);
  // generate a random 16 digit number
  const custom_id: number = Math.floor(1000000000000000 + Math.random() * 9000000000000000);

    useEffect(() => {

      // Establish WebSocket connection
      const socket = new WebSocket('ws://localhost:8888/lobby');
      setWs(socket);
      // join lobby
      socket.onopen = () => {
        // create new session code
        socket.send(JSON.stringify({
          event: 'SessionCreateEvent',
        }));


      };
      // Handle WebSocket messages
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // handle session join event
        if (data.event === 'SessionJoinEvent' && data.status === 200) {
          const { session, user_id } = data;
          setUserIds((prevUserIds) => [...prevUserIds, user_id]);
          setJoinedSessionCode(session);
        }
        // handle session create event
        if (data.event === 'SessionCreateEvent' && data.status === 200) {
          setSessionCode(data.session);
          socket.send(JSON.stringify({
            event: 'SessionJoinEvent',
            session: data.session,
            custom_id: custom_id,
          }));
      };

      // Cleanup WebSocket connection on component unmount
      return () => {
        socket.close();
      };
      } 
    }, []);

  return (
    <div className="flex flex-col h-full text-6xl text-highlight-a justify-center 
      items-center text-center gap-24">
      <div className='flex flex-row'>
        <div className='relative'>
          <div className='relative flex border-highlight-c border-solid border-[1px] py-4 px-4 rounded-3xl'>
            <p className='font-light'>Lobby Code: </p>
            <input
              type="text"
              className='flex z-10 w-56 text-center border-none outline-none justify-center font-light bg-transparent'
              value={joinedSessionCode}
              onChange={(e) => setJoinedSessionCode(e.target.value)}
            />
          </div>
          <div className='absolute w-full h-full top-0 left-0 border-highlight-c border-solid border-[12px] rounded-3xl blur-xl'>
          </div>
        </div>

        <CopyToClipboard text={joinedSessionCode}
          onCopy={() => setCopied(joinedSessionCode)}>
          <div className='w-24 h-24'>
            <CopySvg className={`w-full h-full mx-10 p-4 rounded-3xl 
             border-highlight-c border-solid border-[1px]
            hover:bg-highlight-c transition duration-300 ease-in cursor-pointer
            ${copied === sessionCode? "bg-d fill-highlight-a":"bg-d fill-a"}`} />
          </div>
        </CopyToClipboard>
      </div>
      <div className='flex relative'
      onClick={() => navigate(`/game/${joinedSessionCode}`)}>
          <div className='relative border-highlight-c border-solid border-[1px] py-4 px-4 
          rounded-3xl z-10 font-thin hover:text-c hover:bg-highlight-c transition duration-300 ease-in cursor-pointer'>
            PLAY
          </div>
          <div className='absolute w-full h-full top-0 left-0 border-highlight-c border-solid border-[12px] rounded-3xl blur-xl'>
          </div>
      </div>

    </div>
  );
};

export default Lobby;
