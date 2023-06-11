from typing import *
from datetime import datetime
from tornado.websocket import WebSocketHandler
import random


class SessionManager:
    websockets: Dict[int, WebSocketHandler] = {}
    sessions: Dict[str, List[WebSocketHandler]] = {}

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
    def remove_session_ws(cls, session: str, ws: WebSocketHandler) -> None:
        """
        Removes a websocket from a session.
        If the session is empty, it will be deleted
        """
        if session not in cls.sessions:
            return
        cls.sessions[session].remove(ws)
        if len(cls.sessions[session]) == 0:
            del cls.sessions[session]

    @classmethod
    def get_session_ws(cls, session: str) -> List[WebSocketHandler]:
        if session not in cls.sessions:
            return []
        return cls.sessions[session]
    
    @classmethod
    def create_session(cls) -> str:
        """
        Generates a session code which contains 4 letters
        """
        letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        code = "".join([random.choice(letters) for _ in range(4)])
        if code in cls.sessions:
            return cls.create_session()
        cls.sessions[code] = []
        return code
    
    @classmethod
    def validate_session(cls, session: str) -> bool:
        """whether a session exists or not"""
        print(cls.sessions.keys())
        print(session in cls.sessions.keys())
        return session in cls.sessions.keys()
