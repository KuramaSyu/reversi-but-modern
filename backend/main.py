import asyncio
from typing import *
from datetime import datetime
from typing import Any
import tornado
from tornado import httputil
from tornado.websocket import WebSocketHandler
from tornado.web import RequestHandler, Application
import random
import json 
import traceback
import logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

from utils import Grid
from handlers import LoginHandler, SignInHandler
from impl.session_manager import GameSessionManager, LobbySessionManager
from impl.event_handler import ReversiEventHandler, LobbyEventHandler
from core import Database, get_config

config = get_config()





class GameWebSocket(WebSocketHandler):
    _id: int = -1
    _session: str|None = None

    def __init__(self, *args, **kwargs: Any) -> None:
        self.log = logging.getLogger(self.__class__.__name__)
        self.event_handler: ReversiEventHandler = ReversiEventHandler(self)
        super().__init__(*args, **kwargs)

    def check_origin(self, origin):
        return True

    def open(self):
        self._id = GameSessionManager.get_ws_id()
        GameSessionManager.websockets[self._id] = self
        self.log.debug(f"WebSocket with id {self._id} opened")

    async def on_message(self, message):
        self.log.debug(f"Game Message received from {self._id}: {message}")
        try:
            await self.event_handler.dispatch(message)
        except tornado.websocket.WebSocketClosedError:
            self.log.debug("WebSocketClosedError")
            self.on_close()

    def on_close(self):
        del GameSessionManager.websockets[self._id]
        if self._session is not None:
            GameSessionManager.remove_session_ws(self._session, self._id)
            self.log.debug(f"WebSocket with id {self._id} removed from session {self._session}")
        self.log.debug(f"WebSocket with id {self._id} closed")



class LobbyWebSocket(WebSocketHandler):
    _id: int = -1
    _session: str | None = None
    _custom_id: str | None = None

    def __init__(self, *args, **kwargs: Any) -> None:
        self.log = logging.getLogger(self.__class__.__name__)
        self.event_handler: LobbyEventHandler = LobbyEventHandler(self)
        super().__init__(*args, **kwargs)

    def check_origin(self, origin):
        return True
    
    def set_session(self, session: str):
        self._session = session

    def open(self):
        self._id = LobbySessionManager.get_ws_id()
        LobbySessionManager.websockets[self._id] = self
        self.log.debug(f"WebSocket with id {self._id} opened")
    
    def on_close(self):
        self.log.debug(f"Lobby WebSocket with id {self._id} closing")
        if not self._session or not self._id:
            self.log.debug("No session or id")
            return
        self.log.debug("removing session")
        self.log.debug(LobbySessionManager.sessions[self._session])
        try:
            LobbySessionManager.remove_session_ws(self._session, self)
        except Exception:
            self.log.debug(traceback.format_exc())
        # emulating a lobby left event
        self.log.debug("dispatching lobby leave event")
        event = json.dumps(
            {
                "event": "SessionLeaveEvent",
                "session": self._session,
                "user_id": self._id,
            }
        )
        task = asyncio.create_task(self.event_handler.dispatch(event))
        self.log.debug(f"Lobby WebSocket with id {self._id} closed")

    async def on_message(self, message):
        self.log.debug(f"Lobby Message received from {self._id}: {message}")
        try:
            await self.event_handler.dispatch(message)
        except tornado.websocket.WebSocketClosedError:
            self.log.debug("WebSocketClosedError")
            self.on_close()


class CreateSessionHandler(RequestHandler):
    BASE_URL = config.public.url

    def __init__(self, *args, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._set_headers()
        

    def _set_headers(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'Content-Type')

    async def get(self):
        code = LobbySessionManager.create_session()
        self.write({
            "status": 200,
            "data": {
                "code": code,
                "link": f"{self.BASE_URL}lobby/{code}"
            }
        })

class DiscordLoginHandler(RequestHandler):
    def __init__(self, *args, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._set_headers()

    def _set_headers(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'Content-Type')

    async def get(self):
        code = LobbySessionManager.create_session()
        self.write({
            "status": 200,
            "data": {
                "code": code,
                "link": f"http://inuthebot.duckdns.org:4242/lobby/{code}"
            }
        })


def make_app():
    return tornado.web.Application([
        (r"/reversi", GameWebSocket),
        (r"/create_session", CreateSessionHandler),
        (r"/lobby", LobbyWebSocket),
        (r"/login", LoginHandler),
        (r"/register", SignInHandler)
    ])

async def main():
    PORT = 8888
    db = Database()
    print(db)
    await db.connect()
    print(f"Starting server on port {PORT}")
    app = make_app()
    app.listen(PORT)
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())