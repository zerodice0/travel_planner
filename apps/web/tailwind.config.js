/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#E8F2FB',
  				'100': '#D1E5F7',
  				'200': '#A3CBF0',
  				'300': '#7AB0EC',
  				'400': '#5C9AE4',
  				'500': '#4A90E2',
  				'600': '#2E5C8A',
  				'700': '#234567',
  				'800': '#1A334C',
  				'900': '#122231',
  				'950': '#0A1119',
  				DEFAULT: '#4A90E2',
  				light: '#7AB0EC',
  				dark: '#2E5C8A',
  				foreground: '#ffffff'
  			},
  			secondary: {
  				'50': '#E8F8F0',
  				'100': '#D1F1E1',
  				'200': '#A3E3C3',
  				'300': '#7FDA9A',
  				'400': '#64D683',
  				'500': '#50C878',
  				'600': '#3A9A5C',
  				'700': '#2C7346',
  				'800': '#1E4D30',
  				'900': '#0F261A',
  				DEFAULT: '#50C878',
  				light: '#7FDA9A',
  				dark: '#3A9A5C',
  				foreground: '#ffffff'
  			},
  			success: '#10B981',
  			warning: '#F59E0B',
  			error: '#EF4444',
  			info: '#3B82F6',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderColor: {
  			DEFAULT: 'hsl(var(--border))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    // scrollbar-hide utility
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
};
