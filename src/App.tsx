import { useState } from 'react'
import {
  useNavigate,
  useLocation,
  useSearchParams,
  Route,
  Routes,
  type Location,
} from 'react-router'
import { Moon, Sun } from 'lucide-react'
import { SortControls } from '@/components/SortControls'
import { SearchBox } from '@/components/SearchBox'
import { StoryList } from '@/components/StoryList'
import { StoryDetail } from '@/components/StoryDetail'
import { Recap } from '@/components/Recap'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { Range } from '@/api/hn'
import { getStoredRange, setStoredTheme } from '@/lib/preferences'
import { applyTheme, resolveTheme } from '@/lib/theme'

function ThemeToggle() {
  const [theme, setTheme] = useState(resolveTheme)

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setStoredTheme(next)
    applyTheme(next)
    setTheme(next)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle dark mode"
      onClick={toggle}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}

function Header() {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <div className="flex w-fit items-center gap-2 rounded-md border border-border bg-foreground px-3 py-1.5 font-mono text-background">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-red-500" />
          <span className="size-2.5 rounded-full bg-yellow-500" />
          <span className="size-2.5 rounded-full bg-green-500" />
        </div>
        <h1 className="text-base font-semibold tracking-tight">
          <span className="text-green-500">~$</span> hn_top
          <span className="animate-pulse">▌</span>
        </h1>
      </div>
      <ThemeToggle />
    </div>
  )
}

function Home() {
  const [searchParams] = useSearchParams()
  const range = (searchParams.get('range') ?? getStoredRange()) as Range
  const isCustomRange = searchParams.has('from') || searchParams.has('to')

  return (
    <div className="mx-auto max-w-3xl p-4 2xl:max-w-5xl">
      <Header />
      <p className="mb-4 text-sm text-muted-foreground">
        Hacker News, sorted by what actually is interesting
      </p>
      <div className="my-4 flex flex-wrap items-center gap-2">
        <SortControls />
      </div>
      <SearchBox />
      {!isCustomRange && <Recap range={range} />}
      <StoryList />
    </div>
  )
}

function Item() {
  return (
    <div className="mx-auto max-w-3xl p-4 2xl:max-w-5xl">
      <StoryDetail />
    </div>
  )
}

function ItemModal() {
  const navigate = useNavigate()
  return (
    <Dialog open onOpenChange={(open) => !open && navigate(-1)}>
      <DialogContent className="min-w-0 max-w-2xl sm:max-w-2xl">
        <DialogTitle className="sr-only">Story details</DialogTitle>
        <div className="max-h-[80vh] min-w-0 overflow-x-hidden overflow-y-auto break-words [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <StoryDetail />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function App() {
  const location = useLocation()
  const backgroundLocation = (
    location.state as { backgroundLocation?: Location } | null
  )?.backgroundLocation

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
  )
}

export default App
