import Home from './pages/Home';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};