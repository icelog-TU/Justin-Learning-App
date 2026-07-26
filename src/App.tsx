import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import IdiomsBrowse from './pages/IdiomsBrowse';
import IdiomsQuiz from './pages/IdiomsQuiz';
import SentencePractice from './pages/SentencePractice';
import IdiomChainGame from './pages/IdiomChainGame';
import IdiomAssociationGame from './pages/IdiomAssociationGame';
import ConfusablesQuiz from './pages/ConfusablesQuiz';
import ProgressPage from './pages/ProgressPage';
import GachaPage from './pages/GachaPage';
import CharactersPage from './pages/CharactersPage';
import CharacterDetailPage from './pages/CharacterDetailPage';
import NotebookPage from './pages/NotebookPage';
import CurrencyDetailPage from './pages/CurrencyDetailPage';
import StreakDetailPage from './pages/StreakDetailPage';
import LevelDetailPage from './pages/LevelDetailPage';
import ChainLinksDetailPage from './pages/ChainLinksDetailPage';
import AssociationCharacterDetailPage from './pages/AssociationCharacterDetailPage';
import GuwenHome from './pages/GuwenHome';
import GuwenLessonDecode from './pages/GuwenLessonDecode';
import SettingsPage from './pages/SettingsPage';
import TtsAuditPage from './pages/TtsAuditPage';
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
            <Route path="/idioms/association" element={<IdiomAssociationGame />} />
            <Route path="/guwen" element={<GuwenHome />} />
            <Route path="/guwen-lesson/:lessonId" element={<GuwenLessonDecode />} />
            <Route path="/tts-audit" element={<TtsAuditPage />} />
            <Route path="/confusables" element={<ConfusablesQuiz />} />
            <Route path="/gacha" element={<GachaPage />} />
            <Route path="/characters" element={<CharactersPage />} />
            <Route path="/characters/:id" element={<CharacterDetailPage />} />
            <Route path="/notebook" element={<NotebookPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/progress/currency/:type" element={<CurrencyDetailPage />} />
            <Route path="/progress/streak" element={<StreakDetailPage />} />
            <Route path="/progress/level" element={<LevelDetailPage />} />
            <Route path="/progress/chain-links" element={<ChainLinksDetailPage />} />
            <Route path="/progress/association/:char" element={<AssociationCharacterDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppDataProvider>
  );
}
