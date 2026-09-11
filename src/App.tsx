import { useNavigate, useLocation, Route, Routes, type Location } from "react-router";
import { SortControls } from "@/components/SortControls";
import { StoryList } from "@/components/StoryList";
import { StoryDetail } from "@/components/StoryDetail";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function Home() {
  return (
    <div className="mx-auto max-w-3xl p-4 2xl:max-w-5xl">
      <h1 className="text-2xl font-semibold">Hacker News Top</h1>
      <p className="mb-4 text-sm text-muted-foreground">Hacker News, sorted by what actually is interesting</p>
      <SortControls />
      <StoryList />
    </div>
  );
}

function Item() {
  return (
    <div className="mx-auto max-w-3xl p-4 2xl:max-w-5xl">
      <StoryDetail />
    </div>
  );
}

function ItemModal() {
  const navigate = useNavigate();
  return (
    <Dialog open onOpenChange={(open) => !open && navigate(-1)}>
      <DialogContent className="min-w-0 max-w-2xl sm:max-w-2xl">
        <DialogTitle className="sr-only">Story details</DialogTitle>
        <div className="max-h-[80vh] min-w-0 overflow-x-hidden overflow-y-auto break-words [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
