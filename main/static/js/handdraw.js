var canvasParent = $("#canvas-container");
var renderer, scene, camera;
var stats, gui;

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

init();
animate();

//主体初始化
function init() {
  //渲染器设置
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setClearColor(0xffffff, 0);
  renderer.setSize(canvasParent.width(), canvasParent.height());
  $("#canvas-container").append(renderer.domElement);
  renderer.shadowMap.enabled = false;

  //设置场景和摄像机
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, canvasParent.width() / canvasParent.height(), 0.1, 10000);
  camera.position.set(0.6, 5, -10);

  //设置网格
  var helper = new THREE.GridHelper(1000, 40, 0x303030, 0x303030);
  //scene.add(helper);

  //设置光源
  var DLight = new THREE.DirectionalLight(0xffffff, 0.5);
  DLight.position.set(1, 2, -2);
  var Alight = new THREE.AmbientLight(0xffffff, 0.6); // soft white light

  scene.add(DLight);
  scene.add(Alight);

  //添加模型
  var manager = new THREE.LoadingManager();
  var mtlLoader = new THREE.MTLLoader(manager);
  var obmloader = new THREE.OBMLoader(manager);

  manager.onLoad = function() {
    console.log('Loading complete!');
  };
  manager.onProgress = function(url, itemsLoaded, itemsTotal) {
    current_progress = itemsLoaded / itemsTotal * 100;
    console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
  };

  var shader = THREE.HandDrawShader["hatch"];
  var uniforms = THREE.UniformsUtils.clone(shader.uniforms);
  uniforms["fcolor"].value.setHex(0x000000);
  var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader
  });

  //模型导入器
  obmloader.setPath('../static/obj/');
  obmloader.load('liver.obm', function(object) {
    object.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        scene.add(child);
      }
    });
  });

  //记录帧数
  stats = new Stats();
  $("#canvas-container").append(stats.dom);

  //镜头控制
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0.6, 5, -0.6);
  controls.rotateSpeed = 0.2;

  window.addEventListener('resize', onWindowResize, false);
}

//渲染
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  controls.update();
  stats.update();
}

//改变窗口尺寸
function onWindowResize() {
  camera.aspect = canvasParent.width() / canvasParent.height();
  camera.updateProjectionMatrix();
  renderer.setSize(canvasParent.width(), canvasParent.height());
}
