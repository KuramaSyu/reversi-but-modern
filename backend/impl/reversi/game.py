"""Implements the pure logic of the game."""
from typing import *
from typing import Any
import random
import json

from utils import Grid


class RuleError(Exception):
    """raised when a rule is violated"""
    pass



class Chip:
    def __init__(self, Game: "Game", row: int, column: int, owner_id: int | None = None):
        self._game = Game
        self._owner_id = owner_id
        self._row = row
        self._col = column

    def swap_user_id(self) -> None:
        """swaps the owner id to the other player"""
        if self.owner_id is None:
            raise TypeError("Cannot swap owner id of a chip that has no owner")
        if self.owner_id == self._game.player_id_1:
            self._owner_id = self._game.player_id_2
        else:
            self._owner_id = self._game.player_id_1
    
    def __hash__(self) -> int:
        return hash((self.row, self.column))

    @property
    def owner_id(self) -> int:
        return self._owner_id
    
    @owner_id.setter
    def owner_id(self, value: int) -> None:
        self._owner_id = value
    
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
        # return f"<Chip owner_id={self.owner_id} row={self.row} column={self.column}>"
        return self.__str__()
    
    def __str__(self) -> str:
        """print chip in chess format"""
        return f"<Chip ower={self.owner_id} field={chr(self.column + 65)}{self.row + 1}"
    


class Board:
    """
    Represents a board
    """

    def __init__(self):
        self._board: List[List[Chip]] = []

    def drop_chip(self, row: int, column: int, player_id: int) -> List[Chip]:
        """
        drops a chip at the given position.
        Swaps affected chips.
        Raises RuleError if the move is not valid.

        Args:
        -----
        row: int
            the row of the chip
        column: int
            the column of the chip
        player_id: int
            the id of the player that drops the chip

        Raises:
        -------
        RuleError:
            - on wrong chip placement
            - if the chip is placed on an occupied field

        Returns:
        --------
        List[Chip] :
            A list with all the flipped Chips. The Chips have the new owner id.
        """
        chip = self.get_field(row, column)
        if not chip.owner_id is None:
            raise RuleError(
                json.dumps(
                    {
                        "event": "RuleErrorEvent",
                        "message": "You cannot place your chip on an occupied field.",
                        "user_id": player_id
                    }
                )
            )
        chip.owner_id = player_id
        self._swap_chips(row, column, player_id)

    def _swap_chips(self, row: int, column: int, player_id: int) -> List[Chip]:
        """
        flips the chips that are affected by the chip at the given position.
        This also checks if the move is valid.
        
        Args:
        -----
        row: int
            the row of the chip
        column: int
            the column of the chip

        Raises:
        -------
        RuleError:
            if the move is not valid

        Returns:
        --------
        List[Chip] :
            A list with all the flipped Chips. The Chips have the new owner id.
        """
        directions: List[List[Chip]] = [
            Grid.get_rows(self._board),
            Grid.get_cols(self._board),
            Grid.get_forward_diagonals(self._board),
            Grid.get_backward_diagonals(self._board)
        ]

        affected_chips: Set[Chip] = set()
        for direction in directions:
            for row in direction:
                print(f"check row: {str(row)}")
                start = False
                end = False
                for chip in row:
                    # start when first player chip is found
                    if chip.owner_id == player_id:
                        start = True
                    # skip rest when not started
                    if not start:
                        continue
                    # mark end after the first empty chip is found
                    if chip.owner_id is None:
                        end = True
                    # raise error if a non empty chip is found after the end
                    if end:
                        if not chip.owner_id is None:
                            raise RuleError(
                                json.dumps(
                                    {
                                        "event": "RuleErrorEvent",
                                        "message": "You have to place your chip next to an enemy chip.",
                                        "user_id": player_id
                                    }
                                )
                            )
                        continue
                    # continue when chip does not need to be swapped
                    if chip.owner_id == player_id:
                        continue
                    # add chip to affected chips
                    print(f"affect chip: {str(chip)}")
                    affected_chips.add(chip)
        # swap affected chips
        print(f"affected chips: {str(affected_chips)}")
        for chip in affected_chips:
            chip.swap_user_id()
        return affected_chips
    
    @property
    def board(self) -> List[Chip]:
        return self._board

    @board.setter
    def board(self, value: List[Chip]) -> None:
        self._board = value

    @staticmethod
    def _generate_board(rows: int, columns: int) -> "Board":
        """generates a new state"""
        board = []
        self = Board()
        for row in range(rows):
            board.append([])
            for column in range(columns):
                board[-1].append(
                    Chip(Game=self, row=row, column=column)
                )
        self.board = board
        return self
    
    @classmethod
    def DEFAULT(cls) -> "Board":
        """returns the default state"""
        return cls._generate_board(8, 8)
    
    def __repr__(self) -> str:
        return f"<Board board={repr(self.board)}>"
    
    def get_field(self, row: int, column: int) -> Chip:
        """returns the field at the given position"""
        return self.board[row][column]



class Game:
    """Represents a game of reversi"""
    def __init__(
            self,
            player_1: int,
            player_2: int,
            board: Board = Board.DEFAULT()
    ): 
        self._player_1 = player_1
        self._player_2 = player_2
        #self._current_player_id = random.choice([player_1, player_2])
        self._current_player_id = player_1
        self._board = board

    @property
    def current_player(self) -> int:
        return self._current_player_id
    
    def _swap_current_player(self) -> None:
        """swaps the current player"""
        if self.current_player == self.player_1:
            self._current_player_id = self.player_2
        else:
            self._current_player_id = self.player_1
    
    @property
    def player_1(self) -> int:
        return self._player_1
    
    @property
    def player_2(self) -> int:
        return self._player_2
    
    @property
    def board(self) -> Board:
        return self._board
    
    def place_chip(self, row: int, column: int, player: int) -> List[Chip]:
        """
        drops a chip at the given position.
        Swaps affected chips.
        Raises RuleError if the move is not valid.

        Args:
        -----
        row: int
            the row of the chip
        column: int
            the column of the chip
        player_id: int
            the id of the player that drops the chip

        Raises:
        -------
        RuleError:
            - on wrong chip placement
            - if the chip is placed on an occupied field
            - if player is not the current player

        Returns:
        --------
        List[Chip] :
            A list with all the flipped Chips. The Chips have the new owner id.
        """
        if self.current_player != player:
            raise RuleError(
                json.dumps(
                    {
                        "event": "RuleErrorEvent",
                        "user_id": player,
                        "message": "It is not your turn",
                    }
                )
            )

        swapped_chips = self.board.drop_chip(row, column, player)
        self._swap_current_player()
        return {
            "event": "ChipPlacedEvent",
            "user_id": player,
            "data": {
                "row": row,
                "column": column,
                "swapped_chips": swapped_chips
            },
            "status": 200
        }
    
    @classmethod
    def DEFAULT(cls, player_id_1: int, player_id_2: int) -> "Game":
        """returns the default game"""
        return cls(
            player_1=player_id_1,
            player_2=player_id_2,
            board=Board.DEFAULT()
        )