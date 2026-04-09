// --- MAPPING DES IMAGES DE PROFIL ---
import luffyImg from '../assets/images/imagesProfil/luffy.png';
import pessiImg from '../assets/images/imagesProfil/Pessi.jpg';
import zoroImg from '../assets/images/imagesProfil/R.png';
import flashImg from '../assets/images/imagesProfil/flash.jpg';
import milesImg from '../assets/images/imagesProfil/miles.jpg';

// Map image file names to Vite imports
export const profileImageMap: Record<string, string> = {
  'luffy.png': luffyImg,
  'Pessi.jpg': pessiImg,
  'R.png': zoroImg,
  'flash.jpg': flashImg,
  'miles.jpg': milesImg,
};

// Reverse map: imports to file names
export const reverseProfileImageMap: Record<string, string> = {
  [luffyImg]: 'luffy.png',
  [pessiImg]: 'Pessi.jpg',
  [zoroImg]: 'R.png',
  [flashImg]: 'flash.jpg',
  [milesImg]: 'miles.jpg',
};

// Helper to get the image URL from a file name
export const getProfileImageUrl = (imageName: string | undefined): string => {
  if (!imageName) return '';
  return profileImageMap[imageName] || '';
};

// Helper to get the file name from an imported image URL
export const getProfileImageName = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '';
  return reverseProfileImageMap[imageUrl] || '';
};
