import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js';

type ClearSenseModelViewerProps = {
  modelUrl: string;
  libraryPath: string;
  fallbackImage: string;
};

type SizedMesh = {
  mesh: THREE.Mesh;
  volume: number;
};

type ProductState = 'docked' | 'lifted' | 'returning';

const colors = {
  pearl: 0xe1e2e0,
  warmWhite: 0xd4d5d1,
  recess: 0x8fa8ae,
  seam: 0x313b3d,
  ice: 0xbfeaff,
  forest: 0x173e35,
  sky: 0xd9eef4,
};

export default function ClearSenseModelViewer({ modelUrl, libraryPath, fallbackImage }: ClearSenseModelViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const applySeparationRef = useRef<((distance: number) => void) | null>(null);
  const adjustSeparationRef = useRef<((percentageDelta: number) => void) | null>(null);
  const returnProductRef = useRef<(() => void) | null>(null);
  const interactionEnabledRef = useRef(true);
  const loadedRef = useRef(false);
  const [status, setStatus] = useState('准备加载产品模型…');
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [separation, setSeparation] = useState(0);
  const [productState, setProductState] = useState<ProductState>('docked');
  const [interactionEnabled, setInteractionEnabled] = useState(() => (
    typeof window === 'undefined' || !window.matchMedia('(pointer: coarse)').matches
  ));

  useEffect(() => {
    interactionEnabledRef.current = interactionEnabled;
    if (controlsRef.current) controlsRef.current.enabled = interactionEnabled;
    const canvas = hostRef.current?.querySelector('canvas');
    if (canvas) canvas.style.touchAction = interactionEnabled ? 'none' : 'pan-y';
  }, [interactionEnabled, loaded]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !window.WebGLRenderingContext) {
      setFailed(true);
      setStatus('当前浏览器无法显示3D模型');
      return;
    }

    let disposed = false;
    let frame = 0;
    let returnFrame = 0;
    let isVisible = true;
    let environmentTarget: THREE.WebGLRenderTarget | null = null;
    let shadowPlane: THREE.Mesh | null = null;
    let movableMeshes: THREE.Mesh[] = [];
    let movableGroup: THREE.Group | null = null;
    let rotationPivot: THREE.Group | null = null;
    let maxSeparation = 1;
    let collisionClearance = 0;
    let dockedProductBottomY = 0;
    let safetyReferenceReady = false;
    let currentSeparation = 0;
    let productStateValue: ProductState = 'docked';
    let productYaw = 0;
    let productPitch = 0;

    const updateProductState = (nextState: ProductState) => {
      productStateValue = nextState;
      host.dataset.productState = nextState;
      setProductState(nextState);
    };
    updateProductState('docked');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.84;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    environmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.72;
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.autoRotate = false;
    controlsRef.current = controls;

    scene.add(new THREE.HemisphereLight(0xf8fbfa, colors.forest, 1.15));
    const keyLight = new THREE.DirectionalLight(0xfff9ee, 2.15);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.00015;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(colors.sky, 1.05);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(colors.ice, 0.9);
    scene.add(rimLight);

    const render = () => renderer.render(scene, camera);
    renderRef.current = render;

    const animate = () => {
      if (disposed || !isVisible) return;
      controls.update();
      render();
      frame = window.requestAnimationFrame(animate);
    };

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      window.cancelAnimationFrame(frame);
      if (isVisible) animate();
    }, { threshold: 0.05 });
    visibilityObserver.observe(host);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const hitMovableProduct = (event: PointerEvent) => {
      if (!movableMeshes.length) return false;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(movableMeshes, false).length > 0;
    };

    const applySeparation = (distance: number) => {
      if (!movableGroup) return;
      currentSeparation = THREE.MathUtils.clamp(distance, 0, maxSeparation);
      movableGroup.position.z = currentSeparation;
      const percentage = Math.round((currentSeparation / maxSeparation) * 100);
      setSeparation(percentage);
      host.dataset.separation = String(percentage);
      render();
    };

    const getMinimumSafeSeparation = () => {
      if (!movableGroup || !rotationPivot || !safetyReferenceReady || !movableMeshes.length) return 0;
      scene.updateMatrixWorld(true);
      const productBounds = new THREE.Box3();
      movableMeshes.forEach((mesh) => productBounds.expandByObject(mesh));
      if (productBounds.isEmpty()) return 0;
      const safeDistance = THREE.MathUtils.clamp(
        currentSeparation + dockedProductBottomY + collisionClearance - productBounds.min.y,
        0,
        maxSeparation,
      );
      host.dataset.minimumSafeSeparation = String(Math.round((safeDistance / maxSeparation) * 100));
      return safeDistance;
    };

    const applySafeSeparation = (distance: number) => {
      const minimum = getMinimumSafeSeparation();
      applySeparation(THREE.MathUtils.clamp(distance, minimum, maxSeparation));
    };

    applySeparationRef.current = applySeparation;
    adjustSeparationRef.current = (percentageDelta) => {
      const nextDistance = THREE.MathUtils.clamp(
        currentSeparation + maxSeparation * (percentageDelta / 100),
        0,
        maxSeparation,
      );
      if (productStateValue === 'lifted' && nextDistance < currentSeparation) applySafeSeparation(nextDistance);
      else applySeparation(nextDistance);
      if (currentSeparation === 0) updateProductState('docked');
      else if (productStateValue === 'lifted' || currentSeparation >= maxSeparation * 0.15) updateProductState('lifted');
    };

    const drag: {
      active: boolean;
      pointerId: number;
      pointerType: string;
      mode: 'lift' | 'rotate' | 'height' | 'touch-pending' | 'touch-height' | 'touch-pinch' | null;
      startX: number;
      startY: number;
      startSeparation: number;
      startYaw: number;
      startPitch: number;
      startTouchCentroidY: number;
      startTouchDistance: number;
      startCameraDistance: number;
      touches: Map<number, { x: number; y: number }>;
      movedTouches: Set<number>;
    } = {
      active: false,
      pointerId: -1,
      pointerType: '',
      mode: null,
      startX: 0,
      startY: 0,
      startSeparation: 0,
      startYaw: 0,
      startPitch: 0,
      startTouchCentroidY: 0,
      startTouchDistance: 0,
      startCameraDistance: 0,
      touches: new Map(),
      movedTouches: new Set(),
    };

    const getTouchMetrics = () => {
      const touches = [...drag.touches.values()];
      if (touches.length < 2) return null;
      const [first, second] = touches;
      return {
        centroidY: (first.y + second.y) / 2,
        distance: Math.hypot(first.x - second.x, first.y - second.y),
      };
    };

    const beginTwoFingerGesture = () => {
      const metrics = getTouchMetrics();
      if (!metrics) return;
      drag.mode = 'touch-pending';
      drag.startTouchCentroidY = metrics.centroidY;
      drag.startTouchDistance = Math.max(metrics.distance, 1);
      drag.startSeparation = currentSeparation;
      drag.startCameraDistance = camera.position.distanceTo(controls.target);
      drag.movedTouches.clear();
      host.dataset.gestureMode = 'touch-pending';
      host.classList.remove('is-rotating-product');
      host.classList.add('is-lifting-product');
    };

    const applyTouchZoom = (touchDistance: number) => {
      const nextDistance = THREE.MathUtils.clamp(
        drag.startCameraDistance * (drag.startTouchDistance / Math.max(touchDistance, 1)),
        controls.minDistance,
        controls.maxDistance,
      );
      const offset = camera.position.clone().sub(controls.target).normalize().multiplyScalar(nextDistance);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      host.dataset.cameraDistance = nextDistance.toFixed(4);
      render();
    };

    const applyProductRotation = (yaw: number, pitch: number) => {
      if (!rotationPivot) return;
      productYaw = yaw;
      productPitch = THREE.MathUtils.clamp(pitch, -THREE.MathUtils.degToRad(75), THREE.MathUtils.degToRad(75));
      rotationPivot.rotation.set(productPitch, 0, productYaw);
      host.dataset.productYaw = productYaw.toFixed(4);
      host.dataset.productPitch = productPitch.toFixed(4);
      if (productStateValue === 'lifted') {
        const minimum = getMinimumSafeSeparation();
        if (currentSeparation < minimum) applySeparation(minimum);
      }
      render();
    };

    const onPointerDown = (event: PointerEvent) => {
      const addingSecondTouch = drag.active
        && drag.pointerType === 'touch'
        && event.pointerType === 'touch'
        && productStateValue === 'lifted'
        && drag.touches.size === 1;
      if (
        !interactionEnabledRef.current
        || !loadedRef.current
        || productStateValue === 'returning'
        || (!addingSecondTouch && !hitMovableProduct(event))
      ) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      if (addingSecondTouch) {
        drag.touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        renderer.domElement.setPointerCapture?.(event.pointerId);
        beginTwoFingerGesture();
        return;
      }

      drag.active = true;
      drag.pointerId = event.pointerId;
      drag.pointerType = event.pointerType;
      drag.mode = productStateValue === 'lifted'
        ? event.shiftKey ? 'height' : 'rotate'
        : 'lift';
      drag.startX = event.clientX;
      drag.startY = event.clientY;
      drag.startSeparation = currentSeparation;
      drag.startYaw = productYaw;
      drag.startPitch = productPitch;
      drag.touches.clear();
      if (event.pointerType === 'touch') {
        drag.touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }
      controls.enabled = false;
      host.dataset.gestureMode = drag.mode;
      host.classList.add(drag.mode === 'rotate' ? 'is-rotating-product' : 'is-lifting-product');
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!interactionEnabledRef.current || !loadedRef.current) return;
      if (!drag.active) {
        host.classList.toggle('is-over-product', hitMovableProduct(event));
        return;
      }
      if (event.pointerType === 'touch' && drag.touches.has(event.pointerId)) {
        drag.touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
        drag.movedTouches.add(event.pointerId);
      }

      if (drag.touches.size >= 2 && drag.mode?.startsWith('touch-')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const metrics = getTouchMetrics();
        if (!metrics) return;
        const centroidDelta = metrics.centroidY - drag.startTouchCentroidY;
        const distanceDelta = metrics.distance - drag.startTouchDistance;
        const pinchThreshold = Math.max(10, drag.startTouchDistance * 0.06);

        if (drag.mode === 'touch-pending') {
          if (drag.movedTouches.size < 2) return;
          if (Math.abs(distanceDelta) >= pinchThreshold) drag.mode = 'touch-pinch';
          else if (Math.abs(centroidDelta) >= 8) drag.mode = 'touch-height';
          host.dataset.gestureMode = drag.mode;
        }

        if (drag.mode === 'touch-pinch') {
          applyTouchZoom(metrics.distance);
        } else if (drag.mode === 'touch-height') {
          const dragScale = maxSeparation / Math.max(host.clientHeight * 0.46, 1);
          applySafeSeparation(drag.startSeparation - centroidDelta * dragScale);
        }
        return;
      }

      if (event.pointerId !== drag.pointerId || drag.touches.size > 1) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (drag.mode === 'rotate') {
        const yaw = drag.startYaw + (event.clientX - drag.startX) * 0.012;
        const pitch = drag.startPitch + (event.clientY - drag.startY) * 0.009;
        applyProductRotation(yaw, pitch);
      } else if (drag.mode === 'height') {
        const dragScale = maxSeparation / Math.max(host.clientHeight * 0.46, 1);
        applySafeSeparation(drag.startSeparation + (drag.startY - event.clientY) * dragScale);
      } else {
        const dragScale = maxSeparation / Math.max(host.clientHeight * 0.32, 1);
        applySeparation(drag.startSeparation + (drag.startY - event.clientY) * dragScale);
      }
    };

    const finishDrag = (event: PointerEvent) => {
      if (!drag.active) return;
      if (drag.touches.has(event.pointerId)) drag.touches.delete(event.pointerId);
      if (renderer.domElement.hasPointerCapture?.(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }

      if (drag.mode?.startsWith('touch-')) {
        if (drag.touches.size > 0) return;
        drag.active = false;
        drag.pointerId = -1;
        drag.pointerType = '';
        drag.mode = null;
        drag.movedTouches.clear();
        host.dataset.gestureMode = 'idle';
        host.classList.remove('is-lifting-product');
        host.classList.remove('is-rotating-product');
        controls.enabled = interactionEnabledRef.current;
        return;
      }

      if (event.pointerId !== drag.pointerId) return;
      if (drag.mode === 'lift') {
        if (currentSeparation < maxSeparation * 0.15) {
          applySeparation(0);
          updateProductState('docked');
        } else {
          updateProductState('lifted');
        }
      }
      drag.active = false;
      drag.pointerId = -1;
      drag.pointerType = '';
      drag.mode = null;
      drag.touches.clear();
      drag.movedTouches.clear();
      host.dataset.gestureMode = 'idle';
      host.classList.remove('is-lifting-product');
      host.classList.remove('is-rotating-product');
      controls.enabled = interactionEnabledRef.current;
    };

    const onPointerLeave = (event: PointerEvent) => {
      host.classList.remove('is-over-product');
      if (drag.active && event.pointerType !== 'touch') finishDrag(event);
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown, true);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', finishDrag);
    canvas.addEventListener('pointercancel', finishDrag);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const returnProduct = () => {
      if (!movableGroup || !rotationPivot || currentSeparation === 0 || productStateValue === 'returning') return;
      window.cancelAnimationFrame(returnFrame);
      updateProductState('returning');
      controls.enabled = false;

      const finishReturn = () => {
        if (!rotationPivot) return;
        rotationPivot.rotation.set(0, 0, 0);
        productYaw = 0;
        productPitch = 0;
        host.dataset.productYaw = '0';
        host.dataset.productPitch = '0';
        applySeparation(0);
        updateProductState('docked');
        controls.enabled = interactionEnabledRef.current;
        render();
      };

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finishReturn();
        return;
      }

      const startedAt = performance.now();
      const startSeparation = currentSeparation;
      const startQuaternion = rotationPivot.quaternion.clone();
      const identityQuaternion = new THREE.Quaternion();
      const rotateDuration = 320;
      const lowerDuration = 420;
      const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

      const tick = (time: number) => {
        if (disposed || !rotationPivot) return;
        const elapsed = time - startedAt;
        if (elapsed <= rotateDuration) {
          const progressValue = easeOutCubic(THREE.MathUtils.clamp(elapsed / rotateDuration, 0, 1));
          rotationPivot.quaternion.slerpQuaternions(startQuaternion, identityQuaternion, progressValue);
        } else {
          rotationPivot.quaternion.copy(identityQuaternion);
          const lowerProgress = easeOutCubic(THREE.MathUtils.clamp((elapsed - rotateDuration) / lowerDuration, 0, 1));
          applySeparation(startSeparation * (1 - lowerProgress));
        }
        render();

        if (elapsed < rotateDuration + lowerDuration) {
          returnFrame = window.requestAnimationFrame(tick);
        } else {
          finishReturn();
        }
      };
      returnFrame = window.requestAnimationFrame(tick);
    };
    returnProductRef.current = returnProduct;

    const pearlMaterial = new THREE.MeshPhysicalMaterial({
      color: colors.pearl,
      metalness: 0.02,
      roughness: 0.27,
      clearcoat: 0.58,
      clearcoatRoughness: 0.24,
      sheen: 0.16,
      sheenColor: new THREE.Color(colors.ice),
      envMapIntensity: 0.9,
    });
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: colors.warmWhite,
      metalness: 0,
      roughness: 0.34,
      clearcoat: 0.42,
      clearcoatRoughness: 0.31,
      envMapIntensity: 0.82,
    });
    const recessMaterial = new THREE.MeshPhysicalMaterial({
      color: colors.recess,
      metalness: 0.03,
      roughness: 0.36,
      clearcoat: 0.24,
      envMapIntensity: 0.86,
    });
    const detailMaterial = new THREE.MeshPhysicalMaterial({
      color: colors.seam,
      metalness: 0.08,
      roughness: 0.3,
      envMapIntensity: 0.9,
    });
    const lightMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdff7ff,
      emissive: colors.ice,
      emissiveIntensity: 3.6,
      roughness: 0.18,
      toneMapped: false,
    });

    const loader = new Rhino3dmLoader();
    loader.setLibraryPath(libraryPath);
    loader.load(
      modelUrl,
      (rhinoObject) => {
        if (disposed) return;
        const meshes: THREE.Mesh[] = [];
        rhinoObject.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.computeBoundingBox();
            meshes.push(child);
          }
        });

        const mainAssembly = meshes.filter((mesh) => {
          const center = mesh.geometry.boundingBox?.getCenter(new THREE.Vector3());
          const size = mesh.geometry.boundingBox?.getSize(new THREE.Vector3());
          if (!center || !size) return false;
          const isReferencePlane = Math.min(size.x, size.y, size.z) < 0.02;
          return !isReferencePlane && center.x > -80 && center.x < 80 && center.y > -60 && center.y < 110;
        });
        const visibleMeshes = mainAssembly.length >= 6 ? mainAssembly : meshes.filter((mesh) => {
          const size = mesh.geometry.boundingBox?.getSize(new THREE.Vector3());
          return size && Math.min(size.x, size.y, size.z) >= 0.02;
        });
        meshes.forEach((mesh) => {
          if (!visibleMeshes.includes(mesh)) mesh.removeFromParent();
        });

        const sizedParts: SizedMesh[] = visibleMeshes.map((mesh) => {
          const size = mesh.geometry.boundingBox?.getSize(new THREE.Vector3()) ?? new THREE.Vector3(1, 1, 1);
          return { mesh, volume: Math.max(size.x * size.y * size.z, 0.001) };
        }).sort((a, b) => b.volume - a.volume);
        const baseParts = sizedParts.slice(0, 2);
        const upperParts = sizedParts.slice(2);
        movableMeshes = upperParts.map(({ mesh }) => mesh);

        baseParts.forEach(({ mesh }, index) => {
          mesh.material = index === 0 ? baseMaterial : recessMaterial;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });
        const smallestUpperVolume = Math.min(...upperParts.map(({ volume }) => volume));
        upperParts.forEach(({ mesh, volume }, index) => {
          const isSmallDetail = volume <= smallestUpperVolume * 1.05;
          mesh.material = isSmallDetail ? lightMaterial : (index === upperParts.length - 1 ? detailMaterial : pearlMaterial);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });

        const upperBounds = new THREE.Box3();
        upperParts.forEach(({ mesh }) => upperBounds.expandByObject(mesh));
        const pivotWorldPosition = upperBounds.getCenter(new THREE.Vector3());

        movableGroup = new THREE.Group();
        movableGroup.name = 'ClearSense upper product lift';
        rhinoObject.add(movableGroup);
        rhinoObject.updateMatrixWorld(true);

        rotationPivot = new THREE.Group();
        rotationPivot.name = 'ClearSense upper product rotation pivot';
        rotationPivot.position.copy(rhinoObject.worldToLocal(pivotWorldPosition.clone()));
        movableGroup.add(rotationPivot);
        rhinoObject.updateMatrixWorld(true);
        movableMeshes.forEach((mesh) => rotationPivot?.attach(mesh));

        const orientedModel = new THREE.Group();
        orientedModel.rotation.x = -Math.PI / 2;
        orientedModel.add(rhinoObject);
        scene.add(orientedModel);
        orientedModel.updateMatrixWorld(true);

        const initialBox = new THREE.Box3().setFromObject(orientedModel);
        const center = initialBox.getCenter(new THREE.Vector3());
        const size = initialBox.getSize(new THREE.Vector3());
        orientedModel.position.sub(center);
        orientedModel.updateMatrixWorld(true);

        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        maxSeparation = maxDimension * 0.46;
        collisionClearance = maxDimension * 0.012;
        const dockedProductBounds = new THREE.Box3();
        movableMeshes.forEach((mesh) => dockedProductBounds.expandByObject(mesh));
        dockedProductBottomY = dockedProductBounds.min.y;
        safetyReferenceReady = !dockedProductBounds.isEmpty();
        keyLight.position.set(maxDimension * 1.8, maxDimension * 2.6, maxDimension * 1.6);
        fillLight.position.set(-maxDimension * 1.8, maxDimension * 0.9, -maxDimension * 1.2);
        rimLight.position.set(-maxDimension * 0.3, maxDimension * 2, maxDimension * 1.8);
        const shadowExtent = maxDimension * 1.8;
        keyLight.shadow.camera.left = -shadowExtent;
        keyLight.shadow.camera.right = shadowExtent;
        keyLight.shadow.camera.top = shadowExtent;
        keyLight.shadow.camera.bottom = -shadowExtent;
        keyLight.shadow.camera.near = maxDimension * 0.1;
        keyLight.shadow.camera.far = maxDimension * 8;

        shadowPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(maxDimension * 5, maxDimension * 5),
          new THREE.ShadowMaterial({ color: colors.forest, opacity: 0.17 }),
        );
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -size.y / 2 - maxDimension * 0.015;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);

        camera.position.set(maxDimension * 1.38, maxDimension * 0.88, maxDimension * 1.52);
        camera.near = Math.max(maxDimension / 1000, 0.01);
        camera.far = maxDimension * 20;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.minDistance = maxDimension * 0.72;
        controls.maxDistance = maxDimension * 4.5;
        controls.update();
        controls.saveState();
        host.dataset.cameraDistance = camera.position.distanceTo(controls.target).toFixed(4);

        host.dataset.upperParts = String(movableMeshes.length);
        host.dataset.baseParts = String(baseParts.length);
        loadedRef.current = true;
        host.dataset.productYaw = '0';
        host.dataset.productPitch = '0';
        host.dataset.minimumSafeSeparation = '0';
        host.dataset.gestureMode = 'idle';
        setLoaded(true);
        setProgress(100);
        setStatus('模型已载入');
        applySeparation(0);
        render();
      },
      (event) => {
        if (!event.total) return;
        const nextProgress = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setProgress(nextProgress);
        setStatus(`正在载入模型 ${nextProgress}%`);
      },
      (error) => {
        console.error('ClearSense 3D model failed to load', error);
        setFailed(true);
        setStatus('模型暂时无法载入，已显示静态产品图');
      },
    );

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(returnFrame);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown, true);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', finishDrag);
      canvas.removeEventListener('pointercancel', finishDrag);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      controls.dispose();
      loader.dispose();
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material.dispose());
        }
      });
      environmentTarget?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      controlsRef.current = null;
      renderRef.current = null;
      applySeparationRef.current = null;
      adjustSeparationRef.current = null;
      returnProductRef.current = null;
      loadedRef.current = false;
    };
  }, [libraryPath, modelUrl]);

  const closeProduct = () => returnProductRef.current?.();
  const resetView = () => {
    controlsRef.current?.reset();
    renderRef.current?.();
  };
  const handleModelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!loaded) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      adjustSeparationRef.current?.(10);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      adjustSeparationRef.current?.(-10);
    } else if (event.key === 'Home') {
      event.preventDefault();
      closeProduct();
    }
  };

  return (
    <div className="model-viewer-shell standalone-model-viewer">
      <div className="model-canvas-wrap" aria-busy={!loaded && !failed}>
        <div
          className="model-canvas"
          ref={hostRef}
          role="group"
          tabIndex={loaded ? 0 : -1}
          aria-label="ClearSense可交互3D模型。拖住上方产品将它从底座提起，松手后再次拖动产品可独立旋转；手机双指同向上下移动、电脑按住Shift拖动可调整产品高度；拖动空白区域旋转整套模型，Home键合上。"
          onKeyDown={handleModelKeyDown}
        />
        {!loaded && !failed && (
          <div className="model-loading" role="status" aria-live="polite">
            <span>{status}</span>
            <div><i style={{ transform: `scaleX(${Math.max(progress, 4) / 100})` }} /></div>
          </div>
        )}
        {failed && (
          <figure className="model-fallback">
            <img src={fallbackImage} alt="ClearSense产品静态渲染图" />
            <figcaption>{status}</figcaption>
          </figure>
        )}
        {loaded && !interactionEnabled && (
          <button className="model-enable" type="button" onClick={() => setInteractionEnabled(true)}>
            点击操作3D模型
          </button>
        )}
        {loaded && (
          <span className="model-hint">
            {interactionEnabled
              ? productState === 'lifted'
                ? '拖动产品自由旋转 · 手机在产品上双指上下 / 电脑 Shift+拖动升降 · 拖动空白旋转整套模型'
                : productState === 'returning'
                  ? '正在恢复产品角度并合回底座'
                  : '拖住上方产品拿起 · 松手后解锁自由旋转与安全升降 · 拖动空白旋转'
              : '页面滚动保持开启'}
          </span>
        )}
      </div>

      <div className="model-controls" aria-label="3D模型控制">
        <div className="separation-status" aria-live="polite">
          <span>产品与底座</span>
          <strong>{separation === 0 ? '已合上' : `已分开 ${separation}%`}</strong>
        </div>
        <div className="model-control-buttons">
          <button
            type="button"
            disabled={!loaded || separation === 0 || productState === 'returning'}
            onClick={closeProduct}
          >
            合回底座
          </button>
          <button type="button" disabled={!loaded} onClick={resetView}>复位视角</button>
        </div>
        {loaded && <span className="part-count">1 个上方整机 · 1 个底座</span>}
      </div>
    </div>
  );
}
