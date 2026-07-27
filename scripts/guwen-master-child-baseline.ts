import type { ChildSnapshot } from './guwen-master-child-snapshot';

// 2026-07-27：九篇格式遷移前，以當時預覽解析器可見的孩子端欄位建立。
// 格式整理不得改變這些內容；真正教材修訂須另案更新並接受審核。
export const GUWEN_CHILD_BASELINE: Record<string, ChildSnapshot> = {
  'lessons/01-guwen-wangrong-rewrite.md': { questionCount: 20, hash: 'd5d5be103d714b1023b65ed9af85549aaf5facfb97e0b045535905f1ec7bb833' },
  '02-guwen-simaguang-decoder-content.md': { questionCount: 18, hash: '3eea7a17cf42e04e7fc31739839d0cbe28f26aa8e7a3d4d3eea5ee12283dd452' },
  '03-guwen-kezhouqiujian-decoder-content.md': { questionCount: 37, hash: '063997e16aee461ee53d1be3673fa00e8297f32c0f16ffffae5c6851e570efff' },
  '04-guwen-shouzhudaitu-decoder-content.md': { questionCount: 18, hash: '2ea6e2e9212b017d085af0a637c9d8972658c12744870caaf578cb30b73bfc1b' },
  '05-guwen-yamiaozhuzhang-decoder-content.md': { questionCount: 9, hash: '6b76a8f58a94afd8f0a7dd14674ce6436316dedfe31d53d52de14f078ba310c8' },
  '06-guwen-yanerdaozhong-decoder-content.md': { questionCount: 21, hash: 'a46ab6b5a40db9b5d6adee0782f966d25920ce5001c591951e93ef093cfce8ba' },
  '07-guwen-zhengrenmailv-decoder-content.md': { questionCount: 20, hash: '0cf1fddd3a30acbf34265a38e179dc140d210d9c25700224369e85e5b261c5d0' },
  '08-guwen-changganrucheng-decoder-content.md': { questionCount: 7, hash: 'ad700f20a8ca58d43be324eee620148fda6a3fc053b8bdfe9d9eb8ad49b3ed7a' },
  '09-guwen-yangshizi-decoder-content.md': { questionCount: 9, hash: '132f7d0ac1343c60f2586012909e5576a103bde250e8e00ab16398793ca80733' },
};
