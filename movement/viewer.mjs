import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { getPose } from './poses.mjs';

const params = new URLSearchParams(location.search);
const exerciseId = params.get('exercise') || '';
const compact = params.get('compact') === '1';
if (compact) document.body.classList.add('compact');
const stage = document.querySelector('#stage');
const initial = getPose(exerciseId, 1.2);
let renderer;
try {
  if (!initial) throw new Error('No movement model is available for this exercise.');
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (error) {
  stage.innerHTML =
    '<p id="error">The 3D preview is unavailable in this browser. Follow the written exercise instructions below.</p>';
  document.querySelector('#toolbar').hidden = true;
}
if (renderer) start();

function start() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, compact ? 1 : 1.8));
  renderer.shadowMap.enabled = !compact;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 30);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.3;
  controls.maxDistance = 6;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.enabled = !compact;
  const target = new THREE.Vector3(0, initial.floor ? 0.35 : 0.93, 0);
  const home = new THREE.Vector3(2.4, initial.floor ? 1.7 : 1.65, 3.6);
  const reset = () => {
    controls.target.copy(target);
    camera.position.copy(home);
    controls.update();
  };
  reset();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xa5afbe, 2.2));
  const key = new THREE.DirectionalLight(0xfff4e7, 3.0);
  key.position.set(3, 5, 4);
  key.castShadow = !compact;
  scene.add(key);
  key.shadow.mapSize.set(1024, 1024);
  const fill = new THREE.DirectionalLight(0xd5e2ff, 1.3);
  fill.position.set(-3, 3, -2);
  scene.add(fill);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 64),
    new THREE.MeshStandardMaterial({ color: 0xe3e9ee, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.015;
  floor.receiveShadow = true;
  scene.add(floor);
  const skin = new THREE.MeshStandardMaterial({ color: 0xb77f5b, roughness: 0.66 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x263f64, roughness: 0.86 });
  const shorts = new THREE.MeshStandardMaterial({ color: 0x343d4b, roughness: 0.95 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0xf2f1ed, roughness: 0.75 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x30251f, roughness: 1 });
  const metal = new THREE.MeshStandardMaterial({
    color: 0x374453,
    roughness: 0.55,
    metalness: 0.25,
  });
  const sphere = new THREE.SphereGeometry(1, compact ? 16 : 28, compact ? 12 : 20);
  const capsule = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.6, -0.5),
      new THREE.Vector2(0.82, -0.4),
      new THREE.Vector2(1, -0.22),
      new THREE.Vector2(0.92, 0.1),
      new THREE.Vector2(0.72, 0.36),
      new THREE.Vector2(0.6, 0.5),
    ],
    compact ? 16 : 28,
  );
  const torsoGeometry = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.145, 0),
      new THREE.Vector2(0.16, 0.07),
      new THREE.Vector2(0.155, 0.16),
      new THREE.Vector2(0.19, 0.3),
      new THREE.Vector2(0.215, 0.41),
      new THREE.Vector2(0.21, 0.46),
      new THREE.Vector2(0.115, 0.51),
      new THREE.Vector2(0.055, 0.52),
    ],
    32,
  );
  const meshes = {};
  const torsoMesh = shape('torso', shirt, torsoGeometry);
  const v = (a) => new THREE.Vector3(...a);
  function shape(name, material, geometry = sphere) {
    const m = new THREE.Mesh(geometry, material);
    m.castShadow = !compact;
    scene.add(m);
    meshes[name] = m;
    return m;
  }
  function ellipsoid(name, position, scale, material = skin) {
    const m = meshes[name] || shape(name, material);
    m.position.copy(v(position));
    m.scale.set(...scale);
    return m;
  }
  function limb(name, a, b, radius, material = skin) {
    const av = v(a),
      bv = v(b),
      direction = bv.clone().sub(av);
    const m = meshes[name] || shape(name, material, capsule);
    m.position.copy(av.add(bv).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    m.scale.set(radius, direction.length(), radius * 0.92);
  }
  const head = new THREE.Group();
  scene.add(head);
  const headPart = (material, xyz, scale) => {
    const m = new THREE.Mesh(sphere, material);
    m.position.set(...xyz);
    m.scale.set(...scale);
    head.add(m);
    return m;
  };
  headPart(skin, [0, 0, 0], [0.095, 0.125, 0.094]);
  headPart(skin, [0, -0.06, 0.017], [0.076, 0.06, 0.073]);
  headPart(hair, [0, 0.057, -0.016], [0.097, 0.076, 0.084]);
  headPart(skin, [0, -0.005, 0.095], [0.018, 0.025, 0.025]);
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.5 });
  for (const sign of [-1, 1]) {
    headPart(skin, [sign * 0.096, -0.005, 0], [0.015, 0.031, 0.02]);
    headPart(eyeWhite, [sign * 0.036, 0.018, 0.085], [0.018, 0.009, 0.006]);
    headPart(hair, [sign * 0.036, 0.018, 0.091], [0.007, 0.008, 0.003]);
    headPart(hair, [sign * 0.035, 0.036, 0.084], [0.026, 0.005, 0.006]);
  }
  headPart(
    new THREE.MeshStandardMaterial({ color: 0x87513e, roughness: 0.8 }),
    [0, -0.052, 0.084],
    [0.029, 0.004, 0.005],
  );

  // Compact previews use the same pose engine as the enlarged viewer.
  const chair = new THREE.Group();
  scene.add(chair);
  function box(parent, size, position, color) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
    );
    m.position.set(...position);
    parent.add(m);
    return m;
  }
  box(chair, [0.48, 0.06, 0.44], [0, 0.45, -0.24], 0x9ba8b7);
  box(chair, [0.46, 0.42, 0.05], [0, 0.71, -0.44], 0x9ba8b7);
  for (const x of [-0.2, 0.2])
    for (const z of [-0.42, -0.06]) box(chair, [0.035, 0.43, 0.035], [x, 0.215, z], 0x748393);
  const wall = box(scene, [1.1, 1.7, 0.025], [0, 0.84, 0.66], 0xd3dce5);
  wall.material.transparent = true;
  wall.material.opacity = 0.23;
  const support = new THREE.Group();
  scene.add(support);
  box(support, [0.7, 0.04, 0.04], [0, 1.06, 0.56], 0x8294a8);
  for (const x of [-0.3, 0.3]) box(support, [0.035, 1.06, 0.035], [x, 0.53, 0.56], 0x8294a8);
  const weights = [new THREE.Group(), new THREE.Group()];
  for (const weight of weights) {
    scene.add(weight);
    box(weight, [0.23, 0.025, 0.025], [0, 0, 0], 0x9ca5b0);
    for (const x of [-0.1, 0.1]) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 8), metal);
      plate.rotation.z = Math.PI / 2;
      plate.position.x = x;
      weight.add(plate);
    }
  }
  function renderPose(time) {
    const p = getPose(exerciseId, time);
    const up = v(p.shoulder).sub(v(p.hip)).normalize();
    const trunkQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    torsoMesh.position.copy(v(p.hip));
    torsoMesh.scale.set(1, 1, 0.62);
    torsoMesh.quaternion.copy(trunkQ);
    torsoMesh.rotateY(p.roll || 0);
    const waist = ellipsoid('waist', p.hip, [0.175, 0.12, 0.112], shorts);
    waist.quaternion.copy(trunkQ);
    waist.rotateY(p.roll || 0);
    limb('neck', p.shoulder, v(p.shoulder).addScaledVector(up, 0.18).toArray(), 0.055);
    head.position.copy(v(p.head));
    head.quaternion.copy(trunkQ);
    head.rotateY((p.roll || 0) + (p.twist || 0) + p.headTurn);
    head.rotateZ(p.headTilt);
    chair.visible = p.chair;
    wall.visible = p.wall;
    support.visible = !!p.support;
    for (const [i, side] of ['left', 'right'].entries()) {
      const shoulder = p[side + 'Shoulder'],
        elbow = p[side + 'Elbow'],
        hand = p[side + 'Hand'];
      const hip = p[side + 'Hip'],
        knee = p[side + 'Knee'],
        foot = p[side + 'Foot'];
      ellipsoid(side + 'deltoid', shoulder, [0.077, 0.08, 0.074], shirt);
      limb(side + 'upperArm', shoulder, elbow, 0.062);
      limb(side + 'forearm', elbow, hand, 0.044);
      ellipsoid(side + 'elbow', elbow, [0.043, 0.044, 0.041]);
      const palm = ellipsoid(side + 'palm', hand, [0.036, 0.065, 0.023]);
      palm.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        v(elbow).sub(v(hand)).normalize(),
      );
      palm.rotateX(p.wrist);
      palm.rotateZ(p.wristSide);
      palm.rotateY(p.forearm);
      limb(side + 'thigh', hip, knee, 0.087);
      const shortsEnd = v(hip).lerp(v(knee), 0.48).toArray();
      limb(side + 'shorts', hip, shortsEnd, 0.099, shorts);
      ellipsoid(side + 'knee', knee, [0.059, 0.062, 0.061]);
      limb(side + 'calf', knee, foot, 0.055);
      const shoeMesh = ellipsoid(
        side + 'shoe',
        [foot[0], foot[1] - 0.025, foot[2] + 0.055],
        [0.064, 0.045, 0.135],
        shoe,
      );
      shoeMesh.rotation.x = 0;
      if (p.toeLift && (p.toeLift.side === 0 || p.toeLift.side === (i === 0 ? 1 : -1)))
        shoeMesh.rotation.x = -p.toeLift.amount;
      weights[i].visible = !!p.weights && (p.weights !== 'goblet' || i === 0);
      weights[i].position.copy(v(hand));
      if (p.weights === 'goblet') weights[i].position.x = 0;
    }
    if (!compact) {
      document.querySelector('#phase').textContent = p.phase;
      document.querySelector('#progress').style.width = `${((time % 8) / 8) * 100}%`;
    }
  }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !compact && !reduceMotion.matches,
    time = 1.2,
    speed = 1,
    last = performance.now(),
    visible = true;
  const playButton = document.querySelector('#play');
  function updatePlay() {
    playButton.textContent = playing ? 'Pause' : 'Play';
    playButton.setAttribute('aria-label', playing ? 'Pause movement' : 'Play movement');
  }
  updatePlay();
  playButton.onclick = () => {
    playing = !playing;
    updatePlay();
  };
  document.querySelector('#speed').onchange = (e) => (speed = Number(e.target.value));
  document.querySelector('#scrub').oninput = (e) => {
    time = Number(e.target.value);
    playing = false;
    updatePlay();
  };
  document.querySelector('#reset').onclick = reset;
  document.querySelector('#restart').onclick = () => {
    time = 0;
    document.querySelector('#scrub').value = '0';
    playing = !reduceMotion.matches;
    updatePlay();
  };
  const fullscreenButton = document.querySelector('#fullscreen');
  const viewerStatus = document.querySelector('#viewer-status');
  if (!compact && document.fullscreenEnabled) {
    fullscreenButton.hidden = false;
    fullscreenButton.onclick = async () => {
      viewerStatus.hidden = true;
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        viewerStatus.textContent = 'Full screen is unavailable here. Use + to zoom in.';
        viewerStatus.hidden = false;
      }
    };
    document.addEventListener('fullscreenchange', () => {
      fullscreenButton.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
    });
  }
  document.querySelector('#front').onclick = () => {
    camera.position.set(0, target.y + 0.3, 4);
    controls.target.copy(target);
    controls.update();
  };
  document.querySelector('#side').onclick = () => {
    camera.position.set(4, target.y + 0.3, 0);
    controls.target.copy(target);
    controls.update();
  };
  function zoom(factor) {
    const delta = camera.position.clone().sub(controls.target);
    delta.setLength(THREE.MathUtils.clamp(delta.length() * factor, 1.3, 6));
    camera.position.copy(controls.target).add(delta);
    controls.update();
  }
  document.querySelector('#zoom-in').onclick = () => zoom(0.8);
  document.querySelector('#zoom-out').onclick = () => zoom(1.25);
  let compactRendered = false;
  if (!compact)
    new ResizeObserver(() => {
      const bottom = document.querySelector('#toolbar').offsetHeight;
      stage.style.bottom = `${bottom}px`;
      document.querySelector('#progress').style.bottom = `${bottom}px`;
    }).observe(document.querySelector('#toolbar'));
  new ResizeObserver(() => {
    const w = stage.clientWidth,
      h = stage.clientHeight;
    if (w && h) {
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      compactRendered = false;
    }
  }).observe(stage);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      playing = false;
      updatePlay();
    }
  });
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    document.querySelector('#phase').textContent =
      'Preview paused. Reopen the exercise to reload it.';
    playing = false;
    updatePlay();
  });
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible || document.hidden || (compact && compactRendered)) return;
    if (playing) {
      time += dt * speed;
      document.querySelector('#scrub').value = String(time % 8);
    }
    renderPose(time);
    controls.update();
    renderer.render(scene, camera);
    compactRendered = true;
  }
  requestAnimationFrame(frame);
}
