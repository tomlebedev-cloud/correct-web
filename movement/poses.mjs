// Original, illustrative joint paths. Units are metres; +Z is forward.
// IDs, rather than body regions, determine which movement is shown.
export const movementIds = [
  'ath-squat',
  'ath-lunge',
  'ath-side-lunge',
  'ath-march',
  'ath-shoulder-roll',
  'ath-heel-dig',
  'neck-turn',
  'neck-tilt',
  'wrist-flex',
  'forearm-turn',
  'wrist-side',
  'seated-turn',
  'seated-march',
  'ankle-flex',
  'shoulder-roll',
  'wall-slide',
  'wall-press',
  'side-bend',
  'chest-open',
  'side-leg',
  'hip-extension',
  'sit-stand',
  'mini-squat',
  'heel-dig',
  'calf-raise',
  'calf-stretch',
  'quad-stretch',
  'hamstring-stretch',
  'glute-stretch',
  'lib-goblet-squat',
  'lib-reverse-lunge',
  'lib-rdl',
  'lib-row',
  'lib-press',
  'lib-curl',
  'lib-push-up',
  'lib-bridge',
  'lib-bird-dog',
  'lib-dead-bug',
  'lib-plank',
  'lib-side-plank',
];
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, k) => a.map((v) => v * k);
const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const len = (a) => Math.hypot(...a);
const norm = (a) => mul(a, 1 / (len(a) || 1));
export function jointBetween(a, b, lengthA, lengthB, bend = [0, 0, 1]) {
  const delta = sub(b, a),
    distance = Math.max(0.001, len(delta));
  const direction = norm(delta);
  const d = Math.min(distance, lengthA + lengthB - 0.001);
  const along = (lengthA ** 2 - lengthB ** 2 + d ** 2) / (2 * d);
  let perpendicular = sub(bend, mul(direction, dot(bend, direction)));
  if (len(perpendicular) < 0.001) perpendicular = sub([1, 0, 0], mul(direction, direction[0]));
  return add(
    add(a, mul(direction, along)),
    mul(norm(perpendicular), Math.sqrt(Math.max(0, lengthA ** 2 - along ** 2))),
  );
}

export function getPose(id, seconds = 0) {
  if (!movementIds.includes(id)) return null;
  const phase = (((seconds % 8) + 8) % 8) / 4;
  const side = phase < 1 ? 1 : -1;
  const u = phase % 1;
  const d = Math.sin(Math.PI * u) ** 2;
  const wave = Math.sin((seconds * Math.PI) / 4);
  const p = {
    hip: [0, 0.96, 0],
    shoulder: [0, 1.46, 0],
    leftFoot: [0.16, 0.09, 0],
    rightFoot: [-0.16, 0.09, 0],
    leftHand: [0.28, 0.9, 0.04],
    rightHand: [-0.28, 0.9, 0.04],
    headTurn: 0,
    headTilt: 0,
    wrist: 0,
    wristSide: 0,
    forearm: 0,
    chair: false,
    wall: false,
    weights: false,
    floor: false,
    phase: d < 0.15 ? 'Start position' : u < 0.5 ? 'Move with control' : 'Return with control',
  };
  const hips = (y, z = 0, x = 0, lean = 0) => {
    p.hip = [x, y, z];
    p.shoulder = [x, y + Math.sqrt(0.25 - lean * lean), z + lean];
  };
  const handsForward = (y, z, width = 0.23) => {
    p.leftHand = [width, y, z];
    p.rightHand = [-width, y, z];
  };
  const seated = [
    'seated-turn',
    'seated-march',
    'ankle-flex',
    'shoulder-roll',
    'chest-open',
    'neck-turn',
    'neck-tilt',
    'wrist-flex',
    'forearm-turn',
    'wrist-side',
  ].includes(id);
  if (seated) {
    hips(0.54, -0.22);
    p.leftFoot = [0.16, 0.09, 0.32];
    p.rightFoot = [-0.16, 0.09, 0.32];
    handsForward(0.6, 0.12);
    p.chair = true;
  }
  if (['ath-squat', 'mini-squat', 'lib-goblet-squat', 'sit-stand'].includes(id)) {
    const depth = id === 'mini-squat' ? 0.18 : 0.37;
    hips(0.96 - depth * d, -0.24 * d, 0, 0.18 * d);
    handsForward(1.28 - depth * d, 0.35 - 0.16 * d);
    p.leftFoot[0] = 0.21;
    p.rightFoot[0] = -0.21;
    if (id === 'sit-stand') p.chair = true;
    if (id === 'mini-squat') {
      p.support = true;
      handsForward(1.04, 0.55);
    }
    if (id === 'lib-goblet-squat') {
      p.weights = 'goblet';
      handsForward(p.shoulder[1] - 0.06, p.shoulder[2] + 0.2, 0.1);
    }
  } else if (['ath-lunge', 'lib-reverse-lunge'].includes(id)) {
    const forward = id === 'ath-lunge';
    const lead = side > 0 ? 'leftFoot' : 'rightFoot';
    p[lead][2] = (forward ? 0.69 : -0.69) * d;
    const rear = forward ? (side > 0 ? 'rightFoot' : 'leftFoot') : lead;
    p[rear][1] += 0.07 * d;
    p.toeLift = { side: forward ? -side : side, amount: -0.6 * d };
    // Keep the pelvis between planted feet; lower as the stride lengthens.
    hips(0.96 - 0.27 * d, (forward ? 0.26 : -0.24) * d, 0, 0.04 * d);
    handsForward(p.shoulder[1] - 0.15, p.shoulder[2] + 0.26, 0.15);
    p.phase = `${side > 0 ? 'Left' : 'Right'} leg · ${u < 0.5 ? 'step and lower' : 'return to standing'}`;
  } else if (id === 'ath-side-lunge') {
    p[side > 0 ? 'leftFoot' : 'rightFoot'][0] = side * (0.16 + 0.5 * d);
    hips(0.96 - 0.27 * d, -0.13 * d, side * 0.43 * d, 0.1 * d);
    handsForward(p.shoulder[1] - 0.13, 0.3, 0.13);
  } else if (['ath-march', 'seated-march'].includes(id)) {
    const leg = side > 0 ? 'leftFoot' : 'rightFoot';
    p[leg][1] += 0.25 * d;
    p[leg][2] += 0.1 * d;
    if (!seated) {
      p.leftHand = [0.25, 1.03, 0.12 - side * 0.2 * d];
      p.rightHand = [-0.25, 1.03, 0.12 + side * 0.2 * d];
    }
  } else if (['heel-dig', 'ath-heel-dig'].includes(id)) {
    p[side > 0 ? 'leftFoot' : 'rightFoot'][2] = 0.4 * d;
    p.toeLift = { side, amount: 0.35 * d };
    hips(0.96 - 0.045 * d, -0.02 * d);
  } else if (id === 'neck-turn') p.headTurn = 0.65 * wave;
  else if (id === 'neck-tilt') p.headTilt = 0.23 * wave;
  else if (['wrist-flex', 'wrist-side', 'forearm-turn'].includes(id)) {
    handsForward(0.91, 0.28);
    p[id === 'wrist-flex' ? 'wrist' : id === 'wrist-side' ? 'wristSide' : 'forearm'] = wave * 0.6;
  } else if (['shoulder-roll', 'ath-shoulder-roll'].includes(id)) {
    p.shrug = 0.03 * Math.sin((seconds * Math.PI) / 2);
    p.shoulderRoll = 0.025 * Math.cos((seconds * Math.PI) / 2);
  } else if (id === 'seated-turn') {
    p.twist = wave * 0.35;
    handsForward(0.88, 0.23);
  } else if (id === 'ankle-flex') p.toeLift = { side: 0, amount: 0.35 * wave };
  else if (id === 'wall-slide') {
    p.wall = true;
    p.leftHand = [0.23, 1.43 + 0.43 * d, 0.25];
    p.rightHand = [-0.27, 0.91, 0.05];
  } else if (id === 'wall-press') {
    p.wall = true;
    hips(0.96, 0.12 * d, 0, 0.13 * d);
    handsForward(1.43, 0.55, 0.25);
  } else if (id === 'side-bend') {
    p.shoulder[0] = 0.13 * wave;
    p.shoulder[1] -= 0.03 * Math.abs(wave);
    p.leftHand[1] -= 0.08 * wave;
    p.rightHand[1] += 0.08 * wave;
  } else if (id === 'chest-open') handsForward(0.88, -0.32 - 0.1 * d, 0.24);
  else if (['side-leg', 'hip-extension'].includes(id)) {
    p.support = true;
    handsForward(1.08, 0.52);
    const foot = p[side > 0 ? 'leftFoot' : 'rightFoot'];
    if (id === 'side-leg') {
      foot[0] += side * 0.3 * d;
      foot[1] += 0.1 * d;
    } else {
      foot[2] -= 0.32 * d;
      foot[1] += 0.1 * d;
    }
  } else if (id === 'calf-raise') {
    p.support = true;
    hips(0.96 + 0.05 * d);
    handsForward(1.08, 0.52);
    p.leftFoot[1] += 0.05 * d;
    p.rightFoot[1] += 0.05 * d;
    p.toeLift = { side: 0, amount: -0.5 * d };
  } else if (id === 'calf-stretch') {
    p.wall = true;
    p.leftFoot[2] = 0.2;
    p.rightFoot[2] = -0.4;
    hips(0.86, 0.01, 0, 0.09);
    handsForward(1.33, 0.55);
    p.phase = 'Hold gently · repeat on the other side';
  } else if (id === 'quad-stretch') {
    p.support = true;
    p.rightHand = [-0.23, 1.08, 0.52];
    p.leftFoot = [0.16, 0.55, -0.35];
    p.leftHand = [0.16, 0.6, -0.36];
    p.leftKnee = [0.14, 0.52, 0];
    p.phase = 'Hold gently · repeat on the other side';
  } else if (['lib-rdl', 'lib-row'].includes(id)) {
    const tilt = id === 'lib-row' ? 0.8 : 0.9 * d;
    hips(0.94 - 0.1 * tilt, -0.2 * tilt, 0, 0.42 * tilt);
    p.weights = true;
    handsForward(
      p.shoulder[1] - 0.53 + (id === 'lib-row' ? 0.3 * d : 0),
      p.shoulder[2] + 0.02 - (id === 'lib-row' ? 0.16 * d : 0),
      0.24,
    );
  } else if (id === 'lib-press') {
    p.weights = true;
    handsForward(1.5 + 0.46 * d, 0.06, 0.33 - 0.12 * d);
  } else if (id === 'lib-curl') {
    p.weights = true;
    handsForward(0.96 + 0.4 * d, 0.05 + 0.2 * Math.sin((Math.PI * d) / 2), 0.28);
  }

  // Floor work uses its own body orientation, not an upright motion approximation.
  if (['lib-bridge', 'lib-dead-bug', 'hamstring-stretch', 'glute-stretch'].includes(id)) {
    p.floor = true;
    p.hip = [0, 0.17, 0];
    p.shoulder = [0, 0.17, -0.49];
    p.leftFoot = [0.16, 0.09, 0.53];
    p.rightFoot = [-0.16, 0.09, 0.53];
    p.leftHand = [0.29, 0.11, -0.06];
    p.rightHand = [-0.29, 0.11, -0.06];
    p.kneeBend = [0, 1, 0];
    if (id === 'lib-bridge') p.hip[1] += 0.25 * d;
    if (id === 'lib-dead-bug') {
      p.leftFoot = [0.16, 0.55, 0.45];
      p.rightFoot = [-0.16, 0.55, 0.45];
      p.leftHand = [0.22, 0.72, -0.46];
      p.rightHand = [-0.22, 0.72, -0.46];
      const foot = side > 0 ? 'leftFoot' : 'rightFoot',
        hand = side > 0 ? 'rightHand' : 'leftHand';
      p[foot][1] -= 0.38 * d;
      p[foot][2] += 0.32 * d;
      p[hand][1] -= 0.41 * d;
      p[hand][2] -= 0.46 * d;
    }
    if (id === 'hamstring-stretch') {
      p.leftFoot = [0.14, 0.91, 0.15];
      p.leftHand = [0.13, 0.47, 0.07];
      p.rightHand = [0.03, 0.45, 0.05];
      p.phase = 'Hold gently · repeat on the other side';
    }
    if (id === 'glute-stretch') {
      p.leftFoot = [0.16, 0.58, -0.15];
      p.leftHand = [0.16, 0.56, -0.18];
      p.rightHand = [0.04, 0.55, -0.16];
      p.phase = 'Hold gently · repeat on the other side';
    }
  }
  if (['lib-push-up', 'lib-plank', 'lib-bird-dog'].includes(id)) {
    p.floor = true;
    const height = id === 'lib-push-up' ? 0.56 - 0.18 * d : id === 'lib-plank' ? 0.35 : 0.6;
    p.hip = [0, height, -0.1];
    p.shoulder = [0, height, 0.4];
    p.leftFoot = [0.16, 0.09, -0.88];
    p.rightFoot = [-0.16, 0.09, -0.88];
    p.leftHand = [0.27, 0.1, 0.46];
    p.rightHand = [-0.27, 0.1, 0.46];
    p.kneeBend = [0, -1, 0];
    if (id === 'lib-plank') {
      p.leftElbow = [0.23, 0.1, 0.38];
      p.rightElbow = [-0.23, 0.1, 0.38];
      p.leftHand[2] = 0.66;
      p.rightHand[2] = 0.66;
      p.phase = 'Hold steady · keep breathing';
    }
    if (id === 'lib-bird-dog') {
      p.leftFoot = [0.16, 0.1, -0.67];
      p.rightFoot = [-0.16, 0.1, -0.67];
      p.leftKnee = [0.16, 0.1, -0.15];
      p.rightKnee = [-0.16, 0.1, -0.15];
      const leg = side > 0 ? 'left' : 'right',
        arm = side > 0 ? 'right' : 'left';
      p[`${leg}Foot`] = [side * 0.16, 0.1 + 0.5 * d, -0.67 - 0.24 * d];
      p[`${leg}Knee`] = [side * 0.16, 0.1 + 0.5 * d, -0.15 - 0.34 * d];
      p[`${arm}Hand`] = [-side * (0.27 - 0.04 * d), 0.1 + 0.5 * d, 0.46 + 0.52 * d];
    }
  }
  if (id === 'lib-side-plank') {
    p.floor = true;
    p.hip = [0, 0.34, -0.1];
    p.shoulder = [0, 0.52, 0.39];
    p.leftFoot = [0.04, 0.08, -0.89];
    p.rightFoot = [-0.04, 0.14, -0.89];
    p.leftHand = [0.28, 0.08, 0.51];
    p.rightHand = [-0.08, 0.57, -0.05];
    p.leftElbow = [0.03, 0.08, 0.35];
    p.roll = Math.PI / 2;
    p.phase = 'Hold steady · repeat on the other side';
  }

  const up = norm(sub(p.shoulder, p.hip));
  // A local side axis rotates around the trunk for seated rotation and side planks.
  const twist = p.twist || 0;
  const across = p.roll ? [0, -1, 0] : [Math.cos(twist), 0, -Math.sin(twist)];
  for (const [key, sign] of [
    ['left', 1],
    ['right', -1],
  ]) {
    p[`${key}Hip`] = add(p.hip, mul(across, sign * 0.14));
    p[`${key}Shoulder`] = add(add(p.shoulder, mul(across, sign * 0.22)), [
      0,
      p.shrug || 0,
      p.shoulderRoll || 0,
    ]);
    p[`${key}Knee`] ||= jointBetween(
      p[`${key}Hip`],
      p[`${key}Foot`],
      0.44,
      0.43,
      p.kneeBend || [0, 0, 1],
    );
    p[`${key}Elbow`] ||= jointBetween(p[`${key}Shoulder`], p[`${key}Hand`], 0.29, 0.28, [
      sign * 0.6,
      -0.2,
      -0.4,
    ]);
  }
  p.neck = add(p.shoulder, mul(up, 0.1));
  p.head = add(p.shoulder, mul(up, 0.25));
  if (['lib-bridge', 'lib-dead-bug', 'hamstring-stretch', 'glute-stretch'].includes(id)) {
    p.neck = [0, 0.17, -0.57];
    p.head = [0, 0.17, -0.72];
  }
  return p;
}
