from typing import *
from datetime import datetime
import abc
import asyncio
from abc import ABC, abstractmethod, abstractclassmethod



class Event(ABC):
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
        ...