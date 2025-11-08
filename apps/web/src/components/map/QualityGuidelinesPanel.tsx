import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

/**
 * QualityGuidelinesPanel
 *
 * Purpose: Provide inline guidance for creating high-quality place entries
 * Use case: Help users understand what makes a good place entry
 *
 * Features:
 * - Display tips and best practices
 * - Show good vs bad examples
 * - Collapsible details to save space
 * - Rate limit information
 */
export function QualityGuidelinesPanel() {
  const [showExamples, setShowExamples] = useState(false);

  return (
    <div className="quality-guidelines bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-2">
        <Sparkles size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-3">
            장소 추가 가이드
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                정확한 이름을 입력하세요 (예: "스타벅스 강남역점")
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>전체 주소를 입력하세요 (도로명 주소 권장)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>카테고리를 선택하면 검색에 도움이 됩니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>부적절한 내용은 자동 검토됩니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>하루에 5개까지 추가 가능합니다 (인증 사용자: 10개)</span>
            </li>
          </ul>

          {/* Examples Toggle */}
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center gap-1 mt-3 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
          >
            {showExamples ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
            <span>{showExamples ? '예시 숨기기' : '예시 보기'}</span>
          </button>

          {/* Examples */}
          {showExamples && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="font-medium text-green-900 mb-1">
                  ✅ 좋은 예
                </div>
                <div className="text-green-800 space-y-1">
                  <p>• 이름: "홍대 주차타워 근처 카페 라운지"</p>
                  <p>• 주소: "서울시 마포구 양화로 160 3층"</p>
                  <p>• 카테고리: "카페"</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="font-medium text-red-900 mb-1">
                  ❌ 나쁜 예
                </div>
                <div className="text-red-800 space-y-1">
                  <p>• 이름: "카페" (너무 일반적)</p>
                  <p>• 주소: "홍대" (불완전)</p>
                  <p>• 이름: "좋은 곳", "모르겠음" (의미 없음)</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
