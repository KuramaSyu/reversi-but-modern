from typing import *
import json
from tornado.websocket import WebSocketHandler
import random
import traceback
from enum import Enum

from impl.session_manager import SessionManager

from impl.reversi.game import Game
from impl.reversi.game_manager import ReversiManager


class ResponseType(Enum):
    SESSION = 0
    PLAYER = 1

class EventManager:
    def __init__(self, event_handler: "EventHandler"):
        self.event_handler = event_handler
        self.listeners: Dict[str, List[Callable[..., Awaitable]]] = {}

    def add_listener(self, event_type, listener: Callable[..., Awaitable]):
        if event_type not in self.listeners:
            self.listeners[event_type] = []
        self.listeners[event_type].append(listener)

    async def notify_listeners(self, event_type: str, event: Dict[str, Any]):
        if event_type in self.listeners:
            for listener in self.listeners[event_type]:
                response, scope = await listener(event)
                if scope == ResponseType.SESSION:
                    print("respond to session")
                    for ws in SessionManager.get_session_ws(event["session"]):
                        print(f"Sending response to {ws._id}: {response}")
                        ws.write_message(response)
                else:
                    print(f"Sending response to {self.event_handler.ws._id}: {response}")
                    self.event_handler.ws.write_message(response)



class event:
    def __init__(self, event_type):
        self.event_type = event_type

    def __call__(self, fn):
        async def wrapper(*args, **kwargs):
            self_ = args[0]
            self_.event_manager.add_listener(self.event_type, fn)
            print(self_)
            await fn(*args, **kwargs)
        return wrapper


class EventHandler:
    def __init__(self, ws: WebSocketHandler):
        self.ws = ws
        self.event_manager = EventManager(self)
        self.event_manager.add_listener("TurnMadeEvent", self.turn_made)
        self.event_manager.add_listener("SessionJoinEvent", self.session_join_event)
        self.event_manager.add_listener("ErrorEvent", self.error_event)
        self.event_manager.add_listener("ChipPlacedEvent", self.chip_placed_event)

    async def dispatch(self, event):
        await self.message_receive(event)

    async def message_receive(self, event):
        # decrypt event
        try:
            event = json.loads(event)
        except json.JSONDecodeError:
            # invalid json syntax
            event = {
                "event": "ErrorEvent",
                "status": 400,
                "message": "Invalid JSON Syntax",
                "data": event
            }
        
        event_type = event["event"]
        print("Event received:", event_type)
        await self.event_manager.notify_listeners(event_type, event)

    async def turn_made(self):
        print("Turn made")

    async def session_join_event(self, event) -> Tuple[Dict[str, Any], ResponseType]:
        """
        check if session is valid and return status
        """
        session = event["session"]
        if SessionManager.validate_session(session):
            player_id = self.ws._id
            SessionManager.add_session_ws(session, self.ws)
            ReversiManager.create_game(
                player_id_1=player_id,
                player_id_2=12345,
                session=session
            )
            return {
                "event": "SessionJoinEvent",
                "status": 200,
                "session": session,
                "data": {
                    "player_id": player_id,
                },
            }, ResponseType.SESSION
        else:
            return {
                "event": "SessionJoinEvent",
                "status": 404,
                "message": "Session does not exist",
                "data": {
                    "session": session
                }
            }, ResponseType.PLAYER
        
    async def chip_placed_event(self, event: Dict[str, Any]) -> Tuple[Dict[str, Any], ResponseType]:
        game: Game | None = ReversiManager.get_game(event["session"])
        if game is None:
            return {
                "event": "ChipPlacedEvent",
                "status": 404,
                "message": "Session does not exist",
                "data": event["data"],
                "session": event["session"]
            }, ResponseType.PLAYER
        try:
            swapped_chips = game.place_chip(
                row=event["data"]["row"],
                column=event["data"]["col"],
                player=event["user_id"]
            )
            return {
                "event": "ChipPlacedEvent",
                "status": 200,
                "session": event["session"],
                "data": {
                    "row": event["data"]["row"],
                    "col": event["data"]["col"],
                    "swapped_chips": swapped_chips,
                    "player": game.current_player
                },
            }, ResponseType.SESSION
        except Exception as e:
            error = traceback.format_exc()
            try:
                return json.loads(str(e)), ResponseType.PLAYER
            except json.JSONDecodeError:
                print(error)
            

        
    async def error_event(self, event):
        return event, ResponseType.PLAYER
        

class LobbyEventHandler:
    def __init__(self, ws: WebSocketHandler):
        self.ws = ws
        self.event_manager = EventManager(self)
        self.event_manager.add_listener("SessionCreateEvent", self.session_create_event)
        # session leave event
        self.event_manager.add_listener("SessionJoinEvent", self.session_join_event)
        # game start event


    async def dispatch(self, event):
        await self.message_receive(event)

    async def message_receive(self, event):
        # decrypt event
        try:
            event = json.loads(event)
        except json.JSONDecodeError:
            # invalid json syntax
            event = {
                "event": "ErrorEvent",
                "status": 400,
                "message": "Invalid JSON Syntax",
                "data": event
            }
        
        event_type = event["event"]
        print("Event received:", event_type)
        await self.event_manager.notify_listeners(event_type, event)
    
    async def session_join_event(self, event) -> Tuple[Dict[str, Any], ResponseType]:
        """
        check if session is valid and return status
        """
        session = event["session"]
        if SessionManager.validate_session(session):
            player_id = self.ws._id
            SessionManager.add_session_ws(session, self.ws)
            return {
                "event": "SessionJoinEvent",
                "status": 200,
                "session": session,
                "data": {
                    "player_id": player_id,
                    "custom_id": event["custom_id"]
                },
            }, ResponseType.SESSION
        else:
            return {
                "event": "SessionJoinEvent",
                "status": 404,
                "message": "Session does not exist",
                "data": {
                    "session": session
                }
            }, ResponseType.PLAYER
        
    async def session_create_event(self, event: Dict[str, Any]) -> Tuple[Dict[str, Any], ResponseType]:
        """
        create a session and return the session id
        """
        session = SessionManager.create_session()
        return {
            "event": "SessionCreateEvent",
            "status": 200,
            "session": session,
            "data": {
                "session": session
            }
        }, ResponseType.PLAYER
    
    async def game_start_event(self, event: Dict[str, Any]) -> Tuple[Dict[str, Any], ResponseType]:
        ...


# if __name__ == "__main__":
#     handler = EventHandler()
#     handler.message_receive({"event": "TurnMadeEvent", "data": "test"})
