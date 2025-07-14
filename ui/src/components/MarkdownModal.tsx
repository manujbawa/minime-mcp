import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface MarkdownModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  metadata?: {
    created_at?: string;
    updated_at?: string;
    memory_type?: string;
    importance_score?: number;
    tags?: string[];
    sections?: string[];
    auto_tasks_created?: boolean;
    technical_analysis_included?: boolean;
    [key: string]: any;
  };
}

export function MarkdownModal({ open, onClose, title, content, metadata }: MarkdownModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          minHeight: fullScreen ? '100vh' : '80vh',
          maxHeight: fullScreen ? '100vh' : '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, pr: 2 }}>
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'text.secondary' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Metadata Section */}
      {metadata && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {metadata.memory_type && (
              <Chip 
                label={metadata.memory_type} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            )}
            {metadata.importance_score && (
              <Chip 
                label={`Importance: ${(metadata.importance_score * 100).toFixed(0)}%`} 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
            )}
            {metadata.auto_tasks_created && (
              <Chip 
                label="Auto Tasks Created" 
                size="small" 
                color="success" 
                variant="outlined" 
              />
            )}
            {metadata.technical_analysis_included && (
              <Chip 
                label="Technical Analysis" 
                size="small" 
                color="info" 
                variant="outlined" 
              />
            )}
            {metadata.tags?.filter(tag => !['project_brief'].includes(tag)).map((tag) => (
              <Chip 
                key={tag} 
                label={tag} 
                size="small" 
                variant="outlined" 
              />
            ))}
          </Box>
          
          {(metadata.created_at || metadata.updated_at) && (
            <Typography variant="caption" color="text.secondary">
              {metadata.created_at && `Created: ${formatDate(metadata.created_at)}`}
              {metadata.updated_at && metadata.created_at !== metadata.updated_at && 
                ` • Updated: ${formatDate(metadata.updated_at)}`
              }
            </Typography>
          )}
        </Box>
      )}

      <DialogContent 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          '& .markdown-content': {
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              color: theme.palette.primary.main,
              marginTop: theme.spacing(3),
              marginBottom: theme.spacing(1),
              '&:first-of-type': {
                marginTop: 0,
              }
            },
            '& h1': { fontSize: '2rem', fontWeight: 600 },
            '& h2': { fontSize: '1.5rem', fontWeight: 600 },
            '& h3': { fontSize: '1.25rem', fontWeight: 500 },
            '& p': {
              marginBottom: theme.spacing(2),
              lineHeight: 1.6,
            },
            '& ul, & ol': {
              paddingLeft: theme.spacing(3),
              marginBottom: theme.spacing(2),
            },
            '& li': {
              marginBottom: theme.spacing(0.5),
            },
            '& code': {
              backgroundColor: theme.palette.grey[100],
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'Monaco, "SF Mono", "Roboto Mono", monospace',
            },
            '& pre': {
              backgroundColor: theme.palette.grey[50],
              border: `1px solid ${theme.palette.grey[200]}`,
              borderRadius: theme.shape.borderRadius,
              padding: theme.spacing(2),
              overflow: 'auto',
              marginBottom: theme.spacing(2),
              '& code': {
                backgroundColor: 'transparent',
                padding: 0,
              }
            },
            '& blockquote': {
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              paddingLeft: theme.spacing(2),
              marginLeft: 0,
              marginBottom: theme.spacing(2),
              fontStyle: 'italic',
              color: theme.palette.text.secondary,
            },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              marginBottom: theme.spacing(2),
              '& th, & td': {
                border: `1px solid ${theme.palette.grey[300]}`,
                padding: theme.spacing(1),
                textAlign: 'left',
              },
              '& th': {
                backgroundColor: theme.palette.grey[100],
                fontWeight: 600,
              }
            },
            '& hr': {
              border: 'none',
              borderTop: `2px solid ${theme.palette.grey[200]}`,
              margin: `${theme.spacing(3)} 0`,
            }
          }
        }}
      >
        <Box className="markdown-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}