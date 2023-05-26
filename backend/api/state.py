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
    
    @abstractmethod
    async def save(self) -> "State":
        """
        Updates the state in the database

        Returns:
        --------
        `State`
            The updated state
        """
        raise NotImplementedError()
    
    @abstractmethod
    async def fetch(self) -> "State":
        """
        Fetches the state from the database

        Returns:
        --------
        `State`
            The fetched state
        """
        raise NotImplementedError()
    
    @abstractmethod
    async def create(self) -> "State":
        """
        Creates the state in the database

        Returns:
        --------
        `State`
            The created state
        """
        raise NotImplementedError()
    
    @abstractmethod
    async def delete(self) -> "State":
        """
        Deletes the state from the database

        Returns:
        --------
        `State`
            The deleted state
        """
        raise NotImplementedError()
    
    @abstractmethod
    async def reset(self) -> "State":
        """
        Resets the state

        Returns:
        --------
        `State`
            The resetted state
        """
        raise NotImplementedError()
    
    @abstractmethod
    async def move(self, x: int, y: int) -> "State":
        """
        Makes a move

        Args:
        -----
        x : `int`
            The x coordinate of the move
        y : `int`
            The y coordinate of the move

        Returns:
        --------
        `State`
            The state after the move
        """
        raise NotImplementedError()
    
    @abstractmethod
    async def pass_turn(self) -> "State":
        """
        Passes the turn

        Returns:
        --------
        `State`
            The state after the turn has been passed
        """
        raise NotImplementedError()