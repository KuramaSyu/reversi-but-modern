from typing import *
import json
from tornado.websocket import WebSocketHandler
import random
import traceback
from enum import Enum
import logging

from impl.session_manager import GameSessionManager, LobbySessionManager, SessionManager

from impl.reversi.game import Game
from impl.reversi.game_manager import ReversiManager


logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

class ResponseType(Enum):
    SESSION = 0
    PLAYER = 1

class EventManager:
    def __init__(self, event_handler: "ReversiEventHandler", session_manager: SessionManager):
        self.log = logging.getLogger(event_handler.__class__.__name__)
        self.session_manager = session_manager
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
                    self.log.debug("respond to session")
                    for ws in self.session_manager.get_session_ws(event["session"]):
                        self.log.debug(f"Sending response to {ws._id}: {response}")
                        ws.write_message(response)
                else:
                    self.log.debug(f"Sending response to {self.event_handler.ws._id}: {response}")
                    self.event_handler.ws.write_message(response)



class event:
    def __init__(self, event_type):
        self.event_type = event_type

    def __call__(self, fn):
        async def wrapper(*args, **kwargs):
            self_ = args[0]
            self_.event_manager.add_listener(self.event_type, fn)
            await fn(*args, **kwargs)
        return wrapper


class ReversiEventHandler:
    def __init__(self, ws: WebSocketHandler):
        self.log = logging.getLogger(self.__class__.__name__)
        self.ws = ws
        self.event_manager = EventManager(self, GameSessionManager)
        self.event_manager.add_listener("TurnMadeEvent", self.turn_made)
        self.event_manager.add_listener("SessionJoinEvent", self.session_join_event)
        self.event_manager.add_listener("ErrorEvent", self.error_event)
        self.event_manager.add_listener("ChipPlacedEvent", self.chip_placed_event)
        self.event_manager.add_listener("GameReadyEvent", self.game_ready_event)


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
        self.log.debug(f"Event received: {event_type}",)
        await self.event_manager.notify_listeners(event_type, event)


    async def turn_made(self):
        self.log.debug("Turn made")


    async def session_join_event(self, event) -> Tuple[Dict[str, Any], ResponseType]:
        """
        check if session is valid and return status
        """
        session = event["session"]
        if GameSessionManager.validate_session(session):
            player_id = self.ws._id
            GameSessionManager.add_session_ws(session, self.ws)
        else: 
            return {
                "event": "SessionJoinEvent",
                "status": 404,
                "message": "Session does not exist",
                "data": {
                    "session": session
                }
            }, ResponseType.PLAYER
        
        if len(GameSessionManager.sessions[session]) >= 2:
            # game ready
            ReversiManager.create_game(
                player_id_1=GameSessionManager.sessions[session][0]._id,
                player_id_2=GameSessionManager.sessions[session][1]._id,
                session=session
            )
            # dispatch game ready event
            await self.dispatch(
                event=json.dumps({
                    "event": "GameReadyEvent",
                    "status": 200,
                    "session": session,
                    "data": {
                        "player_id_1": GameSessionManager.sessions[session][0]._id,
                        "player_id_2": GameSessionManager.sessions[session][1]._id,
                    },
                })
            )
        return {
            "event": "SessionJoinEvent",
            "status": 200,
            "session": session,
            "data": {
                "custom_id": event["data"]["custom_id"], 
                "player_id": player_id,
            },
        }, ResponseType.SESSION


    async def game_ready_event(self, event: Dict[str, Any]) -> Tuple[Dict[str, Any], ResponseType]:
        return {
            "event": "GameReadyEvent",
            "status": 200,
            "session": event["session"],
            "data": {
                "player_id_1": event["data"]["player_id_1"],
                "player_id_2": event["data"]["player_id_2"],
            },
         }, ResponseType.SESSION


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
            response = game.place_chip(
                row=event["data"]["row"],
                column=event["data"]["column"],
                player=event["user_id"]
            )
            return response, ResponseType.SESSION
        except Exception as e:
            error = traceback.format_exc()
            try:
                return json.loads(str(e)), ResponseType.PLAYER
            except json.JSONDecodeError:
                self.log.debug(error)
            

        
    async def error_event(self, event):
        return event, ResponseType.PLAYER
        


class LobbyEventHandler:
    def __init__(self, ws: WebSocketHandler):
        self.log = logging.getLogger(self.__class__.__name__)
        self.ws = ws
        self.event_manager = EventManager(self, LobbySessionManager)
        self.event_manager.add_listener("SessionCreateEvent", self.session_create_event)
        self.event_manager.add_listener("SessionJoinEvent", self.session_join_event)
        self.event_manager.add_listener("SessionLeaveEvent", self.session_leave_event)
        self.event_manager.add_listener("GameStartEvent", self.game_start_event)


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
        self.log.debug(f"Event received: {event_type}", )
        await self.event_manager.notify_listeners(event_type, event)
    

    async def session_join_event(self, event) -> Tuple[Dict[str, Any], ResponseType]:
        """
        check if session is valid and return status
        """
        session = event["session"]
        if LobbySessionManager.validate_session(session):
            user_id = self.ws._id
            LobbySessionManager.add_session_ws(session, self.ws)
            self.ws.set_session(session)
            return {
                "event": "SessionJoinEvent",
                "status": 200,
                "session": session,
                "data": {
                    "user_id": user_id,
                    "all_users": [ws._id for ws in LobbySessionManager.get_session_ws(session)],
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
        session = LobbySessionManager.create_session()
        return {
            "event": "SessionCreateEvent",
            "status": 200,
            "session": session,
            "data": {
                "session": session
            }
        }, ResponseType.PLAYER
    

    async def session_leave_event(self, event: Dict[str, Any]) -> Tuple[Dict[str, Any], ResponseType]:
        """
        create a session and return the session id
        """
        # removing of websocket is done in main
        return {
            "event": "SessionLeaveEvent",
            "status": 200,
            "session": event["session"],
            "data": {
                "session": event["session"],
                "all_users": [ws._id for ws in LobbySessionManager.get_session_ws(event["session"])]
            }
        }, ResponseType.SESSION
    

    async def game_start_event(self, event: Dict[str, Any]) -> Tuple[Dict[str, Any], ResponseType]:
        LobbySessionManager.transfer_to_game(event["session"])
        self.log.debug(f"Game codes: {GameSessionManager.sessions}")
        return {
            "event": "GameStartEvent",
            "status": 200,
            "session": event["session"]
        }, ResponseType.SESSION


# if __name__ == "__main__":
#     handler = EventHandler()
#     handler.message_receive({"event": "TurnMadeEvent", "data": "test"})
