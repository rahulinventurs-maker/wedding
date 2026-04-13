// Wedding colour palette
// Built around warm champagne, dusty rose, and deep sage tones.
// Every colour has a light/dark variant so the UI can scale gracefully.

export const colors = {

  // Champagne — primary brand colour, used for buttons, highlights, accents
  champagne: {
    50:  '#fdf8f0',
    100: '#faefd9',
    200: '#f4ddb0',
    300: '#ecc880',
    400: '#e2ad50',
    500: '#d4943a',  // main
    600: '#b87830',
    700: '#8f5c28',
    800: '#6b4422',
    900: '#4a2f1a',
  },

  // Dusty rose — RSVP confirmed states, love-themed UI elements
  rose: {
    50:  '#fdf2f4',
    100: '#fce7eb',
    200: '#f9d0d8',
    300: '#f4aab8',
    400: '#ec7d92',
    500: '#e05472',  // main
    600: '#c73a5d',
    700: '#a62c4a',
    800: '#7e2338',
    900: '#581929',
  },

  // Sage green — success states, nature-inspired accents
  sage: {
    50:  '#f2f5f0',
    100: '#e2eade',
    200: '#c4d4bc',
    300: '#9db892',
    400: '#789a6a',
    500: '#5a7d4e',  // main
    600: '#466440',
    700: '#374e34',
    800: '#293c28',
    900: '#1b2a1b',
  },

  // Cream — page backgrounds, cards, soft surfaces
  cream: {
    50:  '#fefdf9',
    100: '#fdf9f0',
    200: '#faf2e0',
    300: '#f5e8c8',
    400: '#eddcb0',
    500: '#e3cc94',  // main
    600: '#ceaf6a',
    700: '#a88848',
    800: '#7d6435',
    900: '#554327',
  },

  // Neutral — text, borders, and structural greys
  neutral: {
    0:   '#ffffff',
    50:  '#fafaf9',
    100: '#f5f4f2',
    200: '#e8e6e3',
    300: '#d4d1cc',
    400: '#a9a49c',
    500: '#7d7870',
    600: '#5c5850',
    700: '#3e3b35',
    800: '#27241f',
    900: '#14120e',
  },

  // Semantic aliases — use these directly in components
  primary:    '#d4943a',   // champagne 500
  secondary:  '#5a7d4e',   // sage 500
  accent:     '#e05472',   // rose 500
  background: '#fdf9f0',   // cream 100
  surface:    '#fefdf9',   // cream 50
  border:     '#e8e6e3',   // neutral 200
  text:       '#27241f',   // neutral 800
  textMuted:  '#7d7870',   // neutral 500
  error:      '#c0392b',
  success:    '#5a7d4e',   // sage 500
  warning:    '#d4943a',   // champagne 500

} as const;

export type Colors = typeof colors;
