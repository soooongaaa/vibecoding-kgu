// 손 인식 · 제스처 감지.
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │ 이 파일의 감지 로직은 함부로 바꾸지 말 것. 이유는 아래에 다 적어뒀다. │
// └─────────────────────────────────────────────────────────────────────┘
//
// 1) 타건은 "y좌표가 임계값 아래로" 방식이 아니라 피크 감지다.
//    손가락 끝이 아래로 빠르게 내려가다가 급정지하는 순간을 잡는다.
//    단순 임계값 방식으로 바꾸면 손 전체를 내릴 때 다섯 손가락이 동시에 터진다.
//
// 2) 주먹은 armed 플래그로 막는다.
//    손을 한 번 편 상태를 지나야 다시 발사된다.
//    이게 없으면 주먹 쥔 채 가만히 있어도 계속 소리가 난다.
//
// 3) 모든 거리는 palmSize 로 나눈다.
//    카메라와의 거리가 달라져도 똑같이 동작하게 하는 장치다.

// MediaPipe 손 랜드마크 인덱스
const WRIST = 0;
const MIDDLE_MCP = 9;
const TIPS = [4, 8, 12, 16, 20]; // 엄지 검지 중지 약지 새끼

// --- 타건(tap) 튜닝값 -----------------------------------------------------
const TAP_VEL_ON = 1.9;      // 하강 시작으로 볼 속도 (palm단위/초)
const TAP_DECEL = 0.42;      // 최고속도의 이 비율 밑으로 떨어지면 "급정지"
const TAP_MIN_TRAVEL = 0.10; // 하강 시작 후 이만큼은 실제로 내려와야 인정
const TAP_COOLDOWN = 130;    // 손가락별 재발사 금지 시간 (ms)
const THUMB_SCALE = 1.35;    // 엄지는 오탐이 잦아 문턱을 높인다

// --- 주먹(fist) 튜닝값 ----------------------------------------------------
const FIST_CLOSED = 1.15;    // 이보다 오므리면 쥔 것
const FIST_OPEN = 1.85;      // 이보다 펴면 다시 장전(armed)

// --- 스퀴시(squish) 튜닝값 ------------------------------------------------
const SQ_CLOSED = 1.15;
const SQ_OPEN = 2.00;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export class HandState {
  constructor() {
    // 손가락별 타건 추적 상태
    this.fingers = TIPS.map(() => ({
      prevY: null,
      descending: false,
      peakVel: 0,
      startY: 0,
      lastFire: 0,
    }));

    this.fistArmed = true;   // 주먹: 편 상태를 지나야 true
    this.squishArmed = true; // 스퀴시: 활짝 편 상태를 지나야 true

    this.prevT = null;
    this.present = false;
    this.landmarks = null;
    this.palmSize = 0;
    this.curl = 2;
    this.span = 2;
    this.center = { x: 0.5, y: 0.5 };
  }

  reset() {
    this.fingers.forEach((f) => {
      f.prevY = null;
      f.descending = false;
      f.peakVel = 0;
    });
    this.prevT = null;
    this.present = false;
    this.landmarks = null;
  }

  // landmarks: MediaPipe 정규화 좌표 배열(없으면 null), tMs: 밀리초 타임스탬프
  // 반환: 이번 프레임에 발생한 이벤트 배열
  update(landmarks, tMs) {
    const events = [];

    if (!landmarks || landmarks.length < 21) {
      this.reset();
      return events;
    }

    this.present = true;
    this.landmarks = landmarks;

    const wrist = landmarks[WRIST];
    const mcp = landmarks[MIDDLE_MCP];

    // (3) 손 크기 정규화 — 카메라 거리 보정의 기준
    const palmSize = dist(wrist, mcp);
    this.palmSize = palmSize;
    if (palmSize < 1e-4) return events;

    const dt = this.prevT === null ? 0 : (tMs - this.prevT) / 1000;
    this.prevT = tMs;

    this.center = { x: mcp.x, y: mcp.y };

    // ================= (1) 손가락 타건 : 피크 감지 =================
    //
    // 핵심은 손목 기준 상대 y 를 쓴다는 것.
    // 손 전체가 내려가면 (tip.y - wrist.y) 는 그대로라 속도가 0이다.
    // 즉 손을 통째로 내리는 동작으로는 절대 발사되지 않는다.
    // 손가락이 손바닥에 대해 접힐 때만 값이 움직인다.
    if (dt > 0 && dt < 0.2) {
      for (let i = 0; i < TIPS.length; i++) {
        const tip = landmarks[TIPS[i]];
        const st = this.fingers[i];

        const y = (tip.y - wrist.y) / palmSize; // 손목 기준, 손 크기로 나눔
        if (st.prevY === null) {
          st.prevY = y;
          continue;
        }

        const vel = (y - st.prevY) / dt; // + 가 아래 방향
        st.prevY = y;

        const scale = i === 0 ? THUMB_SCALE : 1;
        const velOn = TAP_VEL_ON * scale;
        const minTravel = TAP_MIN_TRAVEL * scale;

        if (!st.descending) {
          // 아래로 충분히 빠르게 움직이기 시작하면 추적 개시
          if (vel > velOn) {
            st.descending = true;
            st.peakVel = vel;
            st.startY = y;
          }
        } else {
          if (vel > st.peakVel) st.peakVel = vel;

          const travel = y - st.startY;
          const stopped = vel < st.peakVel * TAP_DECEL;

          if (stopped) {
            // 여기가 "급정지하는 순간". 이때만 소리가 난다.
            const enough = travel > minTravel;
            const cool = tMs - st.lastFire > TAP_COOLDOWN;
            if (enough && cool) {
              st.lastFire = tMs;
              events.push({
                type: 'tap',
                finger: i,
                strength: clamp01((st.peakVel - velOn) / 6),
                x: tip.x,
                y: tip.y,
              });
            }
            st.descending = false;
            st.peakVel = 0;
          } else if (vel < 0) {
            // 다시 올라가면 추적 취소
            st.descending = false;
            st.peakVel = 0;
          }
        }
      }
    }

    // ================= (2) 주먹 쥐기 : armed 플래그 =================
    //
    // 손가락 끝들이 손목에 얼마나 가까운지를 palmSize 로 나눠서 본다.
    const curl =
      [8, 12, 16, 20].reduce((sum, idx) => sum + dist(landmarks[idx], wrist), 0) /
      4 /
      palmSize;
    const prevCurl = this.curl;
    this.curl = curl;

    if (curl > FIST_OPEN) {
      // 손을 폈다 → 다시 장전
      this.fistArmed = true;
    } else if (curl < FIST_CLOSED && this.fistArmed) {
      // 장전된 상태에서 쥐었다 → 발사하고 장전 해제.
      // 쥔 채로 가만히 있어도 두 번은 안 나간다.
      this.fistArmed = false;
      const speed = Math.abs(prevCurl - curl) / Math.max(dt, 1 / 60);
      events.push({
        type: 'fist',
        strength: clamp01(0.35 + speed / 8),
        x: mcp.x,
        y: mcp.y,
      });
    }

    // ================= 스퀴시 : 벌렸다 오므리기 =================
    // 엄지끝 ↔ 새끼끝 사이 폭. 역시 palmSize 로 나눈다.
    const span = dist(landmarks[4], landmarks[20]) / palmSize;
    const prevSpan = this.span;
    this.span = span;

    if (span > SQ_OPEN) {
      this.squishArmed = true;
    } else if (span < SQ_CLOSED && this.squishArmed) {
      this.squishArmed = false;
      const speed = Math.abs(prevSpan - span) / Math.max(dt, 1 / 60);
      events.push({
        type: 'squish',
        strength: clamp01(0.3 + speed / 10),
        x: mcp.x,
        y: mcp.y,
      });
    }

    return events;
  }
}

// 왼손 오른손을 각각 따로 추적한다.
// 손마다 상태가 완전히 분리돼 있어야 한쪽 손의 armed 플래그가
// 다른 손 때문에 풀리는 일이 없다.
export class BothHands {
  constructor() {
    this.states = { Left: new HandState(), Right: new HandState() };
    this.active = [];
  }

  // result: MediaPipe detectForVideo 결과
  update(result, tMs) {
    const events = [];
    const seen = new Set();
    const active = [];

    const list = (result && result.landmarks) || [];
    for (let i = 0; i < list.length; i++) {
      // handedness 가 없거나 두 손이 같은 라벨로 나오면 남은 쪽에 배정한다
      let label = result.handedness?.[i]?.[0]?.categoryName;
      if (label !== 'Left' && label !== 'Right') label = i === 0 ? 'Right' : 'Left';
      if (seen.has(label)) label = label === 'Left' ? 'Right' : 'Left';
      if (seen.has(label)) continue;

      seen.add(label);
      const st = this.states[label];
      for (const ev of st.update(list[i], tMs)) {
        ev.hand = label;
        events.push(ev);
      }
      active.push(st);
    }

    // 사라진 손은 상태를 비워서 다음에 다시 잡혔을 때 오발사되지 않게 한다
    for (const key of ['Left', 'Right']) {
      if (!seen.has(key)) this.states[key].reset();
    }

    this.active = active;
    return events;
  }

  get count() { return this.active.length; }
  get all() { return [this.states.Left, this.states.Right]; }
}

// MediaPipe HandLandmarker 로딩
const VISION_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export async function createLandmarker() {
  const vision = await import(`${VISION_CDN}/vision_bundle.mjs`);
  const fileset = await vision.FilesetResolver.forVisionTasks(`${VISION_CDN}/wasm`);
  const landmarker = await vision.HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
  });
  return landmarker;
}

// 손 그릴 때 쓰는 뼈대 연결 정보
export const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
