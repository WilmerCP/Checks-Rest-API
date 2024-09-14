
# Arepita - Checks Rest API 

Web application created with vanilla Node.js implementing a lot of the functionality and native modules that this runtime environment offers. 

The app consists of a server that hosts a JSON Restful API with features like serving the GUI with dynamic templates, CRUD operations for users and authentication via tokens.

When an user creates an account from the GUI using their phone number, they can set up to 5 "checks" for any desired website. 

The application will check the current state of those websites every minute and notify the user of any changes via text message.

<img src="https://github.com/WilmerCP/Checks-Rest-API/blob/master/screenshots/inicio.png" width="500">

<img src="https://github.com/WilmerCP/Checks-Rest-API/blob/master/screenshots/login.png" width="500">

<img src="https://github.com/WilmerCP/Checks-Rest-API/blob/master/screenshots/checks.png" width="500">



## Getting Started


### Prerequisites

- Node.js version 18.13 or higher
- Twilio demo account, virtual phone number, SID, and authentication Token
- Https certificate and private key

### Set up

#### 1. Clone the project

```bash
  git clone https://github.com/WilmerCP/Checks-Rest-API.git
```

#### 2. Fill in the config.js file with twilio credentials


#### 3. Create the following folder structure

- project-root/
  - .data/
    - checks/
    - users/
    - tokens/
  - .logs/
  - https/
    - cert.pem
    - key.pem

#### 4. Generate a self signed SSL certificate and private key and copy them to the appropiate files


#### 5. Run the app 

```bash
  node index
```
## Running Tests

To run tests, run the following command

```bash
  node tests
```

More tests can be easily added to the unit.js and api.js files within the tests folder
## Admin CLI

When the app is running, a Command Line Interface will be automatically available providing useful functionality for the administrator.

The list of available commands can be accessed with:

```bash
  help
```
or 
```bash
  man
```

<img src="https://github.com/WilmerCP/Checks-Rest-API/blob/master/screenshots/manual.png" width="480">

## Logs

In order to keep a history of actions taken by the application a log system was implemented. Whenever checks are being performed the results will be logged to files inside the .logs folder. 

Every 24hs these files are being compressed using base 64 and gzip. 

In order to access the  list of compressed log files use the following command:

```bash
  list logs
```

In order to see the content of a log file use the following command:

```bash
  log info {id} 
```
## License

This project is licensed under the MIT License.

