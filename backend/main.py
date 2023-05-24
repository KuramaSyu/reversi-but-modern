import asyncio
from typing import *
from datetime import datetime
import tornado
from tornado.websocket import WebSocketHandler

class EchoWebSocket(WebSocketHandler):
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
        print("WebSocket opened")

    def on_message(self, message):
        print("Message received: {}".format(message))
        self.write_message(self.to_json(message, "echo", 200))

    def on_close(self):
        print("WebSocket closed")


def make_app():
    return tornado.web.Application([
        (r"/chat", EchoWebSocket),
    ])

async def main():
    app = make_app()
    app.listen(8888)
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())