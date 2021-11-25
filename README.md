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
## Random matchmaking
```
EL = Event Listener 
Entrambi gli utenti:
1) Fare il login. Quando viene fatto il login il client deve inviare un messaggio all'EL 'saveClient' dove il contenuto del messagio è
  {
    "username" : "my_username"
  }

2) Fare la richiesta di gioco: viene fatta una richiesta HTTP in post con url 'localhost:8080/matchmaking', il payload di questa richiesta è: 
  {
    "type" : "randomMatchmaking"
  }
Il player1 (primo player che fa la richiesta), rimane in attesa finchè non fa la richiesta il secondo player e quindi joina la richiesta di gioco (player1 in attesa deve essere mostrato un messaggio di attesa). Quando anche il secondo player accede al game, il server notifica ad entrambi i player che la fase di matchmaking è terminata e quindi il gioco può iniziare. Questo avviene con il server che invia un messaggio all'EL del client 'lobby'. Invia il valore 'true', quindi i player devono essere portati alla view dove avviene il gioco.

3) Quando il gioco ha inizio il server invia un messaggio ad entrambi i client all'EL 'move'. Questo messaggio specifica ai due player chi sarà a fare la prima mossa, dal momento che è scelto casualmente. Il messaggio assume 2 formati diversi:
  Assumiamo che sia il player1 a cominciare con la prima mossa, riceverà:
    {
      "yourTurn" : true
    }
  Player2 riceverà quindi:
    {
      "yourTurn" : false
    }

Ora verranno spiegati i passi che si effettuano ad ogni mossa, per il player che esegue la mossa e per quello in attesa della mossa dell'avversario. Assumiamo che sia player1 ad effettuare la mossa e quindi player2 in attesa di questa.
4.1) Player1 per effettuare una mossa deve inviare un messaggio SocketIO al server, all'EL 'move', il contenuto del messaggio deve seguire questo formato:
  {
    "username" : "my_username",
    "move" : col
  }
  Dove col è la colonna dove inserire la pedina. Questa deve essere compresa tra 1 e 7.
  Dopo aver effettuato la mossa player1 rimane in attesa di un messaggio dal server per capire se la mossa è corretta e quindi è stata salvata correttamente. Questo messaggio viene ricevuto dall'EL 'move' del client. I casi sono:
  
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

VITTORIA
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

 Quando un player fa la mossa, successivamente riceve un oggetto JSON nel seguente formato:
 {
   "error" : true (si è verificato un errore e la mossa non è stata inserita) / false (nessun errore, la mossa è stata inserita),
   "codeError" : contiene il codice di errore
   "errorMessage" : se error = false, questo campo è null, altrimenti contiene il motivo dell'errore
 }

 Quando un player fa la mossa, l'altro player riceve un oggetto JSON nel seguente formato:
 {
   "move" : cols
 }
 Dove col è la colonna dove la mossa è stata fatta, questo permette di aggiornare il campo da gioco del giocatore avversario
```

