import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
const { THREE, THREEx } = window;

export default class Main {
  constructor() {
    this.onResize = this.onResize.bind(this);
    this.startAr = this.startAr.bind(this);
    this.render = this.render.bind(this);
    this.init();
  }

  init() {
    this.initScene();
    this.initContents();
    this.initStartButton();
    this.initStopButton();
    this.start();
    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      localClippingEnabled: true
    });
    this.renderer.setClearColor(new THREE.Color('black'), 1);
    this.renderer.setSize(640, 480);
    this.renderer.gammaOutput = true;
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0px';
    this.renderer.domElement.style.left = '0px';
    this.renderer.domElement.style.zIndex = '-1';
    document.body.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.lookAt(0, 0, 0);
    this.camera.position.set(0, 10, 0);
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();
    this.scene.add(this.camera);
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 2);
    this.scene.add(light);
  }

  initContents() {
    this.contents = new THREE.Group();
    const geo = new THREE.CubeGeometry(1, 1, 1);
    const mat = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const mesh1 = new THREE.Mesh(geo, mat);
    mesh1.position.set(0, 0.5, 0);
    this.contents.add(mesh1);

    this.mixer = null;
    const loader = new GLTFLoader();
    const scale = 0.004;
    loader.load('./assets/vendor/horse.glb', (gltf) => {
      this.horse = gltf.scene.children[0];
      this.horse.scale.set(scale, scale, scale);
      this.horse.rotation.set(-Math.PI / 2, 0, 0);
      this.horse.position.set(0, -1, 0.3);
      this.contents.add(this.horse);
      this.mixer = new THREE.AnimationMixer(this.horse);
      this.mixer.clipAction(gltf.animations[0]).setDuration(1).play();
    });

    this.helperPoints = [
      new THREE.Object3D(),
      new THREE.Object3D(),
      new THREE.Object3D()
    ];
    this.helperPoints[0].position.set(0, 0, 0);
    this.helperPoints[1].position.set(1, 0, 1);
    this.helperPoints[2].position.set(1, 0, 0);
    this.contents.add(this.helperPoints[0]);
    this.contents.add(this.helperPoints[1]);
    this.contents.add(this.helperPoints[2]);

    this.clippingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    // scene.add(new THREE.PlaneHelper(this.clippingPlane, 1, 0xffff00));
    this.renderer.clippingPlanes.push(this.clippingPlane);

    this.scene.add(this.contents);
  }

  initArToolkit() {
    this.source = new THREEx.ArToolkitSource({
      sourceType: 'webcam',
    });
    this.source.init(this.onResize);

    this.context = new THREEx.ArToolkitContext({
      debug: false,
      cameraParametersUrl: './assets/vendor/camera_para.dat',
      detectionMode: 'mono',
      imageSmoothingEnabled: true,
      maxDetectionRate: 60,
      canvasWidth: this.source.parameters.sourceWidth,
      canvasHeight: this.source.parameters.sourceHeight,
    });
    this.context.init(() => {
      this.camera.projectionMatrix.copy(this.context.getProjectionMatrix());
    });
  }

  initMarker() {
    new THREEx.ArMarkerControls(this.context, this.contents, {
      type: 'pattern',
      patternUrl: './assets/vendor/patt.hiro'
    });
  }

  initStartButton() {
    document.getElementById('start-button').addEventListener('click', this.startAr);
  }

  initStopButton() {
    document.getElementById('stop-button').addEventListener('click', () => {
      this.isStop = true;
      if (this.source) {
        this.source.domElement.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
        this.source.domElement.srcObject = null;
      }
    });
  }

  onResize() {
    if (this.source && this.contents) {
      this.source.onResizeElement();
      this.source.copyElementSizeTo(this.renderer.domElement);
      if(this.context.arController !== null){
        this.source.copyElementSizeTo(this.context.arController.canvas);
      }
    } else {
      const width = window.innerWidth || document.documentElement.clientWidth;
      const height = window.innerHeight || document.documentElement.clientHeight;
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
    }
  }

  startAr() {
    this.controls.reset();
    this.controls.dispose();
    this.camera = new THREE.Camera();
    this.scene.remove(this.camera);
    this.renderer.setClearColor(new THREE.Color('black'), 0);
    this.initArToolkit();
    this.initMarker();
    this.isAr = true;
  }

  start() {
    this.isStop = false;
    this.prevTime = Date.now();
    this.render();
  }

  render() {
    if (!this.isStop) {
      requestAnimationFrame(this.render);
      if (this.isAr) {
        if (this.source.ready === false) {
          return;
        }
        this.context.update(this.source.domElement);
        this.clippingPlane.setFromCoplanarPoints(...this.helperPoints.map((helperPoint) => (
          new THREE.Vector3().applyMatrix4(helperPoint.matrixWorld)
        )));
      }
      if (this.mixer) {
        const time = Date.now();
        if (!this.startTime) {
          this.startTime = Date.now();
        }
        this.mixer.update((time - this.prevTime) * 0.001);
        this.horse.position.set(0, (time - this.startTime) / 400 - 1, 0.3);
        if (this.horse.position.y > 4.5) {
          this.startTime = Date.now();
          this.horse.position.set(0, -1, 0.3);
        }
        this.prevTime = time;
      }
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }
}
