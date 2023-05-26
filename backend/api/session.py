from typing import *
from abc import abstractclassmethod, abstractmethod, ABC



class Session(ABC):
    """
    Represents a session of Reversi
    """

    @property
    @abstractmethod
    def id(self) -> int:
        """the id of the sesison"""
        raise 