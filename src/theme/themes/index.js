import sand from './sand'
import midnight from './midnight'
import ocean from './ocean'
import forest from './forest'
import rose from './rose'
import slate from './slate'

const themes = { sand, midnight, ocean, forest, rose, slate }

export const themeNames = Object.keys(themes)

export function applyTheme(name) {
  const vars = themes[name] || themes.sand
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}

export default themes
