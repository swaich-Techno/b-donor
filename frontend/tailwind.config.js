/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        donor: {
          red: "#c91f2f",
          dark: "#1f2933",
          soft: "#fff5f5",
          line: "#eceff3"
        }
      },
      boxShadow: {
        soft: "0 18px 45px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};
