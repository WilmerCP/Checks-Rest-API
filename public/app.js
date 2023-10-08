//Javascript del lado del cliente

//Cambio de color del header al hacer scroll

    

window.onload = function(){

    let header = document.getElementById('header');

    window.addEventListener('scroll',()=>{

        if(window.scrollY > 0){
    
            header.style.backgroundColor = '#3f7055';
            header.style.height = '4em';
    
        }else{
    
            header.style.backgroundColor = 'rgba(0, 0, 0, 0.144)';
            header.style.height = '5em';
    
        }
    
    
    })

}

