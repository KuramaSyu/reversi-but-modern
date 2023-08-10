from typing import *
import bcrypt
import tornado
from tornado import httputil
from tornado.websocket import WebSocketHandler
from tornado.web import RequestHandler, Application

class SignInHandler(RequestHandler):
    def __init__(self, *args, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self._set_headers()

    def _set_headers(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'Content-Type')

    async def post(self):
        password = self.get_argument("password")
        username = self.get_argument("username")
        salt: bytes = bcrypt.gensalt()
        hashed_password: bytes = bcrypt.hashpw(password.encode(), salt)
        self.write(
            {
                "status": 200,
                "token": "test",
                "salt": salt.decode(),
                "hashed_password": hashed_password.decode(),
                "password": password,
            }
        )