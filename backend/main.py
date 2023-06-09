import asyncio
from typing import *
from datetime import datetime
from typing import Any
import tornado
from tornado import httputil
from tornado.websocket import WebSocketHandler
from tornado.web import RequestHandler, Application
import random

from test import A
print(A)
from grids import Grid
print(Grid)
from impl.session_manager import SessionManager
from impl.event_handler import EventHandler




class WebSocket(WebSocketHandler):
    _id: int = -1
    _session: str|None = None

    def __init__(self, *args, **kwargs: Any) -> None:
        self.event_handler: EventHandler = EventHandler(self)
        super().__init__(*args, **kwargs)

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
        self._id = SessionManager.get_ws_id()
        SessionManager.websockets[self._id] = self
        print(f"WebSocket with id {self._id} opened")

    async def on_message(self, message):
        print(f"Message received from {self._id}: {message}")
        await self.event_handler.dispatch(message)

    def on_close(self):
        del SessionManager.websockets[self._id]
        if self._session is not None:
            SessionManager.remove_session_ws(self._session, self._id)
            print(f"WebSocket with id {self._id} removed from session {self._session}")
        print(f"WebSocket with id {self._id} closed")


class CreateSessionHandler(RequestHandler):
    def __init__(self, *args, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._set_headers()

    def _set_headers(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'Content-Type')

    def get(self):
        code = SessionManager.create_session()
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
    PORT = 8888
    print(f"Starting server on port {PORT}")
    app = make_app()
    app.listen(PORT)
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())