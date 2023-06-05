import asyncio
from typing import *
from datetime import datetime
import tornado
from tornado.websocket import WebSocketHandler
from tornado.web import RequestHandler, Application
import random

websockets: Dict[int, WebSocketHandler] = {}
sessions: Dict[str, List[int]] = {}

def get_id() -> int:
    code = random.randint(1000000, 9999999)
    if code in websockets:
        return get_id()
    return code

def add_session_ws(session: str, ws_id: int) -> None:
    if session not in sessions:
        sessions[session] = []
    sessions[session].append(ws_id)

def remove_session_ws(session: str, ws_id: int) -> None:
    """
    Removes a websocket from a session.
    If the session is empty, it will be deleted
    """
    if session not in sessions:
        return
    sessions[session].remove(ws_id)
    if len(sessions[session]) == 0:
        del sessions[session]

def get_session_ws(session: str) -> List[WebSocketHandler]:
    if session not in sessions:
        return []
    return [websockets[ws_id] for ws_id in sessions[session]]

def create_session() -> str:
    """
    Generates a session code which contains 4 letters
    """
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    code = "".join([random.choice(letters) for _ in range(4)])
    if code in sessions:
        return create_session()
    sessions[code] = []
    return code


class WebSocket(WebSocketHandler):
    _id: int = -1
    _session: str|None = None
    def check_origin(self, origin):
        return True

    def to_json(self, data, action: str, status: int = 200):
        return {
            "status": status,
            "data": data,
            "action": action,
            "timestamp": datetime.now().timestamp(),
            "sender": "server"
        }
    def open(self):
        self._id = get_id()
        websockets[self._id] = self
        print(f"WebSocket with id {self._id} opened")

    def on_message(self, message):
        print(f"Message received from {self._id}: {message}")
        
        self.write_message(self.to_json(message, "echo", 200))

    def on_close(self):
        del websockets[self._id]
        print(f"WebSocket with id {self._id} closed")


class CreateSessionHandler(RequestHandler):
  def get(self):
    code = create_session()
    self.write({
        "status": 200,
        "data": {
            "code": code
        }
    })


def make_app():
    return tornado.web.Application([
        (r"/chat", WebSocket),
        (r"/create_session", CreateSessionHandler)
    ])

async def main():
    app = make_app()
    app.listen(8888)
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())