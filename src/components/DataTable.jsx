import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

function descendingComparator(a, b, orderBy, columns) {
  // Special handling for 'no' column - sort by actual numeric value
  if (orderBy === 'no') {
    const aValue = a.no || a.originalIndex + 1;
    const bValue = b.no || b.originalIndex + 1;
    if (bValue < aValue) {
      return -1;
    }
    if (bValue > aValue) {
      return 1;
    }
    return 0;
  }
  
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy, columns) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy, columns)
    : (a, b) => -descendingComparator(a, b, orderBy, columns);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const DataTable = ({
  title,
  columns,
  rows,
  loading = false,
  searchable = true,
  filterable = false,
  refreshable = false,
  onRefresh,
  initialOrderBy = '',
  initialOrder = 'asc',
  rowsPerPageOptions = [5, 10, 25],
  defaultRowsPerPage = 10,
  actions,
  additionalActions,
  emptyMessage = 'Tidak ada data',
  // Server-side pagination props
  page,
  rowsPerPage: externalRowsPerPage,
  count,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const [order, setOrder] = useState(initialOrder);
  const [orderBy, setOrderBy] = useState(initialOrderBy);
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(defaultRowsPerPage);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine if using server-side pagination
  const isServerSidePagination = onPageChange !== undefined && onRowsPerPageChange !== undefined;

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    if (isServerSidePagination) {
      onPageChange(event, newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (isServerSidePagination) {
      onRowsPerPageChange(event);
    } else {
      setInternalRowsPerPage(newRowsPerPage);
      setInternalPage(0);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    if (!isServerSidePagination) {
      setInternalPage(0);
    }
  };

  // Add originalIndex and 'no' field to rows for proper sorting of 'no' column
  const rowsWithIndex = rows.map((row, index) => ({
    ...row,
    originalIndex: index,
    no: index + 1 // Add 'no' field for sorting
  }));

  // Filter rows based on search query (only for client-side filtering)
  const filteredRows = searchable && !isServerSidePagination
    ? rowsWithIndex.filter((row) => {
        if (!searchQuery) return true;
        
        return Object.keys(row).some((key) => {
          const value = row[key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery.toLowerCase());
          }
          if (typeof value === 'number') {
            return value.toString().includes(searchQuery);
          }
          return false;
        });
      })
    : rowsWithIndex;

  // Calculate empty rows to maintain consistent page height
  const currentPage = isServerSidePagination ? (page || 0) : internalPage;
  const currentRowsPerPage = isServerSidePagination ? (externalRowsPerPage || defaultRowsPerPage) : internalRowsPerPage;
  const totalCount = isServerSidePagination ? (count || 0) : filteredRows.length;
  
  // Ensure page is within valid range
  const maxPage = totalCount > 0 ? Math.max(0, Math.ceil(totalCount / currentRowsPerPage) - 1) : 0;
  const validCurrentPage = Math.min(currentPage, maxPage);
  
  const emptyRows = validCurrentPage > 0 ? Math.max(0, (1 + validCurrentPage) * currentRowsPerPage - totalCount) : 0;

  // Get displayed rows
  let displayedRows;
  if (isServerSidePagination) {
    displayedRows = filteredRows.map((row, index) => ({
      ...row,
      displayIndex: currentPage * currentRowsPerPage + index
    })); // For server-side, we assume rows are already paginated
  } else {
    const sortedRows = stableSort(filteredRows, getComparator(order, orderBy, columns));
    // Add sortedIndex to all sorted rows first
    const sortedRowsWithIndex = sortedRows.map((row, index) => ({
      ...row,
      sortedIndex: index
    }));
    
    displayedRows = sortedRowsWithIndex
      .slice(currentPage * currentRowsPerPage, currentPage * currentRowsPerPage + currentRowsPerPage)
      .map((row, index) => ({
        ...row,
        displayIndex: row.sortedIndex // Use sortedIndex instead of pagination index
      }));
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography
            sx={{ flex: '1 1 auto' }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            {title}
            {loading && (
              <CircularProgress size={20} sx={{ ml: 2, verticalAlign: 'middle' }} />
            )}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {searchable && (
              <TextField
                size="small"
                placeholder="Cari..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: { xs: '100%', sm: 250 } }}
              />
            )}

            {filterable && (
              <Tooltip title="Filter">
                <IconButton>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
            )}

            {refreshable && onRefresh && (
              <Tooltip title="Refresh">
                <span>
                  <IconButton onClick={onRefresh} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            
            {additionalActions && additionalActions}
          </Box>
        </Toolbar>

        <TableContainer 
          sx={{ 
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: { xs: 800, sm: 900, md: 1000 }
            }
          }}
        >
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size="medium"
          >
            <TableHead>
              <TableRow sx={{ '& th': { backgroundColor: 'var(--primary-color)', color: 'white' } }}>
                {columns.map((column, index) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'center'}
                    sortDirection={orderBy === column.id ? order : false}
                    sx={{ 
                      fontWeight: 600,
                      backgroundColor: index % 2 === 0 ? 'var(--primary-color)' : 'var(--primary-light)',
                      color: 'white',
                      padding: { xs: '8px 6px', sm: '16px 12px' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      lineHeight: 1.5,
                      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                      minWidth: column.minWidth || 'auto',
                      maxWidth: column.maxWidth || 'none'
                    }}
                  >
                    {column.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id)}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            color: 'white !important',
                          },
                          '&.Mui-active': {
                            color: 'white !important',
                          },
                          color: 'white !important'
                        }}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
                {actions && <TableCell 
                  key="actions-header"
                  align="center" 
                  sx={{ 
                    fontWeight: 600,
                    backgroundColor: columns.length % 2 === 0 ? 'var(--primary-color)' : 'var(--primary-light)',
                    color: 'white',
                    padding: '16px 12px',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                >Aksi</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Memuat data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length > 0 ? (
                displayedRows.map((row, index) => {
                  return (
                    <TableRow 
                      hover 
                      tabIndex={-1} 
                      key={row.id || index}
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: '#f0f0f0' },
                        '&:hover': { backgroundColor: '#e8f5e9 !important' }
                      }}
                    >
                      {columns.map((column) => {
                        const value = row[column.id];
                        const displayIndexForFormat = row.displayIndex !== undefined ? row.displayIndex : index;
                        return (
                          <TableCell 
                            key={column.id} 
                            align={column.align || 'center'}
                            sx={{
                              padding: { xs: '8px 12px', sm: '12px 16px' },
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              lineHeight: 1.6,
                              borderBottom: '1px solid rgba(224, 224, 224, 1)',
                              minWidth: column.minWidth || 'auto',
                              maxWidth: column.maxWidth || 'none',
                              wordBreak: 'break-word',
                              '& .MuiTypography-root': {
                                margin: 0,
                                padding: 0,
                                lineHeight: 'inherit'
                              },
                              '& p': {
                                margin: 0,
                                padding: 0,
                                lineHeight: 'inherit'
                              }
                            }}
                          >
                            {column.format ? column.format(value, row, displayIndexForFormat) : value}
                          </TableCell>
                        );
                      })}
                      {actions && (
                        <TableCell 
                          key="actions" 
                          align="center"
                          sx={{
                            padding: { xs: '8px 12px', sm: '12px 16px' },
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            lineHeight: 1.6,
                            borderBottom: '1px solid rgba(224, 224, 224, 1)',
                            minWidth: { xs: '80px', sm: '120px' },
                            whiteSpace: 'nowrap',
                            '& .MuiTypography-root': {
                              margin: 0,
                              padding: 0,
                              lineHeight: 'inherit'
                            },
                            '& p': {
                              margin: 0,
                              padding: 0,
                              lineHeight: 'inherit'
                            }
                          }}
                        >
                          {actions(row)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">{emptyMessage}</Typography>
                  </TableCell>
                </TableRow>
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={totalCount}
          rowsPerPage={currentRowsPerPage}
          page={validCurrentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) =>
            count > 0 ? `${from}-${to} dari ${count}` : '0 dari 0'
          }
        />
      </Paper>
    </Box>
  );
};

export default DataTable;