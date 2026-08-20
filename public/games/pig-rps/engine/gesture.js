// 손 모양 인식.
//
// MediaPipe GestureRecognizer 의 사전학습 모델을 쓴다.
// 우리가 쓰는 카테고리는 셋뿐이고 나머지는 전부 무시한다.
//
// 한 프레임만 보고 판정하면 반드시 오판한다. 손이 움직이는 중이거나
// 모션 블러가 끼면 Victory 가 한두 프레임씩 Closed_Fist 로 튄다.
// 그래서 판정 순간에 한 번 읽는 게 아니라 짧은 구간을 모아 최빈값을 쓴다.

const VISION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

// MediaPipe 카테고리 → 게임 손 모양
const HAND_MAP = {
  Closed_Fist: 'rock',
  Victory: 'scissors',
  Open_Palm: 'paper',
};

// 이 점수 밑이면 셌다고 치지 않는다. 애매한 손을 승패에 반영하면 게임이 망가진다.
const MIN_SCORE = 0.55;

export const SHAPES = {
  rock: { key: 'rock', name: '바위', emoji: '✊' },
  scissors: { key: 'scissors', name: '가위', emoji: '✌️' },
  paper: { key: 'paper', name: '보', emoji: '🖐️' },
};

export async function createRecognizer() {
  const vision = await import(`${VISION_CDN}/vision_bundle.mjs`);
  const fileset = await vision.FilesetResolver.forVisionTasks(`${VISION_CDN}/wasm`);
  return vision.GestureRecognizer.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });
}

// 한 프레임의 결과에서 손 모양 하나를 뽑는다. 못 읽으면 null.
export function readShape(result) {
  const top = result?.gestures?.[0]?.[0];
  if (!top) return null;
  const shape = HAND_MAP[top.categoryName];
  if (!shape) return null;
  if (top.score < MIN_SCORE) return null;
  return shape;
}

export function readLandmarks(result) {
  return result?.landmarks?.[0] || null;
}

// 판정 구간 동안 프레임을 모았다가 최빈값을 낸다.
export class ShapeVote {
  constructor({ minSamples = 6 } = {}) {
    this.minSamples = minSamples;
    this.counts = null;
    this.total = 0;
  }

  start() {
    this.counts = { rock: 0, scissors: 0, paper: 0 };
    this.total = 0;
  }

  push(shape) {
    if (!this.counts || !shape) return;
    this.counts[shape] += 1;
    this.total += 1;
  }

  // 표본이 너무 적으면 null. 이 경우 그 라운드는 다시 친다.
  result() {
    if (!this.counts || this.total < this.minSamples) return null;
    let best = null;
    let bestCount = 0;
    for (const key of Object.keys(this.counts)) {
      if (this.counts[key] > bestCount) {
        best = key;
        bestCount = this.counts[key];
      }
    }
    return best;
  }
}
