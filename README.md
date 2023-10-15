# reversi-but-modern
 A Project for learning React JS, Tailwind CSS, the integration of Websockets and Backend with Pythons Tornado framework to manage Websockets

## What is Reversi
Reversi is a board game made for 2 players who place chips. More info, how the game works, [here](https://de.wikipedia.org/wiki/Othello_(Spiel)) ![Screenshot from Website](https://media.discordapp.net/attachments/818871393369718824/1162780814157828116/image.png?ex=653d2f05&is=652aba05&hm=3dc94588bc72e6bec38a7e43ed80cc243dbfe2a5d168fe483f1b9c5df4cd0608&=&width=1621&height=853)

## Test server
Keep in mind, that the game requires 2 players. Starting the game alone, results in a broken game. On the website you will find a copy button. Send the copied URL to the other player. After joining, a second circle with a random number will appear. Now press play.

Test here: https://reversi.inuthebot.duckdns.org

## Setup
copy the repo and run 
```bash 
docker-compose up --build
``` 
For SSL you can use a reverse proxy like traefik, which fetches a SSL cert from Let's Encrypt.


