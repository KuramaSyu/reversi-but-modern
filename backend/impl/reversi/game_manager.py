from typing import *

from api import State


class Chip:
    def __init__(self, row: int, column: int, owner_id: int, swap_user_id: int):
        self._owner_id = owner_id
        self._swap_user_id = swap_user_id
        self._row = row
        self._col = column

    def swap_user_id(self) -> None:
        self._owner_id, self._swap_user_id = self._swap_user_id, self._owner_id

    @property
    def owner_id(self) -> int:
        return self._owner_id
    
    @property
    def row(self) -> int:
        return self._row
    
    @property
    def column(self) -> int:
        return self._col
    


    


class ReversiState(State):
    """
    Represents the state of the Reversi game
    """

    def __init__(self, board: List[Chip], player_id_1: int, player_id_2: int):
        self.board = board
        self.player_id_1 = player_id_1
        self.player_id_2 = player_id_2
    