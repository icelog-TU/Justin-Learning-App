import type { ChildSnapshot } from './guwen-master-child-snapshot';

// 2026-07-27：九篇完成唯一格式欄位映射後建立。
// 遷移時另以非標題文字逐行比對證明內容未改；之後真正教材修訂須另案更新並接受審核。
// 2026-07-28：成人預覽解析器修正混合一般段落／引用段落的詳解漏抓問題；教材 MD 未改，
// 重新建立第 1–8 篇解析指紋，讓完整詳解納入後續孩子端文字保護。
export const GUWEN_CHILD_BASELINE: Record<string, ChildSnapshot> = {
  'lessons/01-guwen-wangrong-rewrite.md': { questionCount: 20, hash: 'dd46c4423110b7b6b4dd21dfe04f37fdbd76f517c5c21af1c2ecf676cb2cdca4' },
  '02-guwen-simaguang-decoder-content.md': { questionCount: 18, hash: '27d5c4b77cb2a13889aa12105043c4ca776f36488bf34d49426131bda64718ba' },
  '03-guwen-kezhouqiujian-decoder-content.md': { questionCount: 37, hash: 'fdb2373040bc0b4d774ff3c4597db0f10bef82e2a54a661406d7ac7787b24797' },
  '04-guwen-shouzhudaitu-decoder-content.md': { questionCount: 18, hash: 'a8bb260c9673f078fa0a1ba81960c03446e86bc3d4e8fd1ab22fd628f462cbb9' },
  '05-guwen-yamiaozhuzhang-decoder-content.md': { questionCount: 9, hash: 'c1325136cdb1946cede737053f5f91e5faf50a714319cfa0aa084f9db5710752' },
  '06-guwen-yanerdaozhong-decoder-content.md': { questionCount: 21, hash: 'c9f5d5324d80a7ad3cb32ba94d4bed9cc1d7979274602acf3a088e2a3172be11' },
  '07-guwen-zhengrenmailv-decoder-content.md': { questionCount: 20, hash: '20711633264aad9d4e1b3ba030dead8380df9bcebabcb0f1d8b3d9d71c3da850' },
  '08-guwen-changganrucheng-decoder-content.md': { questionCount: 10, hash: 'dee88ceb5412ef79b01d747cd07c4c94f463decdffce809abf9e2087732b734a' },
  '09-guwen-yangshizi-decoder-content.md': { questionCount: 9, hash: '132f7d0ac1343c60f2586012909e5576a103bde250e8e00ab16398793ca80733' },
};
