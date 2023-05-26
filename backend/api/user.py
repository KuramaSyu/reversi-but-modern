from typing import *
from abc import abstractmethod, abstractclassmethod, ABC

__all__ = ["User"]

class User(ABC):
    @property
    @abstractmethod
    def id(self) -> int:
        """
        the Uer ID
        """
        ...
