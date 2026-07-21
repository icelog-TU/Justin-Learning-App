import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import IdiomsBrowse from './pages/IdiomsBrowse';
import IdiomsQuiz from './pages/IdiomsQuiz';
import SentencePractice from './pages/SentencePractice';
import IdiomChainGame from './pages/IdiomChainGame';
import ConfusablesQuiz from './pages/ConfusablesQuiz';
import ProgressPage from './pages/ProgressPage';
import GachaPage from './pages/GachaPage';
import CharactersPage from './pages/CharactersPage';
import CharacterDetailPage from './pages/CharacterDetailPage';
import NotebookPage from './pages/NotebookPage';
import { AppDataProvider } from './lib/AppDataContext';

export default function App() {
  return (
    <AppDataProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/idioms" element={<IdiomsBrowse />} />
            <Route path="/idioms/quiz" element={<IdiomsQuiz />} />
            <Route path="/idioms/sentence" element={<SentencePractice />} />
            <Route path="/idioms/chain" element={<IdiomChainGame />} />
            <Route path="/confusables" element={<ConfusablesQuiz />} />
            <Route path="/gacha" element={<GachaPage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/characters/:id" element={<CharacterDetailPage />} />
            <Route path="/notebook" element={<NotebookPage />} />
            <Route path="/progress" element={<ProgressPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppDataProvider>
  );
}
