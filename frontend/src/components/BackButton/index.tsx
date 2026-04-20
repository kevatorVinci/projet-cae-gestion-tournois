import { Button } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate } from 'react-router-dom';
import { SxProps, Theme } from '@mui/material/styles';

type BoutonRetourProps = {
  sx?: SxProps<Theme>;
  onClick?: () => void;
};

export default function BoutonRetour({ sx, onClick }: BoutonRetourProps) {
  const navigate = useNavigate();
  return (
    <Button
      disableRipple
      startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 10 }} />}
      size="small"
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }
        navigate(-1);
      }}
      sx={{
        color: 'rgba(255,255,255,0.4)',
        fontSize: '0.75rem',
        position: 'fixed',
        top: 80,
        left: 16,
        minWidth: 'auto',
        p: 0,
        ...(sx ?? {}),
        '&:hover': {
          color: 'rgba(255,255,255,0.7)',
          bgcolor: 'transparent',
        },
      }}
    >
      Retour
    </Button>
  );
}
