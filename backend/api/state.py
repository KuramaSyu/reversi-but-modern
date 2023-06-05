from typing import *
from abc import abstractmethod, abstractclassmethod, ABC


class State(ABC):
    """
    Represents the state of the game
    """

    @abstractmethod
    def to_json(self) -> Dict[str, Any]:
        """
        Converts the state to a JSON object

        Returns:
        --------
        `Dict[str, Any]`
            The JSON object
        """
        raise NotImplementedError()
    
    @abstractclassmethod
    def from_json(cls, data: Dict[str, Any]) -> "State":
        """
        Converts a JSON object to a State object

        Args:
        -----
        data : `Dict[str, Any]`
            The JSON object to convert

        Returns:
        --------
        `State`
            The converted State object
        """
        raise NotImplementedError()
    

class ReversiState(State):
    ...