from typing import *

from api import State

from impl.reversi.game import Game

states: Dict[str, Game] = {}



class ReversiManager:
    """manages the open instances of games"""
    
    def __init__(self):
        # Dict[Session, ReversiState]
        self._games: Dict[str, Game] = {}

    def create_game(self, player_id_1: int, player_id_2: int) -> str:
        """creates a new game and returns its id"""
        game = Game.DEFAULT(player_id_1, player_id_2)
        

    def get_game(self, session: str) -> Optional[Game]:
        """returns the game with the given id"""
        return self._games.get(session, None)
    