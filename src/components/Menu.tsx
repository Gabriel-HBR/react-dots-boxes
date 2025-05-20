import { useEffect, useState } from "react";

export default function Menu({
  pageShow,
  setPageShow,
}: {
  pageShow: number;
  setPageShow: (pageShow: number) => void;
}) {

  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    console.log("Toggle theme");
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    localStorage.setItem('@dark-mode-react-tailwind:theme-1.0.0', newTheme);
    setTheme(newTheme);

    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    const themeFromLocalStorage = 
      localStorage.getItem('@dark-mode-react-tailwind:theme-1.0.0');

    if (themeFromLocalStorage) {
      setTheme(themeFromLocalStorage);
      document.documentElement.classList.toggle('dark', themeFromLocalStorage === 'dark');
    }
  }, []);

  return (
    <div className="p-4 mx-auto flex sm:flex-row items-center gap-4 flex-col items-stretch max-w-4xl">
      <div className="flex flex-1 justify-center sm:justify-start">
        <div className="py-2 text-2xl">Dots and Boxes</div>
      </div>
      <div className="flex-1 flex items-center justify-center sm:justify-between gap-4 w-full">
        <div
          className="inline-block p-2 button translate-none sm:-translate-x-1/2 content-center"
          onClick={() => setPageShow(pageShow === 1 ? 2 : 1)}
        >
          {pageShow === 1 ? "Settings" : "Go Back"}
        </div>
        <div
          className="inline-block p-2 button"
          onClick={() => toggleTheme()}
        >
          {theme === 'dark' ? "Light Mode" : "Dark Mode"}
        </div>
      </div>
    </div>
  );
}
