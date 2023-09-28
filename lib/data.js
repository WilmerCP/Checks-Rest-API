//Este codigo permite crear, leer y borrar archivos en una carpeta que usaremos como base de datos

let fs = require('fs').promises;
let path = require('path');
let helpers = require('./helpers');

let base = path.join(__dirname,'..','.data');

const lib = {};

//method exclusive to create new files

lib.create = async function (folder,name,data,callback){

    try{

    let fd = await fs.open(base+'/'+folder+'/'+name+'.json','wx');

    await fd.write(JSON.stringify(data));

    await fd.close();

    callback(false);

    }catch(e){

        callback(e);

    }

}

//method for obtaining the content of a file

lib.read = async function (folder,name,callback){

    try{

    let contenido = await fs.readFile(base+'/'+folder+'/'+name+'.json');

    callback(false,helpers.convertToJSON(contenido));


    }catch(e){

        callback(e);

    }
}

//method for replacing the content of a file

lib.update = async function (folder,name,data,callback){

    try{

        let fd = await fs.open(base+'/'+folder+'/'+name+'.json','r+');

        await fd.truncate(); //borra el contenido

        await fd.write(JSON.stringify(data));

        await fd.close();

        callback(false);


    }catch(e){

        callback(e);

    }
}

//method for deleting a file

lib.delete = async function(folder,name,callback){

    try{

        await fs.unlink(base+'/'+folder+'/'+name+'.json');

        callback(false);

    }catch(e){

        callback(e);

    }


}

lib.list = async function(folder,callback){

    try{

        let archivos = await fs.readdir(base+'/'+folder+'/');
        let listaArchivos = [];
        
        archivos.forEach((nombreArhivo)=>{

            listaArchivos.push(nombreArhivo.replace('.json',''));

        });

        callback(false,listaArchivos);


    }catch(e){

        callback(e)

    }


}


module.exports = lib;