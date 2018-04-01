var canvasParent = $("#canvas-container");
var renderer, scene, camera;
var stats, gui;
var raycaster, mouse;
var grp_lung;
var f_seg;
var displaymode = false;
var seg_dict = {
  "L_S12": {color:"0xfd6847", info:"Left S1-2"},
  "L_S03": {color:"0xffc546", info:"Left S3"},
  "L_S04": {color:"0xb4d64a", info:"Left S4"},
  "L_S05": {color:"0x75e28a", info:"Left S5"},
  "L_S06": {color:"0x947dd1", info:"Left S6"},
  "L_S78": {color:"0xa1e0f1", info:"Left S7-8"},
  "L_S09": {color:"0x89bfff", info:"Left S9"},
  "L_S10": {color:"0x7887e3", info:"Left S10"},

  "R_S01": {color:"0xfd6847", info:"Right S1"},
  "R_S02": {color:"0xff8f47", info:"Right S2"},
  "R_S03": {color:"0xffc546", info:"Right S3"},
  "R_S04": {color:"0xb4d64a", info:"Right S4"},
  "R_S05": {color:"0x75e28a", info:"Right S5"},
  "R_S06": {color:"0x947dd1", info:"Right S6"},
  "R_S07": {color:"0x96efd9", info:"Right S7"},
  "R_S08": {color:"0xa1e0f1", info:"Right S8"},
  "R_S09": {color:"0x89bfff", info:"Right S9"},
  "R_S10": {color:"0x7887e3", info:"Right S10"},
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
  if(f_seg){
    $("#info-text").html(seg_dict[f_seg.name].info);
  }else{
    $("#info-text").html("Touch it");
  }

  if (!displaymode) {
    for (i in grp_lung.children) {
      var _seg = grp_lung.children[i];
      if (_seg != f_seg && _seg.material.opacity != 1) {
        _seg.material.color.setHex(seg_dict[_seg.name].color);
        new TWEEN.Tween(_seg.material).to({
          opacity: 1,
        }, fadeTime).
        onComplete(function() {
          this.transparent = false;
        }).start();
      }
    }

    if (f_seg) {
      f_seg.material.transparent = true;
      new TWEEN.Tween(f_seg.material).to({
        opacity: 0.2,
      }, fadeTime)
      .onComplete(function() {
        f_seg.material.color.setHex(0xffffff);
      }).start();
    }

  } else {
    for (i in grp_lung.children) {
      var _seg = grp_lung.children[i];
      _seg.material.color.setHex(seg_dict[_seg.name].color);
      if (_seg != f_seg) {
        _seg.material.transparent = true;
        _seg.material.color.setHex(0xffffff);
        new TWEEN.Tween(_seg.material).to({
          opacity: 0.2,
        }, fadeTime).start();
      }
    }

    if (f_seg) {
      new TWEEN.Tween(f_seg.material).to({
        opacity: 1
      }, fadeTime)
      .onComplete(function() {
        f_seg.material.transparent = false;
      }).start();
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
  camera = new THREE.PerspectiveCamera(50, canvasParent.width() / canvasParent.height(), 0.1, 10000);
  camera.position.set(0, 1, -4);

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

  grp_lung = new THREE.Group();
  scene.add(grp_lung);

  //模型导入器
  mtlLoader.setPath('../static/obj/lung/');
  obmloader.setPath('../static/obj/lung/');

  //导入气管模型
  mtlLoader.load('bro.mtl', function(materials) {
    materials.preload();
    obmloader.setMaterials(materials);
    obmloader.load('bro.obm', function(object) {
      object.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          var materials = child.material;
          for (i in materials) {
            var name = materials[i].name.replace("_mtl","");
            materials[i] = new THREE.MeshLambertMaterial();
            if(name == "bro"){
              materials[i].color.setHex(0xffffff);
            }else{
              materials[i].color.setHex(seg_dict[name].color);
            }
          }
          scene.add(child);
        }
      });
    });
  });

  //导入肺段模型
  for (key in seg_dict) {
    filename = key + '.obm';
    obmloader.load(filename, function(object) {
      object.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshLambertMaterial();
          child.material.color.setHex(seg_dict[child.name].color);
          grp_lung.add(child);
        }
      });
    });
  }

  //记录帧数
  stats = new Stats();
  //$("#canvas-container").append(stats.dom);

  //镜头控制
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.7, 0);
  controls.rotateSpeed = 0.2;
  controls.maxDistance = 7;
  controls.minDistance = 3;

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('resize', onWindowResize, false);
}

//点击事件
$("canvas").on("click", function(e) {
  e.preventDefault();
  mouse.x = (e.offsetX / canvasParent.width()) * 2 - 1;
  mouse.y = -(e.offsetY / canvasParent.height()) * 2 + 1;
  raycastSegment();
});
$("canvas").on("tap", function(e) {
  e.preventDefault();
  mouse.x = e.touches[0].clientX;
  mouse.y = e.touches[0].clientY;
  raycastSegment();
});

//显示模式更换
$('#displaytoggle').change(function() {
  if (this.checked) {
    displaymode = true;
  } else {
    displaymode = false;
  }
  UpdateDisplay();
});

//点击选中分段
function raycastSegment() {
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(grp_lung.children);
  if (intersects.length > 0) {
    f_seg = intersects[0].object;
  } else {
    f_seg = null;
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
