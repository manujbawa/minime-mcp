/**
 * Projects Search Component
 * Search input for filtering projects
 */

import React from 'react';
import {
  Card,
  CardContent,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search,
} from '@mui/icons-material';

interface ProjectsSearchProps {
  searchTerm: string;
  onChange: (value: string) => void;
}

export const ProjectsSearch: React.FC<ProjectsSearchProps> = ({
  searchTerm,
  onChange,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <TextField
          fullWidth
          placeholder="Search projects by name, description, or technology..."
          value={searchTerm}
          onChange={(e) => onChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 600 }}
        />
      </CardContent>
    </Card>
  );
};