/**
 * 마크다운 텍스트를 HTML로 변환하는 유틸리티 함수
 * 
 * 지원하는 마크다운 구문:
 * - 헤더 (# ## ###)
 * - 볼드 (**text**)
 * - 이탤릭 (*text*)
 * - 인라인 코드 (`code`)
 * - 코드 블록 (```code```)
 * - 링크 ([text](url))
 * - 순서없는 목록 (- item)
 * - 인용문 (> quote)
 * - 수평선 (---)
 * 
 * @param markdown - 변환할 마크다운 문자열
 * @returns HTML 문자열
 */
export function parseMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';
  
  // 줄바꿈을 임시로 다른 문자열로 대체
  let html = markdown.replace(/\r\n|\n\r|\n|\r/g, '\n');
  
  // 코드 블록 (```..```) - 이 부분이 다른 정규식에 영향을 주지 않도록 먼저 처리
  html = html.replace(/```([\s\S]*?)```/gm, function(match, code) {
    return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });
  
  // 인라인 코드 (`..`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 헤더
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // 볼드, 이탤릭
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 링크
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // 순서없는 목록
  // 전체 목록을 찾아서 처리
  html = html.replace(/((^|\n)- (.*?)(\n|$))+/g, function(match) {
    return '<ul>' + match.replace(/^- (.*?)$/gm, '<li>$1</li>') + '</ul>';
  });
  
  // 인용문
  html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
  
  // 수평선
  html = html.replace(/^---+$/gm, '<hr>');
  
  // 줄바꿈
  html = html.replace(/\n/g, '<br>');
  
  return html;
}