# Network Inventory Time Sheets

A very secret project. Don't tell anyone about it.

Home page: <https://github.com/francbohuslav/nits>  
Skype: [cis_franc](skype:cis_franc), E-mail: [bohuslav.franc@unicornuniverse.eu](bohuslav.franc@unicornuniverse.eu)

## Preparation

[Node.js](https://nodejs.org/) or docker must be installed.

## Usage

1. Clone GIT repository https://github.com/francbohuslav/nits.git.
2. Go to directory, probably named **_nits_**.
3. Copy file **_.env.example_** to file **_.env_** and configure its content.

Either ...

4. Install node modules by command `npm i`.
5. Build app by command `npm run build`.
6. Execute app by command `npm run start`.

... or ...

4. Start as docker `docker-compose up -d`.

## User data

The application stores user data into folder **_userdata_**. Make folder writeble (`chmod -R 777` or other way) if some problems occure.
