import type { ChildSnapshot } from './guwen-master-child-snapshot';

// 2026-07-27：九篇完成唯一格式欄位映射後建立。
// 遷移時另以非標題文字逐行比對證明內容未改；之後真正教材修訂須另案更新並接受審核。
export const GUWEN_CHILD_BASELINE: Record<string, ChildSnapshot> = {
  'lessons/01-guwen-wangrong-rewrite.md': { questionCount: 20, hash: '68c4cfe87d6c7f1775281cec4f00b3a86354f2433959b26a88e9451b26f1ec94' },
  '02-guwen-simaguang-decoder-content.md': { questionCount: 18, hash: '3eea7a17cf42e04e7fc31739839d0cbe28f26aa8e7a3d4d3eea5ee12283dd452' },
  '03-guwen-kezhouqiujian-decoder-content.md': { questionCount: 37, hash: '5d558646528870f925ffd9b436aa6d86380e3e41f526c53ae6271ded04b88562' },
  '04-guwen-shouzhudaitu-decoder-content.md': { questionCount: 18, hash: '2ea6e2e9212b017d085af0a637c9d8972658c12744870caaf578cb30b73bfc1b' },
  '05-guwen-yamiaozhuzhang-decoder-content.md': { questionCount: 9, hash: '6b76a8f58a94afd8f0a7dd14674ce6436316dedfe31d53d52de14f078ba310c8' },
  '06-guwen-yanerdaozhong-decoder-content.md': { questionCount: 21, hash: 'a46ab6b5a40db9b5d6adee0782f966d25920ce5001c591951e93ef093cfce8ba' },
  '07-guwen-zhengrenmailv-decoder-content.md': { questionCount: 20, hash: '0cf1fddd3a30acbf34265a38e179dc140d210d9c25700224369e85e5b261c5d0' },
  '08-guwen-changganrucheng-decoder-content.md': { questionCount: 7, hash: 'ad700f20a8ca58d43be324eee620148fda6a3fc053b8bdfe9d9eb8ad49b3ed7a' },
  '09-guwen-yangshizi-decoder-content.md': { questionCount: 9, hash: '132f7d0ac1343c60f2586012909e5576a103bde250e8e00ab16398793ca80733' },
};
