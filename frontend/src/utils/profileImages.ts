// --- MAPPING DES IMAGES DE PROFIL ---
import luffyImg from '../assets/images/imagesProfil/luffy.png';
import pessiImg from '../assets/images/imagesProfil/Pessi.jpg';
import zoroImg from '../assets/images/imagesProfil/R.png';
import flashImg from '../assets/images/imagesProfil/flash.jpg';
import milesImg from '../assets/images/imagesProfil/miles.jpg';

// Mapping des noms d'images vers les imports Vite
export const profileImageMap: Record<string, string> = {
  'luffy.png': luffyImg,
  'Pessi.jpg': pessiImg,
  'R.png': zoroImg,
  'flash.jpg': flashImg,
  'miles.jpg': milesImg,
};

// Mapping inverse : des imports vers les noms de fichiers
export const reverseProfileImageMap: Record<string, string> = {
  [luffyImg]: 'luffy.png',
  [pessiImg]: 'Pessi.jpg',
  [zoroImg]: 'R.png',
  [flashImg]: 'flash.jpg',
  [milesImg]: 'miles.jpg',
};

// Fonction pour obtenir l'URL de l'image depuis le nom du fichier
export const getProfileImageUrl = (imageName: string | undefined): string => {
  if (!imageName) return '';
  return profileImageMap[imageName] || '';
};

// Fonction pour obtenir le nom du fichier depuis l'URL importée
export const getProfileImageName = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '';
  return reverseProfileImageMap[imageUrl] || '';
};
