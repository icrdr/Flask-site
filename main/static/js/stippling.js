var canvas = $("#canvas-container");
var width = canvas.width();
var height = canvas.height();
//渲染器
var renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(width, height);
renderer.setClearColor(0xffffff, 0);
$(canvas).append(renderer.domElement);
renderer.shadowMap.enabled = true;

//缓存
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

//场景和摄像机
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(50, width / height, 3, 50);
camera.position.set(0, 5, -10);

//设置网格
var helper = new THREE.GridHelper(1000, 40, 0x303030, 0x303030);
//scene.add(helper);

//添加组
var group = new THREE.Group();
scene.add(group);

//设置光源
var lDir = new THREE.DirectionalLight(0xffffff, 2.0);
lDir.position.set(5, 3, 3);
lDir.castShadow = true;

group.add(lDir);
var lAmb = new THREE.AmbientLight(0xffffff, 0.01);
scene.add(lAmb);

//添加载入器
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
//添加材质
var mNormal = new THREE.MeshNormalMaterial();
var mDepth = new THREE.MeshDepthMaterial();
var mLambert = new THREE.MeshPhongMaterial({
  color: 0x999999
});

//添加模型
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

//后期
var resolution = new THREE.Vector2(width, height);
var sVERTEX = `
varying vec2 vUv;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    vUv = uv;
}
`;

var sFRAGMENT =
  `
precision highp float;

uniform sampler2D tDiffuse;
uniform vec3 cPos;
uniform vec3 inkColor;
uniform vec2 iResolution;

varying vec2 vUv;

vec2 rand2d(vec2 co){
co.x += cPos.x + cPos.y;
co.y += cPos.y + cPos.z;
return (vec2(
  fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453),
  fract(cos(dot(co.yx ,vec2(8.64947,45.097))) * 43758.5453)
)*2.0-1.0)*0.3;
}

float rand(vec2 co)
{
highp float a = 12.9898;
highp float b = 78.233;
highp float c = 43758.5453;
highp float dt= dot(co.xy ,vec2(a,b));
highp float sn= mod(dt,3.14);
return fract(sin(sn) * c);
}

float stippling(float size, float width)
{
vec2 uv = gl_FragCoord.xy * size;
float color = 1.0;

for(float i = -1.0; i < 3.0; i++){
for(float j = -1.0; j < 3.0; j++){
  vec2 center = vec2(
    floor(uv).x + 1.0*i,
    floor(uv).y + 1.0*j
  );
  center += rand2d(center);

  vec2 dUv = vec2(
    (uv.x - center.x)/width,
    (uv.y - center.y)/width
  );

  float circleA = smoothstep(0.5, 0.4, length(dUv - vec2(0.5)));
  float squ = (
    abs(dUv.x - 0.5) < 0.3 &&
    abs(dUv.y - 0.5) < 0.3 )? 1.0:0.0;
  float circleB = smoothstep(0.2, 0.15, length(dUv - vec2(0.5)));

  vec2 tUv = vec2(
    center.x / iResolution.x / size,
    center.y / iResolution.y / size
  );

  if(texture2D(tDiffuse, tUv).r < rand(center)){
    color -= circleA;
  }
}
}
color = max(color,0.0);
color = min(color,1.0);
return color;
}

void main() {
float _a = texture2D(tDiffuse, vUv).a;
_a *= (1.0 - stippling(0.7, 1.8));
vec3 ink = (_a == 0.0)? vec3(0.0):inkColor;
gl_FragColor = vec4(ink, _a);
//gl_FragColor = vec4(ink, 0.0);
}
`;

var stipplingShader = {
  uniforms: {
    tDiffuse: {
      type: 't',
      value: null
    },
    cPos: {
      type: 'v3',
      value: camera.position
    },
    iResolution: {
      type: 'v2',
      value: resolution
    },
    inkColor: {
      type: 'v3',
      value: new THREE.Vector3(0.35, 0.35, 0.35)
    }
  },
  vertexShader: sVERTEX,
  fragmentShader: sFRAGMENT
};

var eFRAGMENT =
  `
#define Sensitivity vec2(0.5, 10)
#define edgeColor vec3(0.0,0.0,0.0)

uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform vec3 inkColor;
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
    float line_w = 0.8;
    vec4 sample1 = vec4(
      texture2D(tNormal, vUv + (vec2(line_w) / iResolution.xy)).xyz,
      texture2D(tDepth, vUv + (vec2(line_w) / iResolution.xy)).x
    );
    vec4 sample2 = vec4(
      texture2D(tNormal, vUv + (vec2(-line_w) / iResolution.xy)).xyz,
      texture2D(tDepth, vUv + (vec2(-line_w) / iResolution.xy)).x
    );
    vec4 sample3 = vec4(
      texture2D(tNormal, vUv + (vec2(-line_w, line_w) / iResolution.xy)).xyz,
      texture2D(tDepth, vUv + (vec2(-line_w, line_w) / iResolution.xy)).x
    );
    vec4 sample4 = vec4(
      texture2D(tNormal, vUv + (vec2(line_w, -line_w) / iResolution.xy)).xyz,
      texture2D(tDepth, vUv + (vec2(line_w, -line_w) / iResolution.xy)).x
    );

    float edge = 1.0 - checkSame(sample1, sample2) * checkSame(sample3, sample4);

    vec4 base = texture2D(tDiffuse, vUv);
    float alpha = max(edge,base.a);
    gl_FragColor = vec4(mix(base.rgb,inkColor,edge), alpha);
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
    inkColor: {
      type: 'v3',
      value: new THREE.Vector3(0.35, 0.35, 0.35)
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

//记录
var stats = new Stats();
//$("#canvas-container").append(stats.dom);

//镜头控制
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.target.set(0.6, 5, -0.6);
controls.rotateSpeed = 1;
controls.maxDistance = 15;
controls.minDistance = 7;

window.addEventListener('resize', onWindowResize, false);

//读取进度条
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

//渲染
function animate() {
  requestAnimationFrame(animate);
  //group.rotation.y += 0.005;
  group.position.set(camera.position.x,camera.position.y,camera.position.z);
  group.rotation.set(camera.rotation.x,camera.rotation.y,camera.rotation.z);

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
  edgePass.uniforms.tNormal.value = bufferA.texture;
  edgePass.uniforms.tDepth.value = bufferB.texture;
  stipplingPass.uniforms.cPos.value = camera.position;

  for (i in scene.children) {
    if (scene.children[i] instanceof THREE.Mesh) {
      scene.children[i].material = mLambert;
    }
  }

  composer.render();
  controls.update();
  stats.update();
}

//改变窗口尺寸
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
