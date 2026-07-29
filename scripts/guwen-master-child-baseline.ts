import type { ChildSnapshot } from './guwen-master-child-snapshot';

// 2026-07-27：九篇完成唯一格式欄位映射後建立。
// 遷移時另以非標題文字逐行比對證明內容未改；之後真正教材修訂須另案更新並接受審核。
// 2026-07-28：成人預覽解析器修正混合一般段落／引用段落的詳解漏抓問題；教材 MD 未改，
// 重新建立第 1–8 篇解析指紋，讓完整詳解納入後續孩子端文字保護。
// 2026-07-28：《刻舟求劍》第 4–8 題簡化修訂稿與第 13 題新線索版經使用者核准，
// 同步更新第三篇孩子端保護指紋。
// 2026-07-28：《刻舟求劍》第 19、20 題經使用者核准，第三篇新版全文完成，
// 同步更新第三篇孩子端保護指紋。
// 2026-07-28：《揠苗助長》第 3 題線索白話經使用者修訂，第 7、8 題核准；
// 同步更新第五篇孩子端保護指紋。
// 2026-07-28：《揠苗助長》第 9 題經使用者核准，新增第 10–12 題草稿；
// 同步更新第五篇孩子端保護指紋。
// 2026-07-28：《揠苗助長》第 10–11 題經使用者核准，重寫第 12 題並新增第 13–14 題草稿；
// 同步更新第五篇孩子端保護指紋。
// 2026-07-28：《揠苗助長》第 12–14 題經使用者核准，新增第 15–17 題草稿；
// 同步更新第五篇孩子端保護指紋。
// 2026-07-28：《掩耳盜鐘》第 1–2 題經使用者核准，新增第 3–5 題精簡草稿；
// 同步更新第六篇孩子端保護指紋。
// 2026-07-28：《掩耳盜鐘》第 3–4 題經使用者核准，重寫第 5 題並新增第 6–7 題精簡草稿；
// 同步更新第六篇孩子端保護指紋。
// 2026-07-28：《掩耳盜鐘》第 5、7 題經使用者核准，重寫第 8–9 題精簡草稿；
// 同步更新第六篇孩子端保護指紋。
// 2026-07-29：《掩耳盜鐘》第 9 題經使用者核准，第 8 題保留完整真實古文線索，
// 並重寫第 10–12 題精簡草稿；同步更新第六篇孩子端保護指紋。
// 2026-07-29：《掩耳盜鐘》第 8、10、12 題經使用者核准，第 11 題重寫線索，
// 並依整句揭露規則補寫第 5 題核心解答；同步更新第六篇孩子端保護指紋。
// 2026-07-28：《鄭人買履》第 1–2 題依實測回饋精簡重寫，並依新版規則移除主檔讀音註解；
// 同步更新第七篇孩子端保護指紋。
// 2026-07-29：《揠苗助長》全篇依新版去重規則精簡引導語、提問與核心解答；
// 同步更新第五篇孩子端保護指紋。
export const GUWEN_CHILD_BASELINE: Record<string, ChildSnapshot> = {
  'lessons/01-guwen-wangrong-rewrite.md': { questionCount: 20, hash: 'dd46c4423110b7b6b4dd21dfe04f37fdbd76f517c5c21af1c2ecf676cb2cdca4' },
  '02-guwen-simaguang-decoder-content.md': { questionCount: 18, hash: '27d5c4b77cb2a13889aa12105043c4ca776f36488bf34d49426131bda64718ba' },
  '03-guwen-kezhouqiujian-decoder-content.md': { questionCount: 20, hash: 'b5f8e7b39b13a2b24a9b9a415831b567cf2777256f53ac3025ab65f0854ce666' },
  '04-guwen-shouzhudaitu-decoder-content.md': { questionCount: 18, hash: 'a8bb260c9673f078fa0a1ba81960c03446e86bc3d4e8fd1ab22fd628f462cbb9' },
  '05-guwen-yamiaozhuzhang-decoder-content.md': { questionCount: 17, hash: 'baf5311ba6642c79b2727c95d1b1b712ce71d58d9a9a7ab25514a23b46c7495d' },
  '06-guwen-yanerdaozhong-decoder-content.md': { questionCount: 21, hash: '5b2b0670ba5b23c590c826ba7270cdcf114157366913b0629687601b5a0374a3' },
  '07-guwen-zhengrenmailv-decoder-content.md': { questionCount: 20, hash: '67c76642ea46a1478c0ac2181766a7ff76bada9daf5b6c3a896b032c6e5da4cb' },
  '08-guwen-changganrucheng-decoder-content.md': { questionCount: 10, hash: 'dee88ceb5412ef79b01d747cd07c4c94f463decdffce809abf9e2087732b734a' },
  '09-guwen-yangshizi-decoder-content.md': { questionCount: 9, hash: '132f7d0ac1343c60f2586012909e5576a103bde250e8e00ab16398793ca80733' },
};
