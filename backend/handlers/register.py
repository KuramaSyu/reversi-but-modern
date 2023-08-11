from typing import *
import bcrypt
import tornado
from tornado import httputil
from tornado.websocket import WebSocketHandler
from tornado.web import RequestHandler, Application

from core import Table

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
        table = Table("profile.full")
        record = await table.select_row(where={"username": username})
        if record:
            return self.write(
                {
                    "status": 400,
                    "message": "Username already exists",
                    "username": record["username"],
                    "password_hash": record["password_hash"],
                    "salt": record["salt"]

                }
            )

        salt: bytes = bcrypt.gensalt()
        hashed_password: bytes = bcrypt.hashpw(password.encode(), salt)
        table = Table("profile.information")
        record = await table.insert(values={"username": username})
        user_id = record[0]["id"]
        table = Table("profile.authentication")
        record = await table.insert(
            values={
                "user_id": user_id, 
                "salt": salt.decode(), 
                "password_hash": hashed_password.decode()
            }
        )
        self.write(
            {
                "status": 200,
                "token": "test",
                "salt": salt.decode(),
                "hashed_password": hashed_password.decode(),
                "password": password,
                "username": username,
                "user_id": user_id
            }
        )