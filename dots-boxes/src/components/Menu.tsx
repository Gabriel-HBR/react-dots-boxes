export default function Menu({
  isDarkMode,
  setIsDarkMode,
  pageShow,
  setPageShow,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  pageShow: number;
  setPageShow: (pageShow: number) => void;
}) {
  return (
    <div className="p-4 mx-auto flex sm:flex-row items-center gap-4 flex-col items-stretch max-w-4xl">
      <div className="flex flex-1 justify-center sm:justify-start w-full">
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
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </div>
      </div>
    </div>
  );
}
