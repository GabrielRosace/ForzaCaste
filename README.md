# ForzaCaste

## Comandi per runnare:
```bash
sudo service docker start
make run
Cambiare dir
npm install
npm run compile
npm run start

----
# Se c'è bisogno di ricompilare il dockerfile fare:
docker image ls
# Controllare l'id dell'immagine chiamata forzacaste_web e copiarla
docker image rm <id-copiato>
# Poi eseguire i soliti comandi contenuti nel make
```

## Utenti nel DB

### Utenti base
```
username: admin  
password: admin
```
```
username: gabriel  
password: gabriel
```
```
username: caste  
password: caste
```
```
username: tommy  
password: tommy
```

### Utenti moderatori
```
username: gabriel_mod1
password: gabriel
```

### Matchmaking
```
Per effettuare una partita sono necessari due utenti, quindi:
1) Fare il login di due utenti
2) Connettersi al server WebSocket con Postman
3) Creare gli event listener dei WebSocket client su Postman "createMatchRoom", "lobby", "move"
4) Entrambi gli utenti: inviare una richiesta WebSocket con titolo saveClient e parametro { "username": $nome }
5)  Player1:
    5.a) Fare richiesta di gioco, inviare la richiesta http "Create random game request"
    5.b) Ricevuto come risposta il codice 200 e il valore "true" dal server WebSocket invio una richiesta WebSocket con titolo "createMatchRoom") e con parametro { "clientUsername": $nome } 
    5.c) Player1 rimane in attesa
6)  Player2:
    6.a) Fare richiesta di gioco, inviare la richiesta http "Create random game request"
    6.7) Ricevi status code 200
7) Una volta che entrambi i WebSocket client ricevono il messaggio "true" al listener "lobby" fare il redirect della page per iniziare la partita
```
### Richiesta d'amicizia e messaggi amici
```
 per aggiungere un utente tra gli amici:
 1)bisogna fare una richiesta in POST sull'url "localhost:8080/notification", col seguente body--> "receiver": NomeUtente,
                                                                                                   "type": friendRequest
 2)Per accettare la richiesta inviata sotto forma di notifica:
    1)Cambiare l'utente con quello a cui prima è stata inviata la richiesta
    2) fare una richiesta PUT sull'url localhost:8080/notification col seguente body--> "sender": NomeUtente(che ha inviato la richiesta),
                                                                                        "state": true
 3)Infine per aggiunger l'utente alla propria lista bisogna fare una richiesta POST sull'url localhost:8080/friend col seguente
   body--> "sender": NomeUtente(che ha inviato la richiesta)
 per inviare il messaggio a un amico bisogna fare una richiesta in POST sull'url "localhost:8080/notification", col seguente body--> "receiver": NomeUtente,
                                                                                                                                     "type": "friendMessage",
                                                                                                                                     "text": "Salve salvino mio caro vicino"
```

