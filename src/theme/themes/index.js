import sand from './sand'
import midnight from './midnight'
import blackOnWhite from './blackOnWhite'
import whiteOnBlack from './whiteOnBlack'

const themes = { sand, midnight, 'black on white': blackOnWhite, 'white on black': whiteOnBlack }

export const themeNames = Object.keys(themes)

export function applyTheme(name) {
  const vars = themes[name] || themes.sand
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}

export default themes
