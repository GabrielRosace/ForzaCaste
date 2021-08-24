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