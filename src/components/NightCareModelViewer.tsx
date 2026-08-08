import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type NightCareDeliveryRequest = {
  productId: string;
  productName: string;
  delivery: 'single' | 'private' | 'kit';
  nonce: number;
};

type NightCareModelViewerProps = {
  modelUrl: string;
  fallbackImage: string;
  deliveryRequest: NightCareDeliveryRequest | null;
  resetSignal: number;
};

type ViewerRuntime = {
  reset: () => void;
  deliver: (request: NightCareDeliveryRequest) => void;
  restoreView: () => void;
  rotateView: (azimuth: number, polar: number) => void;
  dispose: () => void;
};

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function createLabelTexture(name: string, accent: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#f7f5ef';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = accent;
  context.fillRect(0, 0, 26, canvas.height);
  context.fillStyle = '#112126';
  context.font = '600 44px "Microsoft YaHei", sans-serif';
  context.textBaseline = 'middle';
  const safeName = name.length > 8 ? `${name.slice(0, 8)}…` : name;
  context.fillText(safeName, 54, 108);
  context.fillStyle = '#5f6d70';
  context.font = '500 22px "Microsoft YaHei", sans-serif';
  context.fillText('NightCare 校园夜间支持', 54, 166);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createProductModel(name: string) {
  const group = new THREE.Group();
  const bottleLike = /饮料|液|喷雾|消毒/.test(name);
  const pouchLike = /盐|袋|冷敷|冰袋/.test(name);
  const accent = bottleLike ? '#54cbc4' : pouchLike ? '#e9a646' : '#f06b57';
  const labelTexture = createLabelTexture(name, accent);
  const shellMaterial = new THREE.MeshStandardMaterial({ color: '#f2f0e9', roughness: 0.72, metalness: 0.02 });
  const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });

  if (bottleLike) {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.039, 0.15, 28), shellMaterial);
    bottle.rotation.x = Math.PI / 2;
    group.add(bottle);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.025, 24), new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5 }));
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.086;
    group.add(cap);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.064, 0.09), labelMaterial);
    label.position.set(0, 0, 0.0405);
    group.add(label);
  } else {
    const width = pouchLike ? 0.125 : 0.15;
    const height = pouchLike ? 0.16 : 0.105;
    const depth = pouchLike ? 0.025 : 0.075;
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), shellMaterial);
    group.add(body);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.88, height * 0.78), labelMaterial);
    label.position.z = depth / 2 + 0.001;
    group.add(label);
  }

  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return group;
}

export default function NightCareModelViewer({ modelUrl, fallbackImage, deliveryRequest, resetSignal }: NightCareModelViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ViewerRuntime | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState('正在准备模型…');

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !window.WebGLRenderingContext) {
      setFailed(true);
      setPhase('当前设备无法显示3D模型');
      return undefined;
    }

    let disposed = false;
    let animationFrame = 0;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    const defaultCamera = window.innerWidth < 720
      ? new THREE.Vector3(2.4, 0.8, 5.8)
      : new THREE.Vector3(2.2, 0.95, 4.55);
    camera.position.copy(defaultCamera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.72;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.35 : 1.75));
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight('#f6fbfa', '#5a6464', 0.9));
    const keyLight = new THREE.DirectionalLight('#ffffff', 1.45);
    keyLight.position.set(3.5, 5, 4.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const cyanLight = new THREE.PointLight('#71dfd7', 0.65, 5);
    cyanLight.position.set(-1.2, -0.3, 2.2);
    scene.add(cyanLight);

    const assembly = new THREE.Group();
    assembly.scale.setScalar(2.14);
    scene.add(assembly);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.42, 64),
      new THREE.MeshStandardMaterial({ color: '#d9d9d2', transparent: true, opacity: 0.42, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.075;
    ground.receiveShadow = true;
    scene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 2.7;
    controls.maxDistance = 7.5;
    controls.target.set(0, -0.05, 0);
    controls.update();

    const render = () => {
      if (!disposed) renderer.render(scene, camera);
    };
    controls.addEventListener('change', render);

    const cavityMaterial = new THREE.MeshStandardMaterial({ color: '#172126', roughness: 0.65, metalness: 0.15 });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: '#e7e5df', roughness: 0.48, metalness: 0.12 });
    const trayMaterial = new THREE.MeshStandardMaterial({ color: '#cfd7d6', roughness: 0.35, metalness: 0.28 });
    const glowMaterial = new THREE.MeshBasicMaterial({ color: '#55d9d1', transparent: true, opacity: 0 });

    const kitCavity = new THREE.Mesh(new THREE.PlaneGeometry(0.158, 0.145), cavityMaterial);
    kitCavity.position.set(0.205, -0.315, 0.177);
    kitCavity.visible = false;
    assembly.add(kitCavity);

    const kitDoorPivot = new THREE.Group();
    kitDoorPivot.position.set(0.126, -0.315, 0.184);
    const kitDoor = new THREE.Mesh(new THREE.BoxGeometry(0.158, 0.13, 0.012), doorMaterial);
    kitDoor.position.x = 0.079;
    kitDoor.castShadow = true;
    kitDoorPivot.add(kitDoor);
    kitDoorPivot.visible = false;
    assembly.add(kitDoorPivot);

    const privateGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.112), glowMaterial);
    privateGlow.position.set(-0.112, -0.265, 0.181);
    assembly.add(privateGlow);

    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.245, 0.018, 0.155), trayMaterial);
    tray.position.set(-0.112, -0.285, 0.12);
    tray.castShadow = true;
    tray.receiveShadow = true;
    tray.visible = false;
    assembly.add(tray);

    const productAnchor = new THREE.Group();
    assembly.add(productAnchor);
    let activeProduct: THREE.Group | null = null;

    const clearProduct = () => {
      if (!activeProduct) return;
      productAnchor.remove(activeProduct);
      activeProduct.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose();
          material.dispose();
        });
      });
      activeProduct = null;
    };

    const resetVisuals = () => {
      cancelAnimationFrame(animationFrame);
      kitDoorPivot.rotation.y = 0;
      kitCavity.visible = false;
      kitDoorPivot.visible = false;
      tray.position.z = 0.12;
      tray.visible = false;
      privateGlow.material.opacity = 0;
      clearProduct();
      setPhase('模型可旋转 · 等待终端操作');
      render();
    };

    const deliver = (request: NightCareDeliveryRequest) => {
      resetVisuals();
      const isKit = request.delivery === 'kit';
      kitCavity.visible = isKit;
      kitDoorPivot.visible = isKit;
      tray.visible = !isKit;
      activeProduct = createProductModel(request.productName);
      activeProduct.visible = false;
      activeProduct.scale.setScalar(isKit ? 0.82 : 0.72);
      productAnchor.add(activeProduct);
      const start = performance.now();
      setPhase(`正在交付：${request.productName}`);

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (isKit) {
          kitDoorPivot.rotation.y = -1.42;
          activeProduct.position.set(0.205, -0.315, 0.3);
        } else {
          tray.position.z = 0.3;
          privateGlow.material.opacity = 0.42;
          activeProduct.position.set(-0.112, -0.22, 0.36);
        }
        activeProduct.visible = true;
        setPhase(`${request.productName} · 已送达取货位置`);
        render();
        return;
      }

      const tick = (time: number) => {
        const elapsed = time - start;
        const highlight = clamp01(elapsed / 420);
        privateGlow.material.opacity = isKit ? 0 : 0.12 + Math.sin(highlight * Math.PI) * 0.5;

        if (isKit) {
          const opening = easeOutCubic(clamp01((elapsed - 360) / 760));
          kitDoorPivot.rotation.y = -1.42 * opening;
          activeProduct!.position.set(0.205, -0.315, 0.18 + easeOutCubic(clamp01((elapsed - 980) / 720)) * 0.12);
          activeProduct!.visible = elapsed >= 760;
        } else {
          const extension = easeOutCubic(clamp01((elapsed - 360) / 780));
          tray.position.z = 0.12 + extension * 0.18;
          activeProduct!.position.set(-0.112, -0.22, 0.18 + extension * 0.18);
          activeProduct!.visible = elapsed >= 620;
        }

        render();
        if (elapsed < 1900) {
          animationFrame = requestAnimationFrame(tick);
        } else {
          privateGlow.material.opacity = isKit ? 0 : 0.42;
          setPhase(`${request.productName} · 已送达取货位置`);
          render();
        }
      };
      animationFrame = requestAnimationFrame(tick);
    };

    const restoreView = () => {
      camera.position.copy(defaultCamera);
      controls.target.set(0, -0.05, 0);
      controls.update();
      render();
    };

    const rotateView = (azimuth: number, polar: number) => {
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += azimuth;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + polar, 0.28, Math.PI - 0.28);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      controls.update();
      render();
    };

    runtimeRef.current = {
      reset: resetVisuals,
      deliver,
      restoreView,
      rotateView,
      dispose: () => {
        disposed = true;
        cancelAnimationFrame(animationFrame);
        controls.dispose();
        renderer.dispose();
      },
    };

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.roughness = Math.max(0.35, material.roughness);
              material.envMapIntensity = 0.55;
            }
          });
        });
        assembly.add(model);
        setLoaded(true);
        setPhase('模型可旋转 · 等待终端操作');
        render();
      },
      (event) => {
        if (event.total) setPhase(`正在加载模型 ${Math.round((event.loaded / event.total) * 100)}%`);
      },
      () => {
        setFailed(true);
        setPhase('模型加载失败，终端界面仍可使用');
      },
    );

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    return () => {
      resizeObserver.disconnect();
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [modelUrl]);

  useEffect(() => {
    if (deliveryRequest && loaded) runtimeRef.current?.deliver(deliveryRequest);
  }, [deliveryRequest, loaded]);

  useEffect(() => {
    if (loaded) runtimeRef.current?.reset();
  }, [resetSignal]);

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const camera = runtimeRef.current;
    if (!camera) return;
    if (event.key === 'Home') {
      event.preventDefault();
      camera.restoreView();
    } else if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      if (event.key === 'ArrowLeft') camera.rotateView(-0.12, 0);
      if (event.key === 'ArrowRight') camera.rotateView(0.12, 0);
      if (event.key === 'ArrowUp') camera.rotateView(0, -0.1);
      if (event.key === 'ArrowDown') camera.rotateView(0, 0.1);
    }
  };

  if (failed) {
    return (
      <div className="nightcare-model-fallback" role="status">
        <img src={fallbackImage} alt="NightCare校园夜间健康支持终端渲染图" />
        <p>{phase}</p>
      </div>
    );
  }

  return (
    <div className="nightcare-viewer-shell">
      <div
        ref={hostRef}
        className="nightcare-model-canvas"
        tabIndex={0}
        aria-label="NightCare三维模型。拖动或方向键旋转，滚轮或双指缩放，按Home恢复视角。"
        onKeyDown={handleKeyboard}
      />
      <div className="nightcare-viewer-status" role="status" aria-live="polite">
        <span className={loaded ? 'is-ready' : ''} aria-hidden="true" />
        {phase}
      </div>
      <div className="nightcare-viewer-actions">
        <button type="button" onClick={() => runtimeRef.current?.restoreView()}>恢复视角</button>
        <button type="button" onClick={() => runtimeRef.current?.reset()}>收回商品</button>
      </div>
    </div>
  );
}
