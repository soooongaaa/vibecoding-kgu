// 스테이지 정의. 새 왁뿌를 추가하려면 이 배열에 객체 하나만 밀어넣으면 된다.
//
// gesture : 'tap'    - 손가락 끝 타건 (피크 감지)
//           'fist'   - 주먹 쥐기 (armed 플래그)
//           'squish' - 손 벌렸다 오므리기
// sound   : audio.js 의 신스 이름
// target  : 몇 번 뿌셔야 클리어인지. 스테이지마다 일부러 다르게 뒀다.

export const STAGES = [
  {
    id: 'butter',
    name: '버터 왁스',
    nameEn: 'Salted Butter',
    theme: '#ffd76b',
    themeDeep: '#e0a020',
    bg: ['#fff6d8', '#ffe1a8'],
    gesture: 'tap',
    sound: 'butter',
    target: 12,
    hint: '손가락으로 톡톡 두드려보세요',
    shape: 'block',
    cheers: ['야르~', '뭉근', '보들', '와우!!', '말랑'],
  },
  {
    id: 'honey',
    name: '벌꿀 키보드',
    nameEn: 'Honey Keyboard',
    theme: '#ffb63d',
    themeDeep: '#c97b12',
    bg: ['#fff0d0', '#ffd089'],
    gesture: 'tap',
    sound: 'honey',
    target: 18,
    hint: '키를 하나씩 두드려보세요',
    // 키보드는 왁스를 깨는 게 아니라 눌러보는 스테이지다.
    // 키캡이 부서지는 건 어울리지 않는다. 타건감만 보여준다.
    shape: 'keyboard',
    mode: 'press',
    cheers: ['톡!', '쫀득', '야호', 'WOW!!', '오독', '찰칵'],
  },
  {
    id: 'minto',
    name: '민초 왁뿌',
    nameEn: 'Mint Choco',
    theme: '#7fe6c8',
    themeDeep: '#1f9c7c',
    bg: ['#e6fff7', '#b6f0e0'],
    gesture: 'fist',
    sound: 'mintcrack',
    target: 9,
    hint: '주먹을 꽉 쥐어 깨뜨려보세요',
    shape: 'ball',
    cheers: ['콰작!', '빠직', '와우!!', '야르~', '쩍'],
  },
  {
    id: 'tanghulu',
    name: '딸기 탕후루',
    nameEn: 'Strawberry Tanghulu',
    theme: '#ff7aa8',
    themeDeep: '#d81f5c',
    bg: ['#ffeef4', '#ffc7db'],
    gesture: 'fist',
    sound: 'tanghulu',
    target: 7,
    hint: '주먹을 세게 쥐어 유리처럼 깨보세요',
    shape: 'ball',
    cheers: ['파삭!', '와장창', 'WOW!!', '야호', '짜릿'],
  },
  {
    id: 'cloud',
    name: '구름',
    nameEn: 'Fluffy Cloud',
    theme: '#8fd0ff',
    themeDeep: '#2a7fc4',
    bg: ['#eaf6ff', '#c2e2ff'],
    gesture: 'squish',
    sound: 'cloud',
    target: 10,
    hint: '손을 활짝 폈다가 오므려보세요',
    shape: 'cloud',
    cheers: ['스----', '포근', '야르~', '몰랑', '와우!!'],
  },
];

// 다섯 개를 다 깨면 투표하고, 뽑힌 왁뿌를 보너스로 한 번 더 만진다.
export const ALL_STAGES = STAGES;
