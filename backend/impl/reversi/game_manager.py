from typing import *

from api import State

from impl.reversi.game import Game

states: Dict[str, Game] = {}



class ReversiManager:
    """manages the open instances of games"""
    _games: Dict[str, Game] = {}
        
    @classmethod
    def create_game(cls, player_id_1: int, player_id_2: int, session: str) -> str:
        """creates a new game and returns its id"""
        game = Game.DEFAULT(player_id_1, player_id_2)
        cls._games[session] = game
        
    @classmethod
    def get_game(cls, session: str) -> Optional[Game]:
        """returns the game with the given id"""
        return cls._games.get(session, None)
    