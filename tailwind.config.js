/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // class 기반 다크 모드 활성화
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/widgets/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/entities/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 다크 모드 전용 커스텀 색상 추가
        'gray-750': '#2d3748',
        
        // '방랑자' 테마 컬러 팔레트
        wanderer: {
          // 따뜻한 지구색조
          sand: {
            50: '#fdf8f3',
            100: '#f9f0e6',
            200: '#f2ddc1',
            300: '#e9c49d',
            400: '#d9a374',
            500: '#c8824e',
            600: '#a86a3f',
            700: '#8b5532',
            800: '#6e442a',
            900: '#593624',
          },
          
          // 자연스러운 그린
          sage: {
            50: '#f6f7f4',
            100: '#edefea',
            200: '#d9ded3',
            300: '#bac4b0',
            400: '#94a585',
            500: '#738661',
            600: '#5c6d4c',
            700: '#49583d',
            800: '#3b4632',
            900: '#323b2b',
          },
          
          // 따뜻한 골드/오렌지
          sunset: {
            50: '#fef9f2',
            100: '#fef1e0',
            200: '#fce0bb',
            300: '#f8c88a',
            400: '#f4a857',
            500: '#f18f34',
            600: '#e2761a',
            700: '#bc5d16',
            800: '#964a19',
            900: '#7a3e18',
          },
          
          // 차분한 블루
          ocean: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
          },
          
          // 뉴트럴 크림/베이지
          cream: {
            50: '#fefdfb',
            100: '#fdfbf7',
            200: '#faf6ef',
            300: '#f5ede2',
            400: '#edddc8',
            500: '#e1c7a3',
            600: '#d1ab7a',
            700: '#bc8f5a',
            800: '#9d744b',
            900: '#805f40',
          },
        },
      },
      
      fontFamily: {
        // 캐쥬얼한 여행 느낌의 폰트 추가
        'wanderer-serif': ['Comfortaa', 'system-ui', 'sans-serif'],
        'wanderer-sans': ['Noto Sans KR', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 