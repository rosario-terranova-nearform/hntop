import { Route, Routes } from "react-router";
import { SortControls } from "@/components/SortControls";
import { StoryList } from "@/components/StoryList";
import { StoryDetail } from "@/components/StoryDetail";

function Home() {
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">HN Top</h1>
      <SortControls />
      <StoryList />
    </div>
  );
}

function Item() {
  return (
    <div className="mx-auto max-w-3xl p-4">
      <StoryDetail />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/item/:id" element={<Item />} />
    </Routes>
  );
}

export default App;
