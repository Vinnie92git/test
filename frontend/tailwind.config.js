/** @type {import('tailwindcss').Config} */
// tailwind.config.js o .ts
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      backgroundImage: {
        home: "url('/images/home-bg.png')",
      },
    },
  },
  plugins: [],
};
