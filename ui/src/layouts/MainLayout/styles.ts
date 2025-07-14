export const DRAWER_WIDTH = 280;

export const layoutStyles = {
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  main: (theme: any) => ({
    flexGrow: 1,
    overflow: 'auto',
    backgroundColor: theme.palette.background.default,
  }),
};