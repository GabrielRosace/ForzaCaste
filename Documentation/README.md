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

username: admin
password: admin
```

# Matchmaking
## Random matchmaking
```
EL = Event Listener 

Entrambi gli utenti:
1) Fare il login. Connettersi al socket inviando il proprio jwt come parametro della connessione.
```

```
2) Fare la richiesta di gioco: prima di tutto mandare un emit sull'evento createMatchRoom passando lo username dopo di che, viene fatta una richiesta HTTP in POST con url 'localhost:8080/game', il payload di questa richiesta è:
```
```json
  {
    "type" : "randomMatchmaking"
  }
```
```
Il player1 (primo player che fa la richiesta), rimane in attesa finchè non fa la richiesta il secondo player e quindi joina la richiesta di gioco (player1 in attesa deve essere mostrato un messaggio di attesa). Quando anche il secondo player accede al game, il server notifica ad entrambi i player che la fase di matchmaking è terminata e quindi il gioco può iniziare. Questo avviene con il server che invia un messaggio all'EL del client 'gameReady'. 
Il contenuto di questo messaggio è, successivamento i player possono essere trasportati al campo da gioco:
```
```json
{ 
  "gameReady": true, 
  "opponentPlayer": "opponent"
}

3) Quando il gioco ha inizio il server invia un messaggio ad entrambi i client all'EL 'move'. Questo messaggio specifica ai due player chi sarà a fare la prima mossa, dal momento che è scelto casualmente. Il messaggio assume 2 formati diversi:
Assumiamo che sia il player1 a cominciare con la prima mossa, riceverà:
```
```json
  {
    "yourTurn" : true
  }
```
```
Player2 riceverà quindi:
```
```json
  {
    "yourTurn" : false
  }
```
```
Ora verranno spiegati i passi che si effettuano ad ogni mossa, per il player che esegue la mossa e per quello in attesa della mossa dell'avversario. Assumiamo che sia player1 ad effettuare la mossa e quindi player2 in attesa di questa.

4.1) Player1 per effettuare una mossa deve fare la richiesta HTTP in POST all'endpoint /move, il contenuto del messaggio deve seguire questo formato:
{
  "move": col
}
  Dove col è la colonna dove inserire la pedina. Quest deve essere compresa tra 1 e 7.
  Dopo aver effettuato la mossa il player1 rimane in attesa di un messaggio dale server per capire se la mossa è corretta e quindi è stata salvata correttamente. Questo messaggio viene ricevuto dell'EL 'move' del client. I caso sono:
  
  MOSSA CORRETTA
  La mossa è corretta, è stata eseguita e salvata senza alcun problema. Il messaggio ricevuto dal client è:
  {
    "error": false,
    "codeError": null,
    "errorMessage": null
  }
  Il turno passa quindi all'avversario, di questo evento il player1 deve essere informato.

  ERRORE: COLONNA PIENA
  La mossa non può essere eseguita perchè la colonna indicata per la mossa è già piena. Il messaggio ricevuto dal client è:
  {
    "error": true,
    "codeError": 1,
    "errorMessage": "The column is full"
  }
  Il player deve essere informato dell'errore e deve quindi eseguire nuovamente la mossa.

  ERRORE: COLONNA NON CONSENTITA
  La mossa non può essere eseguita perchè la colonna indicata esce dal campo di gioco, quindi è > 7 o < 1. Il messaggio ricevuto dal client è:
  {
    "error": true,
    "codeError": 2,
    "errorMessage": "Move not allowed, out of playground"
  }
  Il player deve essere informato dell'errore e deve quindi eseguire nuovamente la mossa.

  ERRORE: TURNO ERRATO
  La mossa non può essere eseguita perchè non è il proprio turno, si deve aspettare che l'avversario effettui la sua mossa. Il messaggio ricevuto dal client è:
  {
    "error": true,
    "codeError": 3,
    "errorMessage": "Wrong turn"
  }
  Il player deve essere informato dell'errore e deve aspettare che l'avversario effettui la mossa.

4.2) II passaggio del turno avviene quando la mossa del player1 avviene correttamente e riceve il relativo messaggio.
Per quanto riguarda il player2 invece gli viene inviato un messaggio, all'EL 'move', che segue il formato:
  {
    "move" : index
  }
Dove index è l'indice della colonna dove l'avversario ha effettuato la mossa. Quindi ne conseguono le seguenti azioni:
  - Deve essere simulata la mossa nella view di player2, quindi mostrare la mossa dell'avversario.
  - Dal momento che questo messaggio si riceve solamente quando l'avversario effettua una mossa consentita e quindi il turno passa all'altro player, deve essere informato il player del cambio di turno, in modo che possa effettuare la sua giocata.

5) Ogni volta che viene effettuata una mossa il server controlla se c'è un vincitore (4 pedine di fila), oppure se il campo è pieno e quindi la partita finisce in pareggio.
In ogni caso ai due player viene inviato un messaggio all'EL 'result', in base al formato del messaggio comunica cose diverse:
```
##### VITTORIA
```
Al player vincitore viene inviato un JSON nel seguente formato, che indica la vittoria:
  {
    "win" : true
  }

SCONFITTA
Al player perdente viene inviato un JSON nel seguente formato, che indica la vittoria:
  {
    "win" : false
  }

PAREGGIO
Nel caso di pareggio il messaggio che viene inviato ad entrambi i player assume il seguente formato:
  {
    "win" : null
  }

6) Terminata la partita viene inviato un messaggio ad entrambi i player che li informano sul nuovo ranking. Il messaggio viene sempre inviato all'EL 'result' ed assume il seguente formato:
  {
    "rank" : n_rank
  }
Dove n_rank è il "numero di trofei" persi o ottenuti. Nel caso del vincitore n_rank sarà > 0, nel caso dello sconfitto invece sarà <0. In base al numero n_rank che si riceve dovrà essere mostrato un messaggio diverso all'utente che indica se ha guadagnato o perso rank.
```
## Friendly matchmaking
```
Quando un utente vuole giocare una partita contro un suo amico, questo dovrà poter accedere alla lista dei suoi amici e scegliare l'amico con il quale giocare.
Questo dovrà inviare una richiesta http in POST a 'localhost/game' con il seguente body:
```
```json
{
  "type" : "friendlyMatchmaking",
  "oppositePlayer" : "username dell'amico"
}
```
```
A questo punto l'amico riceverà un messaggio SocketIO dal server all'EL 'gameRequest'. Questo messaggio indica che l'utente ha ricevuto una richieta di gioco e contiene le informazioni necessarie per accettarla. Questo messaggio ha il seguente body:
```
```json
{
  "type" : "friendlyGame",
  "player" : "username dell'utente che lo ha invitato"
}
```
```
Allora l'utente per accettare la richiesta deve inviare una richiesta http in PUT a 'localhost/game' per accettare la richiesta. Il body di questa richiesta è
```
```json
{
  "sender": "username dell'utente che gli ha inviato la richiesta di gioco",
  "accepted": true/false 
}
```
```
Quando la richiesta di gioco viene quindi accettata entrambi i player ricevono un messaggio SocketIO che li informa che il matchmaking è terminato e possono procedere a giocare. Questo messaggio viene ricevuto all'EL 'gameReady' che indica che si può procedere, con il conseguente contenuto:
```
```json
{
  "gameReady": true, 
  "opponentPlayer": "opponent"
}
```
```
Se invece la richiesta di gioco viene rifiutata, ovvero "accepted: false", allora la richiesta viene eliminata senza che una partita venga creata. Inoltre viene inviato un messaggio al sender della richiesta all'EL 'gameReady' che indica che la richiesta è stata rifiutata, con il seguente body:
```
```json
{
  "gameReady": false,
  "message": "Requeste refused"
}
```
# Osservatori di una partita
```
Deve essere iniziata una partita, l'utente deve essere loggato e deve essere stato effettuato il saveClient.

1) L'utente che vuole diventare osservatore di una partita invia una richiesta http a localhost/game in post, con il seguente body:
```
```json
  {
    "type" : "watchGame",
    "player" : "username di uno dei due player"
  }
```
```
2) L'utente allora riceverà un messaggio SocketIO dal server all'EL "enterGameWatchMode" dove il server indica al client di chi è il turno e lo stato del campo di gioco, in modo che queste informazioni vengano visualizzate all'utente. Il body del messaggio è cos' composto:
```
```json
  {
    "playerTurn" : "username del giocatore che deve fare la prossima mossa",
    "playground": "matrice che contiene il campo di gioco"
  }
```
```
3) A questo punto l'osservatore riceverà tutte le informazioni sulla partita che si sta svolgendo e che sta seguendo. In particolare:
```
### MOSSA
```
L'osservatore riceve un messaggio dal server all'EL "gameStatus". Il body del messaggio segue il formato:
```
```json
{
  "player" : "username del giocatore che ha fatto la mossa",
  "move" : "colonna dove è stata eseguita la mossa",
  "nextTutn" : "username del giocatore del prossimo turno"
}
```
### VITTORIA
```
Quando la partita termina con una vittoria il server invia un messaggio all'osservatore che indica chi è il vincitore. L'EL del client che riceve il messaggio è "result" e il messaggio ha il seguente formato:
```
```json
{
  "winner" : "username del giocatore che ha vinto la partita"
}
```
# Chat di gioco
```
Dopo che è stata creata una partita, quindi sono presenti due player e possibili osservatori che sono entrati nel match ( vedi *Osservatori di una partita*) i vari utenti possono inviare messaggi, in particolare i messaggi inviati dai player sono inviati a tutti, i messaggi inviati dagli osservatori vengono inviati a solo gli osservatori, i messaggi inviati da un moderatore non giocatore sono inviati a tutti.
```
```
Per inviare un messaggio nella chat di gioco, rispettando le precedenti premesse, invia una richiesta http a localhost/gameMessage in POST, con il messaggio che contiene il seguente contenuto:
```
```json
{
  "player" : "username di uno dei due player",
  "message" : "messaggio"
}
```
```
Gli utenti connessi alla partita ricevono un messaggio SocketIO all'EL 'gameChat' che segue il formato:
```
```json
{
    "_id": "identificatore",
    "content": "messaggio",
    "sender": "username dell'utente che ha inviato un messaggio",
    "receiver": "null perchè non c'è un vero destinatario dato che è inviato a tutti gli utenti connessi alla partita",
    "timestamp": "timestamp di quando è stato inviato il messaggio",
    "inpending" : null
}
```
# Invio di messaggi tra utenti (chat p2p)
## Invio di messaggi tra amici
```
Premessa: i due utenti devono essere amici
```
### INVIO DI MESSAGGI
```
Quando un utente vuole inviare un messaggio deve inviare una richiesta http in POST a /message, con il seguente body:
```
```json
{
  "receiver" : "username dell'utente a cui si vuole inviare il messaggio",
  "message" : "messaggio"
}
```
```
Se l'utente destinatario è online (ha fatto il login), riceverà un messaggio SocketIO all'EL 'message' con il seguente body:
```
```json  
{
  "_id": "identificatore",
  "content": "messaggio",
  "sender": "username dell'utente che ha inviato un messaggio",
  "receiver": "username dell'utente che ha ricevuto il messaggio",
  "timestamp": "timestamp di quando è stato inviato il messaggio",
  "indpending" : true
}
```
## Invio di messaggi tra un moderatore e un'utente
```
Premessa: uno dei due utenti coinvolti deve essere un moderatore
```
### INVIO DI MESSAGGI
```
Quando un utente vuole inviare un messaggio deve inviare una richieta http in POST a /message/mod, con il seguente body:
```
```json
{
  "receiver" : "username dell'utente a cui si vuole inviare il messaggio",
  "message" : "messaggio"
}
```
```
Se l'utente destinatario è online, riceverà un messaggio SocketIO all'EL 'message' con il seguente body:
```
```json
{
    "_id": "identificatore",
    "content": "messaggio",
    "sender": "username dell'utente che ha inviato un messaggio",
    "receiver": "username dell'utente che ha ricevuto il messaggio",
    "timestamp": "timestamp di quando è stato inviato il messaggio",
    "inpending": true,
    "isAModMessage": true,
    "__v": 0
}
```
## LETTURA MESSAGGI
```
Quando il destinatario di un messaggio ne riceve uno o più, deve comunicare al server che il o i messaggi/io sono stati letti, in modo tale che l'attributo "inpending" dei messagi vengano settati a false. Per far ciò bisogna fare una richieta http in PUT a localhost/message con il seguente body:
```
```json
{
  "sender" : "username dell'utente che ha inviato i messaggi e per i quali si vogliono indicare come letti"
}
```
## RICHIESTA MESSAGGI NON LETTI
```
Quando un utente effettua il login bisogna verificare se questo ha messaggi non letti, quindi ricevuti mentre era offline, e notificarglielo in moda che li legga. Per ottenere i messaggi non letti deve fare una richiesta in GET a localhost/message con il seguente body:
{}
Vuoto perchè basta solo il suo username
Per questo endpoint è disponibile il filtro isAModMessage che se settato a true consente di ricevere solo i messaggi derivanti da comunicazioni con un moderatore non amico, mentre qualora il filtro sia settato a false oppure sia assente il comportamento sarà quello di default, cioè ritornerà i messaggi che gli amici hanno inviato
```
# DOCUMENTAZIONI TODO

- Event Listener SocketIO, client e server
- Funzionamento aggiornamento informazioni profilo utente
- Friendly game


# Richiesta d'amicizia e messaggi amici
## Richiesta amicizia 
```
Per aggiungere un utente tra gli amici:
1) Bisogna fare una richiesta in POST sull'url "localhost:8080/notification", col seguente body:
```
```json
{
  "receiver": "NomeUtente",
  "type": "friendRequest"
}
```
```
2) Per accettare la richiesta inviata sotto forma di notifica è necessario fare una richiesta PUT all'url 'localhost:8080/notification' col seguente body:
```
```json
{
  "sender": "NomeUtente(che ha inviato la richiesta)",
  "accepted": true
}
```
```
Allora per confermare all'utente che ha inviato la richiesta di amicizia che è stata accettata viene inviato un messaggio Socket.IO all'EL 'request' che indica che l'utente di destinazione ha accettato la richiesta. Questo messaggio presenta il seguente body:
```
```json
{
  "newFriend": "username dell'utente che ha accettato la richiesta"
}
```
```
Se invece l'utente vuole rifiutare una richiesta di amicizia deve fare una richiesta in PUT a 'localhost:8080/notification' con il seguente body:
```
```json
{
  "sender": "nome dell'utente che ha inviato la richiesta",
  "accepted": false
}
```
```
Allora viene inviato un messaggio Socket.IO all'EL 'request' al sender della richiesta. Questa indica che la richiesta è stata rifiutata. Il messaggio contiene il seguente body:
```
```json
{
  "newFriend": null
}
```
## Invio messaggi privati
### Invio
```
Se un utente vuole inviare un messaggio privato ad un amico innanzitutto questi devono essere amici. Poi deve inviare una richiesta HTTP in POST a 'localhost/message' con il seguente body:
```
```json
{
  "receiver" : "username dell'amico a cui si vuole inviare il messaggio",
  "message" : "message"
}
```
```
Se l'utente destinatario è online allora gli verrà notificato del messaggio tramite un messaggio SocketIO inviato all'EL 'message' con il seguente body:
```
```json
{
  "content": "messaggio",
  "timestamp": "timestamp di quando è stato inviato il messaggio",
  "sender": "username dell'utente che ha inviato il messaggio",
  "receiver": "username dell'utente che ha ricevuto il messaggio, ovvero se stessi",
  "inpending" : "true perchè il messaggio deve ancora essere letto"
}
```
### Lettura messaggi
```
Quando all'utente viene notificato che ci sono dei messaggi ricevuti non ancora letti e quando questo apre la chat per leggerli deve essere inviata una richiesta HTTP in PUT a 'localhost/message' con il seguente body:
```
```json
{
  "sender" : "username dell'utente che ha inviato i messaggi che si sta cercando di leggere"
}
```
```

```

### Notifica di un'utente online
Registrarsi all'evento `online` e possono arrivare due informazioni:
- {username: username, isConnected: true} <- L'utente username si è appena connesso
- {username: username, isConnected: false} <- L'utente username si è appena disconnesso

### Utenti online
Facendo una richiesta HTTP in GET a `/users/online` si ottengono gli utenti che sono online in questo momento.

### Notifica riguardante l'informazione di amicizia tra due utenti
Quando viene stretta amicizia tra due utenti allora verrà notificato in broadcast sull'evento `friend` un oggetto così composto:
- Nel caso di amicizia avvenuta: `{user: [user1, user2], deleted: false}`
- Nel caso di amicizia cancellata: `{user: [user1, user2, deleted:true]}`

---
## Nuova modalità (vs CPU)
Per poter giocare contro l'AI bisogna prima di tutto creare il gioco, per farlo, fare la richiesta HTTP in POST `/game/cpu`, essa non necessità che le venga inviato nulla. Successivamente effettuare le mosse mediante la richiesta in POST `/move/cpu` mandando il seguente oggetto JSON
```json
{
    "move": 1,
    "difficulty": 3
}
```
In cui `move` è la colonna in cui si vuole inserire il pezzo e `difficulty` è la difficoltà di gioco(Essa può essere compresa tra 2 e 7, dove 2 è quella più semplice. Si consiglia di usare sempre la stessa difficoltà per non compromettere le future giocate)

Nella risposta si otterranno le seguenti informazioni:
```json
{
    "error": false,
    "errormessage": "Correctly added move",
    "cpu": 2,
    "winner": "Cpu wins"
}
```
In cui `cpu` determina la mossa che è effettuato l'AI, mentre `winner`, se esiste, indica il vincitore

## Richiesta di aiuto durante la partita
Durante una partita in corso, si potrà chiedere l'aiuto dell'AI che risponderà con la mossa migliore che si può giocare in quel momento.
Per far ciò basta effettuare la chiamata HTTP in GET `/move` essa ritornerà
```json
{
    "error": false,
    "errormessage": "",
    "move": {
        "0": 4,
        "1": 9
    }
}
```
Dove nell'oggetto `move` è contenuta la mossa da fare, nello specifico in posizione `0` è indicata la colonna in cui l'AI inserirebbe il pezzo, e in `1` la possibilità di vincità. (Quest'ultimo valore si può ignorare)
