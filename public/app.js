//Javascript del lado del cliente

//Cambio de color del header al hacer scroll

window.onload = function () {

    let pagina = document.querySelector('body').className;

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

    app.init();

}

let app = {}

app.config = {

    'sessionToken': false,

}

app.client = {};

app.client.request = async function (metodo, path, headers, queryStringObject, payload, callback) {

    metodo = typeof (metodo) == 'string' && ['GET', 'POST', 'PUT', 'DELETE'].includes(metodo) ? metodo.toUpperCase() : 'GET';
    path = typeof (path) == 'string' ? path : '/';
    headers = typeof (headers) == 'object' && headers != null ? headers : {};
    queryStringObject = typeof (queryStringObject) == 'object' && queryStringObject != null ? queryStringObject : {};
    payload = typeof (payload) == 'object' ? payload : {};
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
        'body': JSON.stringify(payload)
    })

    let objetoRespuesta = await respuesta.json();

    if (callback) {

        callback(respuesta.status, objetoRespuesta);

    }

}

//funcion para recoger los datos del formulario manualmente
app.bindForms = function () {

    if (document.querySelector('form')) {
        document.querySelector('form').addEventListener('submit', function (e) {

            e.preventDefault();
            let formId = this.id;
            let path = this.action;
            let metodo = this.method.toUpperCase();

            //ocultamos el mensaje previo de error en caso de haberse mostrado
            let errormsj = document.getElementById('error_msj');
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

            //verificamos si las contraseñas coinciden
            if (payload.tekrar != payload.password && payload.tekrar !== undefined) {

                errormsj.innerHTML = 'Las contraseñas que ingresaste no coinciden';
                errormsj.style.display = 'initial';

            } else {
                //mandemos la peticion
                app.client.request(metodo, path, undefined, undefined, payload, (status, respuesta) => {

                    if (status !== 200) {

                        errormsj.innerHTML = respuesta.Error;
                        errormsj.style.display = 'initial';

                    } else {

                        app.procesarRespuesta(formId, payload, respuesta);

                    }


                });


            }


        })

    }
}

//Comportamiento a realizar luego de recibir respuesta positiva de un formulario
app.procesarRespuesta = function (formId, enviado, recibido) {

    if (formId == 'accountCreate') {

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

    }

    if (formId == 'iniciarSesion') {

        app.setToken(recibido);
        app.logInContent(true);
        window.location = 'checks/all';

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
        let cinco = 1000 * 60 * 5;

        if (restante < cinco) {

            let payload = {}
            payload.token = token.id;
            payload.extend = true;

            app.client.request('PUT', 'api/tokens', undefined, undefined, payload, (status, newToken) => {

                if (status == 200 && newToken) {

                    app.setToken(newToken);
                    console.log('Se ha renovado la sesión');

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

    if (typeof(myToken) !== 'undefined') {

        try {

            let tokenObj = JSON.parse(myToken);
            app.config.sessionToken = tokenObj;

            if (typeof (tokenObj) == 'object') {

                app.logInContent(true);

            } else {

                app.logInContent(false);

            }

        } catch (error) {

            app.config.sessionToken = false;
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

app.bindLogOutButton = function(){

    let boton = document.getElementById('logOutButton');

    boton.addEventListener('click',(e)=>{

        e.preventDefault();

        app.client.request('DELETE','api/tokens',undefined,undefined,undefined,(status,err)=>{

            app.setToken(false);
            app.logInContent(false);

            window.location = '/';

        })


    });


}

app.init = function () {

    app.bindForms();

    app.getSessionToken();

    app.sessionLoop();

    app.bindLogOutButton();

}