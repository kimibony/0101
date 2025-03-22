import { createTheme } from '@mui/material/styles';

// 10가지 테마 정의
const themes = {
  // 1. 기본 밝은 테마
  default: createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      error: {
        main: '#f44336',
        lightest: '#ffebee',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  }),

  // 2. 다크 테마
  dark: createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#90caf9',
      },
      secondary: {
        main: '#f48fb1',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
      error: {
        main: '#f44336',
        lightest: '#330000',
      },
    },
  }),

  // 3. 자연 테마
  nature: createTheme({
    palette: {
      primary: {
        main: '#4caf50',
      },
      secondary: {
        main: '#8bc34a',
      },
      background: {
        default: '#f9f8f4',
        paper: '#ffffff',
      },
      error: {
        main: '#e53935',
        lightest: '#f5e8e8',
      },
    },
  }),

  // 4. 바다 테마
  ocean: createTheme({
    palette: {
      primary: {
        main: '#0288d1',
      },
      secondary: {
        main: '#26c6da',
      },
      background: {
        default: '#f5f8fa',
        paper: '#ffffff',
      },
      error: {
        main: '#d32f2f',
        lightest: '#e8f0f5',
      },
    },
  }),

  // 5. 선셋 테마
  sunset: createTheme({
    palette: {
      primary: {
        main: '#ff5722',
      },
      secondary: {
        main: '#ff9800',
      },
      background: {
        default: '#fff8e1',
        paper: '#ffffff',
      },
      error: {
        main: '#d84315',
        lightest: '#fff0ea',
      },
    },
  }),

  // 6. 모노크롬 테마
  monochrome: createTheme({
    palette: {
      primary: {
        main: '#424242',
      },
      secondary: {
        main: '#9e9e9e',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
      error: {
        main: '#616161',
        lightest: '#f0f0f0',
      },
    },
  }),

  // 7. 보라 테마
  purple: createTheme({
    palette: {
      primary: {
        main: '#673ab7',
      },
      secondary: {
        main: '#9c27b0',
      },
      background: {
        default: '#f3e5f5',
        paper: '#ffffff',
      },
      error: {
        main: '#c2185b',
        lightest: '#f3e5f5',
      },
    },
  }),

  // 8. 핑크 테마
  pink: createTheme({
    palette: {
      primary: {
        main: '#e91e63',
      },
      secondary: {
        main: '#f06292',
      },
      background: {
        default: '#fce4ec',
        paper: '#ffffff',
      },
      error: {
        main: '#ad1457',
        lightest: '#fce4ec',
      },
    },
  }),

  // 9. 그린 어두운 테마
  darkGreen: createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#81c784',
      },
      secondary: {
        main: '#a5d6a7',
      },
      background: {
        default: '#1e2e1f',
        paper: '#2e3e2f',
      },
      error: {
        main: '#c62828',
        lightest: '#e8f0e8',
      },
    },
  }),

  // 10. 블루베리 테마
  blueberry: createTheme({
    palette: {
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#7986cb',
      },
      background: {
        default: '#e8eaf6',
        paper: '#ffffff',
      },
      error: {
        main: '#303f9f',
        lightest: '#e8eaf6',
      },
    },
  }),
};

export default themes; 