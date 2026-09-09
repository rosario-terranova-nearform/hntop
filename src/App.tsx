import { useNavigate, useLocation, Route, Routes, type Location } from "react-router";
import { SortControls } from "@/components/SortControls";
import { StoryList } from "@/components/StoryList";
import { StoryDetail } from "@/components/StoryDetail";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

function ItemModal() {
  const navigate = useNavigate();
  return (
    <Dialog open onOpenChange={(open) => !open && navigate(-1)}>
      <DialogContent className="max-h-[85vh] min-w-0 max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogTitle className="sr-only">Story details</DialogTitle>
        <div className="min-w-0 break-words">
          <StoryDetail />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function App() {
  const location = useLocation();
  const backgroundLocation = (location.state as { backgroundLocation?: Location } | null)
    ?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<Home />} />
        <Route path="/item/:id" element={<Item />} />
      </Routes>
      {backgroundLocation && (
        <Routes>
          <Route path="/item/:id" element={<ItemModal />} />
        </Routes>
      )}
    </>
  );
}

export default App;
