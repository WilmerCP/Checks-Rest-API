//Este codigo permite guardar todo los logs sobre los checks, comprimirlos y organizarlos por fecha

let fs = require('fs').promises;
let path = require('path');
let helpers = require('./helpers');
let zlib = require('zlib');

let base = path.join(__dirname, '..', '.logs');

const lib = {};

//La funcion gzip no soporta promesas por lo que para mantener el mismo formato las envuelvo en promesas

function gzipPromise(texto) {
    return new Promise((resolve, reject) => {
        zlib.gzip(texto, (err, compressedBuffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(compressedBuffer);
            }
        });
    });
}

function unzipPromise(compressedBuffer) {
    return new Promise((resolve, reject) => {
        zlib.unzip(compressedBuffer, (err, outputBuffer) => {
            if (err) {
                reject(err);
            } else {
                resolve(outputBuffer);
            }
        });
    });
}

//Anexa el nuevo log al archivo y si no existe lo crea

lib.append = async function (filename, logData, callback) {

    try {

        let fh = await fs.appendFile(base + '/' + filename + '.log', logData + '\n');

        callback(false);

    } catch (err) {

        callback(err);

    }


}

//Funcion que leer el directorio de los logs y crea una lista que puede incluir o no los archivos comprimidos

lib.list = async function (includeAll, callback) {

    try {

        let archivos = await fs.readdir(base);

        let lista = [];

        if (archivos && archivos.length > 0) {

            archivos.forEach(function (fileName) {

                if (fileName.includes('.log')) {

                    lista.push(fileName.replace('.log', ''));

                }

                if (fileName.includes('.gz.b64') && includeAll) {

                    lista.push(fileName.replace('.gz.b64', ''));

                }


            });

            callback(false, lista);

        } else {

            callback("Aviso: No se encontraron logs para comprimir")

        }

    } catch (err) {

        callback('Error while listing the logs');

    }

}

//Funcion que lee el contenido de los logs, lo comprime con gzip y lo guarda en base64 en otro archivo

lib.comprimir = async function (aComprimir, nuevoArchivo, callback) {

    try {

        let sourceFile = aComprimir + '.log';
        let destinyFile = nuevoArchivo + '.gz.b64';

        let contenido = await fs.readFile(base + '/' + sourceFile);

        let buffer = await gzipPromise(contenido);

        let fd = await fs.open(base + '/' + destinyFile , 'wx');

        await fd.write(buffer.toString('base64'));

        await fd.close();

        callback(false);

    } catch (err) {

        callback(err);

    }

}

//Funcion que borra el contenido de archivos
lib.truncar = async function (nombreArhivo,callback){

    try {

        await fs.truncate(base + '/' + nombreArhivo);

        callback(false);

        
    } catch (err) {
        
        callback(err);

    }


}

//Funcion que decomprime el contenido de los archivos
lib.decomprimir = async function(nombreArhivo,callback){

    try{

    let contenido = await fs.readFile(base+'/'+nombreArhivo+'.gz.b64','utf8');

    console.log(contenido);

    let compressedBuffer = Buffer.from(contenido,'base64');

    console.log(compressedBuffer);

    let outputBuffer = await unzipPromise(compressedBuffer);

    console.log(outputBuffer);

    let texto = outputBuffer.toString();

    callback(false,texto);

    }catch(err){

        callback(err);

    }

}


module.exports = lib;