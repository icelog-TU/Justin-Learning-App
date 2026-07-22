import { useState } from 'react';
import { useAppDataContext } from '../lib/AppDataContext';

const STATUS_LABEL: Record<string, { icon: string; text: string; className: string }> = {
  idle: { icon: '⚪', text: '尚未連線', className: 'text-gray-500' },
  syncing: { icon: '🔄', text: '同步中…', className: 'text-blue-500' },
  synced: { icon: '☁️', text: '已同步到雲端', className: 'text-green-600' },
  offline: { icon: '📴', text: '目前離線，資料仍保存在本機', className: 'text-amber-600' },
  error: { icon: '⚠️', text: '同步失敗，請檢查網路連線', className: 'text-red-500' },
};

export default function SettingsPage() {
  const { syncCode, syncStatus, linkSyncCode } = useAppDataContext();
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  const status = STATUS_LABEL[syncStatus] ?? STATUS_LABEL.idle;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleLink = () => {
    const trimmed = inputCode.trim();
    if (!trimmed) return;
    linkSyncCode(trimmed);
    setInputCode('');
    setLinkMessage('已切換裝置代碼，正在從雲端抓取資料…');
    setTimeout(() => setLinkMessage(null), 4000);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">⚙️ 設定</h2>
        <p className="text-sm text-gray-500">管理雲端備份與多裝置同步</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 className="font-bold text-gray-800">☁️ 雲端備份狀態</h3>
        <p className={`text-sm font-semibold flex items-center gap-1.5 ${status.className}`}>
          <span>{status.icon}</span>
          <span>{status.text}</span>
        </p>
        <p className="text-xs text-gray-500">
          學習進度、金幣星星、角色收藏等資料會自動備份到雲端，換裝置或重灌瀏覽器時可以用下方的代碼救回來。
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 className="font-bold text-gray-800">📱 這台裝置的代碼</h3>
        <p className="text-xs text-gray-500">
          要讓另一台手機或平板同步同一份資料，把這組代碼輸入到那台裝置的「輸入代碼」欄位即可。
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-gray-800">
            {syncCode}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl px-4 py-3"
          >
            {copied ? '已複製 ✓' : '複製'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 className="font-bold text-gray-800">🔗 輸入代碼連結其他裝置</h3>
        <p className="text-xs text-gray-500">
          如果想把這台裝置換成使用另一台裝置的資料，在這裡輸入那台裝置的代碼即可（會覆蓋這台裝置目前顯示的代碼，並改抓那份雲端資料）。
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="例如 AB12-CD34"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <button
            type="button"
            onClick={handleLink}
            disabled={!inputCode.trim()}
            className="shrink-0 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold text-sm rounded-xl px-4 py-3"
          >
            連結
          </button>
        </div>
        {linkMessage && <p className="text-xs text-teal-600">{linkMessage}</p>}
      </div>
    </div>
  );
}
