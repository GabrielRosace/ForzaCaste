README
======

The backend side is exposed on port 8080, whereas the frontend side is
exposed on port 4200 of localhost.

First of all you have to create a `.env` file into the backend root
directory. The file must include

    JWT_SECRET=secret

This will initialize the key used to sign the JWT.

Then the instructions differ if you use docker or not.

Using docker
------------

After cloning the repository from GitHub, move to the root folder of the
application with the terminal and run the following commands:

-   `make run` if you are using a Unix-based OS
-   `docker-compose run --service-ports web` in you are using a Windows
    OS

The command executed will move you to the container where the necessary
services will be executed.

In order to run the **backend** you have to move to
`/home/node/app/Backend` and then run:

1.  `npm run compile` to compile the source code
2.  `npm run start` to execute the backend service

In order to run the **frontend** you have to move to
`/home/node/app/taw` and then run `npm run start` to execute the angular
frontend.

When you have finished to use the web application, in order to stop the
container you can run `make stop`.

N.B.: If any error occurs, try downloading npm dependencies with the
command `npm install`.

Not using docker
----------------

If you are not using docker, you must have installed Node.js 12.22, npm,
Typescript compiler and Angular-CLI.

After cloning the repository from GitHub, move to the root folder of the
application with the terminal.

In order to run the **backend** you have to move to `Backend` and then
run:

1.  `npm run compile` to compile the Typescript source code
2.  `npm run start` to execute the backend service

In order to run the **frontend** you have to move to `taw` and then run
`npm run start` to execute the angular frontend.

N.B.: If any error occurs, try downloading npm dependencies with the
command `npm install`.

On the web
==========

I remind you that the ForzaCaste application is also available at
<https://forzacaste.live/login>.
