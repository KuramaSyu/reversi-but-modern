import asyncio
import websockets

async def connect_to_websocket():
    async with websockets.connect('ws://localhost:8888') as websocket:
        while True:
            user_input = input("Enter your message (q to quit): ")
            if user_input == 'q':
                break

            await websocket.send(user_input)
            server_response = await websocket.recv()
            print("Server response:", server_response)

asyncio.run(connect_to_websocket())
