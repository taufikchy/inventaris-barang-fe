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

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
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

  // Filter rows based on search query (only for client-side filtering)
  const filteredRows = searchable && !isServerSidePagination
    ? rows.filter((row) => {
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
    : rows;

  // Calculate empty rows to maintain consistent page height
  const currentPage = isServerSidePagination ? page : internalPage;
  const currentRowsPerPage = isServerSidePagination ? externalRowsPerPage : internalRowsPerPage;
  const totalCount = isServerSidePagination ? count : filteredRows.length;
  const emptyRows = currentPage > 0 ? Math.max(0, (1 + currentPage) * currentRowsPerPage - totalCount) : 0;

  // Get displayed rows
  const displayedRows = isServerSidePagination
    ? filteredRows // For server-side, we assume rows are already paginated
    : stableSort(filteredRows, getComparator(order, orderBy))
        .slice(currentPage * currentRowsPerPage, currentPage * currentRowsPerPage + currentRowsPerPage);

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
          </Box>
        </Toolbar>

        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size="medium"
          >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sortDirection={orderBy === column.id ? order : false}
                    sx={{ fontWeight: 600 }}
                  >
                    {column.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
                {actions && <TableCell align="right">Aksi</TableCell>}
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
                    <TableRow hover tabIndex={-1} key={row.id || index}>
                      {columns.map((column) => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align || 'left'}>
                            {column.format ? column.format(value, row) : value}
                          </TableCell>
                        );
                      })}
                      {actions && (
                        <TableCell align="right">{actions(row)}</TableCell>
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
          page={currentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} dari ${count}`
          }
        />
      </Paper>
    </Box>
  );
};

export default DataTable;