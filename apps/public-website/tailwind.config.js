/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkGreen: '#123B26',
          forestGreen: '#205C38',
          lightGreen: '#A8C66C',
          electricGreen: '#39FF14',
          cream: '#F7F5E8',
          warmBeige: '#E8DFC8',
          softSage: '#DCE8C8',
          white: '#FFFFFF',
          warmYellow: '#F2C94C',
        }
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        poppins: ['"Poppins"', 'sans-serif'],
        mukta: ['"Mukta Malar"', '"Poppins"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(18, 59, 38, 0.06)',
        'card': '0 10px 30px -4px rgba(18, 59, 38, 0.1)',
        'button': '0 4px 14px 0 rgba(18, 59, 38, 0.25)',
        'offer': '0 8px 24px -2px rgba(242, 201, 76, 0.25)',
      }
    },
  },
  plugins: [],
}
