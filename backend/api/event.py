from typing import *
from datetime import datetime
import abc
import asyncio
from abc import ABC, abstractmethod, abstractclassmethod

from . import User



class Event(ABC):
    @property
    @abstractmethod
    def user(self) -> User:
        """
        the user object
        """
        raise NotImplementedError()
    
    @abstractclassmethod
    def from_json(cls, data: Dict[str, Any]) -> "Event":
        """
        Converts a JSON object to an Event object
        

        Args:
        -----
        data : `Dict[str, Any]`
            The JSON object to convert
        
        Returns:
        --------
        `Event`
            The converted Event object
        """
        raise NotImplementedError()
    
class GameEvent(Event):
    @property
    @abstractmethod
    def session_id(self) -> int:
        """
        the id of the session
        """
        raise NotImplementedError()
    
    @abstractmethod
    def check_session(self, session_id: int) -> bool:
        """
        Whether or not it's a valid session id
        """
        raise NotImplementedError()
    
class ReversiEvent(GameEvent):
    session_ids: List[int] = []

    def check_session(self, session_id: int) -> bool:
        return True
        return session_id in self.session_ids

class ChipPlacedEvent(ReversiEvent):
    def __init__(self, user: User, session_id: int, row: int, column: int):
        self._user = user
        self._session_id = session_id
        self.row = row
        self.column = column
    
    @property
    def user(self) -> User:
        return self._user
    
    @property
    def session_id(self) -> int:
        return self._session_id
    
    @property
    def row(self) -> int:
        return self.row
    
    @property
    def column(self) -> int:
        return self.column
    
    def check_session(self, session_id: int) -> bool:
        return self.session_id == session_id
    
    @classmethod
    def from_json(cls, data: Dict[str, Any]) -> "ChipPlacedEvent":
        return cls(
            User(data["user_id"]),
            data["session_id"],
            data["data"]["row"],
            data["data"]["column"]
        )