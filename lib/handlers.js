//Dependencias

const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

//Handlers para manejar las diferentes acciones que intente hacer el usuario

var handlers = {};

handlers.NotFound = function (data, callback) {

    callback(404, 'No se encontro el contenido que solicito', 'html');

}

handlers.ping = function (data, callback) {

    callback(200);

}

handlers.index = function (data, callback) {

    if (data.metodo == 'get') {

        var dinamic_content = {

            'head_titulo': 'Inicio',
            'body_class': 'index',
            'hoja_estilos':'public/app.css'

        }

        helpers.prepareTemplate('index', dinamic_content, function (err, str) {

            if (!err && str) {

                callback(200, str, 'html');


            } else {

                callback(500);

            }

        });


    } else {

        callback(405);

    }

}

handlers.accountCreate = function (data, callback) {

    if (data.metodo == 'get') {

        var dinamic_content = {

            'head_titulo': 'Registro',
            'body_class': 'accountCreate',
            'hoja_estilos':'public/accountCreate.css'

        }

        helpers.prepareTemplate('accountCreate', dinamic_content, function (err, str) {

            if (!err && str) {

                callback(200, str, 'html');


            } else {

                callback(500);

            }

        });


    } else {

        callback(405);

    }

}

handlers.iniciarSesion = function (data, callback) {

    if (data.metodo == 'get') {

        var dinamic_content = {

            'head_titulo': 'Log in',
            'body_class': 'iniciarSesion',
            'hoja_estilos':'public/iniciarSesion.css'

        }

        helpers.prepareTemplate('iniciarSesion', dinamic_content, function (err, str) {

            if (!err && str) {

                callback(200, str, 'html');


            } else {

                callback(500);

            }

        });


    } else {

        callback(405);

    }

}

handlers.allChecks = function (data, callback) {

    if (data.metodo == 'get') {

        var dinamic_content = {

            'head_titulo': 'Mis Checks',
            'body_class': 'allChecks',
            'hoja_estilos':'public/allChecks.css'

        }

        helpers.prepareTemplate('allChecks', dinamic_content, function (err, str) {

            if (!err && str) {

                callback(200, str, 'html');


            } else {

                callback(500);

            }

        });


    } else {

        callback(405);

    }

}

handlers.accountEdit = function (data, callback) {

    if (data.metodo == 'get') {

        var dinamic_content = {

            'head_titulo': 'Mi cuenta',
            'body_class': 'accountEdit',
            'hoja_estilos':'public/accountEdit.css'

        }

        helpers.prepareTemplate('accountEdit', dinamic_content, function (err, str) {

            if (!err && str) {

                callback(200, str, 'html');


            } else {

                callback(500);

            }

        });


    } else {

        callback(405);

    }

}

//Servir el favicon

handlers.favicon = function (data, callback) {

    if (data.metodo == 'get') {

        helpers.getStaticAsset('favicon.ico', (err, data) => {

            if (!err && data) {

                callback(200, data, 'favicon');

            } else {

                callback(500);

            }


        });

    } else {

        callback(405);

    }

}

//Servir cualquier archivo publico que soliciten

handlers.public = function (data, callback) {

    if (data.metodo == 'get') {

        var nombreArchivo = data.url.pathname.trim().replace('/public/', '');

        if (nombreArchivo.length > 0) {

            helpers.getStaticAsset(nombreArchivo, (err, data) => {

                if (!err && data) {

                    var contentType = 'plain';

                    if (nombreArchivo.includes('.jpg')) {

                        contentType = 'jpg';

                    }

                    if (nombreArchivo.includes('.svg')) {

                        contentType = 'svg';

                    }

                    if (nombreArchivo.includes('.png')) {

                        contentType = 'png';

                    }

                    if (nombreArchivo.includes('.css')) {

                        contentType = 'css';

                    }

                    if (nombreArchivo.includes('.js')) {

                        contentType = 'javascript';

                    }

                    if (nombreArchivo.includes('.ico')) {

                        contentType = 'favicon';

                    }

                    callback(200, data, contentType);

                } else {

                    callback(500);

                }


            });

        }else{

            callback(404);

        }

    } else {

        callback(405);

    }

}


//Handlers de la API

//Handler que determina que se quiere hacer con los usuarios y redigire a la funcion adecuada

handlers.users = function (data, callback) {

    let metodos = ['post', 'get', 'put', 'delete'];

    if (metodos.includes(data.metodo)) {

        handlers._users[data.metodo](data, callback);


    } else {

        callback(405);

    }

}

handlers._users = {};

//Crear nuevos usuarios

handlers._users.post = function (data, callback) {

    let nombre = typeof (data.contenido.nombre) == 'string' && data.contenido.nombre.trim().length > 0 ? data.contenido.nombre.trim() : false;
    let apellido = typeof (data.contenido.apellido) == 'string' && data.contenido.apellido.trim().length > 0 ? data.contenido.apellido.trim() : false;
    let numero = typeof (data.contenido.numero) == 'string' && data.contenido.numero.trim().length == 10 ? data.contenido.numero.trim() : false;
    let password = typeof (data.contenido.password) == 'string' && data.contenido.password.trim().length > 0 ? data.contenido.password.trim() : false;
    let terminos = typeof (data.contenido.terminos) == 'boolean' && data.contenido.terminos == true ? true : false;

    let hashedPassword = helpers.encriptar(password);

    let nuevoUser = { nombre, apellido, numero, hashedPassword, terminos };

    if (nombre && apellido && numero && hashedPassword && terminos) {

        _data.create('users', numero, nuevoUser, (err) => {

            if (!err) {

                callback(200);

            } else {

                callback(500, { 'Error': 'Could not create the user, might already exist' });

            }


        });


    } else {

        callback(400, { 'Error': 'Missing required fields' });

    }
}

//Leer los usuarios

handlers._users.get = function (data, callback) {

    let numero = typeof (data.url.searchParams.get('numero')) == 'string' && data.url.searchParams.get('numero').trim().length == 10 ? data.url.searchParams.get('numero').trim() : false;
    let token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

    if (numero && token) {

        handlers._tokens.autenticar(numero, token, (validez) => {

            if (validez) {

                _data.read('users', numero, (err, usuario) => {

                    if (!err && usuario) {

                        delete usuario.hashedPassword;

                        callback(200, usuario);

                    } else {

                        callback(404, { 'Error': 'Could not read the user, it might not exist' });

                    }

                });


            } else {

                callback(401, { 'Error': 'Valid credentials are necessary to access this information' });

            }


        });

    } else {

        callback(400, { 'Error': 'Missing required fields' });

    }

}

//Modificar usuarios

handlers._users.put = function (data, callback) {

    let nombre = typeof (data.contenido.nombre) == 'string' && data.contenido.nombre.trim().length > 0 ? data.contenido.nombre.trim() : false;
    let apellido = typeof (data.contenido.apellido) == 'string' && data.contenido.apellido.trim().length > 0 ? data.contenido.apellido.trim() : false;
    let numero = typeof (data.contenido.numero) == 'string' && data.contenido.numero.trim().length == 10 ? data.contenido.numero.trim() : false;
    let password = typeof (data.contenido.password) == 'string' && data.contenido.password.trim().length > 0 ? data.contenido.password.trim() : false;
    let token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

    let hashedPassword = helpers.encriptar(password);

    if (numero && token) {

        _data.read('users', numero, (err, usuario) => {

            if (!err && usuario) {

                handlers._tokens.autenticar(numero, token, (validez) => {

                    if (validez) {


                        if (nombre || apellido || hashedPassword) {

                            if (nombre) {

                                usuario.nombre = nombre;

                            }

                            if (apellido) {

                                usuario.apellido = apellido;

                            }

                            if (hashedPassword) {

                                usuario.hashedPassword = hashedPassword;

                            }

                            _data.update('users', numero, usuario, (err) => {

                                if (!err) {

                                    callback(200);

                                } else {

                                    callback(500, { 'Error': 'Could not update the user fields' });

                                }

                            });


                        } else {

                            callback(400, { 'Error': 'Missing a field to update' });

                        }


                    } else {

                        callback(401, { 'Error': 'Valid credentials are necessary to access this information' });

                    }

                });


            } else {

                callback(404, { 'Error': 'The user does not exist' });

            }


        });


    } else {

        callback(400, { 'Error': 'Missing required fields' });

    }
}

//Borrar los usuarios

handlers._users.delete = function (data, callback) {

    let numero = typeof (data.url.searchParams.get('numero')) == 'string' && data.url.searchParams.get('numero').trim().length == 10 ? data.url.searchParams.get('numero').trim() : false;
    let token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

    if (numero && token) {

        handlers._tokens.autenticar(numero, token, (validez) => {

            if (validez) {

                _data.read('users', numero, (err, usuario) => {

                    if (!err) {

                        _data.delete('users', numero, (err) => {

                            if (!err) {

                                let checks = typeof (usuario.checks) == "object" && usuario.checks instanceof Array ? usuario.checks : [];
                                let aBorrar = checks.length;
                                let errores = 0;

                                if (aBorrar > 0) {

                                    for (let index = 0; index < aBorrar; index++) {

                                        _data.delete('checks', checks[index], (err) => {

                                            if (err) {

                                                errores += 1;

                                            }

                                            if (index == aBorrar - 1) {

                                                if (errores == 0) {

                                                    callback(200);

                                                } else {

                                                    callback(500, { 'error': 'Puede que no se haya podido borrar todos los checks relacionados al usuario' });

                                                }

                                            }

                                        });

                                    }

                                } else {

                                    callback(200);

                                }

                            } else {

                                callback(500, { 'Error': 'Could not delete the user, it might not exist' });

                            }

                        });

                    } else {

                        callback(500, { 'error': 'No se pudo acceder al usuario' });

                    }

                });

            } else {

                callback(401, { 'Error': 'Valid credentials are necessary to access this information' });

            }


        });

    } else {

        callback(400, { 'Error': 'Missing required fields' });

    }

}

//Handler que determina que se quiere hacer con los tokens y redigire a la funcion adecuada

handlers.tokens = function (data, callback) {

    let metodos = ['post', 'get', 'put', 'delete'];

    if (metodos.includes(data.metodo)) {

        handlers._tokens[data.metodo](data, callback);


    } else {

        callback(405);

    }

}

handlers._tokens = {}

//Creacion de los tokens para una sesion

handlers._tokens.post = function (data, callback) {

    let numero = typeof (data.contenido.numero) == 'string' && data.contenido.numero.trim().length == 10 ? data.contenido.numero.trim() : false;
    let password = typeof (data.contenido.password) == 'string' && data.contenido.password.trim().length > 0 ? data.contenido.password.trim() : false;
    let hashedPassword = helpers.encriptar(password);

    if (numero && hashedPassword) {

        //Comprobamos si la contra corresponde con el usuario

        _data.read('users', numero, (err, usuario) => {

            if (!err && usuario) {

                if (usuario.hashedPassword == hashedPassword) {

                    //Creamos el token, lo almacenamos y lo eviamos al usuario

                    let tokenId = helpers.getRandomToken(20);
                    let fechaLimite = Date.now() + 1000 * 60 * 60;

                    let token = {

                        'id': tokenId,
                        'numero': numero,
                        'expira': fechaLimite

                    }

                    _data.create('tokens', tokenId, token, (err) => {

                        if (!err) {

                            callback(200, token);

                        } else {

                            callback(500, { 'Error': 'Could not create token' });

                        }


                    });


                } else {

                    callback(401, { 'Error': 'The password is not correct' });

                }

            } else {

                callback(404, { 'Error': 'No se encontro el usuario' });

            }

        });

    } else {

        callback(400, { 'Error': 'Missing required fields' });

    }

}

//Leer los tokens para verificar si existen y su fecha de vencimiento

handlers._tokens.get = function (data, callback) {

    let tokenId = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

    if (tokenId) {

        _data.read('tokens', tokenId, (err, tokenData) => {

            if (!err && tokenData) {

                callback(200, tokenData);

            } else {

                callback(404, { 'Error': 'Could not find the token, it might not exist' });

            }

        });


    } else {

        callback(400, { 'Error': 'Missing required fields' });

    }

}

//Extender la fecha de validez del token

handlers._tokens.put = function (data, callback) {

    let tokenId = typeof (data.contenido.token) == 'string' && data.contenido.token.trim().length == 20 ? data.contenido.token.trim() : false;
    let extend = typeof (data.contenido.extend) == 'boolean' && data.contenido.extend == true ? true : false;

    if (tokenId && extend) {

        _data.read('tokens', tokenId, (err, tokenInfo) => {

            if (!err && tokenInfo && tokenInfo.expira > Date.now()) {

                tokenInfo.expira = Date.now() + 1000 * 60 * 60;

                _data.update('tokens', tokenId, tokenInfo, (err) => {

                    if (!err) {

                        callback(200,tokenInfo);

                    } else {

                        callback(500, { 'Error': 'Could not extend the period of this token' });

                    }

                });


            } else {

                callback(404, { 'Error': 'The token does not exist or already expired' });

            }


        });


    } else {

        callback(400, { 'Error': 'Missing required fields' });

    }
}


//Eliminar token

handlers._tokens.delete = function (data, callback) {

    let tokenId = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

    if (tokenId) {

        _data.delete('tokens', tokenId, (err) => {

            if (!err) {

                callback(200);

            } else {

                callback(500, { 'Error': 'Could not delete the token, it might not exist' });

            }

        });


    } else {

        callback(400, { 'Error': 'Missing required fields' });

    }

}

//Funcion que verifica que el token del header es valido y corresponde al usuario con el que se esta trabajando

handlers._tokens.autenticar = function (numero, miToken, callback) {

    let tokenId = typeof (miToken) == 'string' && miToken.trim().length == 20 ? miToken.trim() : false;

    if (tokenId && numero) {

        _data.read('tokens', tokenId, (err, tokenData) => {

            if (!err && tokenData && tokenData.numero == numero && tokenData.expira > Date.now()) {

                callback(true)

            } else {

                callback(false);

            }

        });

    } else {

        callback(false);

    }

}

//Funcion que verifica mediante el token del header que haya una sesion iniciada valida y devuelve el numero del usuario

handlers._tokens.verSesion = function (miToken, callback) {

    let tokenId = typeof (miToken) == 'string' && miToken.trim().length == 20 ? miToken.trim() : false;

    if (tokenId) {

        _data.read('tokens', tokenId, (err, tokenData) => {

            if (!err && tokenData && tokenData.expira > Date.now()) {

                callback(tokenData.numero)

            } else {

                callback(false);

            }

        });

    } else {

        callback(false);

    }

}

//Checks para verificar si una web esta funcionando o no

handlers.checks = function (data, callback) {

    let metodos = ['post', 'get', 'put', 'delete'];

    if (metodos.includes(data.metodo)) {

        handlers._checks[data.metodo](data, callback);

    } else {

        callback(405);

    }

}

handlers._checks = {};

handlers._checks.post = function (data, callback) {

    let protocolo = typeof (data.contenido.protocolo) == "string" && ['http', 'https'].includes(data.contenido.protocolo) ? data.contenido.protocolo : false;
    let url = typeof (data.contenido.url) == "string" && data.contenido.url.trim().length >= 1 ? data.contenido.url.trim() : false;
    let timeoutSeconds = typeof (data.contenido.timeoutSeconds) == "number" && data.contenido.timeoutSeconds >= 1 && data.contenido.timeoutSeconds <= 5 ? data.contenido.timeoutSeconds : false;
    let validCodes = typeof (data.contenido.validCodes) == "object" && data.contenido.validCodes instanceof Array && data.contenido.validCodes.length > 0 ? data.contenido.validCodes : false;
    let metodo = typeof (data.contenido.metodo) == "string" && ['get', 'post', 'put', 'delete'].includes(data.contenido.metodo) ? data.contenido.metodo : false;

    if (protocolo && url && timeoutSeconds && validCodes && metodo) {

        let sesion = typeof (data.headers.token) == "string" ? data.headers.token : false;

        //verificamos que haya un token de una sesion valida y obtenemos el numero del usuario del mismo token
        handlers._tokens.verSesion(sesion, (numero) => {

            if (numero) {

                _data.read('users', numero, (err, usuario) => {

                    if (!err && usuario) {

                        //Verificamos la cantidad de checks ya creados por el usuario

                        let checks = typeof (usuario.checks) == "object" && usuario.checks instanceof Array ? usuario.checks : [];

                        if (checks.length < config.maxChecks) {

                            let idCheck = helpers.getRandomToken(20);

                            let nuevoCheck = {

                                'protocolo': protocolo,
                                'url': url,
                                'timeoutSeconds': timeoutSeconds,
                                'validCodes': validCodes,
                                'metodo': metodo,
                                'numero': numero,
                                'id': idCheck

                            };

                            checks.push(idCheck);

                            usuario.checks = checks;

                            //Guardamos el nuevo check

                            _data.create('checks', idCheck, nuevoCheck, (err) => {

                                if (!err) {

                                    //Guardamos la referencia al nuevo check dentro de la info del usuario

                                    _data.update("users", numero, usuario, (err) => {

                                        if (!err) {

                                            callback(200, nuevoCheck);

                                        } else {

                                            callback(500, { 'error': 'No se logro actualizar el usuario' });

                                        }

                                    });

                                } else {

                                    callback(500, { 'error': 'No se pudo guardar el nuevo check' });

                                }

                            });

                        } else {

                            callback(400, { 'error': 'Ya se alcanzo el numero maximo de checks por usuario: ' + config.maxChecks });

                        }

                    } else {

                        callback(500, { 'error': 'No se pudo encontrar el usuario' });

                    }

                });


            } else {

                callback(403);

            }


        });



    } else {

        callback(400);

    }

};

handlers._checks.get = function (data, callback) {

    let checkId = typeof (data.contenido.checkId) == "string" && data.contenido.checkId.trim().length === 20 ? data.contenido.checkId : false;
    let token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;


    if (checkId) {

        _data.read('checks', checkId, (err, check) => {

            if (!err && check) {

                //verificar ahora que el usuario tenga permiso de acceder a esta informacion
                if (token) {

                    handlers._tokens.autenticar(check.numero, token, (validez) => {

                        if (validez) {

                            callback(200, check);

                        } else {

                            callback(403);

                        }


                    });

                } else {

                    callback(403);

                }

            } else {

                callback(404);

            }

        });

    } else {

        callback(400);

    }

};

handlers._checks.put = function (data, callback) {

    let checkId = typeof (data.contenido.checkId) == "string" && data.contenido.checkId.trim().length === 20 ? data.contenido.checkId : false;
    let token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;


    let protocolo = typeof (data.contenido.protocolo) == "string" && ['http', 'https'].includes(data.contenido.protocolo) ? data.contenido.protocolo : false;
    let url = typeof (data.contenido.url) == "string" && data.contenido.url.trim().length >= 1 ? data.contenido.url : false;
    let timeoutSeconds = typeof (data.contenido.timeoutSeconds) == "number" && data.contenido.timeoutSeconds >= 1 && data.contenido.timeoutSeconds <= 5 ? data.contenido.timeoutSeconds : false;
    let validCodes = typeof (data.contenido.validCodes) == "object" && data.contenido.validCodes instanceof Array && data.contenido.validCodes.length > 0 ? data.contenido.validCodes : false;
    let metodo = typeof (data.contenido.metodo) == "string" && ['get', 'post', 'put', 'delete'].includes(data.contenido.metodo) ? data.contenido.metodo : false;

    let campos = [protocolo, url, timeoutSeconds, validCodes, metodo];
    let nombreCampos = ['protocolo', 'url', 'timeoutSeconds', 'validCodes', 'metodo'];

    if (checkId) {

        if (protocolo || url || timeoutSeconds || validCodes || metodo) {

            _data.read("checks", checkId, (err, check) => {

                if (!err && check) {

                    handlers._tokens.autenticar(check.numero, token, (validez) => {

                        if (validez) {

                            for (let index = 0; index < campos.length; index++) {

                                if (campos[index]) {

                                    check[nombreCampos[index]] = campos[index];

                                }

                            }

                            _data.update('checks', checkId, check, (err) => {

                                if (!err) {

                                    callback(200, check);

                                } else {

                                    callback(500);

                                }


                            });


                        } else {

                            callback(403);

                        }


                    });


                } else {

                    callback(404);

                }


            });

        } else {

            callback(400);

        }

    } else {

        callback(400);

    }

};

handlers._checks.delete = function (data, callback) {

    let checkId = typeof (data.contenido.checkId) == "string" && data.contenido.checkId.trim().length === 20 ? data.contenido.checkId : false;
    let token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;


    if (checkId) {

        _data.read('checks', checkId, (err, check) => {

            if (!err && check) {

                //verificar ahora que el usuario tenga permiso de tocar esta informacion
                if (token) {

                    handlers._tokens.autenticar(check.numero, token, (validez) => {

                        if (validez) {

                            _data.delete('checks', checkId, (err) => {

                                if (!err) {

                                    _data.read('users', check.numero, (err, usuario) => {

                                        if (!err && usuario) {

                                            let checksRestantes = usuario.checks.filter(elemento => elemento !== checkId);

                                            usuario.checks = checksRestantes;

                                            _data.update('users', usuario.numero, usuario, (err) => {

                                                if (!err) {

                                                    callback(200);

                                                } else {

                                                    callback(500, { 'error': 'No se pudo actualizar el usuario' });

                                                }


                                            });

                                        }

                                    });



                                } else {

                                    callback(500, { 'error': 'No se pudo borrar el check' });


                                }


                            });

                        } else {

                            callback(403);

                        }


                    });

                } else {

                    callback(403);

                }

            } else {

                callback(404);

            }

        });

    } else {

        callback(400);

    }

};

module.exports = handlers;