

//declarar las variables de nuestra app. 
let scene, camera, renderer, clock, deltaTime, totalTime;

let arToolkitSource, arToolkitContext;

let mesh1, mesh2;

let markerRoot1;

let RhinoMesh, RhinoMesh2;

let raycaster; //permite apuntar o detectar objetos en nuestra aplicacion 

let mouse = new THREE.Vector2();

let INTERSECTED; //guarda info sobre los objetos intersectados por mi raycast

let objects = []; //guarda los objetos que quiero detectar

let video1;




init(); // llamado de la funcion principal que se encarga de hacer casi  todo en la app
animate();

function init() {
    ////////////////////////////////////////////////////////
    //THREE Setup
    ///////////////////////////////////////////////////////
    // crear nuestra escena -  OBJETO.
    scene = new THREE.Scene(); //  crea un objeto escena.

    //////////////////////////////////////////////////////
    //LUCES
    //////////////////////////////////////////////////////

    let light = new THREE.PointLight(0xffffff, 1, 100); //creo nueva luz 
    light.position.set(0, 4, 4); //indico la posicion de la luz 
    light.castShadow = true; //activo la capacidad de generar sombras.
    light.shadow.mapSize.width = 4096; //resolucion mapa de sombras ancho 
    light.shadow.mapSize.height = 4096;// resolucion mapa de sombras alto

    
    
    scene.add(light); //agrego la luz a mi escena 

    let lightSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        })
    );

    lightSphere.position.copy(light);
    scene.add(lightSphere);

    //creamos luces 
    let ambientLight = new THREE.AmbientLight(0xcccccc); //creo las luz
    scene.add(ambientLight); //agrego la luz a mi escena. 

    camera = new THREE.Camera(); //creo objeto camara 
    scene.add(camera); // agrego camara a la escena

    //permite mostrar las cosas en 3d en la pantalla
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });

    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    renderer.setSize(640, 480);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement); // agregarlo a nuestra pagina web


    //tiempo
    clock = new THREE.Clock();
    deltaTime = 0;
    totalTime = 0;

    ////////////////////////////////////////////////////////
    //AR Setup
    ///////////////////////////////////////////////////////

    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
    });

    function onResize() {
        arToolkitSource.onResize()
        arToolkitSource.copySizeTo(renderer.domElement)
        if (arToolkitContext.arController !== null) {
            arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)
        }
    }


    arToolkitSource.init(function onReady() {
        onResize();
    });

    //agregamos un event listener
    window.addEventListener('resize', function () { onResize() });

    //Setup ArKitContext
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'data/camera_para.dat',
        detectionMode: 'mono'
    });

    arToolkitContext.init(function onCompleted() {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    /////////////////////////////////////////////////
    //Marker setup
    /////////////////////////////////////////////////

    markerRoot1 = new THREE.Group(); //creamos un grupo de objetos
    markerRoot1.name = 'marker1';
    scene.add(markerRoot1); // agregamos el grupo a la escena. 

    //Creamos nuestro marcador 
    let markerControl = new THREEx.ArMarkerControls(arToolkitContext, markerRoot1, {

        type: 'pattern', patternUrl: './data/pattern-Z1.patt',
    });

    /////////////////////////////////////////////////
    //GEOMETRY
    /////////////////////////////////////////////////

    //Creo una geometria cubo
    //-//-//let geo1 = new THREE.CubeGeometry(.75, .75, .75); // crear la plantilla
    //creo material 
    //-//-//let material1 = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }); //creamos el material 

    //Creo una geometria 
    // - let geo2 = new THREE.CubeGeometry(.75, .75, .75); // crear la plantilla
    //creo material 
    // - let material2 = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }); //creamos el material

    //////////////MESH1//////////////////////////////////////////
    //creo un mesh con la geometria y el material 
    //-//-//mesh1 = new THREE.Mesh(geo1, material1); //nuestro mesh 
    mesh1 = new THREE.Mesh(RhinoMesh); //nuestro mesh 



    mesh1.name = 'mesh1'; //mensaje a mostrar cuando indicamos el mesh con nuestro mouse
    //activo el recibir y proyectar sombras en otros meshes
    //CAMBIO LA POSICION DE MI MESH 
    mesh1.position.y = 0.5;
    mesh1.position.z = -0.3;

    //activo el recibir y proyectar sombras en otros meshes
    mesh1.castShadow = true;
    mesh1.receiveShadow = true;

    //////////////MESH2//////////////////////////////////////////
    //creo un mesh con la geometria y el material 
    // - mesh2 = new THREE.Mesh(geo2, material2); //nuestro mesh 
    //CAMBIO LA POSICION DE MI MESH 
    // - mesh2.position.x = 0.75;
   // - mesh2.position.y = 1.0;
    //activo el recibir y proyectar sombras en otros meshes
    // - mesh2.castShadow = true;
    // - mesh2.receiveShadow = true;


    //markerRoot1.add(mesh1); //esta linea agrega el cubo a mi grupo y finalmente se puede ver en la escena 
    //markerRoot1.add(mesh2); //agregando el mesh 2 a mi escena

    ////////////////////PISO////////////////
    let floorGeometry = new THREE.PlaneGeometry(20, 20);
    let floorMaterial = new THREE.ShadowMaterial();
    floorMaterial.opacity = 0.25;

    let floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    markerRoot1.add(floorMesh);


    /////// OBJ IMPORT/////////////////////
    function onProgress(xhr) { console.log((xhr.loaded / xhr.total * 100) + "% loaded"); }
    function onError(xhr) { console.log("ha ocurrido un error") };

    //////OBJETO RHINO 1///////////////
    new THREE.MTLLoader ()
        .setPath('models/')
        .load('mod1.mtl', function (materials) {
            materials.preload();
            new THREE.OBJLoader()
                .setMaterials(materials)
                .setPath('models/')
                .load('mod1.obj', function (group) {
                    RhinoMesh = group.children[0];
                    RhinoMesh.material.side = THREE.DoubleSide;
                    RhinoMesh.scale.set(0.0035,0.0035, 0.0035);
                    RhinoMesh.castShadow = true;
                    RhinoMesh.receiveShadow = true;

                    markerRoot1.add(RhinoMesh);
                }, onProgress, onError);
        });

    // //////OBJETO RHINO 2///////////////
    // new THREE.MTLLoader()
    //     .setPath('models/')
    //     .load('model2.mtl', function (materials) {
    //         materials.preload();
    //         new THREE.OBJLoader()
    //             .setMaterials(materials)
    //             .setPath('models/')
    //             .load('model2.obj', function (group) {
    //                 RhinoMesh2 = group.children[0];
    //                 RhinoMesh2.material.side = THREE.DoubleSide;
    //                 RhinoMesh2.scale.set(1, 1, 1);
    //                 RhinoMesh2.castShadow = true;
    //                 RhinoMesh2.receiveShadow = true;

    //                 markerRoot1.add(RhinoMesh2);
    //             }, onProgress, onError);
    //     });





    //mesh2
    // - mesh2 = new THREE.Mesh(box, matBox02);
    // - mesh2.position.y = .25;
    //mesh2.position.x = -.6;
    // - mesh2.name = 'HIRO. Soy el marcador de realidad aumentada mas usado en la historia'; //mensaje a mostrar cuando indicamos el mesh con nuestro mouse

    ///////CREACION ELEMENTOS TEXTO//////////////////////
    //CREACION DE CANVAS 
    canvas1 = document.createElement('canvas');
    context1 = canvas1.getContext('2d');
    context1.font = "Bold 50px Arial";
    context1.fillStyle = "rgba(0,0,0,0.95)";
    context1.fillText('PARASOL', 0, 150);

    //los contenidos del canvas seran usados como textura 
    texture1 = new THREE.Texture(canvas1);
    texture1.needsUpdate = true;

    //creacion del sprite
    var spriteMaterial = new THREE.SpriteMaterial(
        {
            map: texture1
        }
    )
    sprite1 = new THREE.Sprite(spriteMaterial);
    sprite1.scale.set(1, 1.5, 1);
    //sprite1.position.set(5, 5, 0);


    ////////////AGREGAMOS OBJETOS A ESCeNA Y ARRAY OBJECTS
    
    objects.push(mesh1);
    
    // - objects.push(mesh2);


    //agregamos nuestros objetos a la escena mediante el objeto marker1

    markerRoot1.add(mesh1);
    markerRoot1.add(sprite1); //-//-//-//

    // - marker2.add(mesh2);
    // - marker2.add(sprite1);

    //////////EVENT LISTERNERS/////////////////////////////////
    document.addEventListener('mousemove', onDocumentMouseMove, false);// detecta movimiento del mouse

}

//////////////FUNCIONES//////////////////////////////////

function onDocumentMouseMove(event) {
    event.preventDefault();
    sprite1.position.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1, 0);
    sprite1.renderOrder = 999;
    sprite1.onBeforeRender = function (renderer) { renderer.clearDepth(); }

    mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1); //mouse pos

    raycaster.setFromCamera(mouse, camera); //creo el rayo que va desde la camara , pasa por el frustrum 
    let intersects = raycaster.intersectObjects(objects, true); //buscamos las intersecciones
    console.log(objects)
    if (intersects.length > 0) {
        if (intersects[0].object != INTERSECTED) {
            if (INTERSECTED) {
                INTERSECTED.material.color.setHex(INTERSECTED.currentHex);
            }
            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            INTERSECTED.material.color.setHex(0xffff00);

            if (INTERSECTED.name) {
                context1.clearRect(0, 0, 10, 10);
                let message = 'PARASOL' + INTERSECTED.name;
                let metrics = context1.measureText(message);
                let width = metrics.width;
                let height = metrics.height;
                context1.fillStyle = "rgba(0,0,0,0.95)"; // black border
                context1.fillRect(0, 0, width + 208, 20 + 8);
                
                context1.fillStyle = "rgba(255,255,255,0.95)"; // white filler
                context1.fillRect(2, 2, width + 204, 20 + 4);
                context1.fillStyle = "rgba(0,0,0,1)"; // text color
                context1.fillText(message, 4, 20);
                texture1.needsUpdate = true;
            }
            else {
                context1.clearRect(0, 0, 0, 10);
                texture1.needsUpdate = true;
            }
        }

    }
    //si no encuentra intersecciones
    else {
        if (INTERSECTED) {
            INTERSECTED.material.color.setHex(INTERSECTED.currentHex); //devolviendo el color original al objeto            
        }
        INTERSECTED = null;
        context1.clearRect(0, 0, 300, 300);
        texture1.needsUpdate = true;
    }








}













function update() {
    //actualiza contenido de nuestra app AR
    if (arToolkitSource.ready !== false) {
        arToolkitContext.update(arToolkitSource.domElement);
    }
}

function render() {
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    deltaTime = clock.getDelta();
    totalTime += deltaTime; // totalTime =  totalTime + deltaTime 
    update();
    render();
}