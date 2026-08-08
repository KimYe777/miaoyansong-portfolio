import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type RijiShare = {
  id: string;
  title: string;
  date: string;
  time: string;
  sender: string;
  message: string;
  imageKind?: string;
  voiceIncluded?: boolean;
};

export type RijiPrintRequest = { nonce: number; share: RijiShare };

type Props = {
  modelUrl: string;
  photoUrl: string;
  fallbackImage: string;
  share: RijiShare | null;
  printRequest: RijiPrintRequest | null;
  resetSignal: number;
  onTakePhoto: () => void;
};

type Runtime = {
  print: () => void;
  setShare: (share: RijiShare | null) => void;
  reset: () => void;
  restoreView: () => void;
  rotateView: (azimuth: number, polar: number) => void;
  toggleDrawer: () => void;
  dispose: () => void;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (value: number) => value < 0.5
  ? 4 * value * value * value
  : 1 - Math.pow(-2 * value + 2, 3) / 2;

function makePhotoTexture(url: string, onReady: () => void) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 704;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = '#f6f0e3';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    const pad = 52;
    const width = canvas.width - pad * 2;
    const height = canvas.height - pad * 2;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    context.drawImage(image, pad + (width - drawWidth) / 2, pad + (height - drawHeight) / 2, drawWidth, drawHeight);
    texture.needsUpdate = true;
    onReady();
  };
  image.src = url;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeRoundedPlane(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const left = -width / 2;
  const right = width / 2;
  const bottom = -height / 2;
  const top = height / 2;
  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  const geometry = new THREE.ShapeGeometry(shape, 8);
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let index = 0; index < position.count; index += 1) {
    uv.setXY(
      index,
      (position.getX(index) - left) / width,
      (position.getY(index) - bottom) / height,
    );
  }
  uv.needsUpdate = true;
  return geometry;
}

function normalizeShapeUvs(geometry: THREE.ShapeGeometry, left: number, bottom: number, width: number, height: number) {
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let index = 0; index < position.count; index += 1) {
    uv.setXY(index, (position.getX(index) - left) / width, (position.getY(index) - bottom) / height);
  }
  uv.needsUpdate = true;
  return geometry;
}

function makeDrawerFaceGeometry(width: number, height: number, radius: number) {
  const left = -width / 2;
  const right = width / 2;
  const bottom = -height / 2;
  const top = height / 2;
  const notchHalfWidth = 0.055;
  const notchDepth = 0.016;
  const shape = new THREE.Shape();
  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(notchHalfWidth, top);
  shape.quadraticCurveTo(notchHalfWidth, top - notchDepth, 0, top - notchDepth);
  shape.quadraticCurveTo(-notchHalfWidth, top - notchDepth, -notchHalfWidth, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  return normalizeShapeUvs(new THREE.ShapeGeometry(shape, 8), left, bottom, width, height);
}

function makeWarmShellMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: '#e9e4da',
    roughness: 0.7,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.72,
  });
}

function makeRijiBodyMaterial() {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#eee9df',
    roughness: 0.7,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.72,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRijiLocalPosition;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvRijiLocalPosition = vec3(position.x + 0.001517, -position.z - 0.403187, position.y - 0.003209);',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRijiLocalPosition;')
      .replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `float rearMask = 1.0 - smoothstep(-0.055, 0.015, vRijiLocalPosition.z);
        if (vRijiLocalPosition.y < -0.368) discard;
        vec3 warmWhite = vec3(0.82, 0.785, 0.72);
        float fabricWeave = sin(vRijiLocalPosition.y * 310.0) * sin(vRijiLocalPosition.z * 290.0) * 0.002;
        vec3 fabricGrey = vec3(0.115 + fabricWeave, 0.108 + fabricWeave, 0.098 + fabricWeave);
        vec3 materialColor = mix(warmWhite, fabricGrey, rearMask);
        vec4 diffuseColor = vec4(materialColor, opacity);`,
      )
      .replace(
        'float roughnessFactor = roughness;',
        'float roughnessFactor = mix(0.68, 0.94, rearMask);',
      )
      .replace(
        'float metalnessFactor = metalness;',
        'float metalnessFactor = 0.0;',
      );
  };
  material.customProgramCacheKey = () => 'riji-body-material-v3';
  return material;
}

function disposeSourceMaterial(material: THREE.Material) {
  if (material instanceof THREE.MeshStandardMaterial) {
    material.map?.dispose();
    material.normalMap?.dispose();
    material.roughnessMap?.dispose();
    material.metalnessMap?.dispose();
  }
  material.dispose();
}

function makeScreenTexture(url: string, onReady: () => void) {
  const canvas = document.createElement('canvas');
  canvas.width = 1296;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (!context) return { texture, draw: (_share: RijiShare | null) => undefined };

  let currentShare: RijiShare | null = null;
  let sourceImage: HTMLImageElement | null = null;
  const draw = (share: RijiShare | null) => {
    currentShare = share;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!share) {
      texture.needsUpdate = true;
      onReady();
      return;
    }

    context.fillStyle = '#f4f3ee';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#1c211d';
    context.font = '600 54px "Microsoft YaHei", sans-serif';
    context.fillText('日迹', 70, 86);
    context.fillStyle = '#7b7a70';
    context.font = '28px "Microsoft YaHei", sans-serif';
    context.textAlign = 'right';
    context.fillText(`${share.date}  ${share.time}`, 1220, 80);
    context.textAlign = 'left';
    context.fillStyle = '#d6c8ab';
    context.fillRect(70, 118, 1156, 2);

    const photoX = 70;
    const photoY = 164;
    const photoWidth = 650;
    const photoHeight = 480;
    context.fillStyle = '#ddd6c8';
    context.fillRect(photoX, photoY, photoWidth, photoHeight);
    if (sourceImage) {
      const scale = Math.max(photoWidth / sourceImage.naturalWidth, photoHeight / sourceImage.naturalHeight);
      const width = sourceImage.naturalWidth * scale;
      const height = sourceImage.naturalHeight * scale;
      context.save();
      context.beginPath();
      context.rect(photoX, photoY, photoWidth, photoHeight);
      context.clip();
      context.drawImage(sourceImage, photoX + (photoWidth - width) / 2, photoY + (photoHeight - height) / 2, width, height);
      context.restore();
    }

    context.fillStyle = '#1c211d';
    context.font = '600 42px "Microsoft YaHei", sans-serif';
    context.fillText(share.title, 772, 236, 440);
    context.fillStyle = '#68685f';
    context.font = '30px "Microsoft YaHei", sans-serif';
    context.font = '28px "Microsoft YaHei", sans-serif';
    const messageLines = share.message.length > 18
      ? [share.message.slice(0, 18), share.message.slice(18, 36)]
      : [share.message];
    messageLines.forEach((line, index) => context.fillText(line, 772, 308 + index * 48, 440));
    context.fillStyle = '#8c7658';
    context.font = '28px "Microsoft YaHei", sans-serif';
    context.fillText(`来自 ${share.sender}`, 772, 608, 440);
    texture.needsUpdate = true;
    onReady();
  };

  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    sourceImage = image;
    draw(currentShare);
  };
  image.src = url;
  return { texture, draw };
}

export default function RijiModelViewer({ modelUrl, photoUrl, fallbackImage, share, printRequest, resetSignal, onTakePhoto }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [phase, setPhase] = useState('正在准备日迹模型…');

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !window.WebGLRenderingContext) {
      setFailed(true);
      setPhase('当前设备无法显示3D模型');
      return undefined;
    }

    let disposed = false;
    let frame = 0;
    let drawerFrame = 0;
    let drawerAnimating = false;
    let drawerIsOpen = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(27, 1, 0.05, 40);
    const defaultCamera = new THREE.Vector3(1.75, 0.62, 3.25);
    camera.position.copy(defaultCamera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.67;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.2 : 1.65));
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight('#fffdf5', '#6d685f', 0.86));
    const key = new THREE.DirectionalLight('#fff8e8', 1.58);
    key.position.set(3, 4.2, 4.6);
    scene.add(key);
    const warm = new THREE.PointLight('#d98555', 0.4, 6);
    warm.position.set(-1.5, 0.5, 2.2);
    scene.add(warm);

    const assembly = new THREE.Group();
    scene.add(assembly);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 1.8;
    controls.maxDistance = 6;
    controls.target.set(0, 0, 0);

    const photo = new THREE.Group();
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.235),
      new THREE.MeshStandardMaterial({ color: '#f6efe0', roughness: 0.92, side: THREE.DoubleSide }),
    );
    const texture = makePhotoTexture(photoUrl, () => renderer.render(scene, camera));
    const picture = new THREE.Mesh(
      new THREE.PlaneGeometry(0.305, 0.198),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    );
    picture.position.z = 0.002;
    photo.add(paper, picture);
    photo.position.set(0.22, -0.12, 0.16);
    photo.visible = false;
    assembly.add(photo);

    const repairedBase = new THREE.Mesh(
      new RoundedBoxGeometry(0.724, 0.072, 0.61, 5, 0.026),
      makeWarmShellMaterial(),
    );
    repairedBase.position.set(-0.0015, -0.375, -0.012);
    const drawerMaterial = new THREE.MeshPhysicalMaterial({
      color: '#827e77',
      roughness: 0.56,
      metalness: 0.3,
      clearcoat: 0.04,
      clearcoatRoughness: 0.75,
      side: THREE.DoubleSide,
    });
    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(0, -0.328, 0.334);
    const drawerFace = new THREE.Mesh(
      makeDrawerFaceGeometry(0.64, 0.072, 0.012),
      drawerMaterial,
    );
    const drawerTray = new THREE.Mesh(
      new RoundedBoxGeometry(0.59, 0.05, 0.42, 4, 0.018),
      new THREE.MeshPhysicalMaterial({ color: '#716d66', roughness: 0.66, metalness: 0.18 }),
    );
    drawerTray.position.set(0, -0.005, -0.19);
    drawerGroup.add(drawerTray, drawerFace);
    assembly.add(repairedBase, drawerGroup);

    const screenTexture = makeScreenTexture(photoUrl, () => renderer.render(scene, camera));
    const screenAssembly = new THREE.Group();
    screenAssembly.position.set(0, 0.139, 0.126);
    screenAssembly.rotation.x = -0.29;
    const screenBezel = new THREE.Mesh(
      makeRoundedPlane(0.578, 0.338, 0.018),
      new THREE.MeshStandardMaterial({ color: '#c8c6bf', roughness: 0.58, metalness: 0.08 }),
    );
    const screenOff = new THREE.Mesh(
      makeRoundedPlane(0.548, 0.306, 0.012),
      new THREE.MeshPhysicalMaterial({ color: '#d9dad6', roughness: 0.42, metalness: 0, clearcoat: 0.18, clearcoatRoughness: 0.55 }),
    );
    screenOff.position.z = 0.0013;
    const screenContent = new THREE.Mesh(
      makeRoundedPlane(0.542, 0.3, 0.01),
      new THREE.MeshBasicMaterial({ map: screenTexture.texture, transparent: true, side: THREE.DoubleSide, toneMapped: false }),
    );
    screenContent.position.z = 0.0023;
    screenContent.visible = false;
    screenAssembly.add(screenBezel, screenOff, screenContent);
    assembly.add(screenAssembly);

    const render = () => { if (!disposed) renderer.render(scene, camera); };
    controls.addEventListener('change', render);

    const setDrawer = (open: boolean) => {
      if (drawerAnimating || open === drawerIsOpen) return;
      cancelAnimationFrame(drawerFrame);
      const startZ = drawerGroup.position.z;
      const endZ = open ? 0.624 : 0.334;
      const finish = () => {
        drawerGroup.position.z = endZ;
        drawerAnimating = false;
        drawerIsOpen = open;
        setDrawerOpen(open);
        setPhase(open ? '抽屉已打开 · 点击抽屉或按钮合上' : '抽屉已合上 · 点击底部抽屉打开');
        render();
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finish();
        return;
      }
      drawerAnimating = true;
      const start = performance.now();
      const tick = (time: number) => {
        const progress = clamp01((time - start) / 520);
        drawerGroup.position.z = THREE.MathUtils.lerp(startZ, endZ, easeInOut(progress));
        render();
        if (progress < 1) drawerFrame = requestAnimationFrame(tick);
        else finish();
      };
      drawerFrame = requestAnimationFrame(tick);
    };

    const toggleDrawer = () => setDrawer(!drawerIsOpen);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerStart: { x: number; y: number } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!pointerStart || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) {
        pointerStart = null;
        return;
      }
      pointerStart = null;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObjects([drawerFace, drawerTray], false).length) toggleDrawer();
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const reset = () => {
      cancelAnimationFrame(frame);
      photo.position.x = 0.22;
      photo.visible = false;
      setPhase('拖动旋转 · 点击抽屉开合 · 等待打印');
      render();
    };

    const setShare = (nextShare: RijiShare | null) => {
      screenTexture.draw(nextShare);
      screenContent.visible = Boolean(nextShare);
      render();
    };

    const print = () => {
      cancelAnimationFrame(frame);
      photo.visible = true;
      photo.position.x = 0.22;
      setPhase('正在从机身右侧打印照片…');
      const start = performance.now();
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        photo.position.x = 0.51;
        setPhase('照片已打印 · 可旋转模型查看');
        render();
        return;
      }
      const tick = (time: number) => {
        const progress = clamp01((time - start) / 2200);
        photo.position.x = THREE.MathUtils.lerp(0.22, 0.51, easeInOut(progress));
        render();
        if (progress < 1) frame = requestAnimationFrame(tick);
        else setPhase('照片已打印 · 可旋转模型查看');
      };
      frame = requestAnimationFrame(tick);
    };

    const restoreView = () => {
      camera.position.copy(defaultCamera);
      controls.target.set(0, 0, 0);
      controls.update();
      render();
    };

    const rotateView = (azimuth: number, polar: number) => {
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      spherical.theta += azimuth;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + polar, 0.3, Math.PI - 0.3);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      controls.update();
    };

    runtimeRef.current = { print, setShare, reset, restoreView, rotateView, toggleDrawer, dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(drawerFrame);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      texture.dispose();
      screenTexture.texture.dispose();
      renderer.dispose();
    } };

    new GLTFLoader().load(modelUrl, (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const bodyMaterial = makeRijiBodyMaterial();
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(disposeSourceMaterial);
        object.geometry.computeVertexNormals();
        object.material = bodyMaterial;
      });
      assembly.add(model);
      setLoaded(true);
      setPhase('拖动旋转 · 点击抽屉开合 · 等待打印');
      controls.update();
      render();
    }, (event) => {
      if (event.total) setPhase(`正在加载模型 ${Math.round(event.loaded / event.total * 100)}%`);
    }, () => {
      setFailed(true);
      setPhase('模型加载失败，双端原型仍可使用');
    });

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    return () => {
      observer.disconnect();
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
  }, [modelUrl, photoUrl]);

  useEffect(() => {
    if (loaded && printRequest) {
      runtimeRef.current?.setShare(printRequest.share);
      runtimeRef.current?.print();
    }
  }, [loaded, printRequest]);

  useEffect(() => {
    if (loaded) runtimeRef.current?.setShare(share);
  }, [loaded, share]);

  useEffect(() => {
    if (loaded) runtimeRef.current?.reset();
  }, [loaded, resetSignal]);

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!runtimeRef.current) return;
    if (event.key === 'Home') { event.preventDefault(); runtimeRef.current.restoreView(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); runtimeRef.current.rotateView(-0.12, 0); }
    if (event.key === 'ArrowRight') { event.preventDefault(); runtimeRef.current.rotateView(0.12, 0); }
    if (event.key === 'ArrowUp') { event.preventDefault(); runtimeRef.current.rotateView(0, -0.1); }
    if (event.key === 'ArrowDown') { event.preventDefault(); runtimeRef.current.rotateView(0, 0.1); }
  };

  if (failed) return <div className="riji-model-fallback" role="status"><img src={fallbackImage} alt="日迹家庭照片分享终端渲染图" /><p>{phase}</p></div>;

  return (
    <div className="riji-viewer-shell">
      <div ref={hostRef} className="riji-model-canvas" tabIndex={0} onKeyDown={handleKeyboard} aria-label="日迹三维模型。拖动或方向键旋转，滚轮或双指缩放，点击底部抽屉开合，按Home恢复视角。" />
      <div className="riji-viewer-status" role="status" aria-live="polite"><span className={loaded ? 'is-ready' : ''} aria-hidden="true" />{phase}</div>
      <div className="riji-viewer-actions">
        <button type="button" onClick={() => runtimeRef.current?.restoreView()}>恢复视角</button>
        <button type="button" disabled={!loaded} aria-pressed={drawerOpen} onClick={() => runtimeRef.current?.toggleDrawer()}>{drawerOpen ? '合上抽屉' : '打开抽屉'}</button>
        <button type="button" onClick={() => { runtimeRef.current?.reset(); onTakePhoto(); }}>取走照片</button>
      </div>
    </div>
  );
}
