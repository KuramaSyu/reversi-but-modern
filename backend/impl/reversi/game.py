"""Implements the pure logic of the game."""
from typing import *
from typing import Any
import random
import json
from pprint import pprint
from enum import Enum

from utils import Grid


class RuleError(Exception):
    """raised when a rule is violated"""
    def __init__(self, message: str, user_id: int, event: str = "RuleErrorEvent"):
        self.error = {
            "event": event,
            "message": message,
            "user_id": user_id
        }
        super().__init__(json.dumps(self.error))

    @property
    def to_json(self) -> str:
        """returns the error as json"""
        return json.dumps(self.error)
    


class GameOverEvent:
    """event that is sent when the game is over"""
    def __init__(
            self, 
            winner: int,
            title: str,
            reason: str,
    ):
        self.event = "GameOverEvent"
        self.data = {
            "user_id": winner,
            "title": title,
            "reason": reason
        }

    def to_json(self) -> str:
        """returns the event as json"""
        return json.dumps(self.__dict__)

    def to_dict(self) -> Dict[str, Any]:
        """returns the event as dict"""
        return self.__dict__
    



class StartPattern:
    """the different possible starting boards"""
    # List[Player1List[]]
    DIAGONAL = {
        "player_1": [
            {"row": 3, "column": 3},
            {"row": 4, "column": 4}
        ],
        "player_2": [
            {"row": 3, "column": 4},
            {"row": 4, "column": 3}
        ]
    }
    HORIZONTAL = {
        "player_1": [
            {"row": 3, "column": 3},
            {"row": 3, "column": 4}
        ],
        "player_2": [
            {"row": 4, "column": 3},
            {"row": 4, "column": 4}
        ]
    }
    VERTICAL = {
        "player_1": [
            {"row": 3, "column": 3},
            {"row": 4, "column": 3}
        ],
        "player_2": [
            {"row": 3, "column": 4},
            {"row": 4, "column": 4}
        ]
    }


    @classmethod
    def random(cls) -> "StartPattern":
        """returns a random start pattern"""
        return random.choice([cls.DIAGONAL, cls.HORIZONTAL, cls.VERTICAL])



class Chip:
    def __init__(self, game: "Game", row: int, column: int, owner_id: int | None = None):
        self._game = game
        self._owner_id = owner_id
        self._row = row
        self._col = column

    def get_surrounding_opponent_chips(self) -> bool:
        """returns true if there is an opponent chip in the surrounding"""
        surrounding_chips = self._game.get_surrounding_chips(self)


    def swap_user_id(self) -> None:
        """swaps the owner id to the other player"""
        if self.owner_id is None:
            raise TypeError("Cannot swap owner id of a chip that has no owner")
        if self.owner_id == self._game.player_1:
            self._owner_id = self._game.player_2
        else:
            self._owner_id = self._game.player_1
    
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
            "field_name": self.field_name,
            "owner_id": self.owner_id,
            "row": self.row,
            "column": self.column,  
        }

    def __repr__(self) -> str:
        # return f"<Chip owner_id={self.owner_id} row={self.row} column={self.column}>"
        return self.__str__()
    
    def __str__(self) -> str:
        """print chip in chess format"""
        return f"<Chip ower={self.owner_id} field={self.field_name}"
    
    def __eq__(self, __value: object) -> bool:
        if not isinstance(__value, Chip):
            return False
        return self.row == __value.row and self.column == __value.column
    
    @property
    def field_name(self) -> str:
        """print chip in chess format"""
        row_mapping = {index_row: 8-index_row for index_row in range(8)}
        return f"{chr(self.column + 65)}{row_mapping[self.row]}"

    
class Turn:
    def __init__(
        self,
        player: int,
        turn: int,
        chip: Chip | None,
    ):
        self.player_id = player
        self.turn = turn
        self.chip = chip
    
    @property
    def passed_turn(self) -> bool:
        return self.chip is None


class Board:
    """
    Represents a board
    """

    def __init__(self, game: "Game" ):
        self._game = game
        self._board: List[List[Chip]] = []
        self._turn: int = 0

    @property
    def game(self) -> "Game":
        return self._game
    
    @property
    def turn(self) -> int:
        return self._turn

    def count_chips(self, player_id: int) -> int:
        """counts the chips of the given player"""
        count = 0
        for row in self._board:
            for chip in row:
                if chip.owner_id == player_id:
                    count += 1
        return count
    
    def to_json(self, only_occupied_chips: bool = True) -> List[Dict[str, Any]]:
        """returns the board as json"""
        board = []
        for row in self._board:
            for chip in row:
                if chip.owner_id is None and only_occupied_chips:
                    continue
                board.append(chip.to_json())
        return board


    def drop_chip(self, chip: Chip, player: int) -> List[Chip]:
        """
        Places a chip on the board and returns all the chips which where affected by this move

        Args:
        -----
        chip: Chip
            the chip to place on the board
        player: int
            the id of the player that drops the chip

        Raises:
        -------
        RuleError:
            - on wrong chip placement
            - if the chip is placed on an occupied field

        Returns:
        --------
        List[Chip] :
            A list with all the chips which need to be swapped
        """
        # get theoretical changes or raise RuleError
        theoretically_affacted_chips: List[Chip] = []
        try:
            theoretically_affacted_chips = self.theoretically_drop_chip(chip, player, True)
        except RuleError as e:
            raise e
        
        # apply theoretical changes
        chip.owner_id = player
        for chip in theoretically_affacted_chips:
            chip.swap_user_id()
        
        return theoretically_affacted_chips
    

    @property
    def unoccupied_fields(self) -> List[Chip]:
        """returns a list of all unoccupied fields"""
        return [
            chip
            for row in self._board
            for chip in row
            if chip.owner_id is None
        ]
    
    def get_possible_moves(self) -> List[Chip]:
        """returns a list of all possible moves for the given player"""
        return [
            chip
            for chip in self.unoccupied_fields
            if self.has_surrounding_chips(chip)
        ]


    def check_classic_game_over(self) -> Tuple[bool, GameOverEvent | None]:
        """
        checks if the game is over on the following conditions:
            - no free fields left + amount of chips
            - player can't make a valid move

        """
        # check if there are free fields left
        if not self.unoccupied_fields:
            opponent_amount, current_amount = self.count_chips(self.game.other_player), self.count_chips(self.game.current_player)
            if opponent_amount > current_amount:
                return True, GameOverEvent(
                    winner=self.game.other_player,
                    title=f"All Fields are occupied",
                    reason=(
                        f"Player {self.game.other_player} won with {opponent_amount} chips"
                        f" against {current_amount} chips"
                    )
                )
            elif opponent_amount == current_amount:
                return True, GameOverEvent(
                    winner=None,
                    title=f"All Fields are occupied",
                    reason=(
                        f"Draw with {opponent_amount} chips"
                    )
                )
            else:
                return True, GameOverEvent(
                    winner=self.game.current_player,
                    title=f"All Fields are occupied",
                    reason=(
                        f"Player {self.game.current_player} won with {self.count_chips(self.game.current_player)} chips"
                        f" against {self.count_chips(self.game.other_player)} chips"
                    )
                )
        return False, None

    
    def theoretically_drop_chip(
        self, 
        chip: Chip,
        player: int,
        print_: bool = False,
    ) -> List[Chip]:
        """
        tries to theoretically drop a chip on the board.
        This method does not change the board.
        It only returns the chips which would be swapped if the chip would be dropped.

        Args:
        -----
        row: int
            the row of the chip
        column: int
            the column of the chip
        player: int
            the id of the player that drops the chip

        Raises:
        -------
        RuleError:
            - on wrong chip placement
            - if the chip is placed on an occupied field

        Returns:
        --------
        List[Chip] :
            A list with all the chips which need to be swapped
        """
        # check if chip is already occupied
        if not chip.owner_id is None:
            raise RuleError(
                message=f"Field {chip.field_name} is already occupied.", user_id=player
            )
        
        # check for surrounding chips
        if not self.has_surrounding_chips(chip):
            raise RuleError(
                message=f"There is no chip arround {chip.field_name}.", user_id=player
            )
    
        # try to palce chip
        chip.owner_id = player
        affected_chips = self._get_swappable_chips(chip, player, print_)
        if len(affected_chips) == 0:
            chip.owner_id = None
            raise RuleError(
                message="You need to swap at least one chip.", user_id=player
            )
        # revert changes
        chip.owner_id = None

        return affected_chips

    def has_surrounding_chips(self, chip: Chip) -> bool:
        """
        checks if the chip at the given position is valid.
        A chip is valid if it is on the board and has no owner and
        has a surrounding chip.
        """
        # make a list with chips which has an owner
        surrounding_occupied_chips = []
        for chip in self.get_surrounding_chips(chip.row, chip.column):
            if not chip.owner_id is None:
                surrounding_occupied_chips.append(chip)

        if (
            len(surrounding_occupied_chips) == 0
            and sum(
                self.count_chips(player) 
                for player in [self.game.player_1, self.game.player_2]
            ) > 0
        ):
            # no surrounding chip and not first chip -> invalid
            return False
        else:
            # has surrounding chip or is first chip -> valid
            return True


    def get_surrounding_chips(self, row: int, column: int) -> List[Chip]:
        """
        Returns a list of all surrounding chips of the chip at the given position.
        """
        chips: List[Chip] = []
        for i in range(-1, 2):
            for j in range(-1, 2):
                if i == 0 and j == 0:
                    continue
                chip = self.get_field(row + i, column + j)
                if chip is None:
                    continue
                chips.append(chip)
        return chips
    
    def _swap_chips(self, chips: List[Chip]) -> None:
        """swaps the owner of the given chips"""
        for chip in chips:
            chip.swap_user_id()


    def _get_swappable_chips(self, chip: Chip, player: int, print_: bool = False) -> List[Chip]:
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
        placed_chip = chip

        # get all directions of the board
        directions: List[List[List[Chip]]] = [
            Grid.get_rows(self._board),
            Grid.get_cols(self._board),
            Grid.get_forward_diagonals(self._board),
            Grid.get_backward_diagonals(self._board)
        ]

        affected_chips: Set[Chip] = set()
        for direction in directions:
            for row in direction:
                # skip row if placed chip is not in it
                if not placed_chip in row:
                    continue

                # reverse row, so that placed chip is the first one besides None chips
                need_reverse = False
                need_both = False
                for chip in row:
                    if chip.owner_id is None:
                        continue
                    if chip == placed_chip:
                        break
                    else:
                        need_reverse = True
                if need_reverse:
                    row.reverse()

                # actual swapping
                temp_affected_chips: Set[Chip] = set()
                start = False
                placed_reached = False
                if print_:
                    print(f"row: {row}")
                for chip in row:
                    # start when first player chip is found
                    if chip.owner_id == player:
                        if not start:
                            # start
                            start = True
                        else:
                            # end
                            # add found affected chips to affected chips 
                            # TODO: handling when chip in middle of row was placed
                            if placed_reached:
                                affected_chips.update(temp_affected_chips)
                            if not chip == placed_chip:
                                break
                            affected_chips.update(temp_affected_chips)
                        if chip == placed_chip:
                            placed_reached = True
                        continue
                    # skip rest when not started
                    if not start:
                        continue
                    # first None chip -> go to next row
                    if chip.owner_id is None:
                        break
                    temp_affected_chips.add(chip)
        if print_:
            print(f"affected chips: {affected_chips}")
            for row in self._board:
                for chip in row:
                    print(f"{chip.field_name}: {chip.owner_id}", end="\t")
                print()
        return list(affected_chips)
    
    @property
    def board(self) -> List[Chip]:
        return self._board

    @board.setter
    def board(self, value: List[Chip]) -> None:
        self._board = value

    @staticmethod
    def _generate_board(game: "Game", rows: int, columns: int, start_pattern: List[Dict[str, int]]) -> "Board":
        """generates a new state"""
        board = []
        self = Board(game)
        for row in range(rows):
            board.append([])
            for column in range(columns):
                board[-1].append(
                    Chip(game=game, row=row, column=column)
                )
        game.board = self
        self.board = board
        for player_setup in start_pattern.values():
            for chip_coordinates in player_setup:
                self.get_field(
                    chip_coordinates["row"],
                    chip_coordinates["column"]
                ).owner_id = game.current_player
            game._next_turn()
        game._turn = 1
        return self
    
    @classmethod
    def DEFAULT(cls, game: "Game") -> "Board":
        """returns the default state"""
        return cls._generate_board(game, 8, 8, start_pattern=StartPattern.random())
    
    def __repr__(self) -> str:
        return f"<Board board={repr(self.board)}>"
    
    def get_field(self, row: int, column: int) -> Chip | None:
        """returns the field at the given position"""
        try:
            return self.board[row][column]
        except IndexError:
            return None



class Game:
    """Represents a game of reversi"""
    def __init__(
            self,
            player_1: int,
            player_2: int,
    ): 
        self.turns: List[Turn] = []
        self._player_1 = player_1
        self._player_2 = player_2
        #self._current_player = random.choice([player_1, player_2])
        self._current_player = random.choice([player_1, player_2])
        self._board: Board | None = None
        self.game_over = False

    @property
    def current_player(self) -> int:
        return self._current_player
    
    @property
    def other_player(self) -> int:
        if self.current_player == self.player_1:
            return self.player_2
        else:
            return self.player_1
    
    def _next_turn(self) -> None:
        """swaps the current player and increases the turn count"""
        self.board._turn += 1
        if self.current_player == self.player_1:
            self._current_player = self.player_2
        else:
            self._current_player = self.player_1
    
    @property
    def player_1(self) -> int:
        return self._player_1
    
    @property
    def player_2(self) -> int:
        return self._player_2

    
    @property
    def board(self) -> Board:
        return self._board
    
    @board.setter
    def board(self, value: Board) -> None:
        self._board = value
    
    def place_chip(self, row: int, column: int, player: int) -> List[Dict[str, Any]]:
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
        player: int
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
        return_events: List[Dict[str, Any]] = []
        if self.game_over:
            raise RuleError(
                message="The game is already over",
                user_id=player,
            )
        if self.current_player != player:
            raise RuleError(
                message="It's not your turn",
                user_id=player,
            )

        # drops chip or raises RuleError
        swapped_chips = self.board.drop_chip(
            chip=self.board.get_field(row, column),
            player=player
         )
        self.turns.append(
            Turn(
                player=player,
                turn=self.board.turn,
                chip=self.board.get_field(row, column),
            )
        )
        return_events.append({
            "event": "ChipPlacedEvent",
            "user_id": player,
            "data": {
                "row": row,
                "column": column,
                "field_name": Chip(self, row, column).field_name,
                "swapped_chips": [chip.to_json() for chip in swapped_chips]
            },
            "status": 200
        })
        # check classic game over
        game_over, event = self.board.check_classic_game_over()
        if game_over:
            self.game_over = True
            return_events.append(event.to_dict())
            return {"events": return_events}
            
        # add next player event or game over event
        if (move_amount := len(self.get_valid_moves(self.other_player))) > 0:
            # other player has valid moves
            self._next_turn()
            return_events.append({
                "event": "NextPlayerEvent",
                "data": {
                    "user_id": self.current_player,
                    "turn": self.board.turn,
                    "reason": None,
                },
            })
        else:
            if (move_amount := len(self.get_valid_moves(self.current_player))) > 0:
                # other player has no valid moves but current player has
                self.board._turn += 1
                return_events.append({
                    "event": "NextPlayerEvent",
                    "data": {
                        "user_id": self.current_player,
                        "turn": self.board.turn,
                        "reason": f"Player {self.other_player} is not able to move",
                    },
                })
            else:
                # neither player can move
                self.game_over = True
                winner: int | None = None
                if self.board.count_chips(self.current_player) > self.board.count_chips(self.other_player):
                    winner = self.current_player
                elif self.board.count_chips(self.current_player) < self.board.count_chips(self.other_player):
                    winner = self.other_player
                return_events.append(
                    GameOverEvent(
                        winner=winner,
                        title="Game Over",
                        reason="Neither you nor your opponent can move. The game is over.",
                    ).to_dict()
                )
        return {"events": return_events}

    
    def get_valid_moves(self, player: int) -> List[Chip]:
        """returns a list of all valid chips for the given player"""
        fields = self.board.get_possible_moves()
        valid_moves: List[Chip] = []
        for field in fields:
            try:
                self.board.theoretically_drop_chip(field, player)
            except RuleError:
                continue
            valid_moves.append(field)
        return valid_moves

    @classmethod
    def DEFAULT(cls, player_1: int, player_2: int) -> "Game":
        """returns the default game"""
        self = cls(
            player_1=player_1,
            player_2=player_2,
        )
        self.board = Board.DEFAULT(self)
        return self