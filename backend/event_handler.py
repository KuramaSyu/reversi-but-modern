from typing import *
import json
from tornado.websocket import WebSocketHandler

from session_manager import SessionManager

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
                response = await listener(event)
                print(f"Response to {self.event_handler.ws._id}: {response}")
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

    async def dispatch(self, event):
        await self.message_receive(event)

    async def message_receive(self, event):
        try:
            event = json.loads(event)
        except json.JSONDecodeError:
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

    async def session_join_event(self, event) -> Dict[str, Any]:
        """
        check if session is valid and return status
        """
        session = event["data"]["session"]
        if SessionManager.validate_session(session):
            return {
                "event": "SessionJoinEvent",
                "status": 200,
                "data": {
                    "session": session
                },
            }
        else:
            return {
                "event": "SessionJoinEvent",
                "status": 404,
                "message": "Session does not exist",
                "data": {
                    "session": session
                },
            }
        
    async def error_event(self, event):
        return event
        



# if __name__ == "__main__":
#     handler = EventHandler()
#     handler.message_receive({"event": "TurnMadeEvent", "data": "test"})
