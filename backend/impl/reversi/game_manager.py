from typing import *

from api import State

states: Dict[str, "ReversiState"] = {}


class Chip:
    def __init__(self, state: "ReversiState", row: int, column: int, owner_id: int | None = None):
        self._state = state
        self._owner_id = owner_id
        self._row = row
        self._col = column

    def swap_user_id(self) -> None:
        """swaps the owner id to the other player"""
        if self.owner_id is None:
            raise TypeError("Cannot swap owner id of a chip that has no owner")
        if self.owner_id == self._state.player_id_1:
            self._owner_id = self._state.player_id_2
        else:
            self._owner_id = self._state.player_id_1

    @property
    def owner_id(self) -> int:
        return self._owner_id
    
    @property
    def row(self) -> int:
        return self._row
    
    @property
    def column(self) -> int:
        return self._col
    
    def to_json(self) -> Dict[str, Any]:
        return {
            "owner_id": self.owner_id,
            "row": self.row,
            "column": self.column
        }

    def __repr__(self) -> str:
        return f"<Chip owner_id={self.owner_id} row={self.row} column={self.column}>"


class ReversiState(State):
    """
    Represents the state of the Reversi game
    """

    def __init__(self, player_id_1: int, player_id_2: int):
        self._board: List[Chip] = []
        self.player_id_1 = player_id_1
        self.player_id_2 = player_id_2
    
    @property
    def board(self) -> List[Chip]:
        return self._board

    @board.setter
    def board(self, value: List[Chip]) -> None:
        self._board = value

    @staticmethod
    def _generate_state(rows: int, columns: int, player_id_1: int, player_id_2: int) -> "ReversiState":
        """generates a new state"""
        board = []
        self = ReversiState(player_id_1, player_id_2)
        for row in range(rows):
            for column in range(columns):
                board.append(
                    Chip(state=self, row=row, column=column)
                )
        self.board = board
        return self
    
    @classmethod
    def DEFAULT(cls, player_id_1: int, player_id_2: int) -> "ReversiState":
        """returns the default state"""
        return cls._generate_state(8, 8, player_id_1, player_id_2)
    
    def __repr__(self) -> str:
        return f"<ReversiState player_id_1={self.player_id_1} player_id_2={self.player_id_2} board={repr(self.board)}>"
        


class ReversiManager:
    """manages the open instances of games"""
    
    def __init__(self):
        # Dict[Session, ReversiState]
        self._games: Dict[str, ReversiState] = {}

    def create_game(self, player_id_1: int, player_id_2: int) -> str:
        """creates a new game and returns its id"""
        board = [
            Chip(3, 3, player_id_1, player_id_2),
            Chip(4, 4, player_id_1, player_id_2),
            Chip(3, 4, player_id_2, player_id_1),
            Chip(4, 3, player_id_2, player_id_1)
        ]
        game_id = self._generate_game_id()
        self._games[game_id] = ReversiState(board, player_id_1, player_id_2)
        return game_id

    def get_game(self, game_id: str) -> ReversiState:
        """returns the game with the given id"""
        return self._games[game_id]
    