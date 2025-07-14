import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
  Autocomplete,
  Popper,
  Paper,
  Typography,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  TuneRounded,
  DateRange,
  Category,
  Psychology
} from '@mui/icons-material';
import { debounce } from 'lodash';
import { LearningAPI } from '../../../services/api/learning.api';

interface SearchFilters {
  search: string;
  categories: string[];
  types: string[];
  projects: string[];
  minConfidence: number;
  dateRange: string;
  sourceType: 'all' | 'memory' | 'cluster';
  showActionableOnly: boolean;
}

interface InsightSearchBarProps {
  onFiltersChange: (filters: SearchFilters) => void;
  projects: Array<{ id: string; name: string }>;
  categories: string[];
  types: string[];
}

export const InsightSearchBar: React.FC<InsightSearchBarProps> = ({
  onFiltersChange,
  projects,
  categories,
  types
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    categories: [],
    types: [],
    projects: [],
    minConfidence: 0.3,
    dateRange: 'all',
    sourceType: 'all',
    showActionableOnly: false
  });
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length < 2) {
        setSearchSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        // In a real app, this would call a search suggestions endpoint
        const suggestions = [
          `${term} in code`,
          `${term} patterns`,
          `${term} issues`,
          `${term} improvements`,
          `${term} architecture`
        ];
        setSearchSuggestions(suggestions);
      } catch (error) {
        console.error('Search suggestions failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    handleFilterChange({ search: value });
  };

  const clearFilters = () => {
    const cleared: SearchFilters = {
      search: '',
      categories: [],
      types: [],
      projects: [],
      minConfidence: 0.3,
      dateRange: 'all',
      sourceType: 'all',
      showActionableOnly: false
    };
    setSearchTerm('');
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.categories.length > 0 ||
      filters.types.length > 0 ||
      filters.projects.length > 0 ||
      filters.minConfidence > 0.3 ||
      filters.dateRange !== 'all' ||
      filters.sourceType !== 'all' ||
      filters.showActionableOnly
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          {/* Main search bar */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Autocomplete
              freeSolo
              fullWidth
              value={searchTerm}
              onChange={(_, value) => handleSearchChange(value || '')}
              onInputChange={(_, value) => setSearchTerm(value)}
              options={searchSuggestions}
              loading={isSearching}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search insights, patterns, technologies..."
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {searchTerm && (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => handleSearchChange('')}
                            >
                              <Clear />
                            </IconButton>
                          </InputAdornment>
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
            <Button
              variant={showAdvanced ? 'contained' : 'outlined'}
              startIcon={<TuneRounded />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              sx={{ minWidth: 120 }}
            >
              Filters
              {hasActiveFilters() && (
                <Chip
                  size="small"
                  label={
                    filters.categories.length +
                    filters.types.length +
                    filters.projects.length +
                    (filters.minConfidence > 0.3 ? 1 : 0) +
                    (filters.dateRange !== 'all' ? 1 : 0) +
                    (filters.sourceType !== 'all' ? 1 : 0) +
                    (filters.showActionableOnly ? 1 : 0)
                  }
                  color="primary"
                  sx={{ ml: 1, height: 20 }}
                />
              )}
            </Button>
          </Box>

          {/* Quick filter chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="High Confidence"
              icon={<Psychology />}
              onClick={() => handleFilterChange({ minConfidence: 0.8 })}
              color={filters.minConfidence >= 0.8 ? 'primary' : 'default'}
              variant={filters.minConfidence >= 0.8 ? 'filled' : 'outlined'}
            />
            <Chip
              label="Clusters"
              icon={<Category />}
              onClick={() => 
                handleFilterChange({ 
                  sourceType: filters.sourceType === 'cluster' ? 'all' : 'cluster' 
                })
              }
              color={filters.sourceType === 'cluster' ? 'primary' : 'default'}
              variant={filters.sourceType === 'cluster' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Last 7 Days"
              icon={<DateRange />}
              onClick={() => 
                handleFilterChange({ 
                  dateRange: filters.dateRange === '7d' ? 'all' : '7d' 
                })
              }
              color={filters.dateRange === '7d' ? 'primary' : 'default'}
              variant={filters.dateRange === '7d' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Actionable"
              onClick={() => 
                handleFilterChange({ 
                  showActionableOnly: !filters.showActionableOnly 
                })
              }
              color={filters.showActionableOnly ? 'primary' : 'default'}
              variant={filters.showActionableOnly ? 'filled' : 'outlined'}
            />
            {hasActiveFilters() && (
              <Chip
                label="Clear All"
                onClick={clearFilters}
                onDelete={clearFilters}
                color="default"
                variant="outlined"
              />
            )}
          </Stack>

          {/* Advanced filters */}
          {showAdvanced && (
            <>
              <Divider />
              <Box sx={{ pt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Advanced Filters
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                  {/* Categories */}
                  <Autocomplete
                    multiple
                    options={categories}
                    value={filters.categories}
                    onChange={(_, value) => handleFilterChange({ categories: value })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Categories"
                        placeholder="Select categories"
                        size="small"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />

                  {/* Types */}
                  <Autocomplete
                    multiple
                    options={types}
                    value={filters.types}
                    onChange={(_, value) => handleFilterChange({ types: value })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Insight Types"
                        placeholder="Select types"
                        size="small"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />

                  {/* Projects */}
                  <Autocomplete
                    multiple
                    options={projects}
                    getOptionLabel={(option) => option.name}
                    value={projects.filter(p => filters.projects.includes(p.name))}
                    onChange={(_, value) => 
                      handleFilterChange({ projects: value.map(v => v.name) })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Projects"
                        placeholder="Select projects"
                        size="small"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                  />

                  {/* Date Range */}
                  <FormControl size="small">
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange({ dateRange: e.target.value })}
                      label="Date Range"
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="1d">Last 24 Hours</MenuItem>
                      <MenuItem value="7d">Last 7 Days</MenuItem>
                      <MenuItem value="30d">Last 30 Days</MenuItem>
                      <MenuItem value="3m">Last 3 Months</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Source Type */}
                  <FormControl size="small">
                    <InputLabel>Source Type</InputLabel>
                    <Select
                      value={filters.sourceType}
                      onChange={(e) => handleFilterChange({ sourceType: e.target.value as any })}
                      label="Source Type"
                    >
                      <MenuItem value="all">All Sources</MenuItem>
                      <MenuItem value="memory">Individual Memories</MenuItem>
                      <MenuItem value="cluster">Memory Clusters</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Confidence Slider */}
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Minimum Confidence: {Math.round(filters.minConfidence * 100)}%
                    </Typography>
                    <Slider
                      value={filters.minConfidence}
                      onChange={(_, value) => handleFilterChange({ minConfidence: value as number })}
                      min={0}
                      max={1}
                      step={0.1}
                      marks={[
                        { value: 0.3, label: '30%' },
                        { value: 0.5, label: '50%' },
                        { value: 0.8, label: '80%' }
                      ]}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                    />
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};