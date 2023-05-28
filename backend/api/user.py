from typing import *
from abc import abstractmethod, abstractclassmethod, ABC

__all__ = ["User"]

class User():
    def __init__(self, id: int):
        self._id = id

    @property
    def id(self) -> int:
        """
        the Uer ID
        """
        return self._id
