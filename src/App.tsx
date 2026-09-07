import { Route, Routes } from "react-router";
import { SortControls } from "@/components/SortControls";
import { StoryList } from "@/components/StoryList";

function Home() {
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">HN Top</h1>
      <SortControls />
      <StoryList />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
