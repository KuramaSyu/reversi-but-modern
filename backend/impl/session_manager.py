from typing import *
from datetime import datetime
from tornado.websocket import WebSocketHandler
import random
import logging


class SessionManager:
    websockets: Dict[int, WebSocketHandler] = {}
    sessions: Dict[str, List[WebSocketHandler]] = {}
    log = logging.getLogger("SessionManager")

    @classmethod
    def get_ws_id(cls) -> int:
        code = random.randint(1000, 9999)
        if code in cls.websockets:
            return cls.get_ws_id()
        return code
    
    @classmethod
    def add_session_ws(cls, session: str, ws: WebSocketHandler) -> None:
        if session not in cls.sessions:
            cls.sessions[session] = []
        cls.sessions[session].append(ws)

    @classmethod
    def remove_session_ws(cls, session: str, ws: WebSocketHandler | None, pass_check: bool = False) -> None:
        """
        Removes a websocket from a session.
        If the session is empty, it will be deleted

        Args:
        ----
        session: str
            The session code
        ws: WebSocketHandler
            The websocket to remove
        pass_check: bool
            Whether to pass the check to remove empty sessions
        """
        if session not in cls.sessions:
            return
        
        if ws:
            cls.sessions[session].remove(ws)
        else:
            cls.sessions[session] = []

        if pass_check:
            return
        
        if len(cls.sessions[session]) == 0:
            cls.log.debug(f"Delete session {session}")
            del cls.sessions[session]

    @classmethod
    def get_session_ws(cls, session: str) -> List[WebSocketHandler]:
        if session not in cls.sessions:
            return []
        return cls.sessions[session]
    
    @classmethod
    def create_session(cls, session: str | None = None) -> str:
        """
        Generates a session code which contains 4 letters
        """
        letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if session is None:
            code = "".join([random.choice(letters) for _ in range(4)])
        else:
            code = session
        if code in cls.sessions:
            if session is None:
                raise Exception(f"Session {session} already exists")
            return cls.create_session()
        cls.sessions[code] = []
        cls.log.debug(f"Created session {code}")
        return code
    
    @classmethod
    def validate_session(cls, session: str) -> bool:
        """whether a session exists or not"""
        return session in cls.sessions.keys()



class GameSessionManager(SessionManager):
    websockets: Dict[int, WebSocketHandler] = {}
    sessions: Dict[str, List[WebSocketHandler]] = {}
    log = logging.getLogger("GameSessionManager")
    
    @classmethod
    def create_session(cls, session: str | None = None) -> str:
        """
        Generates a session code which contains 4 letters
        """
        letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if session is None:
            code = "".join([random.choice(letters) for _ in range(4)])
        else:
            code = session
        if code in cls.sessions:
            if session is None:
                raise Exception(f"Session {session} already exists")
            return cls.create_session()
        cls.sessions[code] = []
        cls.log.debug(f"Created session {code}")
        return code
    
    @classmethod
    def remove_session_ws(cls, session: str, ws: WebSocketHandler | None, pass_check: bool = False) -> None:
        """
        Removes a websocket from a session.
        If the session is empty, it will be deleted

        Args:
        ----
        session: str
            The session code
        ws: WebSocketHandler
            The websocket to remove
        pass_check: bool
            Whether to pass the check to remove empty sessions
        """
        print("removing session ws")
        LobbySessionManager.remove_session(session)
        super().remove_session_ws(session, ws, pass_check)

    @classmethod
    def get_opponent(cls, session: str, player_id: int) -> int | None:
        """
        Returns the opponent of a player in a session
        """
        if session not in cls.sessions:
            return None
        if len(cls.sessions[session]) != 2:
            return None
        if cls.sessions[session][0]._id == player_id:
            return cls.sessions[session][1]._id
        elif cls.sessions[session][1]._id == player_id:
            return cls.sessions[session][0]._id
        return None
        



class LobbySessionManager(SessionManager):
    websockets: Dict[int, WebSocketHandler] = {}
    sessions: Dict[str, List[WebSocketHandler]] = {}
    log = logging.getLogger("LobbySessionManager")

    @classmethod
    def transfer_to_game(cls, session: str) -> None:
        """
        Transfers all websockets from a session to a game session
        """
        GameSessionManager.create_session(session)


    @classmethod
    def remove_session(cls, session: str) -> None:
        """
        Removes a session from the lobby
        """
        if session not in cls.sessions:
            return
        cls.remove_session_ws(session, None, True)
        del cls.sessions[session]
