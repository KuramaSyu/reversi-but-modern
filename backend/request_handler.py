from typing import *


class EventManager:
    def __init__(self):
        self.listeners = {}

    def add_listener(self, event_type, listener):
        if event_type not in self.listeners:
            self.listeners[event_type] = []
        self.listeners[event_type].append(listener)

    def notify_listeners(self, event_type):
        if event_type in self.listeners:
            for listener in self.listeners[event_type]:
                listener()


class event:
    def __init__(self, event_type):
        self.event_type = event_type

    def __call__(self, fn):
        def wrapper(*args, **kwargs):
            self_ = args[0]
            self_.event_manager.add_listener(self.event_type, fn)
            print(self_)
            fn(*args, **kwargs)
        return wrapper


class RequestHandler:
    def __init__(self):
        self.event_manager = EventManager()
        self.event_manager.add_listener("TurnMadeEvent", self.turn_made)

    def message_receive(self, event):
        event_type = event["event"]
        print("Event received:", event_type)
        self.event_manager.notify_listeners(event_type)

    def turn_made(self):
        print("Turn made")


if __name__ == "__main__":
    handler = RequestHandler()
    handler.message_receive({"event": "TurnMadeEvent", "data": "test"})
