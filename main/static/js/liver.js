var canvasParent = $("#canvas-container");
var renderer, scene, camera;
var stats, gui;
var raycaster, mouse;
var grp;
var selected;
var displaymode = false;
var model_dict = {
  "a": {
    color: "0xdf5875",
    info: "Hepatic Artery"
  },
  "v": {
    color: "0x71c8e1",
    info: "Hepatic Vein"
  },
  "p": {
    color: "0x39b9bb",
    info: "Portal Vein"
  },
  "t": {
    color: "0xed87ab",
    info: "Tumor"
  },
};

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

//显示效果更新
var fadeTime = 100;

function UpdateDisplay() {
  if (selected) {
    $("#info-text").html(model_dict[selected.name].info);
  } else {
    $("#info-text").html("Touch it!");
  }

  

  if (selected) {
    selected.material.color.setHex(model_dict[selected.name].color)
    for (i in grp.children) {
      var sub = grp.children[i]
      if(sub != selected){
        sub.material.color.setHex(0xf8dde7)
      }
    }
  }else{
    for (i in grp.children) {
      var sub = grp.children[i]
      sub.material.color.setHex(model_dict[sub.name].color)
    }
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
  camera = new THREE.PerspectiveCamera(20, canvasParent.width() / canvasParent.height(), 0.1, 10000);
  camera.position.set(0, 0, -10);
  scene.add(camera);
  //设置网格
  var helper = new THREE.GridHelper(1000, 40, 0x303030, 0x303030);
  //scene.add(helper);

  //设置光源
  var DLight = new THREE.PointLight(0xffffff, 0.3);
  DLight.position.set(-5, 10, 3);
  var Alight = new THREE.AmbientLight(0xffffff, 0.9); // soft white light
  camera.add(DLight);
  camera.add(Alight);

  //添加模型
  var manager = new THREE.LoadingManager();
  var obmloader = new THREE.OBMLoader(manager);

  manager.onLoad = function () {
    console.log('Loading complete!');
  };

  manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    current_progress = itemsLoaded / itemsTotal * 100;

    console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
  };

  liver = new THREE.Group();
  grp = new THREE.Group();
  liver.add(grp);
  scene.add(liver);

  //位置设置
  obmloader.setPath('../static/obj/liver/');

  //导入模型
  obmloader.load('h.obm', function (object) {
    object.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshLambertMaterial();
        child.material.color.setHex("0xffc6db");
        child.material.transparent = true
        child.material.opacity = 0.3
        liver.add(child);
      }
    });
  });

  for (key in model_dict) {
    filename = key + '.obm';
    obmloader.load(filename, function (object) {
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshLambertMaterial();
          child.material.metalness = 0.0
          child.material.roughness = 1.0
          child.material.color.setHex(model_dict[child.name].color);
          grp.add(child);
        }
      });
    });
  }
  liver.position.set(0.15, -0.1, 0);
  liver.scale.set(0.15, 0.15, 0.15);
  liver.rotation.set(0, 3.14, 0);
  //记录帧数
  stats = new Stats();
  $("#canvas-container").append(stats.dom);

  //镜头控制
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  controls.rotateSpeed = 0.2;
  controls.maxDistance = 15;
  controls.minDistance = 5;

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('resize', onWindowResize, false);
}

//点击事件
$("canvas").on("click", function (e) {
  e.preventDefault();
  mouse.x = (e.offsetX / canvasParent.width()) * 2 - 1;
  mouse.y = -(e.offsetY / canvasParent.height()) * 2 + 1;
  raycastSegment();
});
$("canvas").on("tap", function (e) {
  e.preventDefault();
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
  raycastSegment();
});


//点击选中分段
function raycastSegment() {
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(grp.children);
  if (intersects.length > 0) {
    selected = intersects[0].object;
  } else {
    selected = null;
  }
  UpdateDisplay();
}

//渲染
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  controls.update();
  stats.update();
  TWEEN.update();
}

//改变窗口尺寸
function onWindowResize() {
  camera.aspect = canvasParent.width() / canvasParent.height();
  camera.updateProjectionMatrix();
  renderer.setSize(canvasParent.width(), canvasParent.height());
}