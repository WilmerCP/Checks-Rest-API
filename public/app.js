//Javascript del lado del cliente

window.onload = function () {

    let pagina = document.querySelector('body').className;

    app.init(pagina);

}

let app = {}

app.config = {

    'sessionToken': false,

}

app.estilos = {

    'colorError': 'rgb(211, 124, 124)',
    'bordeError': '1px solid rgb(247, 15, 15)',
    'colorCorrecto': '#67f58d',
    'bordeCorrecto': '1px solid #0b9931'

}

app.client = {};

app.client.request = async function (metodo, path, headers, queryStringObject, payload, callback) {

    metodo = typeof (metodo) == 'string' && ['GET', 'POST', 'PUT', 'DELETE'].includes(metodo) ? metodo.toUpperCase() : 'GET';
    path = typeof (path) == 'string' ? path : '/';
    headers = typeof (headers) == 'object' && headers != null ? headers : {};
    queryStringObject = typeof (queryStringObject) == 'object' && queryStringObject != null ? queryStringObject : {};
    payload = typeof (payload) == 'object' ? JSON.stringify(payload) : undefined;
    callback = typeof (callback) == 'function' ? callback : false;
    headers['Content-Type'] = 'application/json';
    headers.token = app.config.sessionToken.id;

    let requestUrl = path;
    let contador = 0;

    for (var elemento in queryStringObject) {

        if (queryStringObject.hasOwnProperty(elemento)) {

            if (contador == 0) {

                requestUrl = requestUrl + '?' + elemento + '=' + queryStringObject[elemento];

            } else {

                requestUrl = requestUrl + '&' + elemento + '=' + queryStringObject[elemento];

            }

        }

        contador++;

    }

    let respuesta = await fetch(requestUrl, {
        'method': metodo,
        'headers': headers,
        'body': payload
    })

    let objetoRespuesta = await respuesta.json();

    if (callback) {

        callback(respuesta.status, objetoRespuesta);

    }

}

//funcion para recoger los datos del formulario manualmente
app.bindForms = function () {

    let formularios = document.querySelectorAll('form');

    if (formularios) {

        for (let i = 0; i < formularios.length; i++) {

            formularios[i].addEventListener('submit', function (e) {

                e.preventDefault();
                let formId = this.id;
                let path = this.action;

                //Seteamos el metodo adecuado

                let casosPUT = ['profileEdit', 'changePassword'];
                let metodo = casosPUT.includes(formId) ? 'PUT' : this.method.toUpperCase();

                //ocultamos el mensaje previo de error en caso de haberse mostrado
                let errormsj = this.previousElementSibling;
                errormsj.style.display = "none";

                //obtenemos datos del formulario
                let elementos = this.elements;

                let payload = {};

                for (let i = 0; i < elementos.length; i++) {

                    if (elementos[i].type !== 'submit') {

                        let valor = elementos[i].type == 'checkbox' ? elementos[i].checked : elementos[i].value;
                        payload[elementos[i].name] = valor;

                    }

                }

                if (metodo == 'PUT') {

                    payload.numero = app.config.sessionToken.numero;

                }

                //verificamos si las contraseñas coinciden
                if (payload.tekrar != payload.password && payload.tekrar !== undefined) {

                    errormsj.innerHTML = 'Las contraseñas que ingresaste no coinciden';
                    errormsj.style.display = 'initial';
                    errormsj.style.border = app.estilos.bordeError;
                    errormsj.style.backgroundColor = app.estilos.colorError;

                } else {
                    //mandemos la peticion
                    app.client.request(metodo, path, undefined, undefined, payload, (status, respuesta) => {

                        if (status !== 200) {

                            errormsj.innerHTML = respuesta.Error;
                            errormsj.style.display = 'initial';
                            errormsj.style.border = app.estilos.bordeError;
                            errormsj.style.backgroundColor = app.estilos.colorError;

                        } else {

                            app.procesarRespuesta(formId, payload, respuesta, errormsj);

                        }


                    });


                }


            })

        }

    }
}

//Comportamiento a realizar luego de recibir respuesta positiva de un formulario
app.procesarRespuesta = function (formId, enviado, recibido, errormsj) {

    switch (formId) {
        case 'accountCreate':

            let payload = {

                'numero': enviado.numero,
                'password': enviado.password

            }
            //Iniciamos sesion de una vez al nuevo usuario
            app.client.request('POST', 'api/tokens', undefined, undefined, payload, (status, token) => {

                if (status == 200 && token) {

                    app.setToken(token);
                    app.logInContent(true);
                    window.location = 'checks/all';

                } else {

                    errormsj.innerHTML = 'Hubo un error al iniciar sesion, pruebe manualmente';
                    errormsj.style.display = 'initial';

                }

            });

            break;

        case 'iniciarSesion':

            app.setToken(recibido);
            app.logInContent(true);
            window.location = 'checks/all';

            break;

        case 'profileEdit':

            errormsj.innerHTML = 'Se ha actualizado tu perfil correctamente';
            errormsj.style.display = 'initial';
            errormsj.style.backgroundColor = app.estilos.colorCorrecto;
            errormsj.style.border = app.estilos.bordeCorrecto;

            break;

        case 'changePassword':

            errormsj.innerHTML = 'Se ha cambiado tu contraseña, ¡no la olvides!';
            errormsj.style.display = 'initial';
            errormsj.style.backgroundColor = app.estilos.colorCorrecto;
            errormsj.style.border = app.estilos.bordeCorrecto;

            break;

    }

}

//Guardar el token de sesion

app.setToken = function (token) {

    app.config.sessionToken = token;
    let stringToken = JSON.stringify(token);
    localStorage.setItem('token', stringToken);

}

app.renewToken = function () {

    let token = app.config.sessionToken;

    if (token) {

        let restante = token.expira - Date.now();
        let cinco = 1000 * 60;

        if (restante < cinco) {

            let payload = {}
            payload.token = token.id;
            payload.extend = true;

            app.client.request('PUT', 'api/tokens', undefined, undefined, payload, (status, newToken) => {

                if (status == 200 && newToken) {

                    app.setToken(newToken);
                    console.log('Se ha renovado la sesión');

                } else {

                    app.setToken(false);

                }


            });

        }

    }

}



app.sessionLoop = function () {

    setInterval(function () {

        app.renewToken();

    }, 1000 * 60);


}

//Cuando se navegue se tiene que comprobar si hay una sesion iniciada o no

app.getSessionToken = function () {

    let myToken = localStorage.getItem('token');

    if (typeof (myToken) !== 'undefined') {

        try {

            let tokenObj = JSON.parse(myToken);

            if (typeof (tokenObj) == 'object') {

                if (tokenObj.expira > Date.now()) {

                    app.logInContent(true);
                    app.setToken(tokenObj);

                } else {

                    app.logInContent(false);
                    app.setToken(false);

                }

            } else {

                app.logInContent(false);

            }

        } catch (error) {

            app.setToken(false);
            app.logInContent(false);

        }


    }


}

//Agregar o quitar la clase en caso de estar logeado o no

app.logInContent = function (add) {

    let body = document.querySelector('body');

    if (add) {

        body.classList.add('loggedIn');

    } else {

        body.classList.add('loggedOut')

    }

}

app.bindLogOutButton = function () {

    let boton = document.getElementById('logOutButton');

    boton.addEventListener('click', (e) => {

        e.preventDefault();

        app.client.request('DELETE', 'api/tokens', undefined, undefined, undefined, (status, err) => {

            app.setToken(false);
            app.logInContent(false);

            window.location = '/';

        })


    });


}

//Rellenar el formulario de editar usuario

app.loadUserInfo = function (pagina) {

    if (pagina == 'accountEdit') {

        let params = {
            'numero': app.config.sessionToken.numero
        }

        app.client.request('GET', 'api/users', undefined, params, undefined, function (status, user) {

            if (status == 200) {

                let campoNombre = document.getElementById('nombre');
                let campoApellido = document.getElementById('apellido');

                campoNombre.value = user.nombre;
                campoApellido.value = user.apellido;

            } else {

                let mensaje = document.getElementById('editor_msj');
                mensaje.innerHTML = 'Hubo un error al leer los datos de la cuenta';
                mensaje.style.display = 'initial';
                mensaje.style.backgroundColor = app.estilos.colorError;
                mensaje.style.border = app.estilos.bordeError;



            }


        });
    }
}


//Cambio de color del header en el index al hacer scroll

app.colorHeader = function (pagina) {

    if (pagina == 'index') {

        let header = document.getElementById('header');

        window.addEventListener('scroll', () => {

            if (window.scrollY > 0) {

                header.style.backgroundColor = '#6A9C89';
                header.style.height = '3.2em';

            } else {

                header.style.backgroundColor = 'rgba(0, 0, 0, 0.144)';
                header.style.height = '5em';

            }


        })
    }

}

app.init = function (pagina) {

    app.colorHeader(pagina);

    app.bindForms();

    app.getSessionToken();

    app.sessionLoop();

    app.bindLogOutButton();

    app.loadUserInfo(pagina);

}