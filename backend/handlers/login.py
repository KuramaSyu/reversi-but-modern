from typing import *
import bcrypt
import tornado
from tornado import httputil
from tornado.websocket import WebSocketHandler
from tornado.web import RequestHandler, Application

from core import Table


class LoginHandler(RequestHandler):
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
        table = Table("profile.full")
        record = await table.select_row(where={"username": username})
        if not record:
            return self.write(
                {
                    "status": 400,
                    "message": "Username or password is incorrect"
                }
            )
        is_pw_correct = bcrypt.checkpw(password.encode(), record["password_hash"].encode())
        if not is_pw_correct:
            return self.write(
                {
                    "status": 400,
                    "message": "Wrong password"
                }
            )
        self.write(
            {
                "status": 200,
                "message": "Login successful",
                "token": "test"
            }
        )