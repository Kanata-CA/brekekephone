import { Nav2 } from './Nav2'

// Fix ciruclar dependencies
let nav: Nav2
export const setNav = (n: Nav2) => {
  nav = n
}
export const Nav = () => nav
