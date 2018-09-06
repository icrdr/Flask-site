var canvas = $("#canvas-container");
var width = canvas.width();
var height = canvas.height();

// RENDER
// --------------------------------------------
var renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(width, height);
renderer.setClearColor(0xffffff, 0);
$(canvas).append(renderer.domElement);
renderer.shadowMap.enabled = true;
var scene = new THREE.Scene();

// BUFFER
// --------------------------------------------
var bufferA = new THREE.WebGLRenderTarget({
  stencilBuffer: false,
  depthBuffer: true
});
bufferA.setSize(width, height);

var bufferB = new THREE.WebGLRenderTarget({
  stencilBuffer: false,
  depthBuffer: true
});
bufferB.setSize(width, height);

// CAMERA
// --------------------------------------------
var camera = new THREE.PerspectiveCamera(50, width / height, 3, 50);
camera.position.set(0, 5, -10);

// GROUP
// --------------------------------------------
var group = new THREE.Group();
scene.add(group);

// LIGHT
// --------------------------------------------
var lDir = new THREE.DirectionalLight(0xffffff, 2.0);
lDir.position.set(5, 3, 3);
lDir.castShadow = true;
group.add(lDir);

// HELPER
// --------------------------------------------
var helper = new THREE.GridHelper(1000, 40, 0x303030, 0x303030);
//scene.add(helper);

// LOADER
// --------------------------------------------
var manager = new THREE.LoadingManager();
var mtlLoader = new THREE.MTLLoader(manager);
var obmloader = new THREE.OBMLoader(manager);
var textloader = new THREE.TextureLoader(manager);
obmloader.setPath('../static/obj/');
textloader.setPath('../static/img/');

manager.onLoad = function() {
  console.log('Loading complete!');
};
manager.onProgress = function(url, itemsLoaded, itemsTotal) {
  current_progress = itemsLoaded / itemsTotal * 100;
  console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

// MATERIAL
// --------------------------------------------
var tShape = textloader.load('shape.jpg', function(texture) {
  texture.minFilter = THREE.NearestFilter;
});

var mNormal = new THREE.MeshNormalMaterial();
var mDepth = new THREE.MeshDepthMaterial();
var mLambert = new THREE.MeshPhongMaterial({
  color: 0x999999
});


// OBJECT
// --------------------------------------------
obmloader.load('liver.obm', function(object) {
  object.traverse(function(node) {
    if (node instanceof THREE.Mesh) {
      node.material = mLambert;
      node.castShadow = true;
      node.receiveShadow = true;
      scene.add(node);
    }
  });
});

// POSTEFFECT
// --------------------------------------------
var resolution = new THREE.Vector2(width, height);
var sVERTEX = `
varying vec2 vUv;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    vUv = uv;
}
`;

var sFRAGMENT = `
uniform sampler2D tDiffuse;
uniform sampler2D tShape;
uniform vec3 cPos;
uniform vec2 iResolution;
uniform vec3 lineColor;
uniform float sDensity;
uniform float sSize;
uniform int sType;

varying vec2 vUv;

vec2 rand(vec2 co){
  co.x += cPos.x + cPos.y;
  co.y += cPos.y + cPos.z;
  return vec2(
    fract(sin(mod(dot(co.xy ,vec2(12.9898,78.233)),3.14)) * 43758.5453),
    fract(cos(mod(dot(co.yx ,vec2(8.64947,45.097)),3.14)) * 43758.5453)
  );
}

float shape(vec2 co){
  if(sType == 0){
    return smoothstep(0.3, 0.25, length(co - vec2(0.5)));
  }else if(sType == 1){
    return smoothstep(0.4, 0.35, length(co - vec2(0.5))) - smoothstep(0.2, 0.15, length(co - vec2(0.5)));
  }else if(sType == 2){
    return texture2D(tShape, co).r;
  }
}

float stippling(float density, float size){
  size *= density;
  density *= 0.2;

  vec2 uv = gl_FragCoord.xy * density;
  uv.y *= 0.865;

  float color = 0.0;

  for(float i = -2.0; i < 4.0; i++){
    for(float j = -2.0; j < 4.0; j++){
      vec2 onGrid = vec2(
        floor(uv.x) + 1.0 * i,
        floor(uv.y) + 1.0 * j
      );
      vec2 randCO = onGrid;

      if(mod(randCO.x,2.0) != 0.0){
          onGrid.y += 0.578;
      }

      onGrid += (rand(randCO) * 2.0 - 1.0) * 0.2;

      vec2 dUv = vec2(
        (uv.x - onGrid.x)/(size * 1.0),
        (uv.y - onGrid.y)/(size * 0.865)
      );

      vec2 tUv = vec2(
        (onGrid.x / density)/ iResolution.x ,
        (onGrid.y / (density * 0.865))/ iResolution.y
      );

      if(floor(dUv.x) == 0.0 &&
        floor(dUv.y) == 0.0 &&
        texture2D(tDiffuse, tUv).r <= rand(randCO).x
      )color += shape(dUv);
      //rand(onGrid).x
    }
  }
  color = clamp(color,0.0,1.0);
  return color;
}

void main() {
  float _a = texture2D(tDiffuse, vUv).a;
  _a *= stippling(sDensity, sSize);
  vec3 ink = (_a == 0.0)? vec3(0.0):lineColor;
  gl_FragColor = vec4(ink, _a);

  //gl_FragColor = texture2D(tShape, vUv);
}
`;

var stipplingShader = {
  uniforms: {
    tDiffuse: {
      value: null
    },
    tShape: {
      value: tShape
    },
    cPos: {
      value: camera.position
    },
    iResolution: {
      value: resolution
    },
    lineColor: {
      value: new THREE.Vector3(0.35, 0.35, 0.35)
    },
    sDensity: {
      value: 2.5
    },
    sSize: {
      value: 1.0
    },
    sType: {
      value: 0
    }
  },
  vertexShader: sVERTEX,
  fragmentShader: sFRAGMENT
};

var eFRAGMENT = `
#define Sensitivity vec2(0.5, 10)
#define edgeColor vec3(0.0,0.0,0.0)

uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform vec3 lineColor;
uniform float lineWidth;
uniform vec2 iResolution;

varying vec2 vUv;

float checkSame(vec4 sampleA, vec4 sampleB)
{
    vec3 diffNormal = abs(sampleA.xyz - sampleB.xyz) * Sensitivity.x;
    bool isSameNormal = (diffNormal.x + diffNormal.y + diffNormal.z) < 0.1;
    float diffDepth = abs(sampleA.w - sampleB.w) * Sensitivity.y;
    bool isSameDepth = diffDepth < 0.1;
    return (isSameNormal || isSameDepth) ? 1.0 : 0.0;
}

void main( )
{
    vec4 sample0 = vec4(
      texture2D(tNormal, vUv).xyz,
      texture2D(tDepth, vUv).x
    );
    vec4 sample1 = vec4(
      texture2D(tNormal, vUv + (vec2(lineWidth) / iResolution.xy)).xyz,
      texture2D(tDepth, vUv + (vec2(lineWidth) / iResolution.xy)).x
    );
    vec4 sample2 = vec4(
      texture2D(tNormal, vUv + (vec2(-lineWidth) / iResolution.xy)).xyz,
      texture2D(tDepth, vUv + (vec2(-lineWidth) / iResolution.xy)).x
    );
    vec4 sample3 = vec4(
      texture2D(tNormal, vUv + (vec2(-lineWidth, lineWidth) / iResolution.xy)).xyz,
      texture2D(tDepth, vUv + (vec2(-lineWidth, lineWidth) / iResolution.xy)).x
    );
    vec4 sample4 = vec4(
      texture2D(tNormal, vUv + (vec2(lineWidth, -lineWidth) / iResolution.xy)).xyz,
      texture2D(tDepth, vUv + (vec2(lineWidth, -lineWidth) / iResolution.xy)).x
    );

    float edge = 1.0 - checkSame(sample1, sample2) * checkSame(sample3, sample4);

    vec4 base = texture2D(tDiffuse, vUv);
    float alpha = max(edge,base.a);
    gl_FragColor = vec4(mix(base.rgb,lineColor,edge), alpha);
    //gl_FragColor = vec4(base.rgb, base.a);
}
`;

var edgeShader = {
  uniforms: {
    tDiffuse: {
      type: 't',
      value: null
    },
    tNormal: {
      type: 't',
      value: null
    },
    tDepth: {
      type: 't',
      value: null
    },
    iResolution: {
      type: 'v2',
      value: resolution
    },
    lineColor: {
      type: 'v3',
      value: new THREE.Vector3(0.35, 0.35, 0.35)
    },
    lineWidth: {
      type: 'f',
      value: 1.0
    }
  },
  vertexShader: sVERTEX,
  fragmentShader: eFRAGMENT
};

var composer = new THREE.EffectComposer(renderer);
var RenderPass = new THREE.RenderPass(scene, camera);
//RenderPass.renderToScreen = true;

var stipplingPass = new THREE.ShaderPass(stipplingShader);
//stipplingPass.renderToScreen = true;

var edgePass = new THREE.ShaderPass(edgeShader);
edgePass.renderToScreen = true;

FXAAPass = new THREE.ShaderPass(THREE.FXAAShader);
FXAAPass.uniforms.resolution.value.set(1 / width, 1 / height);
//FXAAPass.renderToScreen = true;

composer.addPass(RenderPass);
composer.addPass(stipplingPass);
composer.addPass(edgePass);
composer.addPass(FXAAPass);

// STATS
// --------------------------------------------
var stats = new Stats();
//$("#canvas-container").append(stats.domElement);
$(stats.domElement).attr( "style", "position:absolute; top:0; left:0" );
// GUI
// --------------------------------------------
var gui = new dat.GUI({ autoPlace: false });
gui.add(stipplingPass.uniforms.sSize, 'value', 1.0, 4.0).name("shape size");
gui.add(stipplingPass.uniforms.sDensity, 'value', 0.1, 2.5).name("shape density");
gui.add(stipplingPass.uniforms.sType, 'value', {
  "point": 0,
  "ring": 1,
  "Hexagon": 2
}).name("shape type");
$("#canvas-container").append(gui.domElement);
$(gui.domElement).attr( "style", "position:absolute; top:0; right:0" );

// CONTRLS
// --------------------------------------------
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.target.set(0.6, 5, -0.6);
controls.rotateSpeed = 1;
controls.maxDistance = 15;
controls.minDistance = 7;

window.addEventListener('resize', onWindowResize, false);

//PROGRESS
var progress_meta = 0;
var current_progress = 0;
var progress_interval = setInterval(progress, 1);

function progress() {
  if (progress_meta < current_progress) {
    progress_meta++;
    $("#prograss-meta").html(parseFloat(progress_meta) + "%");
  }

  if (progress_meta >= 100) {
    window.clearInterval(progress_interval);
    $("#mask-container").hide(500);
  }
}

// ANIMATION
// --------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  //group.rotation.y += 0.005;
  group.position.set(camera.position.x, camera.position.y, camera.position.z);
  group.rotation.set(camera.rotation.x, camera.rotation.y, camera.rotation.z);

  for (i in scene.children) {
    if (scene.children[i] instanceof THREE.Mesh) {
      scene.children[i].material = mNormal;
    }
  }
  renderer.render(scene, camera, bufferA);

  for (i in scene.children) {
    if (scene.children[i] instanceof THREE.Mesh) {
      scene.children[i].material = mDepth;
    }
  }
  renderer.render(scene, camera, bufferB);
  stipplingPass.uniforms.cPos.value = camera.position;
  stipplingPass.uniforms.tShape.value = tShape;
  edgePass.uniforms.tNormal.value = bufferA.texture;
  edgePass.uniforms.tDepth.value = bufferB.texture;

  for (i in scene.children) {
    if (scene.children[i] instanceof THREE.Mesh) {
      scene.children[i].material = mLambert;
    }
  }

  composer.render();
  controls.update();
  stats.update();
}

// WINDOW SIZE
// --------------------------------------------
function onWindowResize() {
  var _w = canvas.width();
  var _h = canvas.height();
  camera.aspect = _w / _h;
  camera.updateProjectionMatrix();

  edgePass.uniforms.iResolution.value.set(_w, _h);
  stipplingPass.uniforms.iResolution.value.set(_w, _h);
  FXAAPass.uniforms.resolution.value.set(1 / _w, 1 / _h);
  renderer.setSize(_w, _h);
  bufferA.setSize(_w, _h);
  bufferB.setSize(_w, _h);
  composer.setSize(_w, _h);
}

animate();
